import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface AnchoredPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  anchorName: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  matchAnchorWidth?: boolean;
  positionArea?: string;
  maxHeightPx?: number;
  offsetPx?: number;
  restoreFocusOnEscape?: boolean;
}

const supportsPopoverApi = (): boolean =>
  typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

const supportsAnchorPositioning = (): boolean =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('position-area', 'top');

/**
 * Controlled Top-Layer dropdown/popover wrapper using `popover="auto"` and CSS Anchor Positioning,
 * with viewport-clamped coordinates, outside dismissal, and trigger focus return on Escape.
 */
export const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  anchorName,
  children,
  id,
  className,
  matchAnchorWidth = true,
  positionArea = 'block-end span-inline-end',
  maxHeightPx = 320,
  offsetPx = 8,
  restoreFocusOnEscape = true,
}) => {
  const supportsPopover = supportsPopoverApi();
  const supportsAnchor = supportsAnchorPositioning();

  const popoverRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const [fallbackStyle, setFallbackStyle] = useState<React.CSSProperties>({});

  isOpenRef.current = isOpen;

  const computeFallbackRect = () => {
    const trigger = triggerRef.current;
    if (!trigger || supportsAnchor) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 12;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const placeTop = spaceBelow < Math.min(maxHeightPx, 240) && spaceAbove > spaceBelow;
    const availableHeight = Math.max(140, Math.min(maxHeightPx, placeTop ? spaceAbove : spaceBelow));

    const maxAllowedWidth = Math.max(160, window.innerWidth - margin * 2);
    const width = matchAnchorWidth ? Math.min(rect.width, maxAllowedWidth) : undefined;
    const left = Math.max(
      margin,
      Math.min(rect.left, window.innerWidth - margin - (width ?? Math.min(240, maxAllowedWidth)))
    );

    setFallbackStyle({
      position: 'fixed',
      inset: 'auto',
      margin: 0,
      left: `${left}px`,
      ...(width ? { width: `${width}px` } : {}),
      maxHeight: `${availableHeight}px`,
      ...(placeTop
        ? { bottom: `${window.innerHeight - rect.top + offsetPx}px` }
        : { top: `${rect.bottom + offsetPx}px` }),
    });
  };

  // Sync imperative showPopover / hidePopover with controlled `isOpen` prop
  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!el || !supportsPopover) return;

    if (isOpen) {
      computeFallbackRect();
      try {
        let alreadyOpen = false;
        try {
          alreadyOpen = el.matches(':popover-open');
        } catch {
          alreadyOpen = false;
        }
        if (!alreadyOpen) {
          const popoverEl = el as HTMLDivElement & {
            showPopover: (options?: { source?: HTMLElement | null }) => void;
          };
          popoverEl.showPopover(
            triggerRef.current ? { source: triggerRef.current } : undefined
          );
        }
      } catch {
        // Fallback silently if disconnected or partial support
      }
    } else {
      try {
        let isCurrentlyOpen = true;
        try {
          isCurrentlyOpen = el.matches(':popover-open');
        } catch {
          isCurrentlyOpen = true;
        }
        if (isCurrentlyOpen) {
          el.hidePopover();
        }
      } catch {
        // Ignore
      }
    }
  }, [isOpen, triggerRef, supportsPopover]);

  // Fallback viewport tracking while open
  useEffect(() => {
    if (!isOpen || supportsAnchor) return;
    computeFallbackRect();
    window.addEventListener('resize', computeFallbackRect);
    window.addEventListener('scroll', computeFallbackRect, true);
    return () => {
      window.removeEventListener('resize', computeFallbackRect);
      window.removeEventListener('scroll', computeFallbackRect, true);
    };
  }, [isOpen, matchAnchorWidth, maxHeightPx, offsetPx, supportsAnchor]);

  // Fallback outside click & Escape handler when Popover API is unavailable, plus Escape focus return
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!supportsPopover) {
          onClose();
        }
        if (restoreFocusOnEscape) {
          requestAnimationFrame(() => {
            triggerRef.current?.focus({ preventScroll: true });
          });
        }
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (supportsPopover) return;
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    if (!supportsPopover) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (!supportsPopover) {
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };
  }, [isOpen, onClose, restoreFocusOnEscape, triggerRef, supportsPopover]);

  const handleToggle = (event: React.ToggleEvent<HTMLDivElement>) => {
    if (event.newState === 'closed' && isOpenRef.current) {
      onClose();
    }
  };

  if (!supportsPopover && !isOpen) return null;

  const anchorVars = {
    '--mf-position-area': positionArea,
    '--mf-popover-max-h': `${maxHeightPx}px`,
    '--mf-anchor-offset': `${offsetPx}px`,
  } as React.CSSProperties;

  const style: React.CSSProperties = supportsAnchor
    ? ({ ...anchorVars, positionAnchor: anchorName } as React.CSSProperties)
    : fallbackStyle;

  if (!supportsPopover) {
    return (
      <div
        ref={popoverRef}
        id={id}
        style={fallbackStyle}
        className={cn('z-[10060]', className)}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      id={id}
      popover="auto"
      onToggle={handleToggle}
      style={style}
      className={cn(
        'mf-popover mf-popover-menu',
        matchAnchorWidth && 'mf-popover-menu--match-width',
        !supportsAnchor && 'z-[10060]',
        className
      )}
    >
      {children}
    </div>
  );
};
