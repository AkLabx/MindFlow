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
  const triggeredRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      triggeredRef.current = false;
      setIsSwiping(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled || startXRef.current === null) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diffX = clientX - startXRef.current;

      // Only allow swiping to the right (positive diffX)
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
