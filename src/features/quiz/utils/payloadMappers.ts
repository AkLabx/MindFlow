import { v4 as uuidv4 } from 'uuid';
import { QuizRuntimeState, QuizHistoryRecord } from '../types';
import { GradingResult } from '../engine/grading';

/**
 * Creates the standardized history record required for offline sync and analytics.
 */
export const buildHistoryRecord = (
  quizId: string,
  totalQuestions: number,
  difficultyStr: string,
  grades: GradingResult
): QuizHistoryRecord => {
  return {
    id: uuidv4(),
    quiz_id: quizId,
    date: Date.now(),
    totalQuestions,
    totalCorrect: grades.totalCorrect,
    totalIncorrect: grades.totalIncorrect,
    totalSkipped: grades.totalSkipped,
    // Convert ms to decimal seconds exactly as the legacy system did
    totalTimeSpent: grades.totalTimeSpent / 1000,
    overallAccuracy: grades.overallAccuracy,
    difficulty: difficultyStr,
    subjectStats: grades.subjectStats
  };
};

/**
 * Strips the heavy question array out of the state payload so it can be
 * safely injected into PostgreSQL JSONB without blowing up size limits.
 */
export const buildFinalStatePayload = (
  state: QuizRuntimeState,
  finalScore: number,
  finalAnswers: Record<string, string>,
  finalTimeTaken: Record<string, number>,
  finalBookmarks: string[]
) => {
  return {
    status: 'result',
    mode: state.mode,
    score: finalScore,
    answers: finalAnswers,
    timeTaken: finalTimeTaken,
    remainingTimes: state.remainingTimes,
    quizTimeRemaining: state.quizTimeRemaining,
    bookmarks: finalBookmarks,
    markedForReview: state.markedForReview,
    hiddenOptions: state.hiddenOptions,
    filters: state.filters,
    isPaused: state.isPaused,
    quizId: state.quizId,
    currentQuestionIndex: state.currentQuestionIndex
  };
};
