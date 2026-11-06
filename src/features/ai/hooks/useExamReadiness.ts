import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamContextStore } from '../../../stores/useExamContextStore';
import { CANONICAL_EXAMS, CanonicalExam, matchesCanonicalExam } from '../../dashboard/constants/examRegistry';
import { useQuestionMetadata } from '../../quiz/hooks/useQuestionMetadata';
import { db } from '../../../lib/db';
import { telemetry } from '../../../lib/telemetry/index';

export type ReadinessTier = 'ready' | 'on_track' | 'developing' | 'early';

export interface RevisionTopicDue {
  topic: string;
  subject: string;
  lastAttemptedAt: number;
  daysSinceLastAttempt: number;
  mistakesCount: number;
  accuracyPct: number;
}

export interface ExamReadinessState {
  isLoading: boolean;
  activeExam: CanonicalExam;
  readinessScore: number;
  coveragePct: number;
  accuracyPct: number;
  tier: ReadinessTier;
  tierLabel: string;
  tierColor: string;
  actionRecommendation: string;
  totalSyllabusTopics: number;
  masteredTopicsCount: number;
  revisionDueTopics: RevisionTopicDue[];
  launchRevisionDrill: (topic?: string) => void;
  refreshReadiness: () => Promise<void>;
}

export const useExamReadiness = (): ExamReadinessState => {
  const navigate = useNavigate();
  const activeExamId = useExamContextStore((s) => s.activeExamId);

  const activeExam = useMemo(() => {
    return CANONICAL_EXAMS.find((e) => e.id === activeExamId) || CANONICAL_EXAMS[0];
  }, [activeExamId]);

  const { metadata } = useQuestionMetadata();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [coveragePct, setCoveragePct] = useState<number>(0);
  const [accuracyPct, setAccuracyPct] = useState<number>(0);
  const [totalSyllabusTopics, setTotalSyllabusTopics] = useState<number>(0);
  const [masteredTopicsCount, setMasteredTopicsCount] = useState<number>(0);
  const [revisionDueTopics, setRevisionDueTopics] = useState<RevisionTopicDue[]>([]);
  const lastAnalyzedKey = useRef<string>('');

  const refreshReadiness = useCallback(async (force = false) => {
    const analysisKey = `${activeExam.id}:::${(metadata || []).length}`;
    if (!force && lastAnalyzedKey.current === analysisKey) return;
    lastAnalyzedKey.current = analysisKey;

    setIsLoading(true);

    try {
      // 1. Gather all syllabus topics for active exam from question metadata
      const examMetadata = (metadata || []).filter((item: any) => {
        const rawExam = item.examName || item.sourceInfo?.examName;
        return matchesCanonicalExam(activeExam, rawExam);
      });

      const syllabusTopicsSet = new Set<string>();
      examMetadata.forEach((item: any) => {
        const topic = item.topic || item.classification?.topic;
        if (topic) syllabusTopicsSet.add(topic);
      });
      const totalTopics = syllabusTopicsSet.size || 12; // Fallback baseline if metadata loading
      setTotalSyllabusTopics(totalTopics);

      // 2. Fetch local saved quizzes to compute attempt coverage, accuracy, and recency
      const savedQuizzes = await db.getAllSavedQuizzes();
      const examQuizzes = savedQuizzes.filter((q) => {
        const rawExam = q.filters?.examName?.[0] || q.questions?.[0]?.examName;
        return matchesCanonicalExam(activeExam, rawExam);
      });

      let totalAttempted = 0;
      let totalCorrect = 0;
      let criticalMistakes = 0;
      const attemptedTopics = new Map<string, {
        subject: string;
        attemptCount: number;
        correctCount: number;
        mistakesCount: number;
        lastAttemptedAt: number;
      }>();

      examQuizzes.forEach((quiz) => {
        if (!quiz.questions) return;
        const answers = quiz.state?.answers || (quiz.state as any)?.userAnswers || {};
        const quizTimestamp = quiz.createdAt || Date.now();

        quiz.questions.forEach((q, idx) => {
          const userAns = answers[q.id] !== undefined ? answers[q.id] : answers[idx];
          if (userAns !== undefined) {
            totalAttempted += 1;
            const isCorrect = userAns === q.correct;
            if (isCorrect) totalCorrect += 1;
            else criticalMistakes += 1;

            const top = q.topic || q.classification?.topic || 'Core Concept';
            const sub = q.subject || q.classification?.subject || 'General';

            const stat = attemptedTopics.get(top) || {
              subject: sub,
              attemptCount: 0,
              correctCount: 0,
              mistakesCount: 0,
              lastAttemptedAt: quizTimestamp,
            };

            stat.attemptCount += 1;
            if (isCorrect) stat.correctCount += 1;
            else stat.mistakesCount += 1;
            stat.lastAttemptedAt = Math.max(stat.lastAttemptedAt, quizTimestamp);

            attemptedTopics.set(top, stat);
          }
        });
      });

      // 3. Compute Metrics
      const coveredTopicsCount = attemptedTopics.size;
      const calcCoveragePct = Math.min(100, Math.round((coveredTopicsCount / totalTopics) * 100));
      const calcAccuracyPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

      let calcScore = 0;
      if (totalAttempted === 0) {
        calcScore = 0;
      } else {
        // Weighted readiness formula: 50% Accuracy + 50% Coverage - unresolved mistake penalty
        const penalty = Math.min(20, criticalMistakes * 2);
        calcScore = Math.max(5, Math.min(100, Math.round(0.5 * calcAccuracyPct + 0.5 * calcCoveragePct - penalty)));
      }

      setReadinessScore(calcScore);
      setCoveragePct(calcCoveragePct);
      setAccuracyPct(calcAccuracyPct);
      setMasteredTopicsCount(
        Array.from(attemptedTopics.values()).filter((t) => t.attemptCount >= 3 && t.correctCount / t.attemptCount >= 0.8).length
      );

      // 4. Compute Spaced Repetition Due Topics
      // A topic is due if last attempted > 3 days ago OR accuracy < 75%
      const now = Date.now();
      const dueList: RevisionTopicDue[] = [];

      attemptedTopics.forEach((stat, topic) => {
        const daysSince = Math.floor((now - stat.lastAttemptedAt) / (1000 * 60 * 60 * 24));
        const topicAcc = stat.attemptCount > 0 ? Math.round((stat.correctCount / stat.attemptCount) * 100) : 0;

        if (daysSince >= 3 || topicAcc < 75 || stat.mistakesCount > 0) {
          dueList.push({
            topic,
            subject: stat.subject,
            lastAttemptedAt: stat.lastAttemptedAt,
            daysSinceLastAttempt: daysSince,
            mistakesCount: stat.mistakesCount,
            accuracyPct: topicAcc,
          });
        }
      });

      dueList.sort((a, b) => b.mistakesCount - a.mistakesCount || b.daysSinceLastAttempt - a.daysSinceLastAttempt);
      setRevisionDueTopics(dueList);

      // 5. Emit telemetry
      telemetry.emit('readiness_computed', {
        examId: activeExam.id,
        readinessScore: calcScore,
        coveragePct: calcCoveragePct,
        tier: calcScore >= 80 ? 'ready' : calcScore >= 60 ? 'on_track' : calcScore >= 40 ? 'developing' : 'early',
      });

      if (dueList.length > 0) {
        telemetry.emit('revision_plan_generated', {
          examId: activeExam.id,
          topicsDueCount: dueList.length,
        });
      }
    } catch (err) {
      console.error('[useExamReadiness] Failed to calculate readiness:', err);
      setReadinessScore(0);
      setCoveragePct(0);
      setAccuracyPct(0);
      setRevisionDueTopics([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeExam, metadata]);

  useEffect(() => {
    refreshReadiness();
  }, [refreshReadiness]);

  // Resolve Tier
  const { tier, tierLabel, tierColor, actionRecommendation } = useMemo(() => {
    if (readinessScore >= 80) {
      return {
        tier: 'ready' as ReadinessTier,
        tierLabel: 'Exam Ready',
        tierColor: 'emerald',
        actionRecommendation: `Maintain peak momentum with full-length timed mocks for ${activeExam.shortCode}.`,
      };
    }
    if (readinessScore >= 60) {
      return {
        tier: 'on_track' as ReadinessTier,
        tierLabel: 'On Track',
        tierColor: 'indigo',
        actionRecommendation: `Target weak subtopics and drill spaced repetition reviews to cross the 80% cut-off.`,
      };
    }
    if (readinessScore >= 40) {
      return {
        tier: 'developing' as ReadinessTier,
        tierLabel: 'Developing',
        tierColor: 'amber',
        actionRecommendation: `Expand your syllabus coverage across untested ${activeExam.shortCode} subjects.`,
      };
    }
    return {
      tier: 'early' as ReadinessTier,
      tierLabel: 'Foundational',
      tierColor: 'blue',
      actionRecommendation: `Take foundational chapter drills and diagnostic PYQ tests to build baseline readiness.`,
    };
  }, [readinessScore, activeExam]);

  // Launch Spaced Repetition Drill
  const launchRevisionDrill = useCallback(
    (targetTopic?: string) => {
      const topDue = targetTopic
        ? revisionDueTopics.find((t) => t.topic === targetTopic)
        : revisionDueTopics[0];

      telemetry.emit('ai_drill_launched', {
        examId: activeExam.id,
        topic: topDue ? topDue.topic : 'Revision Mix',
        mode: 'learning',
        isDiagnostic: false,
      });

      navigate('/quiz/config', {
        state: {
          initialFilters: {
            subject: topDue ? [topDue.subject] : [],
            topic: topDue ? [topDue.topic] : [],
            subTopic: [],
            difficulty: [],
            questionType: [],
            examName: activeExam.dbExamNames,
            examYear: [],
            examDateShift: [],
            tags: ['PYQ'],
          },
          initialMode: 'learning',
          autoStart: true,
          returnTo: '/ai',
          from: '/ai',
          fixedExamContext: true,
        },
      });
    },
    [revisionDueTopics, activeExam, navigate]
  );

  return {
    isLoading,
    activeExam,
    readinessScore,
    coveragePct,
    accuracyPct,
    tier,
    tierLabel,
    tierColor,
    actionRecommendation,
    totalSyllabusTopics,
    masteredTopicsCount,
    revisionDueTopics,
    launchRevisionDrill,
    refreshReadiness,
  };
};
