import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { useAuth } from '../context/AuthContext';

export interface ProfileStats {
  weakTopics: string[];
  quizzesCompleted: number;
  correctAnswers: number;
  averageScore: number;
}

export const useProfileStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    weakTopics: [],
    quizzesCompleted: 0,
    correctAnswers: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        let quizzesCompleted = 0;
        let correctAnswers = 0;
        let totalQuestionsAnswered = 0; // Sum of correct and incorrect (not skipped)


        let subjectTotals: Record<string, { correct: number; incorrect: number }> = {};

        if (user) {
          // Fetch from Supabase for logged-in user
          const { data, error: supabaseError } = await supabase
            .from('quiz_history')
            .select('total_correct, total_incorrect, total_questions, subject_stats')
            .eq('user_id', user.id);

          if (supabaseError) {
            throw supabaseError;
          }

          if (data && data.length > 0) {
            quizzesCompleted = data.length;
            data.forEach((record) => {
              correctAnswers += record.total_correct || 0;
              totalQuestionsAnswered += (record.total_correct || 0) + (record.total_incorrect || 0);

              if (record.subject_stats) {
                  Object.entries(record.subject_stats as Record<string, any>).forEach(([subject, stats]) => {
                      if (!subjectTotals[subject]) subjectTotals[subject] = { correct: 0, incorrect: 0 };
                      subjectTotals[subject].correct += stats.correct || 0;
                      subjectTotals[subject].incorrect += stats.incorrect || 0;
                  });
              }
            });
          }
        } else {
          // Fetch from IndexedDB for guest user
          const localHistory = await db.getQuizHistory();

          if (localHistory && localHistory.length > 0) {
            quizzesCompleted = localHistory.length;
            localHistory.forEach((record) => {
              correctAnswers += record.totalCorrect || 0;
              totalQuestionsAnswered += (record.totalCorrect || 0) + (record.totalIncorrect || 0);

              if (record.subjectStats) {
                  Object.entries(record.subjectStats).forEach(([subject, stats]) => {
                      if (!subjectTotals[subject]) subjectTotals[subject] = { correct: 0, incorrect: 0 };
                      subjectTotals[subject].correct += stats.correct || 0;
                      subjectTotals[subject].incorrect += stats.incorrect || 0;
                  });
              }
            });
          }
        }

        if (isMounted) {
          let averageScore = 0;
          if (totalQuestionsAnswered > 0) {
            averageScore = Math.round((correctAnswers / totalQuestionsAnswered) * 100);
          }

          // Calculate weak topics
          const weakTopicsList: { subject: string; accuracy: number }[] = [];
          Object.entries(subjectTotals).forEach(([subject, stats]) => {
              const attempts = stats.correct + stats.incorrect;
              if (attempts >= 5) { // Minimum 5 attempts to be considered
                  const accuracy = (stats.correct / attempts) * 100;
                  weakTopicsList.push({ subject, accuracy });
              }
          });

          // Sort by lowest accuracy first, and take top 2
          weakTopicsList.sort((a, b) => a.accuracy - b.accuracy);
          const weakTopics = weakTopicsList.slice(0, 2).map(t => t.subject);

          setStats({
            quizzesCompleted,
            correctAnswers,
            averageScore,
            weakTopics,
          });

        }
      } catch (err: any) {
        console.error('Error fetching profile stats:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load statistics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { stats, loading, error };
};
