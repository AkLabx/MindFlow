import React, { useEffect } from "react";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal, ListTree } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { queryClient } from "@/lib/queryClient";
import { subjectService } from "../../services/subjectService";
import { SubjectHeader } from "../../components/subject/SubjectHeader";
import { ActionCard } from "../../components/subject/ActionCard";
import { EmptyState } from "../../components/subject/EmptyState";

export const SubjectHubPage: React.FC = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();

  const setHideGlobalHeader = useLayoutStore(
    (state) => state.setHideGlobalHeader,
  );

  useEffect(() => {
    setHideGlobalHeader(true);
    return () => setHideGlobalHeader(false);
  }, [setHideGlobalHeader]);

  const decodedSubject = subjectName ? decodeURIComponent(subjectName) : "";

  // Eager prefetch of topic taxonomy while user considers action cards
  useEffect(() => {
    if (decodedSubject) {
      queryClient.prefetchQuery({
        queryKey: ["subject-taxonomy", decodedSubject],
        queryFn: () => subjectService.fetchSubjectTaxonomy(decodedSubject),
        staleTime: 1000 * 60 * 30,
      });
    }
  }, [decodedSubject]);

  if (!subjectName) {
    return (
      <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
        <EmptyState message="Invalid subject selected." />
      </div>
    );
  }

  const handleCustomQuiz = () => {
    navigate(ROUTES.QUIZ.CONFIG, {
      state: {
        initialFilters: {
          subject: [decodedSubject],
          topic: [],
          subTopic: [],
          difficulty: [],
          questionType: [],
          examName: [],
          examYear: [],
          examDateShift: [],
          tags: [],
        },
        initialMode: "learning",
        autoStart: false,
        fixedSubjectContext: true,
      },
    });
  };

  const handleTopicWise = () => {
    navigate(ROUTES.SUBJECT_TOPICS.view(decodedSubject));
  };

  return (
    <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-6 relative z-10">
        <SubjectHeader subjectName={decodedSubject} />

        <div className="mt-8 flex flex-col gap-4">
          <ActionCard
            title="Create Custom Quiz"
            description="Filter by topic, difficulty, or year"
            icon={<SlidersHorizontal className="w-6 h-6" />}
            onClick={handleCustomQuiz}
          />
          <ActionCard
            title="Topic-wise Practice"
            description="Browse all topics and subtopics"
            icon={<ListTree className="w-6 h-6" />}
            onClick={handleTopicWise}
          />
        </div>
      </div>
    </div>
  );
};
