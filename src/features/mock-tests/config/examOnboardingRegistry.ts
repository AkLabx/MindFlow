import { resolveExamCbtSkin, type CbtInterfaceSkin } from '../components/cbt/types';

export const EXAM_INTEGRITY_DECLARATION =
  "I have read all the instructions carefully and understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or somebody else's advantage will lead to my immediate disqualification. The decision of MindFlow will be final in the matter and cannot be appealed.";

export interface ExamSymbolLegendItem {
  id: string;
  label: string;
  description: string;
  colorClass: string;
  shapeClass: string;
  badgeIcon?: 'check' | 'dot';
}

export interface ExamActionButtonLegendItem {
  id: string;
  label: string;
  description: string;
  visualClass: string;
}

export interface ExamOnboardingConfig {
  skin: CbtInterfaceSkin;
  patternLabel: string;
  subtitle: string;
  rules: string[];
  symbolLegend: ExamSymbolLegendItem[];
  actionButtons: ExamActionButtonLegendItem[];
  declarationText: string;
}

const formatTestMetricsSummary = (test: any): {
  durationMinutes: number;
  questionCount: number;
  totalMarks: number;
  negativeMarks: number;
} => {
  const durationMinutes = Math.max(1, Number(test?.duration_minutes ?? 60));
  const questionCount = Math.max(
    1,
    Number(
      test?.question_count ??
        (Array.isArray(test?.question_ids) ? test.question_ids.length : 100)
    )
  );
  const totalMarks = Math.max(1, Number(test?.total_marks ?? questionCount));
  const negativeMarks = Math.max(0, Number(test?.negative_marks ?? 0));
  return { durationMinutes, questionCount, totalMarks, negativeMarks };
};

export const resolveExamOnboardingConfig = (
  test: any,
  skinOverride?: CbtInterfaceSkin
): ExamOnboardingConfig => {
  const skin = skinOverride ?? resolveExamCbtSkin({ test });
  const { durationMinutes, questionCount, totalMarks, negativeMarks } =
    formatTestMetricsSummary(test);

  const negativeRule =
    negativeMarks > 0
      ? `Negative marking applies: -${negativeMarks} marks will be deducted for each wrong response.`
      : 'There is no negative marking for incorrect answers in this examination.';

  if (skin === 'ssc_cgl_eduquity') {
    return {
      skin,
      patternLabel: 'SSC New Pattern (Eduquity)',
      subtitle: 'Modern SSC CGL CBT workspace with left-docked navigator & accessibility zoom bar',
      rules: [
        `Total examination duration is ${durationMinutes} minutes covering ${questionCount} objective questions for ${totalMarks} marks.`,
        negativeRule,
        'The Question Navigator stays docked on the left (or opens via the top drawer button on mobile) and updates status in real time.',
        'Use A- / A+ accessibility zoom controls and the EN/HI language selector anytime without losing your progress.',
        'Questions marked as Answered & Marked for Review ARE considered for final evaluation unless cleared before submission.',
        'Answers auto-save locally and sync securely; the exam auto-submits when the countdown timer reaches 00:00.',
      ],
      symbolLegend: [
        {
          id: 'answered',
          label: 'Answered',
          description: 'You have selected an option and saved/visited the question.',
          colorClass: 'bg-emerald-600 text-white border-emerald-700',
          shapeClass: 'rounded-lg',
        },
        {
          id: 'not_answered',
          label: 'Not Answered',
          description: 'You have visited this question but left it unanswered.',
          colorClass: 'bg-rose-600 text-white border-rose-700',
          shapeClass: 'rounded-lg',
        },
        {
          id: 'marked_for_review',
          label: 'Marked for Review',
          description: 'Flagged for revision without selecting an answer yet.',
          colorClass: 'bg-blue-600 text-white border-blue-700',
          shapeClass: 'rounded-lg',
        },
        {
          id: 'not_visited',
          label: 'Not Visited',
          description: 'You have not opened this question yet.',
          colorClass: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600',
          shapeClass: 'rounded-lg',
        },
        {
          id: 'answered_and_marked',
          label: 'Answered & Marked for Review (Considered for Evaluation)',
          description: 'Selected option is saved and flagged; evaluated in final score.',
          colorClass: 'bg-blue-600 text-white border-emerald-400 ring-1 ring-emerald-400',
          shapeClass: 'rounded-lg relative',
          badgeIcon: 'dot',
        },
      ],
      actionButtons: [
        {
          id: 'save_and_next',
          label: 'Save & Next',
          description: 'Saves your selected option and advances to the next question.',
          visualClass: 'bg-teal-600 text-white border-teal-700',
        },
        {
          id: 'previous',
          label: 'Previous',
          description: 'Returns to the preceding question without discarding saved choices.',
          visualClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700',
        },
        {
          id: 'mark_for_review',
          label: 'Mark for Review',
          description: 'Flags the current question in the navigator so you can revisit it later.',
          visualClass: 'bg-blue-600 text-white border-blue-700',
        },
        {
          id: 'unmark_review',
          label: 'Unmark Review',
          description: 'Removes the review flag from the active question.',
          visualClass: 'bg-amber-500 text-slate-950 border-amber-600',
        },
        {
          id: 'clear',
          label: 'Clear',
          description: 'Clears the currently chosen option so the question becomes unanswered.',
          visualClass: 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700',
        },
      ],
      declarationText: EXAM_INTEGRITY_DECLARATION,
    };
  }

  if (skin === 'ssc_cgl_tcs_ion') {
    return {
      skin,
      patternLabel: 'SSC Old Pattern (TCS iON)',
      subtitle: 'Classic TCS iON CBT interface with section tabs & collapsible right 5-symbol palette',
      rules: [
        `Total examination duration is ${durationMinutes} minutes across ${questionCount} questions carrying ${totalMarks} total marks.`,
        negativeRule,
        'Switch between exam sections anytime using the top Section Tabs bar; each tab displays live attempted counts.',
        'Use the right-side Question Palette (collapsible on desktop or drawer on mobile) to jump directly to any question.',
        'Questions marked as Answered & Marked for Review will be evaluated in final scoring unless you click Clear Response.',
        'Your responses are saved continuously and the paper auto-submits automatically when the timer expires.',
      ],
      symbolLegend: [
        {
          id: 'answered',
          label: 'Answered',
          description: 'Question has a saved response.',
          colorClass: 'bg-emerald-600 text-white border-emerald-700',
          shapeClass: 'rounded-t-2xl rounded-b-md',
        },
        {
          id: 'not_answered',
          label: 'Not Answered',
          description: 'Question was viewed without saving an option.',
          colorClass: 'bg-rose-600 text-white border-rose-700',
          shapeClass: 'rounded-t-md rounded-b-2xl',
        },
        {
          id: 'marked_for_review',
          label: 'Marked for Review',
          description: 'Question is marked for later review with no answer selected.',
          colorClass: 'bg-purple-600 text-white border-purple-700',
          shapeClass: 'rounded-full',
        },
        {
          id: 'not_visited',
          label: 'Not Visited',
          description: 'Question has not been visited yet.',
          colorClass: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600',
          shapeClass: 'rounded-md',
        },
        {
          id: 'answered_and_marked',
          label: 'Answered & Marked for Review',
          description: 'Response saved and marked for review (considered for evaluation).',
          colorClass: 'bg-purple-600 text-white border-emerald-400',
          shapeClass: 'rounded-full relative',
          badgeIcon: 'check',
        },
      ],
      actionButtons: [
        {
          id: 'save_and_next',
          label: 'Save & Next',
          description: 'Commits your selected response and moves to the next question.',
          visualClass: 'bg-[#1e3a5f] text-white border-[#142942]',
        },
        {
          id: 'previous',
          label: 'Previous',
          description: 'Navigates backward to review the previous question.',
          visualClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700',
        },
        {
          id: 'mark_for_review',
          label: 'Mark for Review',
          description: 'Marks the question in purple on the palette for quick re-checking.',
          visualClass: 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border-purple-400',
        },
        {
          id: 'unmark_review',
          label: 'Unmark Review',
          description: 'Clears the review marker while preserving any selected option.',
          visualClass: 'bg-purple-600 text-white border-purple-700',
        },
        {
          id: 'clear_response',
          label: 'Clear Response',
          description: 'Erases your selected option for the current question.',
          visualClass: 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-slate-300 dark:border-slate-700',
        },
      ],
      declarationText: EXAM_INTEGRITY_DECLARATION,
    };
  }

  return {
    skin,
    patternLabel: 'BPSC / Standard CBT Interface',
    subtitle: 'Standard bilingual CBT layout with right-side Question Palette and crash-safe sync',
    rules: [
      `Total test duration is ${durationMinutes} minutes across ${questionCount} questions for ${totalMarks} maximum marks.`,
      negativeRule,
      'Select an option and tap Save & Next to record your answer and advance cleanly.',
      'Use the right-side Question Palette (or Palette button on mobile) to filter All, Unanswered, or Marked questions.',
      'Answered & Marked questions are saved and evaluated unless cleared before final submission.',
      'Responses persist offline in real time and the test auto-submits when the countdown reaches zero.',
    ],
    symbolLegend: [
      {
        id: 'answered',
        label: 'Answered',
        description: 'Response saved for this question.',
        colorClass: 'bg-emerald-600 text-white border-emerald-700',
        shapeClass: 'rounded-xl',
      },
      {
        id: 'not_answered',
        label: 'Not Answered',
        description: 'Visited without selecting an answer.',
        colorClass: 'bg-rose-600 text-white border-rose-700',
        shapeClass: 'rounded-xl',
      },
      {
        id: 'marked_for_review',
        label: 'Marked for Review',
        description: 'Flagged for revision before final submission.',
        colorClass: 'bg-purple-600 text-white border-purple-700',
        shapeClass: 'rounded-xl',
      },
      {
        id: 'not_visited',
        label: 'Not Visited',
        description: 'Not opened yet during this attempt.',
        colorClass: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600',
        shapeClass: 'rounded-xl',
      },
      {
        id: 'answered_and_marked',
        label: 'Answered & Marked',
        description: 'Answered and flagged for double-check (included in scoring).',
        colorClass: 'bg-indigo-600 text-white border-purple-400 ring-1 ring-purple-400',
        shapeClass: 'rounded-xl relative',
        badgeIcon: 'dot',
      },
    ],
    actionButtons: [
      {
        id: 'save_and_next',
        label: 'Save & Next',
        description: 'Saves your current answer and moves forward.',
        visualClass: 'bg-indigo-600 text-white border-indigo-700',
      },
      {
        id: 'previous',
        label: 'Previous',
        description: 'Moves back to the previous question.',
        visualClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700',
      },
      {
        id: 'mark',
        label: 'Mark',
        description: 'Flags the current question for review.',
        visualClass: 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700',
      },
      {
        id: 'marked',
        label: 'Marked',
        description: 'Indicates the question is flagged; tap again to unmark.',
        visualClass: 'bg-purple-600 text-white border-purple-700',
      },
    ],
    declarationText: EXAM_INTEGRITY_DECLARATION,
  };
};
