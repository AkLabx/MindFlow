/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockShowToast = vi.fn();

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

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithIdToken: vi.fn(),
    },
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

describe('AuthPage consent UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders only a single passive footer notice on the initial email step without a checkbox', () => {
    renderAuthPage('signin');

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByText(/confirm you are 18\+/i)).toBeNull();
    expect(screen.getAllByText(/By continuing, you agree to our/i)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Terms of Service' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeTruthy();
  });

  it('keeps Sign In step free of consent checkboxes and shows the single footer notice', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    renderAuthPage('signin');

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'aspirant@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue$/i }));

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

  it('keeps the mandatory checkbox on Create Account without repeating the footer notice', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    renderAuthPage('signup');

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'newuser@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue$/i }));

    // Footer notice must NOT be repeated below the Create Account button
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
  });
});
