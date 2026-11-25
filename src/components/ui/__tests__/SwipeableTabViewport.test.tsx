/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { DedicatedPageHeader } from '../DedicatedPageHeader';
import { SwipeableTabViewport, SwipeableTabItem } from '../SwipeableTabViewport';

const SAMPLE_TABS: SwipeableTabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'series', label: 'Test Series' },
  { id: 'pyq', label: 'PYQ Papers' },
];

describe('DedicatedPageHeader', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders h1 title, subtitle, back button (44x44px), and rightActions', () => {
    const onBack = vi.fn();

    render(
      <DedicatedPageHeader
        title="Mock Test Hub"
        subtitle="Practice full-length exams and PYQs"
        onBack={onBack}
        backLabel="Back to dashboard"
        badge={<span>PRO</span>}
        rightActions={
          <button type="button" onClick={() => {}}>
            Filter
          </button>
        }
      >
        <div data-testid="header-children">Tab strip</div>
      </DedicatedPageHeader>
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Mock Test Hub' });
    expect(heading).toBeTruthy();
    expect(screen.getByText('Practice full-length exams and PYQs')).toBeTruthy();
    expect(screen.getByText('PRO')).toBeTruthy();
    expect(screen.getByTestId('header-children')).toBeTruthy();

    const backBtn = screen.getByRole('button', { name: 'Back to dashboard' });
    expect(backBtn.getAttribute('type')).toBe('button');
    expect(backBtn.className).toContain('min-w-[44px]');
    expect(backBtn.className).toContain('min-h-[44px]');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy();
  });
});

describe('SwipeableTabViewport', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('mounts only the active tab panel at rest without duplicating inactive slides', () => {
    const onTabChange = vi.fn();

    render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        ariaLabel="Mock test categories"
        tabIdPrefix="tab"
        panelIdPrefix="panel"
        renderPanel={(tabId) => (
          <div>
            <h2>Panel {tabId}</h2>
            <button type="button">Action {tabId}</button>
          </div>
        )}
      />
    );

    expect(screen.getByRole('heading', { name: 'Panel overview' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Action overview' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Panel series' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Panel pyq' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Action series' })).toBeNull();

    const activePanel = screen.getByRole('tabpanel');
    expect(activePanel.getAttribute('id')).toBe('panel-overview');
    expect(activePanel.getAttribute('aria-labelledby')).toBe('tab-overview');
  });

  it('switches active panel and triggers smooth scrollTo when activeTabId changes externally without bouncing onTabChange', () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();
    const scrollToSpy = vi.fn();

    const { rerender } = render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Content for {tabId}</div>}
      />
    );

    const track = screen.getByLabelText('Mock test categories');
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 360 });
    Object.defineProperty(track, 'scrollLeft', { configurable: true, writable: true, value: 0 });
    (track as HTMLElement & { scrollTo: typeof scrollToSpy }).scrollTo = scrollToSpy;

    rerender(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="series"
        onTabChange={onTabChange}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Content for {tabId}</div>}
      />
    );

    expect(screen.getByText('Content for series')).toBeTruthy();
    expect(screen.queryByText('Content for overview')).toBeNull();
    expect(scrollToSpy).toHaveBeenCalledWith({ left: 360, behavior: 'smooth' });

    act(() => {
      fireEvent.scroll(track);
      vi.advanceTimersByTime(450);
    });

    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('calls onTabChange with settled tab id when user swipes horizontally and settles', () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();

    render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Panel {tabId}</div>}
      />
    );

    const track = screen.getByLabelText('Mock test categories');
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 400 });
    Object.defineProperty(track, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    act(() => {
      track.scrollLeft = 800;
      fireEvent.scroll(track);
      vi.advanceTimersByTime(120);
    });

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('pyq');
  });
});
