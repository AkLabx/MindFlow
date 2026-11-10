/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ConsentAuditModal } from './ConsentAuditModal';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';

const mockUseAuth = vi.fn();
const mockRpc = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: (selector: any) => selector({ showToast: mockShowToast }),
}));

describe('ConsentAuditModal', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    });
  });

  it('returns null when user or profile is missing', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    });
    const { container } = render(<ConsentAuditModal />);
    expect(container.firstChild).toBeNull();
  });

  it('bypasses consent modal while device is offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: {} },
      profile: { id: 'u1', terms_accepted_version: null },
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    });
    const { container } = render(<ConsentAuditModal />);
    expect(container.firstChild).toBeNull();
  });

  it('does not re-prompt when profile already records valid consent', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: {} },
      profile: {
        id: 'u1',
        terms_accepted_version: CURRENT_TERMS_VERSION,
        terms_accepted_at: '2026-11-10T00:00:00Z',
        age_confirmed: CURRENT_AGE_ATTESTATION,
      },
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    });
    const { container } = render(<ConsentAuditModal />);
    expect(container.firstChild).toBeNull();
  });

  it('does not re-prompt when auth user_metadata already carries consent fields', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        user_metadata: {
          terms_accepted_version: CURRENT_TERMS_VERSION,
          age_confirmed: CURRENT_AGE_ATTESTATION,
        },
      },
      profile: {
        id: 'u1',
        terms_accepted_version: null,
        terms_accepted_at: null,
        age_confirmed: null,
      },
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    });
    const { container } = render(<ConsentAuditModal />);
    expect(container.firstChild).toBeNull();
  });

  it('prompts online users missing consent and submits record_user_consent RPC', async () => {
    const refreshProfile = vi.fn().mockResolvedValue(undefined);
    const signOut = vi.fn().mockResolvedValue(undefined);
    mockRpc.mockResolvedValue({ error: null });

    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: {} },
      profile: {
        id: 'u1',
        terms_accepted_version: null,
        terms_accepted_at: null,
        age_confirmed: null,
      },
      refreshProfile,
      signOut,
    });

    render(<ConsentAuditModal />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i }) as HTMLButtonElement;
    expect(acceptButton.disabled).toBe(true);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(acceptButton.disabled).toBe(false);

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('record_user_consent', {
        p_terms_version: CURRENT_TERMS_VERSION,
        p_age_confirmed: CURRENT_AGE_ATTESTATION,
      });
      expect(refreshProfile).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success', title: 'Consent Recorded' })
      );
      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i }) as HTMLButtonElement;
      expect(signOutBtn.disabled).toBe(false);
    });

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('re-prompts when recorded consent version is outdated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        user_metadata: {
          terms_accepted_version: '1.0',
          age_confirmed: CURRENT_AGE_ATTESTATION,
        },
      },
      profile: {
        id: 'u1',
        terms_accepted_version: '1.0',
        terms_accepted_at: '2024-01-01T00:00:00Z',
        age_confirmed: CURRENT_AGE_ATTESTATION,
      },
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    });

    render(<ConsentAuditModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows inline error alert on RPC failure and recovers on retry', async () => {
    const refreshProfile = vi.fn().mockResolvedValue(undefined);
    mockRpc
      .mockResolvedValueOnce({ error: { code: '42501', message: 'permission denied for table profiles' } })
      .mockResolvedValueOnce({ error: null });

    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: {} },
      profile: {
        id: 'u1',
        terms_accepted_version: null,
        terms_accepted_at: null,
        age_confirmed: null,
      },
      refreshProfile,
      signOut: vi.fn(),
    });

    render(<ConsentAuditModal />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Accept & Continue/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('permission denied for table profiles');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error', title: 'Could Not Save Consent' })
      );
      expect(refreshProfile).not.toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Accept & Continue/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
      expect(refreshProfile).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success', title: 'Consent Recorded' })
      );
    });
  });

  it('surfaces error instead of claiming success if refreshProfile fails after RPC', async () => {
    const refreshProfile = vi.fn().mockRejectedValue(new Error('Network timeout'));
    mockRpc.mockResolvedValue({ error: null });

    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: {} },
      profile: {
        id: 'u1',
        terms_accepted_version: null,
        terms_accepted_at: null,
        age_confirmed: null,
      },
      refreshProfile,
      signOut: vi.fn(),
    });

    render(<ConsentAuditModal />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Accept & Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Network timeout');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error', title: 'Could Not Save Consent' })
      );
    });
  });

  it('opens legal modal without toggling the consent checkbox and resets state on user switch', () => {
    const state = {
      user: { id: 'u1', user_metadata: {} },
      profile: { id: 'u1', terms_accepted_version: null, terms_accepted_at: null, age_confirmed: null },
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
    };
    mockUseAuth.mockImplementation(() => state);

    const { rerender } = render(<ConsentAuditModal />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Terms of Service' }));
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText('I Understand')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'I Understand' }));
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    state.user = { id: 'u2', user_metadata: {} };
    state.profile = { id: 'u2', terms_accepted_version: null, terms_accepted_at: null, age_confirmed: null };
    rerender(<ConsentAuditModal />);

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });
});
