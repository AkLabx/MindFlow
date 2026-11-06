import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExamReadiness } from './useExamReadiness';
import { useExamContextStore } from '../../../stores/useExamContextStore';
import { telemetry } from '../../../lib/telemetry/index';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../lib/db', () => ({
  db: {
    getAllSavedQuizzes: vi.fn(),
  },
}));

vi.mock('../../quiz/hooks/useQuestionMetadata', () => ({
  useQuestionMetadata: () => ({
    metadata: [
      { id: 'm1', topic: 'Modern History', examName: 'SSC CGL' },
      { id: 'm2', topic: 'Ancient History', examName: 'SSC CGL' },
      { id: 'm3', topic: 'Trigonometry', examName: 'SSC CGL' },
      { id: 'm4', topic: 'Algebra', examName: 'SSC CGL' },
      { id: 'm5', topic: 'Indian Rivers', examName: 'BPSC Prelims' },
    ],
    loading: false,
  }),
}));

import { db } from '../../../lib/db';

describe('useExamReadiness & Revision Planner Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    telemetry.clear();
    useExamContextStore.setState({ activeExamId: 'ssc_cgl' });
  });

  it('evaluates baseline foundational readiness when 0 attempts exist for the active exam', async () => {
    (db.getAllSavedQuizzes as any).mockResolvedValue([]);

    const { result } = renderHook(() => useExamReadiness());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.readinessScore).toBe(0);
    expect(result.current.tier).toBe('early');
    expect(result.current.tierLabel).toBe('Foundational');
    expect(result.current.coveragePct).toBe(0);
    expect(result.current.revisionDueTopics).toHaveLength(0);

    const history = telemetry.getHistory();
    const readinessEvent = history.find((e) => e.name === 'readiness_computed');
    expect(readinessEvent).toBeDefined();
    if (readinessEvent && readinessEvent.name === 'readiness_computed') {
      expect(readinessEvent.payload.examId).toBe('ssc_cgl');
      expect(readinessEvent.payload.readinessScore).toBe(0);
      expect(readinessEvent.payload.tier).toBe('early');
    }
  });

  it('calculates exam readiness and detects spaced repetition revision topics', async () => {
    const mockQuizzes = [
      {
        id: 'quiz-1',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago (decayed)
        filters: { examName: ['SSC CGL'] },
        state: {
          answers: { q1: 'A', q2: 'B' },
        },
        questions: [
          { id: 'q1', examName: 'SSC CGL', subject: 'History', topic: 'Modern History', correct: 'A' },
          { id: 'q2', examName: 'SSC CGL', subject: 'History', topic: 'Modern History', correct: 'C' }, // Incorrect
        ],
      },
      {
        id: 'quiz-2',
        createdAt: Date.now(),
        filters: { examName: ['SSC CGL'] },
        state: {
          answers: { q3: 'B' },
        },
        questions: [
          { id: 'q3', examName: 'SSC CGL', subject: 'Quant', topic: 'Trigonometry', correct: 'B' }, // Correct
        ],
      },
      // Non-matching exam (BPSC) — must be excluded
      {
        id: 'quiz-3',
        createdAt: Date.now(),
        filters: { examName: ['BPSC CSE PRE'] },
        state: {
          answers: { q4: 'D' },
        },
        questions: [
          { id: 'q4', examName: 'BPSC CSE PRE', subject: 'Geography', topic: 'Indian Rivers', correct: 'D' },
        ],
      },
    ];

    (db.getAllSavedQuizzes as any).mockResolvedValue(mockQuizzes);

    const { result } = renderHook(() => useExamReadiness());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.coveragePct).toBeGreaterThan(0);
    expect(result.current.accuracyPct).toBe(67); // 2 correct out of 3 SSC CGL questions
    expect(result.current.readinessScore).toBeGreaterThan(0);

    // Modern History was practiced 5 days ago and had 1 mistake -> due for spaced revision
    expect(result.current.revisionDueTopics.length).toBeGreaterThanOrEqual(1);
    const modernHist = result.current.revisionDueTopics.find((t) => t.topic === 'Modern History');
    expect(modernHist).toBeDefined();
    expect(modernHist?.mistakesCount).toBe(1);
    expect(modernHist?.daysSinceLastAttempt).toBeGreaterThanOrEqual(4);

    // Test launchRevisionDrill
    act(() => {
      result.current.launchRevisionDrill('Modern History');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/quiz/config', expect.objectContaining({
      state: expect.objectContaining({
        autoStart: true,
        fixedExamContext: true,
        initialFilters: expect.objectContaining({
          topic: ['Modern History'],
        }),
      }),
    }));
  });
});
