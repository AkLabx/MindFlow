import { Question, SubjectStats } from '../types';

export interface GradingResult {
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  totalTimeSpent: number;
  overallAccuracy: number;
  subjectStats: Record<string, SubjectStats>;
}

/**
 * Pure function to calculate score, subject statistics, accuracy, and total time.
 * Framework agnostic and highly testable.
 */
export const calculateSessionGrades = (
  activeQuestions: Question[],
  answers: Record<string, string>,
  timeTaken: Record<string, number>,
  fallbackTimeTaken: Record<string, number> = {}
): GradingResult => {
  const subjectStats: Record<string, SubjectStats> = {};
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;
  let totalTimeSpent = 0;

  activeQuestions.forEach(q => {
    const subject = q?.subject || q?.classification?.subject || 'Unknown';
    if (!subjectStats[subject]) {
      subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0, accuracy: 0 };
    }

    const answer = answers[q.id];
    // Use explicitly passed time, or fallback to global store times if provided
    const timeMs = timeTaken[q.id] || fallbackTimeTaken[q.id] || 0;
    totalTimeSpent += timeMs;

    if (!answer) {
      totalSkipped++;
      subjectStats[subject].skipped++;
    } else {
      subjectStats[subject].attempted++;
      const isCorrect = answer === q.correct;
      if (isCorrect) {
        totalCorrect++;
        subjectStats[subject].correct++;
      } else {
        totalIncorrect++;
        subjectStats[subject].incorrect++;
      }
    }
  });

  Object.keys(subjectStats).forEach(subj => {
    const stats = subjectStats[subj];
    stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  });

  const overallAccuracy = activeQuestions.length > 0
    ? Math.round((totalCorrect / activeQuestions.length) * 100)
    : 0;

  return {
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    totalTimeSpent,
    overallAccuracy,
    subjectStats
  };
};
