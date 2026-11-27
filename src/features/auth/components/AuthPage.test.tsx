/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import SettingsPage from './SettingsPage';
import { EmailOtpInput, sanitizeOtpCode } from './EmailOtpInput';
import { buildAuthRedirectUrl, extractAuthHashParams } from '../utils/authRedirect';
import { formatAuthError, validatePasswordPolicy } from '../utils/authErrorMapper';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockSignInWithPassword = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignUp = vi.fn();
const mockResend = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
const mockRefreshUser = vi.fn().mockResolvedValue(undefined);
const mockShowToast = vi.fn();
let mockAuthState: {
  user: any;
  session: any;
  loading: boolean;
  refreshUser: typeof mockRefreshUser;
} = {
  user: null,
  session: null,
  loading: false,
  refreshUser: mockRefreshUser,
};

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resend: (...args: any[]) => mockResend(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      signInWithOAuth: vi.fn(),
      signInWithIdToken: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('@/lib/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: (selector: any) => selector({ showToast: mockShowToast }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
  motion: {
    div: ({ children, initial, animate, exit, transition, custom, variants, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    svg: ({ children, initial, animate, exit, transition, ...rest }: any) => (
      <svg {...rest}>{children}</svg>
    ),
  },
}));

const renderAuthPage = (initialMode: 'signin' | 'signup' = 'signin') =>
  render(
    <MemoryRouter>
      <AuthPage initialMode={initialMode} />
    </MemoryRouter>
  );

describe('AuthPage linear UX & auth flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a single Sign In screen with zero parallel tabs, New to MindFlow? Create Account CTA, and single passive legal footer', () => {
    renderAuthPage('signin');

    expect(screen.getByTestId('auth-view-signin-email')).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByText(/confirm you are 18\+/i)).toBeNull();

    // Unmistakable Create Account switch carries typed email into single-page Create Account
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'rural.student@example.com' } });
    const createAccountSwitch = screen.getByTestId('switch-to-signup-btn');
    expect(createAccountSwitch.textContent).toContain('New to MindFlow?');
    expect(createAccountSwitch.textContent).toContain('Create Account');

    expect(screen.getAllByText(/By continuing, you agree to our/i)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Terms of Service' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeTruthy();

    fireEvent.click(createAccountSwitch);
    expect(screen.getByTestId('auth-view-signup')).toBeTruthy();
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('rural.student@example.com');

    // Bottom switch returns cleanly to Sign In
    const signInSwitch = screen.getByTestId('switch-to-signin-btn');
    expect(signInSwitch.textContent).toContain('Already have an account?');
    fireEvent.click(signInSwitch);
    expect(screen.getByTestId('auth-view-signin-email')).toBeTruthy();
  });

  it('presents locked Email Address box and vertically stacked Login with Password / Login with Email OTP + Forgot Password? after Continue', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    renderAuthPage('signin');

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'aspirant@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Screen 2: Clean chooser with zero tabs and proper labeled read-only Email box
    expect(screen.getByTestId('auth-view-signin-choose')).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();

    const lockedBox = screen.getByTestId('auth-locked-email-field');
    expect(lockedBox).toBeTruthy();
    const lockedInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    expect(lockedInput.readOnly).toBe(true);
    expect(lockedInput.value).toBe('aspirant@example.com');
    expect(screen.getByTestId('auth-change-email-btn')).toBeTruthy();

    // Stacked method buttons + subtle Forgot Password link
    const pwdChoiceBtn = screen.getByTestId('choose-login-password');
    const otpChoiceBtn = screen.getByTestId('choose-login-otp');
    const forgotBtn = screen.getByTestId('choose-forgot-password');
    expect(pwdChoiceBtn.textContent).toContain('Login with Password');
    expect(otpChoiceBtn.textContent).toContain('Login with Email OTP');
    expect(forgotBtn.textContent).toContain('Forgot Password?');

    // Choose Password -> focused password screen
    fireEvent.click(pwdChoiceBtn);
    expect(screen.getByTestId('auth-view-signin-password')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getAllByText(/By continuing, you agree to our/i)).toHaveLength(1);

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass1!' } });
    const signInSubmitBtn = screen
      .getAllByRole('button', { name: /^Sign In$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    expect(signInSubmitBtn).toBeTruthy();
    fireEvent.click(signInSubmitBtn!);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'aspirant@example.com',
        password: 'StrongPass1!',
      });
    });
  });

  it('renders single vertical Create Account with mandatory DPDP consent checkbox and no duplicate footer notice', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    renderAuthPage('signup');

    expect(screen.getByTestId('auth-view-signup')).toBeTruthy();
    // Passive footer notice must NOT be repeated on Create Account
    expect(screen.queryByText(/By continuing, you agree to our/i)).toBeNull();
    expect(screen.queryByText(/By accessing MindFlow/i)).toBeNull();

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Opening Terms modal inside the label must not toggle the checkbox
    fireEvent.click(screen.getByRole('button', { name: 'Terms of Service' }));
    expect(checkbox.checked).toBe(false);
    expect(screen.getByRole('button', { name: 'I Understand' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'I Understand' }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Aarav Sharma' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });

    const createAccountSubmitBtn = screen
      .getAllByRole('button', { name: /^Create Account$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    expect(createAccountSubmitBtn).toBeTruthy();

    // Submit blocked when checkbox is unchecked
    fireEvent.click(createAccountSubmitBtn!);
    expect(screen.getByRole('alert').textContent).toContain('Terms of Service & Privacy Policy');
    expect(mockSignUp).not.toHaveBeenCalled();

    // Ticking checkbox clears consent error and allows account creation
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.click(createAccountSubmitBtn!);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'StrongPass1!',
        options: {
          emailRedirectTo: expect.stringContaining('#/'),
          data: expect.objectContaining({
            full_name: 'Aarav Sharma',
            display_name: 'Aarav Sharma',
            terms_accepted_version: CURRENT_TERMS_VERSION,
            age_confirmed: CURRENT_AGE_ATTESTATION,
            terms_accepted_at: expect.any(String),
          }),
        },
      });
    });
    expect(localStorage.getItem('mindflow_is_signup')).toBe('true');

    // Transitions cleanly into automated Verify Your Email step (v1.0.385.1)
    expect(await screen.findByTestId('auth-verify-email-step')).toBeTruthy();
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('newuser@example.com');
    expect(screen.getByRole('button', { name: /I've Verified/i })).toBeTruthy();
  });

  it('auto-detects verification via window focus or manual Continue without tripping rate-limit lockout on Email not confirmed', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u-verify-1' }, session: null }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Email not confirmed' },
    });

    renderAuthPage('signup');
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Auto Tester' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'auto@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    const submitBtn = screen
      .getAllByRole('button', { name: /^Create Account$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    fireEvent.click(submitBtn!);

    expect(await screen.findByTestId('auth-verify-email-step')).toBeTruthy();

    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByTestId('auth-verify-continue-btn'));
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledTimes(i + 1);
      });
    }
    expect(localStorage.getItem('mindflow_auth_rate_limit')).toBeNull();

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'verified-tok' } },
      error: null,
    });
    fireEvent(window, new Event('focus'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Email Verified!',
          variant: 'success',
        })
      );
    });
  });

  it('surfaces expired verification redirect errors stored by useAppBootstrap', async () => {
    sessionStorage.setItem('mindflow_auth_redirect_error', 'Email link is invalid or has expired');
    renderAuthPage('signin');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('expired');
    expect(sessionStorage.getItem('mindflow_auth_redirect_error')).toBeNull();
  });

  it('builds HashRouter & Capacitor-safe auth redirect URLs and parses recovery hash tokens', () => {
    expect(
      buildAuthRedirectUrl('signup', {
        isNative: false,
        origin: 'https://aklabx.github.io',
        pathname: '/MindFlow',
      })
    ).toBe('https://aklabx.github.io/MindFlow/#/');

    expect(
      buildAuthRedirectUrl('recovery', {
        isNative: false,
        origin: 'https://aklabx.github.io',
        pathname: '/MindFlow/',
      })
    ).toBe('https://aklabx.github.io/MindFlow/#/reset-password');

    expect(buildAuthRedirectUrl('signup', { isNative: true })).toBe('mindflow://');
    expect(buildAuthRedirectUrl('recovery', { isNative: true })).toBe('mindflow://reset-password');

    const recoveryParams = extractAuthHashParams(
      '#/reset-password#access_token=tok_123&refresh_token=ref_456&type=recovery'
    );
    expect(recoveryParams.get('access_token')).toBe('tok_123');
    expect(recoveryParams.get('refresh_token')).toBe('ref_456');
    expect(recoveryParams.get('type')).toBe('recovery');

    const signupParams = extractAuthHashParams('#/#access_token=tok_s&refresh_token=ref_s&type=signup');
    expect(signupParams.get('access_token')).toBe('tok_s');
    expect(signupParams.get('type')).toBe('signup');
  });

  it('handles Supabase existing-account obfuscation (identities: []) without false-positive signup success', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'existing-u', identities: [] }, session: null },
      error: null,
    });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    renderAuthPage('signup');

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Existing User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const submitBtn = screen
      .getAllByRole('button', { name: /^Create Account$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('already exists');
    });
    expect(screen.queryByText(/Account created/i)).toBeNull();
    expect(localStorage.getItem('mindflow_is_signup')).toBeNull();

    expect(screen.getByRole('button', { name: 'Sign In Instead' })).toBeTruthy();
    const resetBtn = screen.getByRole('button', { name: 'Reset Password' });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('existing@example.com', {
        redirectTo: expect.stringContaining('#/reset-password'),
      });
    });
  });

  it('passes emailRedirectTo on resend confirmation for unconfirmed accounts during password sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Email not confirmed' },
    });
    mockResend.mockResolvedValue({ error: null });

    renderAuthPage('signin');
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'pending@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    fireEvent.click(screen.getByTestId('choose-login-password'));

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass1!' } });
    const signInBtn = screen
      .getAllByRole('button', { name: /^Sign In$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    fireEvent.click(signInBtn!);

    const resendBtn = await screen.findByRole('button', { name: /Resend Confirmation Email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'pending@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('#/'),
        },
      });
    });
  });

  it('enforces >= 8 char password rules on ResetPasswordPage and SettingsPage (OAuth password link)', async () => {
    mockAuthState = {
      user: {
        id: 'oauth-u-1',
        email: 'oauth@example.com',
        identities: [{ provider: 'google', id: 'g-1' }],
      },
      session: { access_token: 'tok-rec' },
      loading: false,
      refreshUser: mockRefreshUser,
    };
    mockUpdateUser.mockResolvedValue({ data: { user: mockAuthState.user }, error: null });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'short7!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'short7!' } });
    fireEvent.click(screen.getByRole('button', { name: /Save New Password/i }));

    expect(screen.getByRole('alert').textContent).toContain('at least 8 characters');
    expect(mockUpdateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: /Save New Password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'StrongPass1!' });
    });

    cleanup();
    mockUpdateUser.mockClear();

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <SettingsPage onBack={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Google Connected')).toBeTruthy();
    expect(screen.getByText(/Set a Password \(Link Email Login\)/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'tiny6!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'tiny6!' } });
    fireEvent.click(screen.getByRole('button', { name: /Link Password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeTruthy();
    expect(mockUpdateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: /Link Password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'StrongPass1!' });
      expect(mockRefreshUser).toHaveBeenCalled();
    });
  });

  it('normalizes pasted OTP values preserving leading zeros and enforces 60s resend cooldown in EmailOtpInput', () => {
    expect(sanitizeOtpCode('Code: 042 819-99')).toBe('042819');

    const handleChange = vi.fn();
    const handleSubmit = vi.fn();
    const handleResend = vi.fn();

    render(
      <EmailOtpInput
        value="042819"
        onChange={handleChange}
        onSubmit={handleSubmit}
        onResend={handleResend}
        resendCooldown={60}
      />
    );

    const input = screen.getByTestId('email-otp-input') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.maxLength).toBe(6);

    fireEvent.paste(input, {
      clipboardData: { getData: () => 'MindFlow OTP: 007 321' },
    });
    expect(handleChange).toHaveBeenCalledWith('007321');

    const resendBtn = screen.getByTestId('email-otp-resend') as HTMLButtonElement;
    expect(resendBtn.disabled).toBe(true);
    expect(resendBtn.textContent).toContain('(60s)');

    fireEvent.click(screen.getByTestId('email-otp-submit'));
    expect(handleSubmit).toHaveBeenCalledWith('042819');
  });

  it('verifies 6-digit signup OTP via verifyOtp(type: signup) inside verify-email step and handles expired codes', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u-otp-signup' }, session: null }, error: null });
    mockVerifyOtp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Token has expired or is invalid' },
    });
    mockVerifyOtp.mockResolvedValueOnce({
      data: { user: { id: 'u-otp-signup' }, session: { access_token: 'signup-otp-tok' } },
      error: null,
    });

    renderAuthPage('signup');
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'OTP Aspirant' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'otpnew@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('checkbox'));
    const submitBtn = screen
      .getAllByRole('button', { name: /^Create Account$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    fireEvent.click(submitBtn!);

    expect(await screen.findByTestId('auth-verify-email-step')).toBeTruthy();
    expect((screen.getByTestId('signup-otp-resend') as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByTestId('signup-otp-input'), { target: { value: '000111' } });
    fireEvent.click(screen.getByTestId('signup-otp-submit'));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Invalid or expired verification code');

    fireEvent.change(screen.getByTestId('signup-otp-input'), { target: { value: '042819' } });
    fireEvent.click(screen.getByTestId('signup-otp-submit'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenLastCalledWith({
        email: 'otpnew@example.com',
        token: '042819',
        type: 'signup',
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Email Verified!', variant: 'success' })
    );
  });

  it('dispatches Login with Email OTP directly from stacked chooser (shouldCreateUser: false), enforces DPDP Create Account redirect, and verifies 6-digit OTP', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Signups not allowed for otp' },
    });

    renderAuthPage('signin');
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'unregistered@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    expect(screen.getByTestId('auth-view-signin-choose')).toBeTruthy();
    fireEvent.click(screen.getByTestId('choose-login-otp'));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'unregistered@example.com',
        options: {
          shouldCreateUser: false,
          emailRedirectTo: expect.stringContaining('#/'),
        },
      });
    });

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('No MindFlow account found');

    // Clicking "Create Account Instead" opens single vertical Create Account with DPDP consent checkbox & email pre-filled
    fireEvent.click(screen.getByTestId('choose-create-account-instead-btn'));
    expect(screen.getByTestId('auth-view-signup')).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeTruthy();
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('unregistered@example.com');

    // Return to Sign In -> Continue -> Login with Email OTP for a registered user
    fireEvent.click(screen.getByTestId('switch-to-signin-btn'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    mockSignInWithOtp.mockResolvedValueOnce({ data: { user: null, session: null }, error: null });
    mockVerifyOtp.mockResolvedValueOnce({
      data: { user: { id: 'u-reg' }, session: { access_token: 'email-otp-tok' } },
      error: null,
    });

    fireEvent.click(screen.getByTestId('choose-login-otp'));
    expect(await screen.findByTestId('auth-view-signin-otp')).toBeTruthy();
    expect(screen.getByTestId('signin-otp-input')).toBeTruthy();
    expect((screen.getByTestId('signin-otp-resend') as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByTestId('signin-otp-input'), { target: { value: '654321' } });
    fireEvent.click(screen.getByTestId('signin-otp-submit'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'unregistered@example.com',
        token: '654321',
        type: 'email',
      });
    });
  });

  it('launches dedicated Recovery screen from Forgot Password? link on chooser, verifies 6-digit recovery OTP, and navigates to /reset-password', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: 'u-rec' }, session: { access_token: 'rec-otp-tok' } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AuthPage initialMode="signin" />} />
          <Route path="/reset-password" element={<div data-testid="reset-password-route">Reset Password Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'recover@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    fireEvent.click(screen.getByTestId('choose-forgot-password'));

    expect(await screen.findByTestId('recovery-otp-card')).toBeTruthy();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('recover@example.com', {
      redirectTo: expect.stringContaining('#/reset-password'),
    });

    fireEvent.change(screen.getByTestId('recovery-otp-input'), { target: { value: '112233' } });
    fireEvent.click(screen.getByTestId('recovery-otp-submit'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'recover@example.com',
        token: '112233',
        type: 'recovery',
      });
    });

    expect(await screen.findByTestId('reset-password-route')).toBeTruthy();
  });

  it('maps signal timed out / 504 request_timeout errors cleanly and exposes Try Again + Google fallback on signup', async () => {
    const nativeTimeout = formatAuthError(new DOMException('signal timed out', 'TimeoutError'), 'signup');
    expect(nativeTimeout.kind).toBe('timeout');
    expect(nativeTimeout.canRetry).toBe(true);
    expect(nativeTimeout.suggestGoogleFallback).toBe(true);
    expect(nativeTimeout.message.toLowerCase()).not.toContain('signal timed out');

    const gateway504 = formatAuthError(
      { status: 504, code: 'request_timeout', message: 'context deadline exceeded' },
      'signup'
    );
    expect(gateway504.kind).toBe('timeout');
    expect(gateway504.suggestGoogleFallback).toBe(true);

    expect(formatAuthError(new TypeError('Failed to fetch'), 'signup').kind).toBe('network');
    expect(formatAuthError({ status: 429, message: 'Email rate limit exceeded' }, 'signup').kind).toBe('rate_limit');
    expect(formatAuthError({ message: 'Error sending confirmation email' }, 'signup').kind).toBe('smtp_error');
    expect(
      formatAuthError(
        { message: 'Password should contain at least one character of each: abc...' },
        'signup'
      ).kind
    ).toBe('weak_password');

    mockSignUp.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
    mockSignUp.mockResolvedValueOnce({ data: { user: { id: 'u-retry-ok' }, session: null }, error: null });

    renderAuthPage('signup');
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Timeout Tester' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'timeoutuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const submitBtn = screen
      .getAllByRole('button', { name: /^Create Account$/i })
      .find((btn) => btn.getAttribute('type') === 'submit');
    fireEvent.click(submitBtn!);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('verification email service took too long');
    expect(alert.textContent).not.toContain('signal timed out');
    expect(localStorage.getItem('mindflow_is_signup')).toBeNull();

    expect(screen.getByTestId('signup-timeout-recovery')).toBeTruthy();
    expect(screen.getByTestId('signup-google-fallback-btn')).toBeTruthy();

    fireEvent.click(screen.getByTestId('signup-retry-btn'));

    expect(await screen.findByTestId('auth-verify-email-step')).toBeTruthy();
    expect(mockSignUp).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('mindflow_is_signup')).toBe('true');
  });

  it('prevents duplicate concurrent signUp calls via in-flight mutex and enforces Supabase password complexity upfront', async () => {
    expect(validatePasswordPolicy('short7!').valid).toBe(false);
    expect(validatePasswordPolicy('alllowercase12').valid).toBe(false);
    expect(validatePasswordPolicy('StrongPass1!').valid).toBe(true);

    let resolveSignUp: ((val: any) => void) | null = null;
    mockSignUp.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
    );

    renderAuthPage('signup');
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Mutex User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'mutex@example.com' } });
    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'lowercase123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'lowercase123' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const form = screen.getByLabelText(/Full Name/i).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByRole('alert').textContent).toContain('uppercase letter');
    expect(screen.getByRole('alert').textContent).toContain('special character');
    expect(mockSignUp).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Choose Password/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'StrongPass1!' } });

    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });

    resolveSignUp!({ data: { user: { id: 'u-mutex-ok' }, session: null }, error: null });
    expect(await screen.findByTestId('auth-verify-email-step')).toBeTruthy();
  });

  it('follows deterministic hierarchical back across Sign-In screens without losing the entered email', () => {
    renderAuthPage('signin');
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'backflow@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    expect(screen.getByTestId('auth-view-signin-choose')).toBeTruthy();
    fireEvent.click(screen.getByTestId('choose-login-password'));
    expect(screen.getByTestId('auth-view-signin-password')).toBeTruthy();

    // Back from Password returns to Chooser (preserving email)
    fireEvent.click(screen.getByTestId('auth-mobile-back-btn'));
    expect(screen.getByTestId('auth-view-signin-choose')).toBeTruthy();
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('backflow@example.com');

    // Back from Chooser returns to Email input (preserving email for typo edits)
    fireEvent.click(screen.getByTestId('auth-mobile-back-btn'));
    expect(screen.getByTestId('auth-view-signin-email')).toBeTruthy();
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('backflow@example.com');
  });
});
