import { Question, SavedQuiz, QuizHistoryRecord } from '@/features/quiz/types';
import { IdiomInteraction, OWSInteraction, SynonymInteraction } from '@/lib/db';
import {
  TodaysPlanState,
  PlanItem,
  PlanChapter,
  VocabPlanItem,
  UserLearningTier
} from '../types';

interface AlgorithmInputs {
  savedQuizzes: SavedQuiz[];
  quizHistory: QuizHistoryRecord[];
  bookmarks: Question[];
  metadataCatalog: Question[];
  idiomInteractions?: IdiomInteraction[];
  owsInteractions?: OWSInteraction[];
  synonymInteractions?: SynonymInteraction[];
}

const CHAPTER_SIZE = 25;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getQuestionSubject = (q: Question) =>
  q.subject ?? q.classification?.subject ?? 'General Knowledge';

const getQuestionTopic = (q: Question) =>
  q.topic ?? q.classification?.topic;

const getQuestionDifficulty = (q: Question) =>
  q.properties?.difficulty ?? (q as any).difficulty ?? 'Medium';

export const generateTodaysPlan = (inputs: AlgorithmInputs): TodaysPlanState => {
  const {
    savedQuizzes = [],
    quizHistory = [],
    bookmarks = [],
    metadataCatalog = [],
    idiomInteractions = [],
    owsInteractions = []
  } = inputs;

  const now = Date.now();

  // 1. Map to track question performance history
  const questionPerformance = new Map<
    string,
    {
      question: Question;
      correctCount: number;
      incorrectCount: number;
      lastAttemptedAt: number;
      isCurrentlyMastered: boolean;
    }
  >();

  // Process saved quizzes to discover mistake patterns & correct recall
  for (const quiz of savedQuizzes) {
    const quizQuestions = quiz.questions || [];
    const answers = quiz.state?.answers || {};
    const quizTime = quiz.createdAt || now;

    for (const q of quizQuestions) {
      if (!q || !q.id) continue;
      const userAnswer = answers[q.id];
      if (!userAnswer) continue; // Skipped / Unanswered

      const isCorrect = userAnswer === q.correct;
      const existing = questionPerformance.get(q.id);

      if (existing) {
        if (isCorrect) {
          existing.correctCount += 1;
        } else {
          existing.incorrectCount += 1;
        }
        if (quizTime > existing.lastAttemptedAt) {
          existing.lastAttemptedAt = quizTime;
          existing.isCurrentlyMastered = isCorrect;
        }
      } else {
        questionPerformance.set(q.id, {
          question: q,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          lastAttemptedAt: quizTime,
          isCurrentlyMastered: isCorrect
        });
      }
    }
  }

  // 2. Classify candidate pools
  const mistakePool: PlanItem[] = [];
  const spacedRetentionPool: PlanItem[] = [];
  const bookmarkedPool: PlanItem[] = [];

  for (const [id, perf] of questionPerformance.entries()) {
    const qSubject = getQuestionSubject(perf.question);
    const qTopic = getQuestionTopic(perf.question);
    const qDiff = getQuestionDifficulty(perf.question);

    // If not currently mastered, or answered incorrectly multiple times
    if (!perf.isCurrentlyMastered || perf.incorrectCount > perf.correctCount) {
      mistakePool.push({
        id,
        question: perf.question,
        category: 'mistake',
        sourceReason: `Missed in previous quiz (${perf.incorrectCount} mistake${perf.incorrectCount > 1 ? 's' : ''})`,
        subject: qSubject,
        topic: qTopic,
        difficulty: qDiff
      });
    } else {
      // Check Spaced Repetition (decay intervals: ~1d, ~3d, ~7d, ~21d)
      const daysSinceAttempt = (now - perf.lastAttemptedAt) / ONE_DAY_MS;
      let intervalLabel = '';

      if (daysSinceAttempt >= 0.8 && daysSinceAttempt <= 1.5) {
        intervalLabel = '1-Day Recall Refresh';
      } else if (daysSinceAttempt >= 2.5 && daysSinceAttempt <= 4.0) {
        intervalLabel = '3-Day Retention Check';
      } else if (daysSinceAttempt >= 6.0 && daysSinceAttempt <= 9.0) {
        intervalLabel = '7-Day Memory Reinforcement';
      } else if (daysSinceAttempt >= 18.0 && daysSinceAttempt <= 25.0) {
        intervalLabel = '21-Day Long-term Anchor';
      }

      if (intervalLabel) {
        spacedRetentionPool.push({
          id,
          question: perf.question,
          category: 'spaced_repetition',
          sourceReason: intervalLabel,
          subject: qSubject,
          topic: qTopic,
          difficulty: qDiff
        });
      }
    }
  }

  // Bookmarks pool
  for (const b of bookmarks) {
    if (!b || !b.id) continue;
    // Don't duplicate if already in mistakePool
    if (!mistakePool.some(m => m.id === b.id)) {
      bookmarkedPool.push({
        id: b.id,
        question: b,
        category: 'bookmark',
        sourceReason: 'Saved in your personal Bookmarks',
        subject: getQuestionSubject(b),
        topic: getQuestionTopic(b),
        difficulty: getQuestionDifficulty(b)
      });
    }
  }

  // 3. Determine User Learning Tier
  const totalAttempts = quizHistory.length + savedQuizzes.length;
  let tier: UserLearningTier = 'new_user';

  if (totalAttempts < 2 && mistakePool.length === 0) {
    tier = 'new_user';
  } else if (mistakePool.length >= 5) {
    tier = 'error_prone';
  } else if (spacedRetentionPool.length >= 6) {
    tier = 'advanced_retention';
  } else {
    tier = 'blueprint_targeted';
  }

  // 4. Construct Today's 15-Question Plan Capsule
  const selectedItems: PlanItem[] = [];
  const selectedIds = new Set<string>();

  const addItemSafely = (item: PlanItem) => {
    if (!selectedIds.has(item.id)) {
      selectedIds.add(item.id);
      selectedItems.push(item);
    }
  };

  if (tier === 'new_user') {
    // Curate 12-15 high-frequency questions spanning key subjects
    const subjectsToCover = ['History', 'Polity', 'Geography', 'Biology', 'Economy', 'Static GK'];
    const candidatesBySubject = new Map<string, Question[]>();

    for (const q of metadataCatalog) {
      const subj = getQuestionSubject(q);
      if (!candidatesBySubject.has(subj)) candidatesBySubject.set(subj, []);
      candidatesBySubject.get(subj)!.push(q);
    }

    for (const subj of subjectsToCover) {
      const list = candidatesBySubject.get(subj) || [];
      const slice = list.slice(0, 2);
      for (const q of slice) {
        addItemSafely({
          id: q.id,
          question: q,
          category: 'high_yield_diagnostic',
          sourceReason: `High-Yield Foundation: ${subj}`,
          subject: subj,
          topic: getQuestionTopic(q),
          difficulty: getQuestionDifficulty(q)
        });
      }
    }

    // Fill remaining up to 15 from metadata if needed
    for (const q of metadataCatalog) {
      if (selectedItems.length >= 15) break;
      addItemSafely({
        id: q.id,
        question: q,
        category: 'high_yield_diagnostic',
        sourceReason: 'Core Syllabus Diagnostic',
        subject: getQuestionSubject(q),
        topic: getQuestionTopic(q),
        difficulty: getQuestionDifficulty(q)
      });
    }
  } else {
    // Priority 1: Mistakes (up to 8 questions)
    for (const m of mistakePool.slice(0, 8)) {
      addItemSafely(m);
    }

    // Priority 2: Spaced Repetition (up to 4 questions)
    for (const s of spacedRetentionPool.slice(0, 4)) {
      addItemSafely(s);
    }

    // Priority 3: Bookmarks (up to 3 questions)
    for (const b of bookmarkedPool.slice(0, 3)) {
      addItemSafely(b);
    }

    // If still under 15, supplement with high-yield items from metadata
    if (selectedItems.length < 15 && metadataCatalog.length > 0) {
      for (const q of metadataCatalog) {
        if (selectedItems.length >= 15) break;
        if (!selectedIds.has(q.id)) {
          addItemSafely({
            id: q.id,
            question: q,
            category: 'spaced_repetition',
            sourceReason: 'Daily Syllabus Refresh',
            subject: getQuestionSubject(q),
            topic: getQuestionTopic(q),
            difficulty: getQuestionDifficulty(q)
          });
        }
      }
    }
  }

  // 5. Build Chapters of 25 (Sequential Master Plan)
  const chapters: PlanChapter[] = [];
  const validCatalog = metadataCatalog.length > 0 ? metadataCatalog : selectedItems.map(i => i.question);
  const totalChaptersCount = Math.min(10, Math.ceil(validCatalog.length / CHAPTER_SIZE));

  for (let i = 0; i < totalChaptersCount; i++) {
    const chunk = validCatalog.slice(i * CHAPTER_SIZE, (i + 1) * CHAPTER_SIZE);
    if (chunk.length === 0) break;

    const primarySubject = getQuestionSubject(chunk[0]);
    let masteredInChunk = 0;

    for (const q of chunk) {
      const perf = questionPerformance.get(q.id);
      if (perf && perf.isCurrentlyMastered) {
        masteredInChunk++;
      }
    }

    chapters.push({
      id: `chapter-${i + 1}`,
      chapterNumber: i + 1,
      title: `Part ${i + 1}: ${primarySubject} Revision`,
      subject: primarySubject,
      questionIds: chunk.map(q => q.id),
      totalQuestions: chunk.length,
      masteredCount: masteredInChunk,
      isUnlocked: i === 0 || chapters[i - 1]?.masteredCount >= 10
    });
  }

  // 6. Curate Tricky Vocab Items for Dual-Track
  const vocabItems: VocabPlanItem[] = [];

  // Add tricky idioms from user interactions
  for (const idiom of idiomInteractions) {
    if (idiom.status === 'tricky' || idiom.status === 'clueless' || idiom.known_ows === false) {
      vocabItems.push({
        id: idiom.idiomId,
        type: 'idiom',
        term: 'Idiom Revision',
        meaning: 'Frequently confused exam idiom',
        status: idiom.status || 'review'
      });
      if (vocabItems.length >= 5) break;
    }
  }

  // Add tricky OWS from user interactions
  for (const ows of owsInteractions) {
    if (ows.known_ows === false) {
      vocabItems.push({
        id: ows.wordId,
        type: 'ows',
        term: 'One Word Substitution',
        meaning: 'Target substitution marked for revision',
        status: 'unmastered'
      });
      if (vocabItems.length >= 10) break;
    }
  }

  // Compute overall stats
  let totalCorrectSum = 0;
  let totalAttemptedSum = 0;
  for (const h of quizHistory) {
    totalCorrectSum += h.totalCorrect || 0;
    totalAttemptedSum += h.totalQuestions || 0;
  }
  const overallAccuracy = totalAttemptedSum > 0 ? Math.round((totalCorrectSum / totalAttemptedSum) * 100) : 0;

  // Title & Subtitle based on Tier
  let title = "Today's 5-Minute Plan";
  let subtitle = "Your personalized daily revision capsule";

  if (tier === 'new_user') {
    title = "Diagnostic Starter Plan";
    subtitle = "15 curated core questions to calibrate your exam readiness";
  } else if (tier === 'error_prone') {
    title = "Mistake Redemption Plan";
    subtitle = `${mistakePool.length} pending mistakes identified for redemption today`;
  } else if (tier === 'advanced_retention') {
    title = "Spaced Retention Radar";
    subtitle = "Preventing memory decay for items answered 1-7 days ago";
  }

  return {
    tier,
    title,
    subtitle,
    estimatedMinutes: 5,
    items: selectedItems,
    vocabItems,
    chapters,
    stats: {
      totalQuestions: selectedItems.length,
      mistakesToRedeem: mistakePool.length,
      spacedRepetitionDue: spacedRetentionPool.length,
      bookmarkedCount: bookmarks.length,
      overallAccuracy
    },
    hasHistoricalData: totalAttempts > 0,
    generatedAt: now
  };
};
