import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InfoTooltipProps {
  text: React.ReactNode;
  label?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  side?: 'top' | 'bottom';
  maxWidthPx?: number;
}

const supportsPopoverApi = (): boolean =>
  typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

const supportsAnchorPositioning = (): boolean =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('position-area', 'top');

/**
 * Accessible, Android-touch and keyboard-first info disclosure tooltip.
 * Uses Top Layer `popover="auto"` + CSS Anchor Positioning when available,
 * with viewport-clamped `getBoundingClientRect` and outside-dismiss fallbacks.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  label,
  ariaLabel,
  icon,
  triggerClassName,
  contentClassName,
  side = 'top',
  maxWidthPx = 224,
}) => {
  const supportsPopover = supportsPopoverApi();
  const supportsAnchor = supportsAnchorPositioning();

  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const popoverId = `mf-tip-${safeId}`;
  const anchorName = `--mf-tip-anchor-${safeId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [fallbackStyle, setFallbackStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const computeFallbackPosition = () => {
    if (!triggerRef.current || supportsAnchor) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const padding = 16;
    const clampedWidth = Math.min(maxWidthPx, Math.max(0, window.innerWidth - padding * 2));
    const half = clampedWidth / 2;
    const center = rect.left + rect.width / 2;
    const left = Math.max(padding + half, Math.min(center, window.innerWidth - padding - half));
    const placeBelow = side === 'bottom' ? window.innerHeight - rect.bottom > 110 : rect.top < 110;

    setFallbackStyle({
      position: 'fixed',
      inset: 'auto',
      margin: 0,
      left: `${left}px`,
      transform: 'translateX(-50%)',
      ...(placeBelow
        ? { top: `${rect.bottom + 8}px` }
        : { bottom: `${window.innerHeight - rect.top + 8}px` }),
    });
  };

  // Reposition fallback while open when viewport scrolls or resizes
  useEffect(() => {
    if (!isOpen || supportsAnchor) return;
    computeFallbackPosition();
    window.addEventListener('resize', computeFallbackPosition);
    window.addEventListener('scroll', computeFallbackPosition, true);
    return () => {
      window.removeEventListener('resize', computeFallbackPosition);
      window.removeEventListener('scroll', computeFallbackPosition, true);
    };
  }, [isOpen, side, maxWidthPx, supportsAnchor]);

  // Outside-click and Escape focus return when Popover API is unavailable
  useEffect(() => {
    if (!isOpen || supportsPopover) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, supportsPopover]);

  const handleToggle = (event: React.ToggleEvent<HTMLDivElement>) => {
    const opening = event.newState === 'open';
    setIsOpen(opening);
    if (opening) {
      computeFallbackPosition();
    }
  };

  const handleFallbackToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) computeFallbackPosition();
      return next;
    });
  };

  const anchorCssVars = {
    '--mf-position-area': side === 'bottom' ? 'bottom' : 'top',
    '--mf-popover-max-w': `${maxWidthPx}px`,
  } as React.CSSProperties;

  const anchorStyle: React.CSSProperties | undefined = supportsAnchor
    ? ({ anchorName } as React.CSSProperties)
    : undefined;

  const popoverStyle: React.CSSProperties = supportsAnchor
    ? ({ ...anchorCssVars, positionAnchor: anchorName } as React.CSSProperties)
    : fallbackStyle;

  const resolvedAriaLabel = ariaLabel || (label ? `More about ${label}` : 'More information');

  const panelClasses = cn(
    'w-56 max-w-[calc(100vw-2rem)] p-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-xl text-center font-normal leading-relaxed border border-slate-700/70',
    contentClassName
  );

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={supportsPopover ? popoverId : undefined}
        popoverTargetAction={supportsPopover ? 'toggle' : undefined}
        onClick={!supportsPopover ? handleFallbackToggle : undefined}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={resolvedAriaLabel}
        style={anchorStyle}
        className={cn(
          'min-w-[44px] min-h-[44px] -my-3 -mx-2 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer touch-manipulation',
          triggerClassName
        )}
      >
        {icon ?? <Info className="w-3.5 h-3.5" aria-hidden="true" />}
      </button>

      {supportsPopover ? (
        <div
          ref={popoverRef}
          id={popoverId}
          popover="auto"
          onToggle={handleToggle}
          style={popoverStyle}
          className={cn('mf-popover mf-popover-anchored', !supportsAnchor && 'z-[10060]')}
        >
          <div className={panelClasses}>{text}</div>
        </div>
      ) : isOpen ? (
        <div
          ref={popoverRef}
          id={popoverId}
          style={fallbackStyle}
          className="z-[10060]"
        >
          <div className={panelClasses}>{text}</div>
        </div>
      ) : null}
    </div>
  );
};
