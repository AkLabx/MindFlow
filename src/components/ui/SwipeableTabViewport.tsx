import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  onSwipeProgress?: (progressIndex: number) => void;
}

type AxisLock = 'none' | 'horizontal' | 'vertical' | 'rail';

const AXIS_LOCK_THRESHOLD_PX = 8;
const PREWARM_THRESHOLD_PX = 4;
const VERTICAL_BIAS_RATIO = 1.15;
const EDGE_RUBBER_BAND_FACTOR = 0.28;
const COMMIT_WIDTH_RATIO = 0.22;
const FLICK_VELOCITY_PX_PER_MS = 0.45;
const FLICK_MIN_DISTANCE_PX = 24;
const TRANSITION_DURATION_MS = 260;
const TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANSITION_CSS = `transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`;

const clampIndex = (idx: number, length: number): number => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, idx));
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canYieldFromNestedRail = (rail: HTMLElement | null, dx: number): boolean => {
  if (!rail) return true;
  const hasOverflow = rail.scrollWidth > rail.clientWidth + 2;
  if (!hasOverflow) return true;
  if (dx > 0 && rail.scrollLeft <= 2) return true;
  if (dx < 0 && rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2) return true;
  return false;
};

const getNowMs = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

/**
 * 1:1 GPU-composited (`translate3d`) finger-tracking horizontal swipe tab viewport
 * with 2D axis locking (DEC-0012), deterministic `[data-h-rail="true"]` boundary
 * arbitration, edge rubber-banding, and resting single-panel DOM mounting.
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
  onSwipeProgress,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isNestedPointerLockRef = useRef<boolean>(false);
  const nestedRailRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  // Gesture state kept in refs for 0 per-frame React re-renders during drag
  const isTrackingTouchRef = useRef<boolean>(false);
  const axisLockRef = useRef<AxisLock>('none');
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const dragOffsetPxRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const [isPreWarming, setIsPreWarming] = useState<boolean>(false);
  const isPreWarmingRef = useRef<boolean>(false);
  const [transitioningFromIndex, setTransitioningFromIndex] = useState<number | null>(null);

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    return idx >= 0 ? idx : 0;
  }, [tabs, activeTabId]);

  const prevActiveIndexRef = useRef<number>(activeIndex);
  const animatedTargetIndexRef = useRef<number | null>(null);
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const setPreWarm = useCallback((next: boolean) => {
    if (isPreWarmingRef.current === next) return;
    isPreWarmingRef.current = next;
    setIsPreWarming(next);
  }, []);

  const cancelPendingRaf = useCallback(() => {
    if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const applyTrackTransform = useCallback(
    (targetIndex: number, offsetPx: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const shouldAnimate = animate && !prefersReducedMotion();
      track.style.transition = shouldAnimate ? TRANSITION_CSS : 'none';
      track.style.transform =
        offsetPx === 0
          ? `translate3d(-${targetIndex * 100}%, 0, 0)`
          : `translate3d(calc(-${targetIndex * 100}% + ${offsetPx}px), 0, 0)`;
    },
    []
  );

  const finishTransitionCleanup = useCallback(() => {
    clearTransitionTimer();
    isAnimatingRef.current = false;
    if (trackRef.current) {
      trackRef.current.style.transition = '';
    }
    setTransitioningFromIndex(null);
    setPreWarm(false);
  }, [clearTransitionTimer, setPreWarm]);

  const scheduleTransitionEndFallback = useCallback(() => {
    clearTransitionTimer();
    isAnimatingRef.current = true;
    transitionTimerRef.current = window.setTimeout(() => {
      finishTransitionCleanup();
    }, TRANSITION_DURATION_MS + 20);
  }, [clearTransitionTimer, finishTransitionCleanup]);

  useEffect(() => {
    return () => {
      cancelPendingRaf();
      clearTransitionTimer();
    };
  }, [cancelPendingRaf, clearTransitionTimer]);

  const releaseNestedPointerLock = useCallback(() => {
    isNestedPointerLockRef.current = false;
    if (viewportRef.current && viewportRef.current.style.overflowX) {
      viewportRef.current.style.overflowX = '';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleWindowPointerRelease = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (isNestedPointerLockRef.current) {
        releaseNestedPointerLock();
      }
    };
    const handleWindowTouchRelease = (e: TouchEvent) => {
      if ((e.touches?.length ?? 0) === 0 && isNestedPointerLockRef.current) {
        releaseNestedPointerLock();
      }
    };
    window.addEventListener('pointerup', handleWindowPointerRelease);
    window.addEventListener('pointercancel', handleWindowPointerRelease);
    window.addEventListener('touchend', handleWindowTouchRelease);
    window.addEventListener('touchcancel', handleWindowTouchRelease);
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerRelease);
      window.removeEventListener('pointercancel', handleWindowPointerRelease);
      window.removeEventListener('touchend', handleWindowTouchRelease);
      window.removeEventListener('touchcancel', handleWindowTouchRelease);
    };
  }, [releaseNestedPointerLock]);

  // Synchronize transform and transition when activeIndex changes or on initial mount
  useLayoutEffect(() => {
    const prevIdx = prevActiveIndexRef.current;
    prevActiveIndexRef.current = activeIndex;

    if (prevIdx === activeIndex) {
      if (!isTrackingTouchRef.current && !isAnimatingRef.current) {
        applyTrackTransform(activeIndex, 0, false);
      }
      return;
    }

    // If this activeIndex change was initiated by our own swipe commit,
    // the 260ms transition is already running cleanly.
    if (animatedTargetIndexRef.current === activeIndex) {
      animatedTargetIndexRef.current = null;
      return;
    }

    const viewportWidth = viewportRef.current?.clientWidth ?? 0;
    const reduceMotion = prefersReducedMotion();

    if (viewportWidth > 0 && !reduceMotion && tabs.length > 0) {
      setTransitioningFromIndex(prevIdx);
      applyTrackTransform(activeIndex, 0, true);
      scheduleTransitionEndFallback();
    } else {
      clearTransitionTimer();
      isAnimatingRef.current = false;
      setTransitioningFromIndex(null);
      setPreWarm(false);
      applyTrackTransform(activeIndex, 0, false);
    }

    onSwipeProgress?.(activeIndex);
  }, [
    activeIndex,
    applyTrackTransform,
    clearTransitionTimer,
    onSwipeProgress,
    scheduleTransitionEndFallback,
    setPreWarm,
    tabs.length,
  ]);

  const handleTrackTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== trackRef.current || e.propertyName !== 'transform') return;
      if (isAnimatingRef.current) {
        finishTransitionCleanup();
      }
    },
    [finishTransitionCleanup]
  );

  const resetTouchTracking = useCallback(() => {
    cancelPendingRaf();
    isTrackingTouchRef.current = false;
    axisLockRef.current = 'none';
    nestedRailRef.current = null;
    dragOffsetPxRef.current = 0;
    velocityRef.current = 0;
    releaseNestedPointerLock();
  }, [cancelPendingRaf, releaseNestedPointerLock]);

  const handleTouchStartCapture = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      const rail = (target?.closest?.('[data-h-rail="true"], .mf-h-rail') as HTMLElement | null) ?? null;
      nestedRailRef.current = rail;

      if (e.touches.length !== 1 || tabs.length <= 1) {
        isTrackingTouchRef.current = false;
        return;
      }

      if (isAnimatingRef.current) {
        clearTransitionTimer();
        isAnimatingRef.current = false;
        setTransitioningFromIndex(null);
      }

      const touch = e.touches[0];
      const now = getNowMs();
      isTrackingTouchRef.current = true;
      axisLockRef.current = 'none';
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      lastXRef.current = touch.clientX;
      startTimeRef.current = now;
      lastTimeRef.current = now;
      velocityRef.current = 0;
      dragOffsetPxRef.current = 0;
    },
    [clearTransitionTimer, tabs.length]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isTrackingTouchRef.current) return;
      if (e.touches.length !== 1) {
        resetTouchTracking();
        applyTrackTransform(activeIndexRef.current, 0, false);
        setPreWarm(false);
        return;
      }

      const currentLock = axisLockRef.current;
      if (currentLock === 'vertical' || currentLock === 'rail') {
        return;
      }

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (currentLock === 'none') {
        if (
          absDx > PREWARM_THRESHOLD_PX &&
          absDy <= absDx * VERTICAL_BIAS_RATIO &&
          canYieldFromNestedRail(nestedRailRef.current, dx)
        ) {
          setPreWarm(true);
        }

        if (Math.max(absDx, absDy) < AXIS_LOCK_THRESHOLD_PX) {
          return;
        }

        if (absDy > absDx * VERTICAL_BIAS_RATIO) {
          axisLockRef.current = 'vertical';
          dragOffsetPxRef.current = 0;
          setPreWarm(false);
          applyTrackTransform(activeIndexRef.current, 0, false);
          return;
        }

        if (!canYieldFromNestedRail(nestedRailRef.current, dx)) {
          axisLockRef.current = 'rail';
          dragOffsetPxRef.current = 0;
          setPreWarm(false);
          return;
        }

        axisLockRef.current = 'horizontal';
        setPreWarm(true);
      }

      // Locked horizontal: 1:1 finger tracking in rAF with edge rubber-banding
      const idx = activeIndexRef.current;
      const atStartEdge = idx === 0 && dx > 0;
      const atEndEdge = idx === tabs.length - 1 && dx < 0;
      const rawDampedDx = atStartEdge || atEndEdge ? dx * EDGE_RUBBER_BAND_FACTOR : dx;
      const dampedDx = Math.round(rawDampedDx * 100) / 100;

      const now = getNowMs();
      const dt = now - lastTimeRef.current;
      if (dt >= 4) {
        const instVel = (touch.clientX - lastXRef.current) / dt;
        velocityRef.current =
          velocityRef.current === 0 ? instVel : velocityRef.current * 0.4 + instVel * 0.6;
        lastTimeRef.current = now;
      }
      lastXRef.current = touch.clientX;
      dragOffsetPxRef.current = dampedDx;

      if (rafRef.current === null) {
        const flushFrame = () => {
          rafRef.current = null;
          if (!isTrackingTouchRef.current || axisLockRef.current !== 'horizontal') return;
          const currentIdx = activeIndexRef.current;
          const currentOffset = dragOffsetPxRef.current;
          applyTrackTransform(currentIdx, currentOffset, false);
          if (onSwipeProgress) {
            const width = viewportRef.current?.clientWidth ?? 0;
            if (width > 0) {
              const progress = Math.max(
                0,
                Math.min(tabs.length - 1, currentIdx - currentOffset / width)
              );
              onSwipeProgress(progress);
            }
          }
        };

        if (typeof requestAnimationFrame === 'function') {
          rafRef.current = requestAnimationFrame(flushFrame);
        } else {
          flushFrame();
        }
      }
    },
    [applyTrackTransform, onSwipeProgress, resetTouchTracking, setPreWarm, tabs.length]
  );

  const handleTouchFinish = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, cancelled: boolean) => {
      if ((e.touches?.length ?? 0) > 0) return;

      const wasHorizontal = isTrackingTouchRef.current && axisLockRef.current === 'horizontal';
      const dampedDx = dragOffsetPxRef.current;
      const pointerDx = lastXRef.current - startXRef.current;
      const totalElapsed = getNowMs() - startTimeRef.current;
      const effectiveVelocity =
        totalElapsed >= 8
          ? velocityRef.current !== 0
            ? velocityRef.current
            : pointerDx / totalElapsed
          : 0;

      resetTouchTracking();

      if (!wasHorizontal) {
        setPreWarm(false);
        return;
      }

      const currentIdx = activeIndexRef.current;
      const width = viewportRef.current?.clientWidth ?? 0;
      const ratioMet = !cancelled && width > 0 && Math.abs(dampedDx) >= width * COMMIT_WIDTH_RATIO;
      const velocityMet =
        !cancelled &&
        Math.abs(effectiveVelocity) >= FLICK_VELOCITY_PX_PER_MS &&
        Math.abs(pointerDx) >= FLICK_MIN_DISTANCE_PX;

      let nextIndex = currentIdx;
      if (ratioMet || velocityMet) {
        if (pointerDx < 0 && currentIdx < tabs.length - 1) {
          nextIndex = currentIdx + 1;
        } else if (pointerDx > 0 && currentIdx > 0) {
          nextIndex = currentIdx - 1;
        }
      }

      const reduceMotion = prefersReducedMotion();

      if (nextIndex !== currentIdx) {
        const nextTab = tabs[nextIndex];
        if (!reduceMotion && width > 0) {
          animatedTargetIndexRef.current = nextIndex;
          setTransitioningFromIndex(currentIdx);
          applyTrackTransform(nextIndex, 0, true);
          scheduleTransitionEndFallback();
        } else {
          animatedTargetIndexRef.current = nextIndex;
          setTransitioningFromIndex(null);
          setPreWarm(false);
          applyTrackTransform(nextIndex, 0, false);
        }
        onSwipeProgress?.(nextIndex);
        if (nextTab && nextTab.id !== activeTabId) {
          onTabChange(nextTab.id);
        }
      } else {
        onSwipeProgress?.(currentIdx);
        if (!reduceMotion && Math.abs(dampedDx) > 0 && width > 0) {
          applyTrackTransform(currentIdx, 0, true);
          scheduleTransitionEndFallback();
        } else {
          applyTrackTransform(currentIdx, 0, false);
          setPreWarm(false);
        }
      }
    },
    [
      activeTabId,
      applyTrackTransform,
      onSwipeProgress,
      onTabChange,
      resetTouchTracking,
      scheduleTransitionEndFallback,
      setPreWarm,
      tabs,
    ]
  );

  return (
    <div
      ref={viewportRef}
      aria-label={ariaLabel}
      onTouchStartCapture={handleTouchStartCapture}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => handleTouchFinish(e, false)}
      onTouchCancel={(e) => handleTouchFinish(e, true)}
      onPointerDownCapture={(e) => {
        if (e.pointerType === 'touch') return;
        const target = e.target as HTMLElement | null;
        const isNested = Boolean(target?.closest?.('[data-h-rail="true"]'));
        isNestedPointerLockRef.current = isNested;
        if (viewportRef.current) {
          viewportRef.current.style.overflowX = isNested ? 'hidden' : '';
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'touch') return;
        releaseNestedPointerLock();
      }}
      onPointerCancel={(e) => {
        if (e.pointerType === 'touch') return;
        releaseNestedPointerLock();
      }}
      className={cn('mf-swipe-track w-full overflow-x-clip touch-pan-y select-none', className)}
    >
      <div
        ref={trackRef}
        onTransitionEnd={handleTrackTransitionEnd}
        className="mf-swipe-track-inner flex w-full will-change-transform"
      >
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIndex;
          const isNeighborPreWarmed = isPreWarming && Math.abs(idx - activeIndex) <= 1;
          const isTransitionOutgoing = idx === transitioningFromIndex;
          const shouldMount = isActive || isNeighborPreWarmed || isTransitionOutgoing;
          const panelId = panelIdPrefix ? `${panelIdPrefix}-${tab.id}` : undefined;
          const labelledBy = tabIdPrefix ? `${tabIdPrefix}-${tab.id}` : undefined;

          return (
            <div
              key={tab.id}
              id={panelId}
              role={isActive ? 'tabpanel' : undefined}
              aria-labelledby={isActive ? labelledBy : undefined}
              aria-hidden={!isActive ? 'true' : undefined}
              data-tab-id={tab.id}
              className={cn('w-full shrink-0 basis-full min-w-0', panelClassName)}
              style={{
                flex: '0 0 100%',
                width: '100%',
                minWidth: 0,
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
    </div>
  );
};
