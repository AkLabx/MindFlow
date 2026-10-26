import { useCallback, useRef, useEffect } from 'react';

interface UseLongPressOptions {
  delay?: number;
  movementThreshold?: number; // How many pixels the pointer can move before canceling
  disabled?: boolean;
}

export function useLongPress(
  onLongPress: (e: React.PointerEvent) => void,
  onClick?: (e: React.PointerEvent) => void,
  { delay = 500, movementThreshold = 10, disabled = false }: UseLongPressOptions = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // We only care about primary pointers (e.g. left click or first touch)
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      startPosRef.current = { x: e.clientX, y: e.clientY };
      isLongPressTriggeredRef.current = false;

      timeoutRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay, disabled]
  );

  const clear = useCallback(
    (e: React.PointerEvent, isEndEvent = false) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      // If it's a pointerup and we haven't triggered long press, it's a click
      if (isEndEvent && !isLongPressTriggeredRef.current && onClick) {
         onClick(e);
      }

      startPosRef.current = null;
    },
    [onClick]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return;

      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      if (dx > movementThreshold || dy > movementThreshold) {
        clear(e, false);
      }
    },
    [movementThreshold, clear]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: (e: React.PointerEvent) => clear(e, true),
    onPointerMove: move,
    onPointerCancel: (e: React.PointerEvent) => clear(e, false),
    onPointerLeave: (e: React.PointerEvent) => clear(e, false)
  };
}
