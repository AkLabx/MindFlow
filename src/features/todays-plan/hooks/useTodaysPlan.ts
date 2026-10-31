import { useState, useEffect, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useQuestionMetadata } from '@/features/quiz/hooks/useQuestionMetadata';
import { fetchQuestionsByIds } from '@/features/quiz/services/questionService';
import { quizCreationService } from '@/features/quiz/services/quizCreationService';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { InitialFilters, Question, SavedQuiz } from '@/features/quiz/types';
import { TodaysPlanState, PlanChapter } from '../types';
import { generateTodaysPlan } from '../services/todaysPlanAlgorithm';

interface UseTodaysPlanReturn {
  planState: TodaysPlanState | null;
  isLoading: boolean;
  isLaunching: boolean;
  activeTrack: 'gk' | 'vocab';
  setActiveTrack: (track: 'gk' | 'vocab') => void;
  startPlanSession: () => Promise<void>;
  startChapterSession: (chapter: PlanChapter, mode?: 'learning' | 'mock') => Promise<void>;
  refreshPlan: () => Promise<void>;
}

export const useTodaysPlan = (): UseTodaysPlanReturn => {
  const navigate = useNavigate();
  const { metadata: metadataCatalog, isLoading: isMetadataLoading } = useQuestionMetadata();
  const [planState, setPlanState] = useState<TodaysPlanState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'gk' | 'vocab'>('gk');
  const [, startTransition] = useTransition();

  const loadPlanData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Load local IndexedDB data concurrently
      let [savedQuizzes, quizHistory, bookmarks, idiomInteractions, owsInteractions] =
        await Promise.all([
          db.getAllSavedQuizzes().catch(() => []),
          db.getQuizHistory().catch(() => []),
          db.getAllBookmarks().catch(() => []),
          db.getAllIdiomInteractions().catch(() => []),
          db.getAllOWSInteractions().catch(() => [])
        ]);

      // 2. Multi-device sync fallback: If local saved quizzes are empty, hydrate from Supabase
      if (savedQuizzes.length === 0) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const { data: remoteQuizzes } = await supabase
              .from('saved_quizzes')
              .select('*')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(20);

            if (remoteQuizzes && remoteQuizzes.length > 0) {
              savedQuizzes = remoteQuizzes.map((row: any): SavedQuiz => {
                const createdAtMs = typeof row.created_at === 'number'
                  ? row.created_at
                  : new Date(row.created_at).getTime() || Date.now();

                return {
                  id: row.id,
                  name: row.name || 'Saved Quiz',
                  createdAt: createdAtMs,
                  filters: row.filters || ({} as any),
                  mode: row.mode || 'learning',
                  questions: row.state?.activeQuestions || [],
                  state: row.state || {}
                };
              });
            }
          }
        } catch (e) {
          console.warn('[useTodaysPlan] Remote saved quizzes fetch skipped:', e);
        }
      }

      // 3. Question Catalog Resolution
      let catalog: Question[] = metadataCatalog;
      if (!catalog || catalog.length === 0) {
        const cached = await db.getQuizMetadataCache().catch(() => []);
        if (cached && cached.length > 0) {
          catalog = cached;
        }
      }

      // If still empty (e.g. fresh session during initial delta sync), fetch high-yield starter questions
      if (!catalog || catalog.length === 0) {
        try {
          const { data: starterQuestions } = await supabase
            .from('questions')
            .select('id, subject, topic, subTopic, difficulty, question, options, correct, explanation')
            .is('deleted_at', null)
            .limit(30);

          if (starterQuestions && starterQuestions.length > 0) {
            catalog = starterQuestions as any;
          }
        } catch (e) {
          console.warn('[useTodaysPlan] Starter questions fallback error:', e);
        }
      }

      const generated = generateTodaysPlan({
        savedQuizzes,
        quizHistory,
        bookmarks,
        metadataCatalog: catalog,
        idiomInteractions,
        owsInteractions
      });

      startTransition(() => {
        setPlanState(generated);
      });
    } catch (err) {
      console.error('[useTodaysPlan] Error assembling daily plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [metadataCatalog]);

  useEffect(() => {
    loadPlanData();
  }, [loadPlanData]);

  // Launch primary 5-minute plan session
  const startPlanSession = async () => {
    if (!planState || planState.items.length === 0) return;

    try {
      setIsLaunching(true);
      const { showToast } = useNotificationStore.getState();

      showToast({
        variant: 'info',
        title: 'Preparing Your Plan',
        message: 'Hydrating full question content & explanations...'
      });

      const questionIds = planState.items.map(i => i.id);
      let questionsToRun = planState.items.map(i => i.question);

      // If items only have metadata, hydrate the full rich questions
      const hasMissingContent = questionsToRun.some(q => !q.options || q.options.length === 0);
      if (hasMissingContent && questionIds.length > 0) {
        const fullQuestions = await fetchQuestionsByIds(questionIds);
        if (fullQuestions.length > 0) {
          questionsToRun = fullQuestions;
        }
      }

      const filters: InitialFilters = {
        subject: ["Today's Plan"],
        topic: ['Personalized Daily Revision'],
        subTopic: [],
        difficulty: [],
        questionType: [],
        examName: [],
        examYear: [],
        examDateShift: [],
        tags: []
      };

      const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const quizName = `Today's Plan (${dateStr})`;

      const result = await quizCreationService.createQuiz(
        questionsToRun,
        filters,
        'learning',
        quizName
      );

      if (result.error) {
        showToast({ variant: 'error', title: 'Launch Failed', message: result.error });
        return;
      }

      navigate(`/quiz/session/learning/${result.quizId}`);
    } catch (err: any) {
      console.error('[useTodaysPlan] Failed to launch plan session:', err);
      useNotificationStore.getState().showToast({
        variant: 'error',
        title: 'Launch Error',
        message: err.message || 'Unable to launch quiz session. Please try again.'
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // Launch a specific Chapter of 25 session
  const startChapterSession = async (chapter: PlanChapter, mode: 'learning' | 'mock' = 'learning') => {
    if (!chapter || chapter.questionIds.length === 0) return;

    try {
      setIsLaunching(true);
      const { showToast } = useNotificationStore.getState();

      showToast({
        variant: 'info',
        title: `Loading ${chapter.title}`,
        message: 'Preparing chapter questions...'
      });

      const fullQuestions = await fetchQuestionsByIds(chapter.questionIds);
      if (fullQuestions.length === 0) {
        throw new Error('No questions found for this chapter.');
      }

      const filters: InitialFilters = {
        subject: [chapter.subject],
        topic: [chapter.title],
        subTopic: [],
        difficulty: [],
        questionType: [],
        examName: [],
        examYear: [],
        examDateShift: [],
        tags: []
      };

      const result = await quizCreationService.createQuiz(
        fullQuestions,
        filters,
        mode,
        chapter.title
      );

      if (result.error) {
        showToast({ variant: 'error', title: 'Launch Failed', message: result.error });
        return;
      }

      navigate(`/quiz/session/${mode}/${result.quizId}`);
    } catch (err: any) {
      console.error('[useTodaysPlan] Failed to launch chapter session:', err);
      useNotificationStore.getState().showToast({
        variant: 'error',
        title: 'Chapter Launch Error',
        message: err.message || 'Unable to load chapter.'
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return {
    planState,
    isLoading: isLoading || (isMetadataLoading && !planState),
    isLaunching,
    activeTrack,
    setActiveTrack,
    startPlanSession,
    startChapterSession,
    refreshPlan: loadPlanData
  };
};
