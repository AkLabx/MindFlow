/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  compareExamDateShiftsDesc,
  parseExamDateShiftSortKey,
} from '../shiftSorting';
import { Question } from '../../types';

const mockMetadataState = vi.hoisted(() => ({
  metadata: [] as Question[],
  isLoading: false,
  error: null as string | null,
  progress: { current: 0, total: 0 },
  refresh: vi.fn(),
}));

vi.mock('../../hooks/useQuestionMetadata', () => ({
  useQuestionMetadata: () => mockMetadataState,
}));

vi.mock('@/pages/ExamBlueprintsHubPage', () => ({
  ExamBlueprintsHubPage: () => React.createElement('div', null, 'Mock Blueprints'),
}));

vi.mock('../../services/quizCreationService', () => ({
  MAX_QUIZ_QUESTIONS: 300,
  DEFAULT_DRILL_QUESTION_COUNT: 25,
  quizCreationService: {
    createQuiz: vi.fn(),
  },
}));

vi.mock('@/lib/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('@/lib/telemetry', () => ({
  telemetry: { emit: vi.fn() },
}));

vi.mock('@/lib/performance', () => ({
  performanceTracker: {
    measureSync: (_name: string, _budget: number, fn: () => unknown) => fn(),
  },
  PERF_BUDGETS: { FILTER_RECALCULATION: 16 },
}));

import { QuizConfig } from '../../components/QuizConfig';

const makeQuestion = (
  id: string,
  examName: string,
  examYear: number,
  examDateShift: string,
  subject = 'Polity'
): Question =>
  ({
    id,
    question: `Sample question ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    classification: {
      subject,
      topic: 'Constitution',
      subTopic: 'Preamble',
    },
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ',
    },
    sourceInfo: {
      examName,
      examYear,
      examDateShift,
    },
    examName,
    examYear,
    examDateShift,
    tags: [],
  }) as unknown as Question;

describe('shiftSorting (compareExamDateShiftsDesc)', () => {
  it('parses full dates, date ranges, numeric dates, month-year, editions, shifts, and times', () => {
    const k1 = parseExamDateShiftSortKey('12 Sep 2024 (Shift-3 • 05:00 PM)');
    expect(k1.timestampMs).toBe(Date.UTC(2024, 8, 12));
    expect(k1.shiftNumber).toBe(3);
    expect(k1.timeMinutes).toBe(17 * 60);

    const kRange = parseExamDateShiftSortKey('01–04 Mar 2024');
    expect(kRange.timestampMs).toBe(Date.UTC(2024, 2, 4));

    const kNum = parseExamDateShiftSortKey('30-09-2023');
    expect(kNum.timestampMs).toBe(Date.UTC(2023, 8, 30));

    const kEdition = parseExamDateShiftSortKey('71st BPSC Prelims');
    expect(kEdition.editionNumber).toBe(71);
  });

  it('sorts examDateShift labels chronologically latest-to-oldest across dates, shifts, times, and editions', () => {
    const unsorted = [
      '30-09-2023 (Shift-1)',
      '09 Sep 2024 (Shift-2 • 01:30 PM)',
      '12 Sep 2024 (Shift-1 • 09:00 AM)',
      '12 Sep 2024 (Shift-3 • 05:00 PM)',
      'Jul 2024',
      '01–04 Mar 2024',
    ];

    const sorted = [...unsorted].sort(compareExamDateShiftsDesc);
    expect(sorted).toEqual([
      '12 Sep 2024 (Shift-3 • 05:00 PM)',
      '12 Sep 2024 (Shift-1 • 09:00 AM)',
      '09 Sep 2024 (Shift-2 • 01:30 PM)',
      'Jul 2024',
      '01–04 Mar 2024',
      '30-09-2023 (Shift-1)',
    ]);

    const editions = ['69th BPSC', '71st BPSC', '70th BPSC'];
    expect([...editions].sort(compareExamDateShiftsDesc)).toEqual([
      '71st BPSC',
      '70th BPSC',
      '69th BPSC',
    ]);
  });
});

describe('QuizConfig multi-exam selection & shift ordering', () => {
  beforeEach(() => {
    mockMetadataState.metadata = [
      makeQuestion('q1', 'BPSC CCE PRE', 2023, '30-09-2023 (Shift-1)'),
      makeQuestion('q2', 'SSC CGL PRE', 2024, '09 Sep 2024 (Shift-2 • 01:30 PM)'),
      makeQuestion('q3', 'SSC CGL PRE', 2024, '12 Sep 2024 (Shift-1 • 09:00 AM)'),
      makeQuestion('q4', 'SSC CGL PRE', 2024, '12 Sep 2024 (Shift-3 • 05:00 PM)'),
    ];
    mockMetadataState.isLoading = false;
    mockMetadataState.error = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps examDomainGroups visible after selecting an exam so users can multi-select/deselect and counts tier2ActiveCount', () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(QuizConfig, { onStart: vi.fn() })
      )
    );

    const scopingToggle = screen.getByRole('button', { name: /PYQ & Examination Scoping/i });
    fireEvent.click(scopingToggle);

    const civilGroup = screen.getByRole('group', { name: 'Civil Services & State PCS' });
    const sscGroup = screen.getByRole('group', { name: 'SSC Exams' });

    const bpscBtn = within(civilGroup).getByRole('button', { name: /BPSC Civil Services Prelims/i });

    // Select first exam
    fireEvent.click(bpscBtn);
    expect(screen.getByText('Target Exam Active')).toBeTruthy();

    // Second exam capsule in examDomainGroups must remain visible for multi-exam selection
    const sscBtnAfterFirstPick = within(sscGroup).getByRole('button', { name: /SSC CGL Prelims/i });
    fireEvent.click(sscBtnAfterFirstPick);

    // Tier-2 active badge counts both selected exams
    expect(screen.getByText('2 active')).toBeTruthy();

    // Deselecting first exam updates count cleanly back to 1
    fireEvent.click(within(civilGroup).getByRole('button', { name: /BPSC Civil Services Prelims/i }));
    expect(screen.getByText('1 active')).toBeTruthy();
  });

  it('renders Exam Shift options sorted chronologically latest-to-oldest', () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(QuizConfig, { onStart: vi.fn() })
      )
    );

    const scopingToggle = screen.getByRole('button', { name: /PYQ & Examination Scoping/i });
    fireEvent.click(scopingToggle);

    const shiftGroup = screen.getByRole('group', { name: 'Exam Shift' });
    const shiftButtons = within(shiftGroup).getAllByRole('button');
    const shiftLabels = shiftButtons.map((btn) => btn.textContent?.replace(/\d+$/, '').trim());

    expect(shiftLabels).toEqual([
      '12 Sep 2024 (Shift-3 • 05:00 PM)',
      '12 Sep 2024 (Shift-1 • 09:00 AM)',
      '09 Sep 2024 (Shift-2 • 01:30 PM)',
      '30-09-2023 (Shift-1)',
    ]);
  });
});
