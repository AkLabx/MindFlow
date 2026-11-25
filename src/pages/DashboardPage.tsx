import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useProfileStats } from "@/features/auth";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { SavedQuiz } from '@/features/quiz/types';
import { db } from '@/lib/db';
import { parseCreatedAtMs } from '@/lib/syncService';
import { ROUTES } from "@/config/routes";
import { telemetry } from '@/lib/telemetry/index';
import { performanceTracker, PERF_BUDGETS } from '@/lib/performance/performanceMetrics';
import { PreparedMockTestsShortcutCard } from "@/features/mock-tests/components/PreparedMockTestsShortcutCard";
import {
  ContinueLearningItem,
  fetchContinueLearningItems,
  getCachedContinueLearningSnapshot,
  readContinueLearningIndexedDBCache,
} from "@/features/mock-tests/api/mockTestsApi";
import { triggerHaptic } from "@/lib/haptics";
import {
  DashboardGreeting,
  QuickActionsGrid,
  UserProgressCard,
} from "@/features/dashboard";

interface DashboardProps {
  onBackToIntro?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Dynamic stats
  const { stats } = useProfileStats();

  // Eager local hydration from IndexedDB for instant (0ms) render on new tabs
  const [localLatestQuiz, setLocalLatestQuiz] = useState<SavedQuiz | null>(null);
  const [localLatestMockAttempt, setLocalLatestMockAttempt] = useState<ContinueLearningItem | null>(() => {
    const cached = getCachedContinueLearningSnapshot(user?.id, Date.now(), 1);
    return cached?.find((item) => item.status === 'in_progress') ?? null;
  });

  // Performance SLA Budget Tracking (Constitution Section 8)
  useEffect(() => {
    performanceTracker.startMark('dashboard_fcp');
    const rafId = requestAnimationFrame(() => {
      performanceTracker.endMark('dashboard_fcp', PERF_BUDGETS.DASHBOARD_FCP, {
        hasLocalQuiz: !!localLatestQuiz,
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    let isMounted = true;
    db.enforceStorageQuota().catch(() => {});
    db.getAllSavedQuizzes().then(quizzes => {
      if (!isMounted) return;
      if (quizzes && quizzes.length > 0) {
        const paused = quizzes
          .filter(q => (q as any).status !== 'result' && !(q as any).deleted_at)
          .sort((a, b) => ((b.createdAt || 0) - (a.createdAt || 0)))[0];
        if (paused) {
          setLocalLatestQuiz(paused);
        }
      }
    }).catch(console.error);
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setLocalLatestMockAttempt(null);
      return;
    }

    const syncSnapshot = getCachedContinueLearningSnapshot(user.id, Date.now(), 1);
    setLocalLatestMockAttempt(syncSnapshot?.find((item) => item.status === 'in_progress') ?? null);

    readContinueLearningIndexedDBCache(user.id, Date.now(), 1)
      .then((items) => {
        if (!isMounted || !items) return;
        setLocalLatestMockAttempt(items.find((item) => item.status === 'in_progress') ?? null);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const { data: latestQuiz } = useQuery({
    queryKey: ['latest-paused-quiz', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(DB_TABLES.QUIZ.SESSIONS)
        .select(`id, name, created_at, mode, filters, state, ${DB_TABLES.QUIZ.SESSION_QUESTIONS}(question_id, sort_order)`)
        .eq('user_id', user!.id)
        .neq('status', 'result')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const rq = data[0];
      const bridgeData = (rq as any).quiz_session_questions ?? (rq as any).bridge_saved_quiz_questions ?? [];
      const remoteQuiz: SavedQuiz = {
        id: rq.id,
        name: rq.name,
        createdAt: parseCreatedAtMs(rq.created_at),
        filters: rq.filters,
        mode: rq.mode as any,
        questions: bridgeData
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((b: any) => ({ id: b.question_id })),
        state: rq.state
      };
      db.saveQuiz(remoteQuiz, { skipRemotePush: true }).catch(console.error);
      return remoteQuiz;
    }
  });

  const { data: remoteLatestMockAttempt } = useQuery({
    queryKey: ['latest-paused-mock-attempt', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      const items = await fetchContinueLearningItems(user!.id, { limit: 1 });
      return items.find((item) => item.status === 'in_progress') ?? null;
    },
  });

  const activeLatestQuiz = latestQuiz !== undefined ? latestQuiz : localLatestQuiz;
  const activeLatestMockAttempt =
    remoteLatestMockAttempt !== undefined ? remoteLatestMockAttempt : localLatestMockAttempt;

  const handleResumeQuiz = (quiz: SavedQuiz) => {
    triggerHaptic('light');
    telemetry.emit('resume_quiz', {
      quizId: quiz.id,
      progressPct: quiz.state?.activeQuestions?.length
        ? Math.round((Object.keys(quiz.state.answers || {}).length / quiz.state.activeQuestions.length) * 100)
        : undefined,
    });
    if (quiz.mode === 'mock') {
      navigate(ROUTES.QUIZ.SESSION.mock(quiz.id));
    } else {
      navigate(ROUTES.QUIZ.SESSION.learning(quiz.id));
    }
  };

  const handleResumeMockAttempt = (item: ContinueLearningItem) => {
    triggerHaptic('medium');
    navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(item.testId), {
      state: { returnTo: ROUTES.DASHBOARD, resumeAttemptId: item.attemptId },
    });
  };

  const handleQuickAction = (action: string) => {
    triggerHaptic('light');
    switch (action) {
      case 'chapter-practice':
        navigate(ROUTES.DASHBOARD_SUBJECTS);
        break;
      case 'custom':
        navigate(ROUTES.MCQS);
        break;
      case 'english':
        navigate(ROUTES.ENGLISH);
        break;
      case 'mistake-notebook':
        navigate(ROUTES.MISTAKE_NOTEBOOK);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-full pt-1 sm:pt-3 w-full overflow-x-clip select-none bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] scroll-mb-28">
      <div
        className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
      />

      <div className="w-full pt-1 sm:pt-2 space-y-3 sm:space-y-4 relative z-10">
        {/* 1. Greeting & Immediate Resume / Saved Questions / History */}
        <DashboardGreeting
          user={user}
          profile={profile}
          latestQuiz={activeLatestQuiz}
          onResumeQuiz={handleResumeQuiz}
          latestMockAttempt={activeLatestMockAttempt}
          onResumeMockAttempt={handleResumeMockAttempt}
        />

        {/* 2. Admin-Prepared Mock Tests Shortcut */}
        <PreparedMockTestsShortcutCard source="dashboard" returnTo={ROUTES.DASHBOARD} />

        {/* 3. Quick Actions (4 Systematic Study Paths) */}
        <QuickActionsGrid onActionClick={handleQuickAction} />

        {/* 4. User Progress */}
        <div className="z-10 relative">
          <UserProgressCard
            averageScore={stats.averageScore}
            quizzesCompleted={stats.quizzesCompleted}
            correctAnswers={stats.correctAnswers}
            totalTimeSpentFormatted={stats.totalTimeSpentFormatted}
            onDetailsClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
