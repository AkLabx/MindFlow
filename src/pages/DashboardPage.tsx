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
  QuickActionsGrid,
  SuggestedDrillCard,
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

  const { data: latestQuiz } = useQuery({
    queryKey: ['latest-paused-quiz', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_quizzes')
        .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const activeQuizzes = data.filter(rq => rq.status !== 'result');
      if (activeQuizzes.length === 0) return null;

      const rq = activeQuizzes[0];
      const bridgeData = rq.bridge_saved_quiz_questions || [];
      return {
        id: rq.id,
        quiz_id: rq.quiz_id,
        name: rq.name,
        createdAt: new Date(rq.created_at).getTime(),
        filters: rq.filters,
        mode: rq.mode as any,
        questions: bridgeData
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((b: any) => ({ id: b.question_id })),
        state: rq.state
      } as SavedQuiz;
    }
  });

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
      case 'english':
        navigate("/english");
        break;
      case 'weak-topics':
        handleStartSuggestedDrill();
        break;
      case 'bookmarks':
        navigate(ROUTES.QUIZ.BOOKMARKS);
        break;
      default:
        break;
    }
  };

  const handleStartSuggestedDrill = () => {
    if (stats.quizzesCompleted === 0) {
      // Diagnostic drill
      handleNavigateWithFilters({ tags: ['Diagnostic'] }, 'learning', true);
    } else if (stats.weakTopics.length > 0) {
      // Weak topic drill
      handleNavigateWithFilters({ subject: [stats.weakTopics[0]] }, 'learning', true, true);
    } else {
      // Challenge
      handleNavigateWithFilters({ difficulty: ['Hard'] }, 'mock', true);
    }
  };

  const suggestedDrillProps = () => {
    if (stats.quizzesCompleted === 0) {
      return {
        topicTitle: "SSC GK Diagnostic Drill",
        subtext: "Find your baseline score across all 6 GK subjects",
        isDiagnostic: true
      };
    }
    if (stats.weakTopics.length > 0) {
      return {
        topicTitle: `${stats.weakTopics[0]}: High-Yield Revision`,
        subtext: `Based on your recent accuracy. Practice 15 Qs.`,
        isDiagnostic: false
      };
    }
    return {
      topicTitle: "SSC CGL Tier-2 Challenge",
      subtext: "Tough Shift / Hard PYQs",
      isDiagnostic: false
    };
  };

  const drillProps = suggestedDrillProps();

  return (
    <div className="min-h-full -mt-4 pt-2 w-full overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
      ></div>

      <div className="w-full pt-1 sm:pt-2 space-y-2.5 relative z-10">
        {/* Tier 1 */}
        <DashboardGreeting
          user={user}
          profile={profile}
          latestQuiz={latestQuiz}
          onResumeQuiz={handleResumeQuiz}
        />

        {/* Tier 2 */}
        <SubjectStrip
          onSubjectClick={handleSubjectClick}
          onViewAllClick={handleViewAllSubjects}
        />

        {/* Tier 3 */}
        <QuickActionsGrid
          onActionClick={handleQuickAction}
        />

        {/* Tier 4 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 z-10 relative">
          <div className="md:col-span-7">
            <SuggestedDrillCard
              topicTitle={drillProps.topicTitle}
              subtext={drillProps.subtext}
              isDiagnostic={drillProps.isDiagnostic}
              onStartDrill={handleStartSuggestedDrill}
            />
          </div>
          <div className="md:col-span-5">
            <UserProgressCard
              averageScore={stats.averageScore}
              quizzesCompleted={stats.quizzesCompleted}
              correctAnswers={stats.correctAnswers}
              totalTimeSpentFormatted={stats.totalTimeSpentFormatted}
              onDetailsClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
            />
          </div>
        </div>

        {/* Tier 5 */}
        <ImportantForSscStrip
          onTopicClick={(filter) => handleNavigateWithFilters(filter, 'learning', true)}
          onViewAllClick={() => navigate("/quiz/config")}
        />
      </div>
    </div>
  );
};
