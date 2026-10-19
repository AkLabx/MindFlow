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
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { startQuiz } = useQuizContext();

  // Dynamic stats
  const { stats, loading: statsLoading } = useProfileStats();
  const [streak, setStreak] = useState(0);

  const { data: latestQuiz } = useQuery({
    queryKey: ['latest-paused-quiz', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_quizzes')
        .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

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
    autoStart = false
  ) => {
    navigate("/quiz-config", {
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
      },
    });
  };

  const handleSubjectClick = (subjectDbKey: string) => {
    handleNavigateWithFilters({ subject: [subjectDbKey] }, 'learning');
  };

  const handleViewAllSubjects = () => {
    navigate("/mcqs");
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'mock':
        handleNavigateWithFilters({}, 'mock');
        break;
      case 'custom':
        navigate("/quiz-config");
        break;
      case 'english':
        navigate("/english");
        break;
      case 'bookmarks':
        navigate("/bookmarks");
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
      handleNavigateWithFilters({ subject: [stats.weakTopics[0]] }, 'learning', true);
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
    <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
      ></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-5 sm:space-y-6 relative z-10">
        {/* Tier 1 */}
        <DashboardGreeting
          user={user}
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
              onDetailsClick={() => navigate("/quiz-results")}
            />
          </div>
        </div>

        {/* Tier 5 */}
        <ImportantForSscStrip
          onTopicClick={(filters) => handleNavigateWithFilters(filters, 'learning')}
          onViewAllClick={() => handleNavigateWithFilters({}, 'learning')}
        />
      </div>
    </div>
  );
};
