import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useProfileStats } from "@/features/auth";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SavedQuiz } from '@/features/quiz/types';
import { useNotification } from "@/stores/useNotificationStore";
import { useQuizContext } from '@/features/quiz/context/QuizContext';
import { db } from '@/lib/db';
import { parseCreatedAtMs } from '@/lib/syncService';
import { isNativeApp } from "@/utils/platform";
import { ROUTES } from "@/config/routes";
import { telemetry } from '@/lib/telemetry/index';
import { performanceTracker, PERF_BUDGETS } from '@/lib/performance/performanceMetrics';
import { useExamContextStore } from "@/stores/useExamContextStore";
import { TopicVulnerability } from "@/features/ai/hooks/useVulnerabilityEngine";

import { AIPrescriptionCard } from "@/features/ai/components/AIPrescriptionCard";
import {
  DashboardGreeting,
  SubjectStrip,
  EnglishSection,
  QuickActionsGrid,
  UserProgressCard,
  ImportantForSscStrip,
  ExamQuickAccessStrip,
  CanonicalExam,
  CANONICAL_EXAMS,
  ImportantForSscConfig,
  DashboardDrillBottomSheet,
  DashboardDrillInfo,
} from "@/features/dashboard";

interface DashboardProps {
  onBackToIntro?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onBackToIntro }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast, showPopup, closePopup } = useNotification();
  const { startQuiz } = useQuizContext();

  const activeExamId = useExamContextStore((s) => s.activeExamId);
  const activeExam = useMemo(() => {
    return CANONICAL_EXAMS.find((e) => e.id === activeExamId) || CANONICAL_EXAMS[0];
  }, [activeExamId]);

  // Dashboard Drill Confirmation Downsheet state
  const [drillSheetInfo, setDrillSheetInfo] = useState<DashboardDrillInfo | null>(null);
  const [isDrillSheetOpen, setIsDrillSheetOpen] = useState(false);

  const showComingSoonPopup = () => {
    showPopup({
      variant: 'info',
      title: 'Upcoming Feature',
      message: 'This feature is coming soon.',
      actions: [
        {
          label: 'Got it',
          onClick: closePopup,
        }
      ],
      onClose: closePopup
    });
  };

  // Dynamic stats
  const { stats, loading: statsLoading } = useProfileStats();
  const [streak, setStreak] = useState(0);

  // Eager local hydration from IndexedDB for instant (0ms) render on new tabs
  const [localLatestQuiz, setLocalLatestQuiz] = useState<SavedQuiz | null>(null);

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
        // Find most recent active/paused quiz
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

  const { data: latestQuiz } = useQuery({
    queryKey: ['latest-paused-quiz', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_quizzes')
        .select('id, name, created_at, mode, filters, state, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('user_id', user!.id)
        .neq('status', 'result')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const rq = data[0];
      const bridgeData = (rq.bridge_saved_quiz_questions as any) || [];
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
      // Keep local IndexedDB updated silently
      db.saveQuiz(remoteQuiz, { skipRemotePush: true }).catch(console.error);
      return remoteQuiz;
    }
  });

  const activeLatestQuiz = latestQuiz !== undefined ? latestQuiz : localLatestQuiz;

  const handleResumeQuiz = (quiz: SavedQuiz) => {
    telemetry.emit('resume_quiz', {
      quizId: quiz.id,
      progressPct: quiz.state?.activeQuestions?.length
        ? Math.round((Object.keys(quiz.state.answers || {}).length / quiz.state.activeQuestions.length) * 100)
        : undefined,
    });
    if (quiz.mode === 'mock') {
      navigate(`/quiz/session/mock/${quiz.id}`);
    } else {
      navigate(`/quiz/session/learning/${quiz.id}`);
    }
  };

  useEffect(() => {
    // Determine streak (placeholder logic, could be extended based on db)
    setStreak(stats.quizzesCompleted > 0 ? 1 : 0);
  }, [stats]);

  const handleNavigateWithFilters = (
    partialFilters: any,
    mode: 'learning' | 'mock' = 'learning',
    autoStart = false,
    fixedSubjectContext = false,
    questionCount = 25
  ) => {
    navigate("/quiz/config", {
      state: {
        initialFilters: {
          subject: [],
          topic: [],
          subTopic: [],
          difficulty: [],
          questionType: [],
          examName: [],
          examYear: [],
          examDateShift: [],
          tags: [],
          ...partialFilters,
        },
        initialMode: mode,
        autoStart,
        fixedSubjectContext,
        questionCount,
      },
    });
  };

  const handleSelectExam = (exam: CanonicalExam) => {
    navigate(`/quiz/config?exam=${exam.id}`, {
      state: {
        returnTo: "/dashboard",
        from: "/dashboard",
        initialFilters: {
          subject: [],
          topic: [],
          subTopic: [],
          difficulty: [],
          questionType: [],
          examName: exam.dbExamNames,
          examYear: [],
          examDateShift: [],
          tags: [],
        },
        canonicalExamId: exam.id,
        fixedExamContext: true,
      },
    });
  };

  // Exam Card Quick Drill -> Open Confirmation Downsheet
  const handleExamQuickDrill = (exam: CanonicalExam) => {
    setDrillSheetInfo({
      type: 'exam_quick_drill',
      title: `${exam.displayName} Quick Drill`,
      subtitle: `${exam.subtitle} • 25 Questions`,
      badgeLabel: `${exam.shortCode} Practice`,
      badgeVariant: 'blue',
      examDisplayName: exam.displayName,
      examShortCode: exam.shortCode,
      description: `Rapid 25-question practice set containing authentic ${exam.displayName} previous years questions across all major subjects.`,
      tags: ['PYQ', exam.shortCode],
      defaultQuestionCount: 25,
      defaultMode: 'learning',
      filters: {
        examName: exam.dbExamNames,
      },
    });
    setIsDrillSheetOpen(true);
  };

  // AI Prescription Drill -> Open Confirmation Downsheet
  const handleAIPrescriptionDrill = (vulnerability: TopicVulnerability) => {
    const isDiag = vulnerability.isDiagnostic;
    setDrillSheetInfo({
      type: 'targeted_drill',
      title: vulnerability.headline,
      subtitle: `${vulnerability.subject} • ${vulnerability.topic}`,
      badgeLabel: isDiag ? 'Diagnostic Sprint' : 'Weak Area Drill',
      badgeVariant: isDiag ? 'blue' : 'rose',
      examDisplayName: activeExam.displayName,
      examShortCode: activeExam.shortCode,
      description:
        vulnerability.subtext ||
        vulnerability.recommendation ||
        (isDiag
          ? `Establish your performance baseline across ${activeExam.displayName} with a 10-Q diagnostic drill.`
          : `Target your diagnosed weak areas with focused practice on ${vulnerability.topic}.`),
      subject: vulnerability.subject,
      topics: vulnerability.drillFilters.topic || [vulnerability.topic],
      tags: vulnerability.drillFilters.tags || ['PYQ'],
      defaultQuestionCount: vulnerability.suggestedQuestionCount || 10,
      defaultMode: 'learning',
      filters: {
        subject: vulnerability.drillFilters.subject || [vulnerability.subject],
        topic: vulnerability.drillFilters.topic || [vulnerability.topic],
        examName: vulnerability.drillFilters.examName || activeExam.dbExamNames,
        tags: vulnerability.drillFilters.tags || ['PYQ'],
      },
    });
    setIsDrillSheetOpen(true);
  };

  // Daily PYQ Drill -> Open Confirmation Downsheet
  const handleDailyPyqDrill = () => {
    setDrillSheetInfo({
      type: 'daily_pyq',
      title: 'Daily PYQ Drill',
      subtitle: `${activeExam.displayName} • Mixed Topics Practice`,
      badgeLabel: 'Daily Challenge',
      badgeVariant: 'amber',
      examDisplayName: activeExam.displayName,
      examShortCode: activeExam.shortCode,
      description: `A 25-question mixed practice set containing verified previous years questions from ${activeExam.displayName}. Helps maintain your daily streak and benchmark your exam speed.`,
      tags: ['PYQ', 'Daily Drill'],
      defaultQuestionCount: 25,
      defaultMode: 'mock',
      filters: {
        tags: ['PYQ'],
        examName: activeExam.dbExamNames,
      },
    });
    setIsDrillSheetOpen(true);
  };

  // Important for SSC Card -> Open Confirmation Downsheet
  const handleImportantTopicClick = (item: ImportantForSscConfig, computedFilter: any) => {
    setDrillSheetInfo({
      type: 'important_topic',
      title: item.title,
      subtitle: `${item.subjectLabel} • ${item.qs}`,
      badgeLabel: item.tag || '🔥 High Yield',
      badgeVariant: 'purple',
      examDisplayName: activeExam.displayName,
      examShortCode: activeExam.shortCode,
      description: `High-frequency ${item.title} questions with repetitive appearance in ${activeExam.displayName} exams. Designed for high-yield score improvement.`,
      subject: item.subjectLabel,
      topics: (item.filter.topic as string[]) || [],
      tags: ['PYQ', 'High Yield'],
      defaultQuestionCount: 20,
      defaultMode: 'learning',
      filters: computedFilter,
    });
    setIsDrillSheetOpen(true);
  };

  const handleSubjectClick = (subjectDbKey: string) => {
    navigate(ROUTES.SUBJECT.view(subjectDbKey));
  };

  const handleViewAllSubjects = () => {
    navigate("/dashboard/subjects");
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'mock':
        handleDailyPyqDrill();
        break;
      case 'custom':
        navigate("/quiz/config");
        break;
      case 'mistake-notebook':
        navigate(ROUTES.MISTAKE_NOTEBOOK);
        break;
      case 'bookmarks':
        navigate(ROUTES.QUIZ.BOOKMARKS);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-full -mt-4 pt-2 w-full overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
      ></div>

      <div className="w-full pt-1 sm:pt-2 space-y-3 sm:space-y-4 relative z-10">
        {/* Tier 1 */}
        <DashboardGreeting
          user={user}
          profile={profile}
          latestQuiz={activeLatestQuiz}
          onResumeQuiz={handleResumeQuiz}
        />

        {/* Tier 1.5: Target Exams Quick Access (Multi-Exam Support) */}
        <ExamQuickAccessStrip
          onSelectExam={handleSelectExam}
          onQuickDrill={handleExamQuickDrill}
        />

        {/* Tier 1.8: AI Study Prescription (Phase 5A Intelligence Layer) */}
        <AIPrescriptionCard onStartDrill={handleAIPrescriptionDrill} />

        {/* Tier 2: GK / GS Subjects */}
        <SubjectStrip
          onSubjectClick={handleSubjectClick}
          onViewAllClick={handleViewAllSubjects}
        />

        {/* Tier 3: English & Vocabulary */}
        <EnglishSection
          onOpenHub={() => navigate(ROUTES.ENGLISH)}
        />

        {/* Tier 4: Quick Actions */}
        <QuickActionsGrid
          onActionClick={handleQuickAction}
        />

        {/* Tier 5: User Progress */}
        <div className="z-10 relative">
          <UserProgressCard
            averageScore={stats.averageScore}
            quizzesCompleted={stats.quizzesCompleted}
            correctAnswers={stats.correctAnswers}
            totalTimeSpentFormatted={stats.totalTimeSpentFormatted}
            onDetailsClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
          />
        </div>

        {/* Tier 6: Important for SSC */}
        <ImportantForSscStrip
          onTopicClick={handleImportantTopicClick}
          onViewAllClick={() => navigate("/quiz/config")}
        />
      </div>

      {/* Confirmation Downsheet for All Dashboard Drills */}
      <DashboardDrillBottomSheet
        isOpen={isDrillSheetOpen}
        onClose={() => setIsDrillSheetOpen(false)}
        drillInfo={drillSheetInfo}
        onStartDrill={(filters, mode, count) => {
          setIsDrillSheetOpen(false);
          handleNavigateWithFilters(
            filters,
            mode,
            true,
            drillSheetInfo?.fixedSubjectContext || false,
            count
          );
        }}
        onCustomizeFilters={(filters, mode, count) => {
          setIsDrillSheetOpen(false);
          handleNavigateWithFilters(
            filters,
            mode,
            false,
            drillSheetInfo?.fixedSubjectContext || false,
            count
          );
        }}
      />
    </div>
  );
};

export default DashboardPage;
