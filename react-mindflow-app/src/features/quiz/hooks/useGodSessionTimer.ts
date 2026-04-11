import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGodSessionTimerProps {
  totalTime: number;
  onTimeUp: () => void;
}

export function useGodSessionTimer({ totalTime, onTimeUp }: UseGodSessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timeLeftRef = useRef(totalTime);
  const currentQuestionTimeRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  // Use a stable reference to onTimeUp so it doesn't trigger effect re-runs
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (totalTime <= 0) {
        onTimeUpRef.current();
        return;
    }
    setTimeLeft(totalTime);
    timeLeftRef.current = totalTime;
  }, [totalTime]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../engine/timerWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
        if (e.data === 'TICK') {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    workerRef.current?.postMessage('STOP');
                    onTimeUpRef.current();
                    return 0;
                }
                const newTime = prev - 1;
                timeLeftRef.current = newTime;
                // Increment individual question timer
                currentQuestionTimeRef.current += 1;
                return newTime;
            });
        }
    };

    workerRef.current.postMessage('START');

    return () => {
        workerRef.current?.postMessage('STOP');
        workerRef.current?.terminate();
    };
  }, []); // Empty dependency array ensures worker is only created once

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getAndResetCurrentQuestionTime = useCallback(() => {
    const timeSpent = currentQuestionTimeRef.current;
    currentQuestionTimeRef.current = 0;
    return timeSpent;
  }, []);

  return {
    timeLeft,
    formatTime,
    getAndResetCurrentQuestionTime,
    getCurrentQuestionTimeRef: () => currentQuestionTimeRef.current
  };
}
