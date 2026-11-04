import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useProfileStats } from "@/features/auth";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SavedQuiz } from '@/features/quiz/types';
import { useNotification } from "@/stores/useNotificationStore";
import { useQuizContext } from '@/features/quiz/context/QuizContext';
import { db } from '@/lib/db';
import { isNativeApp } from "@/utils/platform";
import { ROUTES } from "@/config/routes";


import {
  DashboardGreeting,
  SubjectStrip,
  EnglishSection,
  QuickActionsGrid,
  UserProgressCard,
  ImportantForSscStrip
} from "@/features/dashboard";

interface DashboardProps {
  onBackToIntro?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onBackToIntro }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast, showPopup, closePopup } = useNotification();
  const { startQuiz } = useQuizContext();

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

  useEffect(() => {
    let isMounted = true;
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
        createdAt: new Date(rq.created_at).getTime(),
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
    fixedSubjectContext = false
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
      },
    });
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
        handleNavigateWithFilters({ tags: ['PYQ'] }, 'mock', true);
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
          onTopicClick={(filter) => handleNavigateWithFilters(filter, 'learning', true)}
          onViewAllClick={() => navigate("/quiz/config")}
        />
      </div>
    </div>
  );
};
export default DashboardPage;
