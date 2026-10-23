import { db } from "../../../lib/db";
import { InitialFilters, QuizMode, SavedQuiz } from "../types";

export type QuizProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface QuizProgressResult {
  status: QuizProgressStatus;
  quizId?: string;
  updatedAt?: number;
}

/**
 * Helper to determine if a saved quiz logically matches the requested hierarchy.
 * Currently relies on the filters object used during creation.
 */
function matchesHierarchy(
  quizFilters: InitialFilters,
  subject: string,
  topic: string,
  subTopic: string,
): boolean {
  if (!quizFilters) return false;

  const hasSubject = quizFilters.subject?.includes(subject);
  const hasTopic = quizFilters.topic?.includes(topic);
  const hasSubTopic = quizFilters.subTopic?.includes(subTopic);

  // We consider it a match if it exactly targets this subtopic.
  return !!(hasSubject && hasTopic && hasSubTopic);
}

export const quizProgressService = {
  /**
   * Gets the specific status for a given hierarchy and mode.
   * Priority: Most recently created/updated session.
   * We consider 'result' status as COMPLETED, and anything else as IN_PROGRESS.
   */
  getModeStatus: async (
    subject: string,
    topic: string,
    subTopic: string,
    mode: QuizMode,
  ): Promise<QuizProgressResult> => {
    try {
      const allQuizzes = await db.getAllSavedQuizzes();

      const matchingQuizzes = allQuizzes.filter(
        (q) =>
          q.mode === mode &&
          matchesHierarchy(q.filters, subject, topic, subTopic),
      );

      if (matchingQuizzes.length === 0) {
        return { status: "NOT_STARTED" };
      }

      // Sort descending by createdAt (or updated time if we track it on state)
      // Since saved_quizzes in IndexedDB only guarantees createdAt, we use that for freshness.
      matchingQuizzes.sort((a, b) => b.createdAt - a.createdAt);

      // Find first IN_PROGRESS
      const inProgress = matchingQuizzes.find(
        (q) => q.state && q.state.status !== "result",
      );
      if (inProgress) {
        return {
          status: "IN_PROGRESS",
          quizId: inProgress.id,
          updatedAt: inProgress.createdAt,
        };
      }

      // If no IN_PROGRESS, but we have matches, they must all be COMPLETED
      const completed = matchingQuizzes.find(
        (q) => q.state && q.state.status === "result",
      );
      if (completed) {
        return {
          status: "COMPLETED",
          quizId: completed.id,
          updatedAt: completed.createdAt,
        };
      }

      return { status: "NOT_STARTED" };
    } catch (error) {
      console.error("[quizProgressService] Failed to get mode status:", error);
      return { status: "NOT_STARTED" };
    }
  },

  /**
   * Gets the aggregate status across all modes for a given hierarchy.
   * Priority: IN_PROGRESS > COMPLETED > NOT_STARTED
   */
  getAggregateStatus: async (
    subject: string,
    topic: string,
    subTopic: string,
  ): Promise<QuizProgressStatus> => {
    try {
      const allQuizzes = await db.getAllSavedQuizzes();

      const matchingQuizzes = allQuizzes.filter((q) =>
        matchesHierarchy(q.filters, subject, topic, subTopic),
      );

      if (matchingQuizzes.length === 0) {
        return "NOT_STARTED";
      }

      const hasInProgress = matchingQuizzes.some(
        (q) => q.state && q.state.status !== "result",
      );
      if (hasInProgress) {
        return "IN_PROGRESS";
      }

      const hasCompleted = matchingQuizzes.some(
        (q) => q.state && q.state.status === "result",
      );
      if (hasCompleted) {
        return "COMPLETED";
      }

      return "NOT_STARTED";
    } catch (error) {
      console.error(
        "[quizProgressService] Failed to get aggregate status:",
        error,
      );
      return "NOT_STARTED";
    }
  },

  /**
   * Optimised batch fetch for an entire topic's subtopics.
   * Returns a map of subTopic -> AggregateStatus
   */
  getTopicAggregateStatuses: async (
    subject: string,
    topic: string,
    subTopics: string[],
  ): Promise<Record<string, QuizProgressStatus>> => {
    try {
      const allQuizzes = await db.getAllSavedQuizzes();
      const results: Record<string, QuizProgressStatus> = {};

      // Initialize all to NOT_STARTED
      for (const st of subTopics) {
        results[st] = "NOT_STARTED";
      }

      // Filter to just this subject/topic
      const relevantQuizzes = allQuizzes.filter(
        (q) =>
          q.filters?.subject?.includes(subject) &&
          q.filters?.topic?.includes(topic),
      );

      // Map over subtopics
      for (const st of subTopics) {
        const matches = relevantQuizzes.filter((q) =>
          q.filters?.subTopic?.includes(st),
        );
        if (matches.length > 0) {
          const hasInProgress = matches.some(
            (q) => q.state && q.state.status !== "result",
          );
          if (hasInProgress) {
            results[st] = "IN_PROGRESS";
          } else {
            results[st] = "COMPLETED";
          }
        }
      }

      return results;
    } catch (error) {
      console.error(
        "[quizProgressService] Failed to batch fetch statuses:",
        error,
      );
      return {};
    }
  },
};
