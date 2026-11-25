import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InfoHintPopoverProps {
  title: string;
  purpose: string;
  studentVisibility?: string;
  example?: string;
  ariaLabel?: string;
  align?: 'start' | 'end' | 'center';
  className?: string;
}

type PopoverDivElement = HTMLDivElement & {
  showPopover?: (options?: { source?: HTMLElement | null }) => void;
  hidePopover?: () => void;
};

const supportsAnchorPositioning = (): boolean =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('anchor-name', '--a') &&
  CSS.supports('position-area', 'top');

const ALIGN_TO_POSITION_AREA: Record<NonNullable<InfoHintPopoverProps['align']>, string> = {
  start: 'block-end span-inline-end',
  end: 'block-end span-inline-start',
  center: 'block-end',
};

/**
 * Reusable, Android-touch-safe `!` contextual help popover using native HTML Top-Layer
 * `popover="auto"` and CSS Anchor Positioning with viewport-clamped fallback for jsdom
 * and older WebViews.
 */
export const InfoHintPopover: React.FC<InfoHintPopoverProps> = ({
  title,
  purpose,
  studentVisibility,
  example,
  ariaLabel,
  align = 'center',
  className,
}) => {
  const rawId = useId();
  const sanitizedId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const popoverId = `mf-info-popover-${sanitizedId}`;
  const titleId = `mf-info-title-${sanitizedId}`;
  const anchorIdent = `--mf-info-${sanitizedId}`;

  const supportsAnchor = supportsAnchorPositioning();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<PopoverDivElement>(null);

  const [nativeOpen, setNativeOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [needsDisplayOverride, setNeedsDisplayOverride] = useState(false);
  const [hasNativePopoverApi, setHasNativePopoverApi] = useState<boolean>(() =>
    typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function'
  );
  const [fallbackStyle, setFallbackStyle] = useState<React.CSSProperties>({});

  const isOpen = hasNativePopoverApi ? nativeOpen : fallbackOpen;

  const computeFallbackPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || supportsAnchor) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 16;
    const maxWidth = Math.min(320, Math.max(200, window.innerWidth - margin * 2));
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const placeBelow = spaceBelow >= 180 || spaceBelow >= rect.top;

    let left: number;
    if (align === 'start') {
      left = rect.left;
    } else if (align === 'end') {
      left = rect.right - maxWidth;
    } else {
      left = rect.left + rect.width / 2 - maxWidth / 2;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - margin - maxWidth));

    setFallbackStyle({
      position: 'fixed',
      inset: 'auto',
      margin: 0,
      left: `${left}px`,
      width: `${maxWidth}px`,
      zIndex: 10060,
      ...(placeBelow
        ? { top: `${rect.bottom + 8}px` }
        : { bottom: `${window.innerHeight - rect.top + 8}px` }),
    });
  }, [align, supportsAnchor]);

  useEffect(() => {
    const popoverEl = popoverRef.current;
    setHasNativePopoverApi(typeof popoverEl?.showPopover === 'function');
  }, []);

  // Keep fallback coordinates clamped to viewport on resize/scroll while open
  useEffect(() => {
    if (!isOpen || supportsAnchor) return;
    computeFallbackPosition();
    window.addEventListener('resize', computeFallbackPosition);
    window.addEventListener('scroll', computeFallbackPosition, true);
    return () => {
      window.removeEventListener('resize', computeFallbackPosition);
      window.removeEventListener('scroll', computeFallbackPosition, true);
    };
  }, [isOpen, supportsAnchor, computeFallbackPosition]);

  // Outside-click and Escape handling when native Popover API is unavailable
  useEffect(() => {
    if (!fallbackOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setFallbackOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setFallbackOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fallbackOpen]);

  const handleToggleEvent = (event: React.ToggleEvent<HTMLDivElement>) => {
    const nextOpen = event.newState === 'open';
    setNativeOpen(nextOpen);
    if (nextOpen) {
      computeFallbackPosition();
    }
  };

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const popoverEl = popoverRef.current;

    if (popoverEl && typeof popoverEl.showPopover === 'function') {
      setHasNativePopoverApi(true);
      try {
        let currentlyOpen = nativeOpen;
        try {
          currentlyOpen = popoverEl.matches(':popover-open');
        } catch {
          currentlyOpen = nativeOpen;
        }

        if (currentlyOpen) {
          popoverEl.hidePopover?.();
          setNativeOpen(false);
          setNeedsDisplayOverride(false);
        } else {
          computeFallbackPosition();
          popoverEl.showPopover({ source: triggerRef.current });
          setNativeOpen(true);
          let matchedPseudo = false;
          try {
            matchedPseudo = popoverEl.matches(':popover-open');
          } catch {
            matchedPseudo = false;
          }
          setNeedsDisplayOverride(!matchedPseudo);
        }
      } catch {
        computeFallbackPosition();
        setFallbackOpen((prev) => !prev);
      }
      return;
    }

    setHasNativePopoverApi(false);
    setNeedsDisplayOverride(true);
    setFallbackOpen((prev) => {
      const next = !prev;
      if (next) computeFallbackPosition();
      return next;
    });
  };

  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const popoverEl = popoverRef.current;
    if (popoverEl && typeof popoverEl.hidePopover === 'function') {
      try {
        popoverEl.hidePopover();
      } catch {
        // Ignore if already closed
      }
    }
    setNativeOpen(false);
    setFallbackOpen(false);
    setNeedsDisplayOverride(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const triggerStyle = {
    '--anchor-name': anchorIdent,
    anchorName: anchorIdent,
  } as React.CSSProperties;

  const popoverStyle: React.CSSProperties = {
    '--anchor-name': anchorIdent,
    '--mf-info-position-area': ALIGN_TO_POSITION_AREA[align],
    positionAnchor: anchorIdent,
    ...(supportsAnchor ? {} : fallbackStyle),
    ...((!hasNativePopoverApi && fallbackOpen) || (isOpen && needsDisplayOverride)
      ? { display: 'block' }
      : {}),
  } as React.CSSProperties;

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-label={ariaLabel || `Help: ${title}`}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        style={triggerStyle}
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full active:scale-95 touch-manipulation shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <span
          aria-hidden="true"
          className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-black text-xs flex items-center justify-center"
        >
          !
        </span>
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        role="dialog"
        aria-labelledby={titleId}
        hidden={!hasNativePopoverApi && !fallbackOpen}
        data-fallback-open={fallbackOpen ? 'true' : 'false'}
        onBeforeToggle={handleToggleEvent}
        onToggle={handleToggleEvent}
        onClick={(e) => e.stopPropagation()}
        style={popoverStyle}
        className={cn(
          'mf-info-popover max-w-[min(20rem,calc(100vw-2rem))]',
          !supportsAnchor && 'z-[10060]'
        )}
        {...({ popover: 'auto' } as any)}
      >
        <div className="w-80 max-w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl p-4 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-black text-[11px] flex items-center justify-center shrink-0"
              >
                !
              </span>
              <h3
                id={titleId}
                className="text-sm font-bold text-slate-900 dark:text-white leading-snug"
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close help"
              className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 touch-manipulation shrink-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Purpose
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                {purpose}
              </p>
            </div>

            {studentVisibility ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  Where students see this
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  {studentVisibility}
                </p>
              </div>
            ) : null}

            {example ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Example / Tip
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  {example}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </span>
  );
};
