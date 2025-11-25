
import { useState, useEffect, useRef } from 'react';

interface UseLearningTimerProps {
  initialTime: number;
  questionId: string; // Add identifier to force reset
  isPaused: boolean;
  onTimeUp: () => void;
  onTick?: (timeLeft: number) => void;
}

export function useLearningTimer({
  initialTime,
  questionId,
  isPaused,
  onTimeUp,
  onTick
}: UseLearningTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timeLeftRef = useRef(initialTime);

  // Sync state with prop if initialTime changes or question changes
  useEffect(() => {
    setTimeLeft(initialTime);
    timeLeftRef.current = initialTime;
  }, [initialTime, questionId]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

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
  }, [isPaused, onTimeUp, onTick]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    timeLeft,
    timeLeftRef,
    formatTime
  };
}
