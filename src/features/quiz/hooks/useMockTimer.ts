import { useState, useEffect, useRef } from 'react';

/**
 * Props for the useMockTimer hook.
 */
interface UseMockTimerProps {
  /** The total duration of the quiz in seconds. */
  totalTime: number;
  /** Callback fired when the timer reaches zero. */
  onTimeUp: () => void;
  /** Optional callback fired on every second tick. */
  onTick?: (timeLeft: number) => void;
}

/**
 * Custom hook for managing a global session countdown timer (Mock Mode).
 *
 * Unlike the Learning Timer, this one does not reset per question.
 * It counts down continuously for the entire duration of the exam.
 *
 * @param {UseMockTimerProps} props - The hook configuration.
 * @returns {object} Timer state and helper functions.
 */
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

  /**
   * Formats seconds into M:SS string.
   * Note: Does not zero-pad minutes, standard for longer durations.
   */
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
