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
    });
    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success', title: 'Consent Recorded' })
    );

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
