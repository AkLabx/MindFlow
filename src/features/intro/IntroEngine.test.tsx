/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { IntroEngine } from './IntroEngine';

const mockIsNativePlatform = vi.fn(() => false);
const mockSplashHide = vi.fn(() => Promise.resolve());
const mockInitialize = vi.fn();
const mockClearPreview = vi.fn();

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
  },
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: () => mockSplashHide(),
  },
}));

vi.mock('../../stores/useAppConfigStore', () => ({
  useAppConfigStore: () => ({
    config: {
      intro: {
        active: 'blue',
        duration: 2000,
        skipDelay: 100,
        enabled: true,
      },
    },
    initialize: mockInitialize,
    previewConfig: null,
    previewNonce: 0,
    clearPreview: mockClearPreview,
  }),
}));

vi.mock('./registry', () => ({
  getIntroModule: () => ({
    id: 'blue',
    name: 'Mock Intro',
    description: 'Mock',
    isAvailable: true,
    load: async () => ({
      default: ({ onComplete }: { onComplete: () => void }) => (
        <div data-testid="mock-intro-canvas">
          <button type="button" onClick={onComplete}>Finish Module</button>
        </div>
      ),
    }),
  }),
}));

describe('IntroEngine (ADR-0005 / Option B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.location.hash = '';
    mockIsNativePlatform.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    window.location.hash = '';
  });

  it('calls SplashScreen.hide() only on native platforms', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    render(
      <IntroEngine isBootstrapReady={true}>
        <div data-testid="app-router">Router Content</div>
      </IntroEngine>
    );

    await waitFor(() => {
      expect(mockSplashHide).toHaveBeenCalledTimes(1);
    });
  });

  it('skips SplashScreen.hide() on web browsers', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    render(
      <IntroEngine isBootstrapReady={true}>
        <div data-testid="app-router">Router Content</div>
      </IntroEngine>
    );

    expect(mockSplashHide).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId('mock-intro-canvas')).toBeTruthy();
    });
  });

  it('completes intro only after BOTH animation finishes and bootstrap becomes ready', async () => {
    const { rerender } = render(
      <IntroEngine isBootstrapReady={false}>
        {false ? <div data-testid="app-router">Router Content</div> : null}
      </IntroEngine>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-intro-canvas')).toBeTruthy();
    });

    // Finish module playback while bootstrap is still running
    fireEvent.click(screen.getByText('Finish Module'));
    expect(screen.queryByTestId('app-router')).toBeNull();
    expect(screen.getByTestId('mock-intro-canvas')).toBeTruthy();

    // Now bootstrap finishes
    rerender(
      <IntroEngine isBootstrapReady={true}>
        <div data-testid="app-router">Router Content</div>
      </IntroEngine>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('mock-intro-canvas')).toBeNull();
      expect(screen.getByTestId('app-router')).toBeTruthy();
    });
  });

  it('bypasses intro during OAuth hash callback without rendering children until bootstrap finishes', () => {
    window.location.hash = '#access_token=abc&refresh_token=def';
    const { rerender } = render(
      <IntroEngine isBootstrapReady={false}>
        <div data-testid="app-router">Router Content</div>
      </IntroEngine>
    );

    expect(screen.queryByTestId('mock-intro-canvas')).toBeNull();
    expect(screen.queryByTestId('app-router')).toBeNull();

    rerender(
      <IntroEngine isBootstrapReady={true}>
        <div data-testid="app-router">Router Content</div>
      </IntroEngine>
    );
    expect(screen.getByTestId('app-router')).toBeTruthy();
  });
});
