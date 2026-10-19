import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface PerformanceMetrics {
  total_quizzes: number;
  total_correct: number;
  total_incorrect: number;
  total_skipped: number;
  total_time_spent: number;
  total_questions: number;
  average_accuracy: number;
  subject_stats: Record<string, {
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
  }>;
}

export const usePerformanceAnalytics = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: async (): Promise<PerformanceMetrics> => {
      // Fetch directly from quiz_history instead of broken RPC
      const { data: historyData, error: historyError } = await supabase
        .from('quiz_history')
        .select('*');

      let metrics = {
        total_quizzes: 0,
        total_correct: 0,
        total_incorrect: 0,
        total_skipped: 0,
        total_time_spent: 0,
        total_questions: 0,
        average_accuracy: 0,
        subject_stats: {} as Record<string, { attempted: number; correct: number; incorrect: number; skipped: number }>
      };

      if (historyError) {
        console.warn('Failed to fetch from remote quiz_history, falling back to local.', historyError);
        // Fallback to local DB
        const { db } = await import('../../../lib/db');
        const localHistory = await db.getQuizHistory();

        localHistory.forEach(record => {
            metrics.total_quizzes += 1;
            metrics.total_correct += record.totalCorrect || 0;
            metrics.total_incorrect += record.totalIncorrect || 0;
            metrics.total_skipped += record.totalSkipped || 0;
            metrics.total_time_spent += record.totalTimeSpent || 0;
            metrics.total_questions += record.totalQuestions || 0;

            if (record.subjectStats) {
                Object.entries(record.subjectStats).forEach(([subject, stats]: [string, any]) => {
                    if (!metrics.subject_stats[subject]) {
                        metrics.subject_stats[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0 };
                    }
                    metrics.subject_stats[subject].attempted += stats.attempted || 0;
                    metrics.subject_stats[subject].correct += stats.correct || 0;
                    metrics.subject_stats[subject].incorrect += stats.incorrect || 0;
                    metrics.subject_stats[subject].skipped += stats.skipped || 0;
                });
            }
        });
      } else if (historyData) {
        historyData.forEach(record => {
            metrics.total_quizzes += 1;
            metrics.total_correct += record.total_correct || 0;
            metrics.total_incorrect += record.total_incorrect || 0;
            metrics.total_skipped += record.total_skipped || 0;
            metrics.total_time_spent += record.total_time_spent || 0;
            metrics.total_questions += record.total_questions || 0;

            if (record.subject_stats) {
                Object.entries(record.subject_stats).forEach(([subject, stats]: [string, any]) => {
                    if (!metrics.subject_stats[subject]) {
                        metrics.subject_stats[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0 };
                    }
                    metrics.subject_stats[subject].attempted += stats.attempted || 0;
                    metrics.subject_stats[subject].correct += stats.correct || 0;
                    metrics.subject_stats[subject].incorrect += stats.incorrect || 0;
                    metrics.subject_stats[subject].skipped += stats.skipped || 0;
                });
            }
        });
      }

      if (metrics.total_questions > 0) {
          metrics.average_accuracy = (metrics.total_correct / metrics.total_questions) * 100;
      }

      return metrics;
    },
    // Adding some default TanStack Query configurations suitable for dashboards
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reset_user_analytics');
      if (error) {
        console.error('Failed to reset analytics:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the query so that it refetches immediately and returns zeroes
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    }
  });

  return {
    ...query,
    resetMutation
  };
};
