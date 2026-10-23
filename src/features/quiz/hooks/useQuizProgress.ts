import { useState, useEffect, useCallback, useMemo } from "react";
import { QuizMode } from "../types";
import {
  quizProgressService,
  QuizProgressStatus,
  QuizProgressResult,
} from "../services/quizProgressService";

/**
 * Hook to get the aggregate status for a list of subtopics.
 * Useful for list views to show a progress badge (Start, Resume, Completed).
 */
export const useTopicProgress = (
  subject: string,
  topic: string,
  subTopics: string[],
) => {
  const [statuses, setStatuses] = useState<Record<string, QuizProgressStatus>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  // Stable stringified array for dependency to prevent infinite loops if subTopics reference changes
  const subTopicsKey = useMemo(() => subTopics.join(","), [subTopics]);

  const loadStatuses = useCallback(async () => {
    if (!subject || !topic || subTopics.length === 0) {
      setStatuses({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await quizProgressService.getTopicAggregateStatuses(
        subject,
        topic,
        subTopics,
      );
      setStatuses(result);
    } catch (error) {
      console.error("Failed to load topic progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [subject, topic, subTopicsKey]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  return { statuses, isLoading, refresh: loadStatuses };
};

/**
 * Hook to get the specific mode statuses for a single subtopic.
 * Useful for the BottomSheet to display actionable buttons per mode.
 */
export const useSubTopicModeProgress = (
  subject: string,
  topic: string,
  subTopic: string,
) => {
  const [learningStatus, setLearningStatus] = useState<QuizProgressResult>({
    status: "NOT_STARTED",
  });
  const [mockStatus, setMockStatus] = useState<QuizProgressResult>({
    status: "NOT_STARTED",
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStatuses = useCallback(async () => {
    if (!subject || !topic || !subTopic) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [learning, mock] = await Promise.all([
        quizProgressService.getModeStatus(subject, topic, subTopic, "learning"),
        quizProgressService.getModeStatus(subject, topic, subTopic, "mock"),
      ]);

      setLearningStatus(learning);
      setMockStatus(mock);
    } catch (error) {
      console.error("Failed to load subtopic mode progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [subject, topic, subTopic]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  return {
    learningStatus,
    mockStatus,
    isLoading,
    refresh: loadStatuses,
  };
};
