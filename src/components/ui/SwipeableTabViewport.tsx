import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

export interface SwipeableTabItem {
  id: string;
  label: string;
}

export interface SwipeableTabViewportProps {
  tabs: SwipeableTabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  ariaLabel: string;
  tabIdPrefix?: string;
  panelIdPrefix?: string;
  className?: string;
  panelClassName?: string;
  renderPanel: (tabId: string, index: number, isActive: boolean) => React.ReactNode;
}

const clampIndex = (idx: number, length: number): number => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, idx));
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Horizontal CSS scroll-snap tab viewport supporting native Android swipe gestures
 * while keeping non-visible resting slides lightweight (empty snap placeholders) so
 * resting DOM never duplicates interactive controls or text across tabs.
 */
export const SwipeableTabViewport: React.FC<SwipeableTabViewportProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  ariaLabel,
  tabIdPrefix,
  panelIdPrefix,
  className,
  panelClassName,
  renderPanel,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const isNestedRailGestureRef = useRef<boolean>(false);
  const programmaticTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    return idx >= 0 ? idx : 0;
  }, [tabs, activeTabId]);

  const clearTimers = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (programmaticTimerRef.current !== null) {
      window.clearTimeout(programmaticTimerRef.current);
      programmaticTimerRef.current = null;
    }
    if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Synchronize horizontal scroll offset when activeTabId changes externally
  useEffect(() => {
    const track = trackRef.current;
    if (!track || tabs.length === 0) return;
    if (track.clientWidth <= 0) return;

    const targetLeft = activeIndex * track.clientWidth;
    if (Math.abs(track.scrollLeft - targetLeft) <= 1) {
      setPendingIndex(null);
      return;
    }

    isProgrammaticScrollRef.current = true;
    const reduceMotion = prefersReducedMotion();

    if (typeof track.scrollTo === 'function') {
      track.scrollTo({
        left: targetLeft,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    } else {
      track.scrollLeft = targetLeft;
    }

    if (programmaticTimerRef.current !== null) {
      window.clearTimeout(programmaticTimerRef.current);
    }
    programmaticTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      programmaticTimerRef.current = null;
      setPendingIndex(null);
    }, reduceMotion ? 60 : 420);
  }, [activeIndex, tabs.length]);

  const finalizeSettledScroll = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    const track = trackRef.current;
    if (!track || tabs.length === 0) {
      isProgrammaticScrollRef.current = false;
      setPendingIndex(null);
      return;
    }

    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      if (programmaticTimerRef.current !== null) {
        window.clearTimeout(programmaticTimerRef.current);
        programmaticTimerRef.current = null;
      }
      setPendingIndex(null);
      return;
    }

    if (track.clientWidth > 0) {
      const settledIdx = clampIndex(Math.round(track.scrollLeft / track.clientWidth), tabs.length);
      setPendingIndex(null);
      const settledTab = tabs[settledIdx];
      if (settledTab && settledTab.id !== activeTabId) {
        onTabChange(settledTab.id);
      }
    } else {
      setPendingIndex(null);
    }
  }, [activeTabId, onTabChange, tabs]);

  const updatePendingFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || tabs.length === 0 || track.clientWidth <= 0) return;

    const exact = track.scrollLeft / track.clientWidth;
    const delta = exact - activeIndex;
    if (Math.abs(delta) <= 0.02) {
      setPendingIndex(null);
      return;
    }

    const targetIdx =
      delta > 0
        ? clampIndex(Math.ceil(exact), tabs.length)
        : clampIndex(Math.floor(exact), tabs.length);
    setPendingIndex(targetIdx !== activeIndex ? targetIdx : null);
  }, [activeIndex, tabs.length]);

  const handleScroll = useCallback(() => {
    if (isNestedRailGestureRef.current) return;
    if (!isProgrammaticScrollRef.current) {
      if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafRef.current);
      }
      if (typeof requestAnimationFrame === 'function') {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          updatePendingFromScroll();
        });
      } else {
        updatePendingFromScroll();
      }
    }

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(() => {
      finalizeSettledScroll();
    }, 110);
  }, [finalizeSettledScroll, updatePendingFromScroll]);

  // Attach native scrollend & scrollsnapchanging listeners where supported
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScrollEnd = () => {
      finalizeSettledScroll();
    };

    const handleScrollSnapChanging = (event: Event) => {
      if (isProgrammaticScrollRef.current || isNestedRailGestureRef.current) return;
      const snapTarget = (event as Event & { snapTargetInline?: Element | null }).snapTargetInline;
      if (snapTarget) {
        const children = Array.from(track.children);
        const idx = children.indexOf(snapTarget);
        if (idx >= 0 && idx < tabs.length) {
          setPendingIndex(idx !== activeIndex ? idx : null);
        }
      }
    };

    track.addEventListener('scrollend', handleScrollEnd);
    track.addEventListener('scrollsnapchanging', handleScrollSnapChanging);
    return () => {
      track.removeEventListener('scrollend', handleScrollEnd);
      track.removeEventListener('scrollsnapchanging', handleScrollSnapChanging);
    };
  }, [activeIndex, finalizeSettledScroll, tabs.length]);

  return (
    <div
      ref={trackRef}
      aria-label={ariaLabel}
      onScroll={handleScroll}
      onTouchStart={(e) => {
        const target = e.target as HTMLElement | null;
        isNestedRailGestureRef.current = Boolean(target?.closest?.('[data-h-rail="true"]'));
        if (isProgrammaticScrollRef.current) {
          isProgrammaticScrollRef.current = false;
        }
      }}
      onTouchEnd={() => {
        isNestedRailGestureRef.current = false;
      }}
      onTouchCancel={() => {
        isNestedRailGestureRef.current = false;
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement | null;
        isNestedRailGestureRef.current = Boolean(target?.closest?.('[data-h-rail="true"]'));
        if (isProgrammaticScrollRef.current) {
          isProgrammaticScrollRef.current = false;
        }
      }}
      onPointerUp={() => {
        isNestedRailGestureRef.current = false;
      }}
      onPointerCancel={() => {
        isNestedRailGestureRef.current = false;
      }}
      className={cn('mf-swipe-track w-full', className)}
    >
      {tabs.map((tab, idx) => {
        const isActive = idx === activeIndex;
        const shouldMount = isActive || idx === pendingIndex;
        const panelId = panelIdPrefix ? `${panelIdPrefix}-${tab.id}` : undefined;
        const labelledBy = tabIdPrefix ? `${tabIdPrefix}-${tab.id}` : undefined;

        return (
          <div
            key={tab.id}
            id={panelId}
            role={shouldMount ? 'tabpanel' : undefined}
            aria-labelledby={shouldMount ? labelledBy : undefined}
            aria-hidden={!shouldMount ? 'true' : undefined}
            data-tab-id={tab.id}
            className={cn('w-full shrink-0 basis-full min-w-0 snap-start snap-always', panelClassName)}
            style={{
              flex: '0 0 100%',
              width: '100%',
              minWidth: 0,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {shouldMount ? (
              renderPanel(tab.id, idx, isActive)
            ) : (
              <div className="min-h-[30dvh] w-full" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
};
