import { useState, useRef, useCallback } from 'react';

interface UseSwipeToReplyOptions {
  onReply: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useSwipeToReply({
  onReply,
  threshold = 55,
  disabled = false,
}: UseSwipeToReplyOptions) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isLockedVerticalRef = useRef(false);
  const isLockedHorizontalRef = useRef(false);
  const triggeredRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startXRef.current = clientX;
      startYRef.current = clientY;
      isLockedVerticalRef.current = false;
      isLockedHorizontalRef.current = false;
      triggeredRef.current = false;
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled || startXRef.current === null || startYRef.current === null) return;
      if (isLockedVerticalRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const diffX = clientX - startXRef.current;
      const diffY = Math.abs(clientY - startYRef.current);

      // Determine axis lock if not locked yet
      if (!isLockedHorizontalRef.current) {
        if (diffY > 8 && diffY > Math.abs(diffX)) {
          isLockedVerticalRef.current = true;
          return;
        }
        if (diffX > 10 && diffX > diffY * 1.5) {
          isLockedHorizontalRef.current = true;
          setIsSwiping(true);
        } else {
          return;
        }
      }

      // Axis locked to horizontal right swipe
      if (diffX > 0) {
        // Apply rubber-banding dampening after threshold
        const dampenedOffset = diffX > threshold ? threshold + (diffX - threshold) * 0.25 : diffX;
        setOffsetX(Math.min(dampenedOffset, 80));

        if (diffX >= threshold && !triggeredRef.current) {
          triggeredRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        }
      }
    },
    [disabled, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || startXRef.current === null) return;

    if (triggeredRef.current) {
      onReply();
    }

    startXRef.current = null;
    startYRef.current = null;
    isLockedVerticalRef.current = false;
    isLockedHorizontalRef.current = false;
    triggeredRef.current = false;
    setOffsetX(0);
    setIsSwiping(false);
  }, [disabled, onReply]);

  return {
    offsetX,
    isSwiping,
    isThresholdPassed: triggeredRef.current,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}
