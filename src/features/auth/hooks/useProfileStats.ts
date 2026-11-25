import { useState, useEffect } from 'react';
import { db } from '../../../lib/db';
import { useAuth } from '../context/AuthContext';
import {
  ContinueLearningItem,
  MOCK_CACHE_INVALIDATED_EVENT,
  fetchContinueLearningItems,
  getCachedContinueLearningSnapshot,
  readContinueLearningIndexedDBCache,
} from '@/features/mock-tests/api/mockTestsApi';

export interface ProfileStats {
  weakTopics: string[];
  quizzesCompleted: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpentFormatted: string;
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/**
 * Pure aggregator combining custom quiz history (`quiz_history` IndexedDB) with
 * completed prepared mock test attempts (`ContinueLearningItem` where `status === 'completed'`).
 */
export const computeCombinedProfileStats = (
  localHistory: any[],
  mockItems: ContinueLearningItem[]
): ProfileStats => {
  let quizzesCompleted = 0;
  let correctAnswers = 0;
  let totalQuestionsAnswered = 0;
  let totalTimeSpent = 0;
  const subjectTotals: Record<string, { correct: number; incorrect: number }> = {};

  if (Array.isArray(localHistory) && localHistory.length > 0) {
    quizzesCompleted += localHistory.length;
    localHistory.forEach((record: any) => {
      const recordCorrect = record.totalCorrect ?? record.total_correct ?? 0;
      const recordIncorrect = record.totalIncorrect ?? record.total_incorrect ?? 0;
      const recordTime = record.totalTimeSpent ?? record.total_time_spent ?? 0;
      const recordStats = record.subjectStats ?? record.subject_stats;

      correctAnswers += recordCorrect;
      totalQuestionsAnswered += recordCorrect + recordIncorrect;
      totalTimeSpent += recordTime;

      if (recordStats) {
        Object.entries(recordStats as Record<string, any>).forEach(([subject, s]) => {
          if (!subjectTotals[subject]) subjectTotals[subject] = { correct: 0, incorrect: 0 };
          subjectTotals[subject].correct += s.correct || 0;
          subjectTotals[subject].incorrect += s.incorrect || 0;
        });
      }
    });
  }

  const completedMocks = (Array.isArray(mockItems) ? mockItems : []).filter(
    (item) => item && item.status === 'completed'
  );

  for (const mock of completedMocks) {
    quizzesCompleted += 1;
    if (mock.timeTakenSeconds !== null && Number.isFinite(mock.timeTakenSeconds) && mock.timeTakenSeconds > 0) {
      totalTimeSpent += mock.timeTakenSeconds;
    }

    const attempted = Number.isFinite(mock.answeredCount) && mock.answeredCount > 0 ? mock.answeredCount : 0;
    if (attempted > 0) {
      const safeAcc = Math.min(100, Math.max(0, Number(mock.accuracy) || 0));
      const approxCorrect = Math.round((safeAcc / 100) * attempted);
      correctAnswers += approxCorrect;
      totalQuestionsAnswered += attempted;
    }
  }

  let averageScore = 0;
  if (totalQuestionsAnswered > 0) {
    averageScore = Math.round((correctAnswers / totalQuestionsAnswered) * 100);
  } else if (completedMocks.length > 0) {
    const accSum = completedMocks.reduce(
      (sum, item) => sum + Math.min(100, Math.max(0, Number(item.accuracy) || 0)),
      0
    );
    averageScore = Math.round(accSum / completedMocks.length);
  }

  const weakTopicsList: { subject: string; accuracy: number }[] = [];
  Object.entries(subjectTotals).forEach(([subject, stats]) => {
    const attempts = stats.correct + stats.incorrect;
    if (attempts >= 5) {
      const accuracy = (stats.correct / attempts) * 100;
      weakTopicsList.push({ subject, accuracy });
    }
  });

  weakTopicsList.sort((a, b) => a.accuracy - b.accuracy);
  const weakTopics = weakTopicsList.slice(0, 2).map((t) => t.subject);

  return {
    quizzesCompleted,
    correctAnswers,
    averageScore,
    weakTopics,
    totalTimeSpentFormatted: formatTime(totalTimeSpent),
  };
};

export const useProfileStats = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [stats, setStats] = useState<ProfileStats>({
    weakTopics: [],
    quizzesCompleted: 0,
    correctAnswers: 0,
    averageScore: 0,
    totalTimeSpentFormatted: '0s',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const localHistory: any[] = (await db.getQuizHistory()) || [];

        let initialMocks: ContinueLearningItem[] = [];
        if (userId) {
          const syncMocks = getCachedContinueLearningSnapshot(userId, Date.now(), 25);
          if (syncMocks !== null) {
            initialMocks = syncMocks;
          } else {
            const idbMocks = await readContinueLearningIndexedDBCache(userId, Date.now(), 25);
            if (idbMocks !== null) {
              initialMocks = idbMocks;
            }
          }
        }

        if (!isMounted) return;
        setStats(computeCombinedProfileStats(localHistory, initialMocks));
        setLoading(false);

        if (userId) {
          try {
            const freshMocks = await fetchContinueLearningItems(userId, { limit: 25 });
            if (isMounted) {
              setStats(computeCombinedProfileStats(localHistory, freshMocks));
            }
          } catch {
            // Silently keep 0ms cached stats when offline
          }
        }
      } catch (err: any) {
        console.error('Error fetching profile stats:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to load statistics');
          setLoading(false);
        }
      }
    };

    void run();

    const handleInvalidate = () => {
      if (isMounted) {
        void run();
      }
    };
    window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);

    return () => {
      isMounted = false;
      window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);
    };
  }, [userId]);

  return { stats, loading, error };
};
