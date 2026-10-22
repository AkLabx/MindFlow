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

export const SubjectTopicsPage: React.FC = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();

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
    staleTime: 10 * 60 * 1000, // 10 minutes cache
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
    navigateToQuiz(topic, subTopic);
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
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
