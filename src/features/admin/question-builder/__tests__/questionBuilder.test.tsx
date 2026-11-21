/**
 * @vitest-environment jsdom
 */
import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import {
  CANONICAL_EXAMS,
  resolveCanonicalExamNames,
} from '@/features/dashboard/constants/examRegistry';
import {
  fetchFilterOptions,
  searchQuestions,
  fetchQuestionsByUUIDs,
  clearFilterOptionsCache,
} from '../api/questionBuilderApi';
import { QuestionBuilder } from '../components/QuestionBuilder';
import { QuestionLightweight } from '../types/questionBuilder.types';
import { useNotificationStore } from '@/stores/useNotificationStore';

const { rpcMock, fromMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    getQuizMetadataCache: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../test-series/api/adminTestSeriesApi', () => ({
  validateQuestionIds: vi.fn().mockResolvedValue({ valid: [], invalid: [] }),
}));

vi.mock('../components/QuestionPreviewDrawer', () => ({
  QuestionPreviewDrawer: () => null,
}));

const makeQuestions = (count: number): QuestionLightweight[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `00000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
    v1_id: `Q-${idx + 1}`,
    question: `<p>Sample question ${idx + 1} about Bihar history</p>`,
    subject: 'History',
    difficulty: 'Medium',
    examName: 'BPSC TRE3',
    examYear: 2024,
    questionType: 'MCQ',
    tags: [],
    explanation: { summary: 'Explanation' },
    options: ['A', 'B', 'C', 'D'],
    correct: 'A',
  }));

describe('QuestionBuilder performance, canonical BPSC filtering, and React stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFilterOptionsCache();
    useNotificationStore.setState({ toasts: [], activePopup: null });

    // Polyfill IntersectionObserver for react-intersection-observer in jsdom
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolveCanonicalExamNames("bpsc", ...) includes all 19 legacy aliases, BPSC TRE3, and dynamic BPSC DB strings', () => {
    const bpscExam = CANONICAL_EXAMS.find(e => e.id === 'bpsc');
    expect(bpscExam).toBeDefined();
    expect(bpscExam!.dbExamNames).toContain('BPSC TRE3');
    expect(bpscExam!.dbExamNames.length).toBeGreaterThanOrEqual(20);

    const resolved = resolveCanonicalExamNames('bpsc', [
      'BPSC 10-12 HISTORY',
      'bpsc tre3', // case-insensitive duplicate should be deduped
      'SSC CGL',   // unrelated exam should be excluded
    ]);

    for (const legacyAlias of bpscExam!.dbExamNames) {
      expect(resolved).toContain(legacyAlias);
    }
    expect(resolved).toContain('BPSC TRE3');
    expect(resolved).toContain('BPSC 10-12 HISTORY');
    expect(resolved).not.toContain('SSC CGL');
    expect(resolved.filter(n => n.toLowerCase() === 'bpsc tre3')).toHaveLength(1);
  });

  it('searchQuestions chains .is("deleted_at", null), .in("examName", resolvedNames), and sanitized .or() without syntax-breaking chars', async () => {
    const chain: Record<string, any> = {};
    const callLog: Array<{ method: string; args: any[] }> = [];

    const methods = ['select', 'is', 'or', 'eq', 'in', 'order', 'range'];
    methods.forEach(method => {
      chain[method] = vi.fn((...args: any[]) => {
        callLog.push({ method, args });
        if (method === 'range') {
          return Promise.resolve({ data: [], error: null, count: 0 });
        }
        return chain;
      });
    });

    fromMock.mockReturnValue(chain);

    await searchQuestions({
      examName: 'canonical:bpsc',
      search: 'Article 21(A), Bihar',
    });

    expect(fromMock).toHaveBeenCalledWith('questions');
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);

    expect(chain.in).toHaveBeenCalledTimes(1);
    const [inColumn, inValues] = chain.in.mock.calls[0];
    expect(inColumn).toBe('examName');
    expect(inValues).toContain('BPSC TRE3');
    expect(inValues).toContain('BPSC CSE PRE');

    expect(chain.or).toHaveBeenCalledTimes(1);
    const orExpr = chain.or.mock.calls[0][0] as string;
    const filterTokens = orExpr.split(',');
    expect(filterTokens).toHaveLength(4);
    for (const token of filterTokens) {
      expect(token).not.toMatch(/[(),]/);
    }
  });

  it('fetchFilterOptions() calls get_distinct_values 5 times, strips empty difficulties, sorts examYears descending, and caches repeat calls', async () => {
    rpcMock.mockImplementation(async (_fnName: string, args: { column_name: string }) => {
      switch (args.column_name) {
        case 'subject':
          return { data: [{ value: 'Polity' }, { value: 'History' }], error: null };
        case 'difficulty':
          return { data: [{ value: '' }, { value: '  ' }, { value: 'Hard' }, { value: 'Easy' }], error: null };
        case 'examName':
          return { data: [{ value: 'BPSC TRE3' }, { value: 'SSC CGL' }], error: null };
        case 'examYear':
          return { data: [{ value: '2021' }, { value: '2025' }, { value: '2023' }], error: null };
        case 'topic':
          return { data: [{ value: 'Constitution' }], error: null };
        default:
          return { data: [], error: null };
      }
    });

    const first = await fetchFilterOptions();

    expect(rpcMock).toHaveBeenCalledTimes(5);
    expect(fromMock).not.toHaveBeenCalled();
    expect(first.difficulties).toEqual(['Easy', 'Hard']);
    expect(first.examYears).toEqual([2025, 2023, 2021]);
    expect(first.subjects).toEqual(['History', 'Polity']);

    const second = await fetchFilterOptions();
    expect(second).toEqual(first);
    expect(rpcMock).toHaveBeenCalledTimes(5);
  });

  it('fetchQuestionsByUUIDs chunks 150 UUIDs into 2 queries (100 + 50)', async () => {
    const ids = Array.from(
      { length: 150 },
      (_, idx) => `11111111-1111-4111-8111-${String(idx + 1).padStart(12, '0')}`
    );

    const chunkLengths: number[] = [];
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        in: vi.fn((_col: string, chunk: string[]) => {
          chunkLengths.push(chunk.length);
          return Promise.resolve({
            data: chunk.map(id => ({ id, v1_id: id, question: 'Q', tags: [] })),
            error: null,
          });
        }),
      }),
    }));

    const result = await fetchQuestionsByUUIDs(ids);

    expect(chunkLengths).toEqual([100, 50]);
    expect(result).toHaveLength(150);
  });

  it('<QuestionBuilder> avoids refetches & render-phase warnings on echoed onChange, enforces type="button", and emits Popover toasts on Bulk Add', async () => {
    const sampleQuestions = makeQuestions(6);
    const initialId = sampleQuestions[0].id;
    let uuidFetchCount = 0;

    rpcMock.mockResolvedValue({ data: [{ value: 'History' }], error: null });

    fromMock.mockImplementation(() => {
      const chain: Record<string, any> = {};
      chain.select = vi.fn(() => chain);
      chain.is = vi.fn(() => chain);
      chain.or = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.in = vi.fn((_col: string, chunk: string[]) => {
        uuidFetchCount += 1;
        return Promise.resolve({
          data: sampleQuestions.filter(q => chunk.includes(q.id)),
          error: null,
        });
      });
      chain.order = vi.fn(() => chain);
      chain.range = vi.fn(() =>
        Promise.resolve({
          data: sampleQuestions,
          error: null,
          count: sampleQuestions.length,
        })
      );
      return chain;
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ParentWrapper = () => {
      const [ids, setIds] = useState<string[]>([initialId]);
      return <QuestionBuilder initialQuestionIds={ids} onChange={setIds} />;
    };

    const { container } = render(<ParentWrapper />);

    await waitFor(() => {
      expect(screen.getByText(/Results \(6\)/i)).toBeTruthy();
    });
    expect(uuidFetchCount).toBe(1); // Only initial hydration for initialId

    // Toggle 5 questions individually via direct Add buttons
    const addButtons = screen.getAllByRole('button', { name: 'Add question to test' });
    expect(addButtons.length).toBe(5); // 1 is already selected

    for (const btn of addButtons) {
      await act(async () => {
        fireEvent.click(btn);
      });
    }

    // Wait a tick and verify ZERO additional fetchQuestionsByUUIDs calls occurred
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Selected \(6\)/i })).toBeTruthy();
    });
    expect(uuidFetchCount).toBe(1);

    // Unselect all 5 back so we can test Bulk Add toast
    const removeButtons = screen.getAllByRole('button', { name: 'Remove question from test' });
    for (let i = 1; i < 6; i++) {
      await act(async () => {
        fireEvent.click(removeButtons[i]);
      });
    }

    // Bulk select visible & click Add Selected
    const selectVisibleBtn = screen.getByRole('button', { name: /Select Visible/i });
    await act(async () => {
      fireEvent.click(selectVisibleBtn);
    });

    const addSelectedBtn = screen.getByRole('button', { name: /Add Selected/i });
    await act(async () => {
      fireEvent.click(addSelectedBtn);
    });

    const toasts = useNotificationStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[toasts.length - 1].variant).toBe('success');
    expect(String(toasts[toasts.length - 1].message)).toContain('Added 5 questions');

    // Assert every <button> in the rendered DOM has explicit type="button"
    const allButtons = Array.from(container.querySelectorAll('button'));
    expect(allButtons.length).toBeGreaterThan(0);
    for (const btn of allButtons) {
      expect(btn.getAttribute('type')).toBe('button');
    }

    // Assert zero React render-phase or console errors
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
