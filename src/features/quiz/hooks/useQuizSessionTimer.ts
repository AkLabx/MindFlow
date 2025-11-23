
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { QuizMode } from '../types';
import { APP_CONFIG } from '../../../constants/config';

interface UseQuizSessionTimerProps {
  mode: QuizMode;
  questionId: string;
  isAnswered: boolean;
  remainingTime: number; // Per question time for Learning
  globalTimeRemaining: number; // Total time for Mock
  totalQuestions: number;
  onFinish: () => void;
  onSaveTime: (questionId: string, time: number) => void;
  onSyncGlobalTimer: (time: number) => void;
  onLogTime: (questionId: string, time: number) => void;
  onTick?: () => void; // New prop for playing sound
}

export function useQuizSessionTimer({
  mode,
  questionId,
  isAnswered,
  remainingTime,
  globalTimeRemaining,
  totalQuestions,
  onFinish,
  onSaveTime,
  onSyncGlobalTimer,
  onLogTime,
  onTick
}: UseQuizSessionTimerProps) {
  const isMockMode = mode === 'mock';
  
  // Mock Mode: Question Stopwatch (Count up from 0) to track time spent per question
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);
  const questionTimeRef = useRef(0); 

  // 1. Learning Mode Timer (Per Question Countdown)
  const handleLearningTimerComplete = useCallback(() => {
     // In learning mode, timer hitting zero doesn't auto-submit, just stays at 0.
  }, []);

  const [secondsLeftLearning] = useTimer({
    duration: remainingTime ?? APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT,
    onTimeUp: handleLearningTimerComplete,
    key: questionId, // Resets when question changes
    isPaused: isAnswered || isMockMode
  });

  // Sound Effect Logic for Learning Mode (Last 5 seconds)
  useEffect(() => {
      if (!isMockMode && !isAnswered && secondsLeftLearning <= 5 && secondsLeftLearning > 0) {
          onTick?.();
      }
  }, [secondsLeftLearning, isMockMode, isAnswered, onTick]);

  // Ref to hold the current seconds left to avoid dependency loops in useEffect when saving
  const secondsLeftRef = useRef(secondsLeftLearning);
  
  // Keep ref in sync
  useEffect(() => {
    secondsLeftRef.current = secondsLeftLearning;
  }, [secondsLeftLearning]);

  // 2. Mock Mode Timer (Global Countdown)
  const [secondsLeftMock] = useTimer({
    duration: globalTimeRemaining > 0 ? globalTimeRemaining : totalQuestions * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION,
    onTimeUp: onFinish,
    key: 'global-mock-timer', 
    isPaused: !isMockMode || (globalTimeRemaining <= 0)
  });

  // Ref for Mock Timer to prevent re-render loops when syncing to store
  const secondsLeftMockRef = useRef(secondsLeftMock);
  useEffect(() => {
    secondsLeftMockRef.current = secondsLeftMock;
  }, [secondsLeftMock]);

  // 3. Mock Mode Question Stopwatch (Count Up)
  useEffect(() => {
    setQuestionTimeElapsed(0);
    questionTimeRef.current = 0;

    const interval = setInterval(() => {
      setQuestionTimeElapsed(prev => {
        const next = prev + 1;
        questionTimeRef.current = next;
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      // When leaving a question in mock mode, log the time spent
      if (isMockMode && questionTimeRef.current > 0) {
        onLogTime(questionId, questionTimeRef.current);
      }
    };
  }, [questionId, isMockMode, onLogTime]);

  // Sync timers back to state (Learning Mode)
  useEffect(() => {
      return () => {
          if (!isMockMode && !isAnswered) {
              // Use ref to get latest value without triggering re-render loop
              onSaveTime(questionId, secondsLeftRef.current);
          }
      };
  }, [questionId, isMockMode, isAnswered, onSaveTime]);

  // Sync Global Timer (Mock Mode) occasionally
  useEffect(() => {
      if (isMockMode) {
          const interval = setInterval(() => {
              // Use Ref to get current time without adding it to dependencies
              // This prevents the effect from re-running every second, which causes the timer to reset repeatedly
              onSyncGlobalTimer(secondsLeftMockRef.current);
          }, 5000);
          
          return () => {
              clearInterval(interval);
              if (secondsLeftMockRef.current > 0) {
                  onSyncGlobalTimer(secondsLeftMockRef.current);
              }
          }
      }
  }, [isMockMode, onSyncGlobalTimer]);

  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    secondsLeftLearning,
    secondsLeftMock,
    questionTimeElapsed,
    formatTime
  };
}
