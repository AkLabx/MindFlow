import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { quizKeys } from './queryKeys';
import { SavedQuiz, Question } from '../types';

export const useSavedQuizzes = (userId?: string) => {
  return useQuery({
    queryKey: quizKeys.saved(),
    queryFn: async () => {
      if (!userId) return [];

      const { data: quizzes, error } = await supabase
        .from('saved_quizzes')
        .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!quizzes || quizzes.length === 0) return [];

      // Collect all question IDs to fetch
      const allQuestionIds = new Set<string>();
      quizzes.forEach(quiz => {
        const bridges = quiz.bridge_saved_quiz_questions || [];
        bridges.forEach((b: any) => allQuestionIds.add(String(b.question_id)));
      });

      const idArray = Array.from(allQuestionIds);
      if (idArray.length === 0) return quizzes as SavedQuiz[];

      // Fetch questions
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .in('id', idArray);

      if (qError) throw qError;

      const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));

      // Attach questions to quizzes
      return quizzes.map(quiz => {
        const questions: Question[] = [];
        const bridgeData = quiz.bridge_saved_quiz_questions || [];
        bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
        bridgeData.forEach((bq: any) => {
          const q = questionsMap.get(String(bq.question_id));
          if (q) questions.push(q as Question);
        });
        return { ...quiz, questions } as unknown as SavedQuiz;
      });
    },
    enabled: !!userId,
  });
};

export const useQuizHistory = (userId?: string) => {
  return useQuery({
    queryKey: quizKeys.attempted(),
    queryFn: async () => {
      if (!userId) return [];

      // History implies status = 'completed'
      const { data: quizzes, error } = await supabase
        .from('saved_quizzes')
        .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!quizzes || quizzes.length === 0) return [];

      const allQuestionIds = new Set<string>();
      quizzes.forEach(quiz => {
        const bridges = quiz.bridge_saved_quiz_questions || [];
        bridges.forEach((b: any) => allQuestionIds.add(String(b.question_id)));
      });

      const idArray = Array.from(allQuestionIds);
      if (idArray.length === 0) return quizzes as SavedQuiz[];

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .in('id', idArray);

      if (qError) throw qError;

      const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));

      return quizzes.map(quiz => {
        const questions: Question[] = [];
        const bridgeData = quiz.bridge_saved_quiz_questions || [];
        bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
        bridgeData.forEach((bq: any) => {
          const q = questionsMap.get(String(bq.question_id));
          if (q) questions.push(q as Question);
        });
        return { ...quiz, questions } as unknown as SavedQuiz;
      });
    },
    enabled: !!userId,
  });
};

export const useQuizSession = (quizId?: string) => {
  return useQuery({
    queryKey: quizKeys.session(quizId || ''),
    queryFn: async () => {
      if (!quizId) throw new Error("No quiz ID provided");

      const { data: quizData, error } = await supabase
        .from('saved_quizzes')
        .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('id', quizId)
        .single();

      if (error || !quizData) throw new Error("Quiz not found or could not be loaded.");

      const bridgeData = quizData.bridge_saved_quiz_questions || [];
      bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
      const questionIds = bridgeData.map((b: any) => String(b.question_id));

      if (questionIds.length === 0) return { ...quizData, questions: [] } as unknown as SavedQuiz;

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (qError) throw new Error("Failed to fetch quiz questions.");

      const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));
      const questions: Question[] = [];

      bridgeData.forEach((bq: any) => {
        const q = questionsMap.get(String(bq.question_id));
        if (q) questions.push(q as Question);
      });

      return { ...quizData, questions } as unknown as SavedQuiz;
    },
    enabled: !!quizId,
  });
};

export const usePerformanceMetrics = (userId?: string) => {
  return useQuery({
    queryKey: quizKeys.analyticsMetrics(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_performance_metrics');
      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          total_quizzes: 0,
          total_correct: 0,
          total_incorrect: 0,
          total_skipped: 0,
          total_time_spent: 0,
          total_questions: 0,
          average_accuracy: 0,
          subject_stats: {}
        };
      }
      return data[0];
    },
    enabled: !!userId,
  });
};

export const useQuizResult = (quizId?: string) => {
  return useQuery({
    queryKey: quizKeys.result(quizId || ''),
    queryFn: async () => {
      if (!quizId) throw new Error("No quiz ID provided");

      // For results, we fetch from quiz_history
      const { data: historyData, error } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error || !historyData) {
        // Fallback to checking if it's a completed saved_quiz
        const { data: savedData, error: savedError } = await supabase
          .from('saved_quizzes')
          .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
          .eq('id', quizId)
          .single();

        if (savedError || !savedData) throw new Error("Result not found or could not be loaded.");

        // Fetch questions for saved quiz
        const bridgeData = savedData.bridge_saved_quiz_questions || [];
        bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
        const questionIds = bridgeData.map((b: any) => String(b.question_id));

        if (questionIds.length === 0) return { ...savedData, questions: [] } as unknown as SavedQuiz;

        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);

        if (qError) throw new Error("Failed to fetch quiz questions.");

        const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));
        const questions: Question[] = [];

        bridgeData.forEach((bq: any) => {
          const q = questionsMap.get(String(bq.question_id));
          if (q) questions.push(q as Question);
        });

        return { ...savedData, questions } as unknown as SavedQuiz;
      }

      // If it's pure history data, we need to map the questions from attempts (simplified for now as saved fallback handles standard flows)
      return { ...historyData, status: 'result' } as unknown as SavedQuiz;
    },
    enabled: !!quizId,
  });
};
