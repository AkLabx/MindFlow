import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { useAuth } from '../context/AuthContext';
import { SubjectStats } from '../../quiz/types';

export interface ProfileStats {
  quizzesCompleted: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number; // in seconds
  weakTopics: string[];
}

export const useProfileStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    quizzesCompleted: 0,
    correctAnswers: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    weakTopics: [],
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
        let totalQuestionsAnswered = 0;
        let totalTimeSpent = 0;

        // Map to track accuracy per subject to identify weak topics
        const subjectPerformance: Record<string, { correct: number, total: number }> = {};

        if (user) {
          // Fetch from Supabase for logged-in user
          // Important: We need 'total_time_spent' and 'subject_stats' to be in the database schema.
          // Assuming they are added or will be added based on the local QuizHistoryRecord schema.
          const { data, error: supabaseError } = await supabase
            .from('quiz_history')
            .select('total_correct, total_incorrect, total_questions, total_time_spent, subject_stats')
            .eq('user_id', user.id);

          if (supabaseError) {
            throw supabaseError;
          }

          if (data && data.length > 0) {
            quizzesCompleted = data.length;
            data.forEach((record) => {
              correctAnswers += record.total_correct || 0;
              totalQuestionsAnswered += (record.total_correct || 0) + (record.total_incorrect || 0);
              totalTimeSpent += record.total_time_spent || 0;

              if (record.subject_stats) {
                 const parsedStats = typeof record.subject_stats === 'string'
                     ? JSON.parse(record.subject_stats)
                     : record.subject_stats;

                 Object.keys(parsedStats).forEach(subject => {
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = { correct: 0, total: 0 };
                    }
                    subjectPerformance[subject].correct += parsedStats[subject].correct || 0;
                    subjectPerformance[subject].total += parsedStats[subject].total || 0;
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
              totalTimeSpent += record.totalTimeSpent || 0;

              if (record.subjectStats) {
                 Object.keys(record.subjectStats).forEach(subject => {
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = { correct: 0, total: 0 };
                    }
                    subjectPerformance[subject].correct += record.subjectStats[subject].correct || 0;
                    subjectPerformance[subject].total += record.subjectStats[subject].total || 0;
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

          // Calculate weak topics (accuracy < 60% and at least 5 questions attempted)
          const weakTopics = Object.keys(subjectPerformance)
             .map(subject => ({
                 subject,
                 accuracy: subjectPerformance[subject].total > 0
                     ? (subjectPerformance[subject].correct / subjectPerformance[subject].total) * 100
                     : 100,
                 total: subjectPerformance[subject].total
             }))
             .filter(topic => topic.accuracy < 60 && topic.total >= 5)
             .sort((a, b) => a.accuracy - b.accuracy)
             .map(topic => topic.subject)
             .slice(0, 3); // Top 3 weakest topics

          setStats({
            quizzesCompleted,
            correctAnswers,
            averageScore,
            totalTimeSpent,
            weakTopics
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
