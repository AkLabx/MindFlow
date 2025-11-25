
import { useState, useEffect, useRef } from 'react';

interface UseMockTimerProps {
  totalTime: number;
  onTimeUp: () => void;
  onTick?: (timeLeft: number) => void;
}

export function useMockTimer({
  totalTime,
  onTimeUp,
  onTick
}: UseMockTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timeLeftRef = useRef(totalTime);

  useEffect(() => {
    // If we start with 0 or less, finish immediately
    if (totalTime <= 0) {
        onTimeUp();
        return;
    }
    setTimeLeft(totalTime);
    timeLeftRef.current = totalTime;
  }, [totalTime]); // Only reset if totalTime prop changes significantly (usually init)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(intervalId);
          onTimeUp();
          return 0;
        }
        const newTime = prev - 1;
        timeLeftRef.current = newTime;
        onTick?.(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [onTimeUp, onTick]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    timeLeft,
    formatTime
  };
}
