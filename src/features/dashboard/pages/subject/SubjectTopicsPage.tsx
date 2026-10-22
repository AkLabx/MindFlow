import React, { useEffect } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/config/routes';
import { subjectService } from '../../services/subjectService';
import { SubjectHeader } from '../../components/subject/SubjectHeader';
import { TopicCard } from '../../components/subject/TopicCard';
import { SubjectSkeleton } from '../../components/subject/SubjectSkeleton';
import { EmptyState } from '../../components/subject/EmptyState';
import { QuizStartBottomSheet } from '../../components/subject/QuizStartBottomSheet';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { initialState } from '@/features/quiz/stores/useQuizSessionStore';

export const SubjectTopicsPage: React.FC = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();
  const [selectedSubTopic, setSelectedSubTopic] = React.useState<{topic: string, subTopic: string} | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = React.useState(false);

  const setHideGlobalHeader = useLayoutStore((state) => state.setHideGlobalHeader);

  useEffect(() => {
    setHideGlobalHeader(true);
    return () => setHideGlobalHeader(false);
  }, [setHideGlobalHeader]);

  const decodedSubject = subjectName ? decodeURIComponent(subjectName) : '';

  const { data: topicsHierarchy, isLoading, error } = useQuery({
    queryKey: ['subject-topics', decodedSubject],
    queryFn: () => subjectService.fetchSubjectTopics(decodedSubject),
    enabled: !!decodedSubject,
    staleTime: 10 * 60 * 1000,
  });

  const { data: topicsCounts } = useQuery({
    queryKey: ['subject-topics-counts', decodedSubject],
    queryFn: () => subjectService.fetchSubjectTopicCounts(decodedSubject),
    enabled: !!decodedSubject,
    staleTime: 10 * 60 * 1000,
  });



  if (!decodedSubject) {
    return (
        <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
            <EmptyState message="Invalid subject selected." />
        </div>
    );
  }

  const navigateToQuiz = (topic: string, subTopic?: string) => {
    navigate(ROUTES.QUIZ.CONFIG, {
      state: {
        initialFilters: {
          subject: [decodedSubject],
          topic: [topic],
          subTopic: subTopic ? [subTopic] : [],
          difficulty: [],
          questionType: [],
          examName: [],
          examYear: [],
          examDateShift: [],
          tags: [],
        },
        initialMode: 'learning',
        autoStart: false,
        fixedSubjectContext: true,
      },
    });
  };

  const handleTopicClick = (topic: string) => {
    navigateToQuiz(topic);
  };

  const handleSubTopicClick = (topic: string, subTopic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubTopic({ topic, subTopic });
  };


  const handleCreateQuiz = async (mode: 'learning' | 'mock', startImmediately: boolean) => {
    if (!selectedSubTopic) return;

    try {
      setIsCreatingQuiz(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
         useNotificationStore.getState().showToast({ variant: "error", message: "You must be logged in to create a quiz." });
         setIsCreatingQuiz(false);
         return;
      }

      const userId = session.user.id;
      const quizId = crypto.randomUUID();
      const finalName = `${selectedSubTopic.subTopic} Quiz`;

      const cachedMetadata = await db.getQuizMetadataCache();
      if (!cachedMetadata || cachedMetadata.length === 0) {
         useNotificationStore.getState().showToast({ variant: "error", message: "Quiz metadata not found. Please sync." });
         setIsCreatingQuiz(false);
         return;
      }

      const filteredQuestions = cachedMetadata.filter(q =>
        q.subject === decodedSubject &&
        q.topic === selectedSubTopic.topic &&
        q.subTopic === selectedSubTopic.subTopic
      );

      if (filteredQuestions.length === 0) {
        useNotificationStore.getState().showToast({ variant: "error", message: "No questions found for this subtopic." });
        setIsCreatingQuiz(false);
        return;
      }

      const newQuiz: any = {
        id: quizId,
        name: finalName,
        createdAt: Date.now(),
        filters: {
          subject: [decodedSubject],
          topic: [selectedSubTopic.topic],
          subTopic: [selectedSubTopic.subTopic],
          difficulty: [],
          questionType: [],
          examName: [],
          examYear: [],
          examDateShift: [],
          tags: [],
        },
        mode: mode,
        questions: filteredQuestions,
        state: {
          ...initialState,
          status: 'quiz',
          mode: mode,
          startTime: Date.now(),
        }
      };

      await db.saveQuiz(newQuiz);

      const { error: quizError } = await supabase.from('saved_quizzes').insert({
        id: newQuiz.id,
        user_id: userId,
        name: newQuiz.name,
        filters: newQuiz.filters,
        mode: newQuiz.mode,
      });

      if (quizError) {
        console.error('Error saving quiz to Supabase:', quizError);
        // continue anyway as it's saved locally
      } else {
        const bridgeData = newQuiz.questions.map((q: any, index: number) => ({
          quiz_id: newQuiz.id,
          question_id: q.id,
          sort_order: index,
          user_id: userId
        }));
        await supabase.from('bridge_saved_quiz_questions').insert(bridgeData);
      }

      setSelectedSubTopic(null);

      if (startImmediately) {
        navigate(`/quiz/library?tab=created`);
      } else {
        useNotificationStore.getState().showToast({
          variant: "success",
          message: "Quiz saved successfully. You can find it in your Saved Quizzes."
        });
      }

    } catch(err) {
      console.error(err);
      useNotificationStore.getState().showToast({ variant: "error", message: "Failed to create quiz." });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <SubjectSkeleton />;
    }

    if (error) {
      return <EmptyState message="Failed to load topics. Please try again." />;
    }

    if (!topicsHierarchy || Object.keys(topicsHierarchy).length === 0) {
      return <EmptyState message={`No topics found for ${decodedSubject}.`} />;
    }

    return (
      <div className="flex flex-col gap-4">
        {Object.entries(topicsHierarchy).sort(([a], [b]) => a.localeCompare(b)).map(([topic, subTopicsSet]) => (
          <TopicCard
            key={topic}
            topic={topic}
            subTopics={Array.from(subTopicsSet).sort()}
            counts={topicsCounts?.[topic]}
            onClick={() => handleTopicClick(topic)}
            onSubTopicClick={(subTopic, e) => handleSubTopicClick(topic, subTopic, e)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-6 relative z-10">
        <SubjectHeader subjectName={decodedSubject} onBack={() => navigate(ROUTES.SUBJECT.view(decodedSubject))} />
        <QuizStartBottomSheet
          isOpen={!!selectedSubTopic}
          onClose={() => setSelectedSubTopic(null)}
          subject={decodedSubject}
          topic={selectedSubTopic?.topic || ''}
          subTopic={selectedSubTopic?.subTopic || ''}
          questionCount={selectedSubTopic ? (topicsCounts?.[selectedSubTopic.topic]?.[selectedSubTopic.subTopic] || 0) : 0}
          onStartQuiz={(mode) => handleCreateQuiz(mode, true)}
          onSaveForLater={(mode) => handleCreateQuiz(mode, false)}
        />
        {isCreatingQuiz && (
          <div className="fixed inset-0 z-[200] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Creating Your Quiz</h3>
            <p className="text-gray-500 dark:text-gray-400">Saving questions to database...</p>
          </div>
        )}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
