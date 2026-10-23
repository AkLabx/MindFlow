import React, { useMemo } from "react";
import { TopicCard } from "./TopicCard";
import { useTopicProgress } from "@/features/quiz/hooks/useQuizProgress";

interface TopicCardContainerProps {
  subject: string;
  topic: string;
  subTopics: string[];
  counts?: Record<string, number>;
  onClick: () => void;
  onSubTopicClick?: (subTopic: string, e: React.MouseEvent) => void;
}

/**
 * Container component that fetches progress data for a specific topic's subtopics
 * and passes it down to the TopicCard presentation component.
 */
export const TopicCardContainer: React.FC<TopicCardContainerProps> = ({
  subject,
  topic,
  subTopics,
  counts,
  onClick,
  onSubTopicClick,
}) => {
  // Fetch statuses for this specific subject -> topic -> subtopics combination
  const { statuses } = useTopicProgress(subject, topic, subTopics);

  return (
    <TopicCard
      topic={topic}
      subTopics={subTopics}
      counts={counts}
      statuses={statuses}
      onClick={onClick}
      onSubTopicClick={onSubTopicClick}
    />
  );
};
