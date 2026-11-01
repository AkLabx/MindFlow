import React, { useEffect, useMemo, useState } from "react";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { subjectService } from "../../services/subjectService";
import { SubjectHeader } from "../../components/subject/SubjectHeader";
import { TopicCardContainer } from "../../components/subject/TopicCardContainer";
import { SubjectSkeleton } from "../../components/subject/SubjectSkeleton";
import { EmptyState } from "../../components/subject/EmptyState";
import { QuizStartBottomSheet } from "../../components/subject/QuizStartBottomSheet";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { quizCreationService } from "@/features/quiz/services/quizCreationService";
import { useQuestionMetadata } from "@/features/quiz/hooks/useQuestionMetadata";
import { Question } from "@/features/quiz/types";

export const SubjectTopicsPage: React.FC = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();
  const [selectedSubTopic, setSelectedSubTopic] = useState<{
    topic: string;
    subTopic: string;
  } | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isJitLoading, setIsJitLoading] = useState(false);
  const [jitQuestions, setJitQuestions] = useState<Question[]>([]);

  const { metadata: cachedMetadata } = useQuestionMetadata();

  const setHideGlobalHeader = useLayoutStore(
    (state) => state.setHideGlobalHeader,
  );

  useEffect(() => {
    setHideGlobalHeader(true);
    return () => setHideGlobalHeader(false);
  }, [setHideGlobalHeader]);

  const decodedSubject = subjectName ? decodeURIComponent(subjectName) : "";

  // Unified Taxonomy Query (Hierarchy + Counts + Total) with 24h memory retention
  const {
    data: taxonomy,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subject-taxonomy", decodedSubject],
    queryFn: () => subjectService.fetchSubjectTaxonomy(decodedSubject),
    enabled: !!decodedSubject,
    staleTime: 1000 * 60 * 30, // 30 minutes fresh
    gcTime: 1000 * 60 * 60 * 24, // 24 hours in memory
  });

  const filteredQuestionsForSubTopic = useMemo(() => {
    if (!cachedMetadata || !selectedSubTopic) return [];
    return cachedMetadata.filter(
      (q) =>
        (q.subject ?? q.classification?.subject) === decodedSubject &&
        (q.topic ?? q.classification?.topic) === selectedSubTopic.topic &&
        ((q.subTopic ?? q.classification?.subTopic) === selectedSubTopic.subTopic ||
          (selectedSubTopic.subTopic === "General" && !(q.subTopic ?? q.classification?.subTopic)))
    );
  }, [cachedMetadata, decodedSubject, selectedSubTopic]);

  // Eager JIT fetch for fast-tappers when local metadata isn't warm yet
  useEffect(() => {
    let isCancelled = false;

    if (selectedSubTopic && filteredQuestionsForSubTopic.length === 0) {
      setIsJitLoading(true);
      subjectService
        .fetchSubtopicMetadata(
          decodedSubject,
          selectedSubTopic.topic,
          selectedSubTopic.subTopic,
        )
        .then((qs) => {
          if (!isCancelled) {
            setJitQuestions(qs);
            setIsJitLoading(false);
          }
        })
        .catch((err) => {
          console.error("[SubjectTopicsPage] JIT subtopic fetch failed:", err);
          if (!isCancelled) setIsJitLoading(false);
        });
    } else {
      setJitQuestions([]);
      setIsJitLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedSubTopic, filteredQuestionsForSubTopic.length, decodedSubject]);

  const effectiveQuestions =
    filteredQuestionsForSubTopic.length > 0
      ? filteredQuestionsForSubTopic
      : jitQuestions;

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
        initialMode: "learning",
        autoStart: false,
        fixedSubjectContext: true,
      },
    });
  };

  const handleTopicClick = (topic: string) => {
    navigateToQuiz(topic);
  };

  const handleSubTopicClick = (
    topic: string,
    subTopic: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSelectedSubTopic({ topic, subTopic });
  };

  const handleCreateQuiz = async (
    mode: "learning" | "mock",
    difficulty: string,
    startImmediately: boolean,
  ) => {
    if (!selectedSubTopic) return;

    try {
      setIsCreatingQuiz(true);

      let targetQuestions = effectiveQuestions;

      // JIT fallback: if user tapped Start Quiz before eager fetch resolved
      if (targetQuestions.length === 0) {
        targetQuestions = await subjectService.fetchSubtopicMetadata(
          decodedSubject,
          selectedSubTopic.topic,
          selectedSubTopic.subTopic,
        );
      }

      if (targetQuestions.length === 0) {
        useNotificationStore.getState().showToast({
          variant: "error",
          message:
            "No questions found for this subtopic. Please check your connection and try again.",
        });
        setIsCreatingQuiz(false);
        return;
      }

      let filteredQuestions = targetQuestions;
      if (difficulty !== "All") {
        filteredQuestions = filteredQuestions.filter(
          (q) => q.properties?.difficulty === difficulty,
        );
      }

      if (filteredQuestions.length === 0) {
        useNotificationStore.getState().showToast({
          variant: "error",
          message: `No questions found for this subtopic with ${difficulty} difficulty.`,
        });
        setIsCreatingQuiz(false);
        return;
      }

      const finalName = `${selectedSubTopic.subTopic} Quiz`;

      const filters = {
        subject: [decodedSubject],
        topic: [selectedSubTopic.topic],
        subTopic: [selectedSubTopic.subTopic],
        difficulty: difficulty === "All" ? [] : [difficulty],
        questionType: [],
        examName: [],
        examYear: [],
        examDateShift: [],
        tags: [],
      };

      const result = await quizCreationService.createQuiz(
        filteredQuestions,
        filters,
        mode,
        finalName,
      );

      if (result.error) {
        useNotificationStore
          .getState()
          .showToast({ variant: "error", message: result.error });
        setIsCreatingQuiz(false);
        return;
      }

      setSelectedSubTopic(null);

      if (startImmediately) {
        if (result.reused) {
          useNotificationStore.getState().showToast({
            variant: "success",
            message: "Resuming existing quiz session",
          });
        }
        // Navigate to the library first so it's in the back stack, then to the quiz player
        navigate("/quiz/library?tab=created", { replace: true });
        setTimeout(() => {
          navigate(
            mode === "learning"
              ? ROUTES.QUIZ.SESSION.learning(result.quizId)
              : ROUTES.QUIZ.SESSION.mock(result.quizId),
          );
        }, 50);
      } else {
        useNotificationStore.getState().showToast({
          variant: "success",
          duration: 7000,
          message: (
            <span>
              {result.reused
                ? "Resumed existing quiz session."
                : "Quiz saved successfully."}{" "}
              <a
                href="#/quiz/library?tab=created"
                className="underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
                onClick={(e) => {
                  const id = (e.target as any).closest(".relative")?.dataset
                    ?.toastId;
                  if (id) useNotificationStore.getState().removeToast(id);
                }}
              >
                View in Library
              </a>
            </span>
          ),
        });
      }
    } catch (err: any) {
      console.error("[SubjectTopicsPage] Failed to create quiz:", err);
      useNotificationStore.getState().showToast({
        variant: "error",
        message: "Failed to create quiz. Please try again.",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const renderContent = () => {
    if (isLoading) return <SubjectSkeleton />;
    if (error || !taxonomy)
      return <EmptyState message="Failed to load topics. Please check your connection." />;
    if (Object.keys(taxonomy.hierarchy).length === 0)
      return <EmptyState message="No topics found for this subject." />;

    return (
      <div className="flex flex-col gap-4">
        {Object.entries(taxonomy.hierarchy)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([topic, subTopicsList]) => (
            <TopicCardContainer
              key={topic}
              subject={decodedSubject}
              topic={topic}
              subTopics={subTopicsList}
              counts={taxonomy.counts[topic]}
              onClick={() => handleTopicClick(topic)}
              onSubTopicClick={(subTopic, e) =>
                handleSubTopicClick(topic, subTopic, e)
              }
            />
          ))}
      </div>
    );
  };

  const expectedSubtopicCount =
    (selectedSubTopic &&
      taxonomy?.counts?.[selectedSubTopic.topic]?.[selectedSubTopic.subTopic]) ||
    0;

  return (
    <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-6 relative z-10">
        <SubjectHeader
          subjectName={decodedSubject}
          onBack={() => navigate(ROUTES.SUBJECT.view(decodedSubject))}
        />
        <QuizStartBottomSheet
          isOpen={!!selectedSubTopic}
          onClose={() => setSelectedSubTopic(null)}
          subject={decodedSubject}
          topic={selectedSubTopic?.topic || ""}
          subTopic={selectedSubTopic?.subTopic || ""}
          questions={effectiveQuestions}
          expectedCount={expectedSubtopicCount}
          isPreparing={isJitLoading || isCreatingQuiz}
          onStartQuiz={(mode, difficulty) =>
            handleCreateQuiz(mode, difficulty, true)
          }
          onSaveForLater={(mode, difficulty) =>
            handleCreateQuiz(mode, difficulty, false)
          }
        />
        {isCreatingQuiz && (
          <div className="fixed inset-0 z-[200] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              Creating Your Quiz
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Saving questions to database...
            </p>
          </div>
        )}
        <div className="mt-6">{renderContent()}</div>
      </div>
    </div>
  );
};
