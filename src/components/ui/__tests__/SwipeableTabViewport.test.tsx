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

const createTouchEventInit = (clientX: number, clientY: number) => ({
  touches: [{ clientX, clientY } as Touch],
  changedTouches: [{ clientX, clientY } as Touch],
});

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

    const slides = document.querySelectorAll('[data-tab-id]');
    expect(slides[0].getAttribute('aria-hidden')).toBeNull();
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');
    expect(slides[2].getAttribute('aria-hidden')).toBe('true');
  });

  it('syncs translate3d when activeTabId changes externally without bouncing onTabChange and unmounts outgoing slide after 260ms transition', () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();
    const onSwipeProgress = vi.fn();

    const { rerender } = render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        onSwipeProgress={onSwipeProgress}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Content for {tabId}</div>}
      />
    );

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 360 });
    const innerTrack = viewport.querySelector('.mf-swipe-track-inner') as HTMLDivElement;

    rerender(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="series"
        onTabChange={onTabChange}
        onSwipeProgress={onSwipeProgress}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Content for {tabId}</div>}
      />
    );

    expect(screen.getByText('Content for series')).toBeTruthy();
    // Outgoing slide stays mounted with aria-hidden during the 260ms transition
    expect(screen.getByText('Content for overview')).toBeTruthy();
    expect(innerTrack.style.transform).toBe('translate3d(-100%, 0, 0)');
    expect(innerTrack.style.transition).toContain('260ms');
    expect(onSwipeProgress).toHaveBeenCalledWith(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Content for overview')).toBeNull();
    expect(screen.getByText('Content for series')).toBeTruthy();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('tracks 1:1 touch drag via translate3d, pre-warms neighbors, reports progress, and commits on >= 22% width', () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();
    const onSwipeProgress = vi.fn();

    render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        onSwipeProgress={onSwipeProgress}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => <div>Panel {tabId}</div>}
      />
    );

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 400 });
    const innerTrack = viewport.querySelector('.mf-swipe-track-inner') as HTMLDivElement;

    act(() => {
      fireEvent.touchStart(viewport, createTouchEventInit(260, 100));
      fireEvent.touchMove(viewport, createTouchEventInit(140, 102));
      vi.advanceTimersByTime(20);
    });

    // 1:1 translate3d offset = -120px (30% of 400px) and neighbor pre-warmed
    expect(innerTrack.style.transform).toBe('translate3d(calc(-0% + -120px), 0, 0)');
    expect(screen.getByText('Panel series')).toBeTruthy();
    expect(screen.queryByText('Panel pyq')).toBeNull();
    expect(onSwipeProgress).toHaveBeenCalledWith(0.3);

    act(() => {
      fireEvent.touchEnd(viewport, { touches: [], changedTouches: [{ clientX: 140, clientY: 102 } as Touch] });
    });

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('series');
  });

  it('applies 0.28x edge rubber-band damping at index 0 and snaps back without switching tabs', () => {
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

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 400 });
    const innerTrack = viewport.querySelector('.mf-swipe-track-inner') as HTMLDivElement;

    act(() => {
      fireEvent.touchStart(viewport, createTouchEventInit(100, 120));
      fireEvent.touchMove(viewport, createTouchEventInit(200, 122));
      vi.advanceTimersByTime(20);
    });

    expect(innerTrack.style.transform).toBe('translate3d(calc(-0% + 28px), 0, 0)');

    act(() => {
      fireEvent.touchEnd(viewport, { touches: [], changedTouches: [{ clientX: 200, clientY: 122 } as Touch] });
      vi.advanceTimersByTime(300);
    });

    expect(onTabChange).not.toHaveBeenCalled();
    expect(innerTrack.style.transform).toBe('translate3d(-0%, 0, 0)');
  });

  it('commits on fast horizontal flick (>= 0.45 px/ms with |dx| >= 24px)', () => {
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

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 400 });

    act(() => {
      fireEvent.touchStart(viewport, createTouchEventInit(200, 120));
      vi.advanceTimersByTime(30);
      fireEvent.touchMove(viewport, createTouchEventInit(150, 121)); // -50px in 30ms => 1.67 px/ms
      vi.advanceTimersByTime(10);
      fireEvent.touchEnd(viewport, { touches: [], changedTouches: [{ clientX: 150, clientY: 121 } as Touch] });
    });

    expect(onTabChange).toHaveBeenCalledWith('series');
  });

  it('rejects horizontal swipe when vertical axis lock engages (|dY| > |dX| * 1.15)', () => {
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

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 390 });
    const innerTrack = viewport.querySelector('.mf-swipe-track-inner') as HTMLDivElement;

    act(() => {
      fireEvent.touchStart(viewport, createTouchEventInit(200, 200));
      fireEvent.touchMove(viewport, createTouchEventInit(210, 224)); // dx=10, dy=24 => 24 > 11.5
      fireEvent.touchMove(viewport, createTouchEventInit(40, 230));
      vi.advanceTimersByTime(20);
    });

    expect(innerTrack.style.transform).toBe('translate3d(-0%, 0, 0)');

    act(() => {
      fireEvent.touchEnd(viewport, { touches: [], changedTouches: [{ clientX: 40, clientY: 230 } as Touch] });
    });

    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('arbitrates [data-h-rail="true"] mid-scroll vs boundary edge handoff', () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();

    render(
      <SwipeableTabViewport
        tabs={SAMPLE_TABS}
        activeTabId="overview"
        onTabChange={onTabChange}
        ariaLabel="Mock test categories"
        renderPanel={(tabId) => (
          <div data-h-rail="true" data-testid={`rail-${tabId}`}>
            <button type="button">Rail Item {tabId}</button>
          </div>
        )}
      />
    );

    const viewport = screen.getByLabelText('Mock test categories');
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 400 });

    const rail = screen.getByTestId('rail-overview');
    const railItem = screen.getByRole('button', { name: 'Rail Item overview' });
    Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: 800 });
    Object.defineProperty(rail, 'clientWidth', { configurable: true, value: 320 });
    Object.defineProperty(rail, 'scrollLeft', { configurable: true, writable: true, value: 100 });

    // 1. Mid-scroll: rail owns gesture, outer tab swipe must NOT fire
    act(() => {
      fireEvent.touchStart(railItem, createTouchEventInit(260, 120));
      fireEvent.touchMove(railItem, createTouchEventInit(100, 122));
      vi.advanceTimersByTime(20);
      fireEvent.touchEnd(railItem, { touches: [], changedTouches: [{ clientX: 100, clientY: 122 } as Touch] });
    });
    expect(onTabChange).not.toHaveBeenCalled();

    // 2. Right edge boundary (scrollLeft + clientWidth >= scrollWidth - 2): dragging left yields to outer tab swipe
    rail.scrollLeft = 480;
    act(() => {
      fireEvent.touchStart(railItem, createTouchEventInit(260, 120));
      fireEvent.touchMove(railItem, createTouchEventInit(120, 122));
      vi.advanceTimersByTime(20);
      fireEvent.touchEnd(railItem, { touches: [], changedTouches: [{ clientX: 120, clientY: 122 } as Touch] });
    });
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('series');
  });
});
