import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { useNotification } from '../../../stores/useNotificationStore';

const supportsPopoverApi = (): boolean =>
  typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();
  const containerRef = useRef<HTMLDivElement>(null);
  const supportsPopover = supportsPopoverApi();
  const latestToastId = toasts[toasts.length - 1]?.id;

  // Keep notification banner at the top of the Top Layer stack above open modal dialogs
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !supportsPopover) return;

    try {
      let isOpen = false;
      try {
        isOpen = el.matches(':popover-open');
      } catch {
        isOpen = false;
      }

      if (toasts.length > 0) {
        if (isOpen) {
          el.hidePopover();
        }
        el.showPopover();
      } else if (isOpen) {
        el.hidePopover();
      }
    } catch {
      // Fallback silently if engine/test environment lacks Popover methods
    }
  }, [toasts.length, latestToastId, supportsPopover]);

  return (
    <div
      ref={containerRef}
      popover={supportsPopover ? 'manual' : undefined}
      className={
        supportsPopover
          ? 'mf-toast-layer flex flex-col gap-2 md:items-center pointer-events-none'
          : 'fixed top-4 left-0 right-0 z-[10070] flex flex-col gap-2 p-4 md:items-center sm:px-6 md:px-8 pointer-events-none'
      }
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
