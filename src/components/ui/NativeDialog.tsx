import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export type NativeDialogVariant =
  | 'center'
  | 'bottom-sheet'
  | 'drawer-right'
  | 'drawer-left'
  | 'command'
  | 'fullscreen';

export interface NativeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: NativeDialogVariant;
  role?: 'dialog' | 'alertdialog';
  dismissible?: boolean;
  isDirty?: boolean;
  onDirtyCloseAttempt?: () => void;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaLabel?: string;
  className?: string;
  panelClassName?: string;
  backdropClassName?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDialogElement>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  dataTestId?: string;
}

const VARIANT_CLASSES: Record<NativeDialogVariant, string> = {
  center: 'mf-dialog--center',
  'bottom-sheet': 'mf-dialog--bottom-sheet',
  'drawer-right': 'mf-dialog--drawer-right',
  'drawer-left': 'mf-dialog--drawer-left',
  command: 'mf-dialog--command',
  fullscreen: 'mf-dialog--fullscreen',
};

let cachedTopLayerExitSupport: boolean | null = null;

function canAnimateTopLayerExit(): boolean {
  if (cachedTopLayerExitSupport !== null) return cachedTopLayerExitSupport;
  if (typeof document === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
    cachedTopLayerExitSupport = false;
    return false;
  }

  const supportsProperties =
    CSS.supports('transition-behavior', 'allow-discrete') &&
    CSS.supports('overlay', 'auto');
  if (!supportsProperties || !document.body) {
    cachedTopLayerExitSupport = false;
    return false;
  }

  // Firefox historically parsed allow-discrete in CSS.supports without animating display
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;display:none;transition:display 1ms allow-discrete;';
  document.body.appendChild(probe);
  try {
    void window.getComputedStyle(probe).display;
    probe.style.display = 'block';
    cachedTopLayerExitSupport =
      typeof probe.getAnimations === 'function' && probe.getAnimations().length > 0;
  } catch {
    cachedTopLayerExitSupport = false;
  } finally {
    probe.remove();
  }

  return cachedTopLayerExitSupport;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Shared MWG-compliant modal, bottom-sheet, and slide-over drawer built on native `<dialog>`.
 * Provides browser Top Layer stacking, focus trapping, inert background, Escape/cancel dismissal,
 * and automatic focus restoration without mutating `document.body.style.overflow`.
 */
export const NativeDialog: React.FC<NativeDialogProps> = ({
  isOpen,
  onClose,
  children,
  variant = 'center',
  role = 'dialog',
  dismissible = true,
  isDirty = false,
  onDirtyCloseAttempt,
  ariaLabelledBy,
  ariaDescribedBy,
  ariaLabel,
  className,
  panelClassName,
  backdropClassName,
  onKeyDown,
  initialFocusRef,
  dataTestId,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpenRef = useRef(isOpen);
  const closeSeqRef = useRef(0);
  const pointerDownOutsideRef = useRef(false);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  isOpenRef.current = isOpen;

  // Synchronize React visibility to mount before opening and retain DOM during exit animation
  useLayoutEffect(() => {
    if (isOpen) {
      closeSeqRef.current += 1;
      setIsClosing(false);
      setShouldRender(true);
    }
  }, [isOpen]);

  // Keep closedby attribute synced declaratively without relying on JSX TS definitions
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const closedByValue = !dismissible ? 'none' : isDirty ? 'closerequest' : 'any';
    dialog.setAttribute('closedby', closedByValue);
  }, [shouldRender, dismissible, isDirty]);

  // Adjust mobile bottom sheets / modals above Android WebView soft keyboards
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardHeight(0);
      return;
    }

    const vv = window.visualViewport;
    const updateKeyboard = () => {
      const overlaid = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(overlaid > 100 ? overlaid : 0);
    };

    updateKeyboard();
    vv.addEventListener('resize', updateKeyboard);
    vv.addEventListener('scroll', updateKeyboard);
    return () => {
      vv.removeEventListener('resize', updateKeyboard);
      vv.removeEventListener('scroll', updateKeyboard);
    };
  }, [isOpen]);

  // Open / close native Top Layer lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !shouldRender) return;

    if (isOpen) {
      closeSeqRef.current += 1;
      setIsClosing(false);

      if (!dialog.open) {
        previousActiveRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (typeof dialog.showModal === 'function') {
          try {
            dialog.showModal();
          } catch {
            dialog.setAttribute('open', '');
          }
        } else {
          dialog.setAttribute('open', '');
        }
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus({ preventScroll: true });
        }
      }
      return;
    }

    // Closing transition
    if (!dialog.open && !dialog.hasAttribute('open')) {
      setShouldRender(false);
      return;
    }

    const seq = ++closeSeqRef.current;
    const reduced = prefersReducedMotion();
    const nativeTopLayerExit = canAnimateTopLayerExit();

    const finishClose = () => {
      if (seq !== closeSeqRef.current || isOpenRef.current) return;
      if (dialog.open || dialog.hasAttribute('open')) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      }
      setIsClosing(false);
      setShouldRender(false);
      if (previousActiveRef.current && document.contains(previousActiveRef.current)) {
        previousActiveRef.current.focus({ preventScroll: true });
      }
      previousActiveRef.current = null;
    };

    if (reduced || typeof dialog.getAnimations !== 'function') {
      finishClose();
      return;
    }

    if (nativeTopLayerExit) {
      // Allow native overlay/display discrete exit animation before unmounting DOM
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      const animations = dialog.getAnimations();
      if (animations.length === 0) {
        setShouldRender(false);
        return;
      }
      const fallbackTimer = window.setTimeout(() => {
        if (seq === closeSeqRef.current && !isOpenRef.current) {
          setShouldRender(false);
        }
      }, 240);
      Promise.allSettled(animations.map((a) => a.finished)).then(() => {
        window.clearTimeout(fallbackTimer);
        if (seq === closeSeqRef.current && !isOpenRef.current) {
          setShouldRender(false);
        }
      });
      return () => window.clearTimeout(fallbackTimer);
    }

    // Discrete-display fallback for Firefox / older WebViews: animate while still open, then close
    setIsClosing(true);
    const frameId = window.requestAnimationFrame(() => {
      if (seq !== closeSeqRef.current || isOpenRef.current) return;
      const animations = dialog.getAnimations();
      if (animations.length === 0) {
        finishClose();
        return;
      }
      const fallbackTimer = window.setTimeout(finishClose, 240);
      Promise.allSettled(animations.map((a) => a.finished)).then(() => {
        window.clearTimeout(fallbackTimer);
        finishClose();
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, shouldRender, initialFocusRef]);

  if (!shouldRender) return null;

  const isPointOutsideDialog = (dialog: HTMLDialogElement, clientX: number, clientY: number) => {
    const rect = dialog.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || e.target !== dialog) {
      pointerDownOutsideRef.current = false;
      return;
    }
    pointerDownOutsideRef.current = isPointOutsideDialog(dialog, e.clientX, e.clientY);
  };

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || e.target !== dialog || e.detail === 0) return;

    const clickedOutside =
      pointerDownOutsideRef.current && isPointOutsideDialog(dialog, e.clientX, e.clientY);
    pointerDownOutsideRef.current = false;

    if (!clickedOutside) return;

    if (!dismissible) return;
    if (isDirty) {
      onDirtyCloseAttempt?.();
      return;
    }

    // Native closedby="any" may have already closed it; guard before invoking React callback
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      onClose();
    }
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (!dismissible) {
      e.preventDefault();
      return;
    }
    if (isDirty) {
      e.preventDefault();
      onDirtyCloseAttempt?.();
    }
  };

  const handleNativeClose = () => {
    setIsClosing(false);
    setShouldRender(false);
    if (isOpenRef.current) {
      onClose();
    }
  };

  const dialogStyle: React.CSSProperties | undefined =
    keyboardHeight > 0
      ? variant === 'bottom-sheet'
        ? {
            marginBottom: `${keyboardHeight}px`,
            maxHeight: `calc(100dvh - ${keyboardHeight}px - env(safe-area-inset-top))`,
          }
        : variant === 'center' || variant === 'command'
          ? {
              maxHeight: `calc(100dvh - ${keyboardHeight}px - 1.5rem)`,
            }
          : undefined
      : undefined;

  return (
    <dialog
      ref={dialogRef}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      data-closing={isClosing ? 'true' : undefined}
      data-testid={dataTestId}
      style={dialogStyle}
      onPointerDown={handlePointerDown}
      onClick={handleDialogClick}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onKeyDown={onKeyDown}
      className={cn('mf-dialog', VARIANT_CLASSES[variant], backdropClassName, className)}
    >
      {panelClassName ? <div className={panelClassName}>{children}</div> : children}
    </dialog>
  );
};
