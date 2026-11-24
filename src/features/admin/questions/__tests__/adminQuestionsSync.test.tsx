/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DB_TABLES } from '@/config/dbTables';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { queryClient } from '@/lib/queryClient';
import {
  saveQuestion,
  softDeleteQuestion,
  bulkSoftDeleteQuestions,
  fetchDistinctSubjects,
  QuestionRecord,
} from '../services/adminQuestionsService';
import { QuestionInspectorDrawer } from '../components/QuestionInspectorDrawer';
import { AdminQuestionsPage } from '../pages/AdminQuestionsPage';
import { QuestionPreviewDrawer } from '@/features/admin/question-builder/components/QuestionPreviewDrawer';
import { QuestionBuilder } from '@/features/admin/question-builder/components/QuestionBuilder';
import { AdminTestBuilderPage } from '@/features/admin/test-series/pages/AdminTestBuilderPage';

const {
  fromMock,
  rpcMock,
  deleteQuizMetadataCacheMock,
  deleteCacheEntriesByPrefixMock,
  invalidateQueriesSpy,
  invalidateMetadataMemoryMock,
  clearFilterOptionsMock,
  invalidateAnalyticsMock,
  invalidateMockQuestionsMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  deleteQuizMetadataCacheMock: vi.fn().mockResolvedValue(undefined),
  deleteCacheEntriesByPrefixMock: vi.fn().mockResolvedValue(undefined),
  invalidateQueriesSpy: vi.fn().mockResolvedValue(undefined),
  invalidateMetadataMemoryMock: vi.fn(),
  clearFilterOptionsMock: vi.fn(),
  invalidateAnalyticsMock: vi.fn(),
  invalidateMockQuestionsMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    deleteQuizMetadataCache: deleteQuizMetadataCacheMock,
    deleteCacheEntriesByPrefix: deleteCacheEntriesByPrefixMock,
    getQuizMetadataCache: vi.fn().mockResolvedValue([]),
    getCacheEntry: vi.fn().mockResolvedValue(null),
    setCacheEntry: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: invalidateQueriesSpy,
  },
}));

vi.mock('@/features/quiz/hooks/useQuestionMetadata', () => ({
  invalidateQuestionMetadataMemoryCache: invalidateMetadataMemoryMock,
}));

vi.mock('@/features/admin/question-builder/api/questionBuilderApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/admin/question-builder/api/questionBuilderApi')>();
  return {
    ...actual,
    clearFilterOptionsCache: clearFilterOptionsMock,
  };
});

vi.mock('@/features/admin/test-series/api/adminTestSeriesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/admin/test-series/api/adminTestSeriesApi')>();
  return {
    ...actual,
    invalidateMockTestAnalyticsCache: invalidateAnalyticsMock,
  };
});

vi.mock('@/features/mock-tests/api/mockTestsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/mock-tests/api/mockTestsApi')>();
  return {
    ...actual,
    invalidatePreparedMockQuestionCaches: invalidateMockQuestionsMock,
  };
});

vi.mock('@/features/admin/components/UniversalContentImporter', () => ({
  UniversalContentImporter: () => null,
}));

vi.mock('@/lib/telemetry', () => ({
  telemetry: {
    emit: vi.fn(),
  },
}));

const makeQuestion = (overrides: Partial<QuestionRecord> = {}): QuestionRecord => ({
  id: '11111111-1111-4111-8111-000000000001',
  created_at: '2026-11-24T00:00:00Z',
  v1_id: 'BPSC-MATH-01',
  subject: 'Mathematics',
  topic: 'Algebra',
  subTopic: 'Quadratics',
  examName: '70th BPSC Prelims',
  examYear: 2024,
  examDateShift: 'Shift 1',
  difficulty: 'Medium',
  questionType: 'MCQ',
  question: 'Solve for $x$: $x^2 - 5x + 6 = 0$',
  question_hi: 'समीकरण $x^2 - 5x + 6 = 0$ को हल करें:',
  options: ['2 and 3', '1 and 6', '3 and 4', 'None of the above'],
  options_hi: ['2 और 3', '1 और 6', '3 और 4', 'उपर्युक्त में से कोई नहीं'],
  correct: '2 and 3',
  tags: ['Algebra', 'BPSC'],
  explanation: {
    fact: 'Factorization yields $(x-2)(x-3)=0$.',
    summary: 'Roots are $2$ and $3$.',
    analysis_correct: 'Both $2$ and $3$ satisfy the quadratic.',
    analysis_incorrect: 'Other pairs do not sum to $5$ and multiply to $6$.',
    conclusion: 'Option A is correct.',
  },
  deleted_at: null,
  ...overrides,
});

describe('v1.0.378 Admin Question Bank & Preview Sync Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useNotificationStore.setState({ toasts: [], activePopup: null });

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

  it('saveQuestion, softDeleteQuestion, and bulkSoftDeleteQuestions query DB_TABLES.BANK.QUESTIONS and purge all 3 cache tiers without clearing active student attempts', async () => {
    window.localStorage.setItem('mindflow_subject_counts', '{"History":10}');
    window.localStorage.setItem('mindflow_exam_counts_cache_v1', '{"bpsc":50}');
    window.localStorage.setItem('mindflow_mock_active_attempt_v1_user1_test1', '{"answers":{"q1":"A"}}');

    const queriedTables: string[] = [];
    const savedRow = makeQuestion({ question: 'Updated KaTeX $E=mc^2$' });

    fromMock.mockImplementation((table: string) => {
      queriedTables.push(table);
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: savedRow, error: null })),
            })),
            then: (resolve: any) => resolve({ error: null }),
          })),
          in: vi.fn(async () => ({ error: null })),
        })),
      };
    });

    const result = await saveQuestion({
      id: savedRow.id,
      question: savedRow.question,
      explanation: savedRow.explanation,
    });

    expect(result.question).toBe('Updated KaTeX $E=mc^2$');
    expect(queriedTables).toEqual([DB_TABLES.BANK.QUESTIONS]);
    expect(invalidateMetadataMemoryMock).toHaveBeenCalledTimes(1);
    expect(clearFilterOptionsMock).toHaveBeenCalledTimes(1);
    expect(invalidateAnalyticsMock).toHaveBeenCalledTimes(1);
    expect(invalidateMockQuestionsMock).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dashboard-subject-counts'],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['subject-taxonomy'],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['question-image', 'question', savedRow.id],
    });
    expect(window.localStorage.getItem('mindflow_subject_counts')).toBeNull();
    expect(window.localStorage.getItem('mindflow_exam_counts_cache_v1')).toBeNull();
    expect(window.localStorage.getItem('mindflow_mock_active_attempt_v1_user1_test1')).toBe(
      '{"answers":{"q1":"A"}}'
    );
    expect(deleteCacheEntriesByPrefixMock).toHaveBeenCalledWith([
      'admin_mock_test_analytics_v1:',
      'quiz_metadata_sync',
    ]);

    vi.clearAllMocks();
    await softDeleteQuestion(savedRow.id);
    expect(deleteQuizMetadataCacheMock).toHaveBeenCalledWith([savedRow.id]);
    expect(invalidateMockQuestionsMock).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    await bulkSoftDeleteQuestions([savedRow.id, '22222222-2222-4222-8222-000000000002']);
    expect(deleteQuizMetadataCacheMock).toHaveBeenCalledWith([
      savedRow.id,
      '22222222-2222-4222-8222-000000000002',
    ]);

    rpcMock.mockResolvedValue({ data: [{ value: 'History' }, { value: 'Polity' }], error: null });
    const subjects = await fetchDistinctSubjects();
    expect(rpcMock).toHaveBeenCalledWith('get_distinct_values', { column_name: 'subject' });
    expect(subjects).toEqual(['History', 'Polity']);
  });

  it('<QuestionPreviewDrawer> renders bilingual KaTeX, normalizes string[] + options_hi, and surfaces a Soft-Deleted warning banner', async () => {
    const archivedQ = makeQuestion({
      deleted_at: '2026-11-24T10:00:00Z',
    });

    fromMock.mockImplementation((table: string) => {
      expect(table).toBe(DB_TABLES.BANK.QUESTIONS);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: archivedQ, error: null })),
          })),
        })),
      };
    });

    const { container } = render(
      <QuestionPreviewDrawer
        isOpen={true}
        onClose={vi.fn()}
        questionId={archivedQ.id}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Soft-Deleted Question')).toBeTruthy();
    });

    // KaTeX elements rendered (not raw unparsed text-only stub)
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(screen.getByText('BPSC-MATH-01')).toBeTruthy();
    expect(screen.getByText('2 and 3')).toBeTruthy();
    expect(screen.getByText('2 और 3')).toBeTruthy();
    expect(screen.getByText('Option A is correct.')).toBeTruthy();

    // Language toggle switches cleanly to English only -> Hindi translation hides
    const hindiBtn = screen.getByRole('button', { name: 'Hindi' });
    const englishBtn = screen.getByRole('button', { name: 'English' });
    expect(hindiBtn.getAttribute('type')).toBe('button');
    expect(englishBtn.getAttribute('type')).toBe('button');
    expect(hindiBtn.className).toContain('min-h-[44px]');

    fireEvent.click(englishBtn);
    expect(screen.queryByText('2 और 3')).toBeNull();
    expect(screen.getByText('2 and 3')).toBeTruthy();

    fireEvent.click(hindiBtn);
    expect(screen.getByText('2 और 3')).toBeTruthy();

    // Every interactive button inside drawer uses type="button"
    expect(container.querySelectorAll('button:not([type="button"])').length).toBe(0);
  });

  it('<QuestionInspectorDrawer> updates immediately on Save and uses <ConfirmDialog> instead of window.confirm on Soft Delete', async () => {
    const initialQ = makeQuestion();
    const updatedQ = makeQuestion({
      question: 'Updated quadratic prompt $x^2 = 9$',
      correct: '3 and 4',
    });

    fromMock.mockImplementation(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: updatedQ, error: null })),
          })),
          then: (resolve: any) => resolve({ error: null }),
        })),
      })),
    }));

    const confirmSpy = vi.spyOn(window, 'confirm');
    const onClose = vi.fn();

    const Harness: React.FC = () => {
      const [q, setQ] = React.useState<QuestionRecord | null>(initialQ);
      return (
        <QuestionInspectorDrawer
          question={q}
          isOpen={true}
          onClose={onClose}
          onQuestionUpdated={(saved) => {
            if (saved) setQ(saved);
          }}
        />
      );
    };

    const { container } = render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    const stemInput = screen.getByLabelText(/English Question Text/i) as HTMLTextAreaElement;
    fireEvent.change(stemInput, { target: { value: 'Updated quadratic prompt $x^2 = 9$' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByText(/Updated quadratic prompt/i)).toBeTruthy();
    });
    expect(useNotificationStore.getState().toasts.some((t) => t.title === 'Question Saved')).toBe(true);

    // Click Soft Delete -> opens ConfirmDialog (no native window.confirm)
    fireEvent.click(screen.getByRole('button', { name: 'Soft delete question' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText('Soft Delete Question?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Soft Delete' }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(container.querySelectorAll('button:not([type="button"])').length).toBe(0);
  });

  it('<AdminQuestionsPage> renders responsive mobile & desktop views and uses <ConfirmDialog> for bulk delete', async () => {
    const q1 = makeQuestion();
    rpcMock.mockResolvedValue({ data: [{ value: 'Mathematics' }], error: null });

    fromMock.mockImplementation((table: string) => {
      if (table === DB_TABLES.BANK.QUESTIONS) {
        return {
          select: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(async () => ({
                  data: [q1],
                  count: 1,
                  error: null,
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            in: vi.fn(async () => ({ error: null })),
          })),
        };
      }
      return {};
    });

    const confirmSpy = vi.spyOn(window, 'confirm');

    const { container } = render(
      <MemoryRouter>
        <AdminQuestionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Solve for \$x\$: \$x\^2 - 5x \+ 6 = 0\$/i).length).toBeGreaterThan(0);
    });

    const selectButtons = screen.getAllByRole('button', { name: 'Select question' });
    fireEvent.click(selectButtons[0]);

    const bulkDeleteBtn = screen.getByRole('button', { name: /Delete Selected/i });
    expect(bulkDeleteBtn.getAttribute('type')).toBe('button');
    fireEvent.click(bulkDeleteBtn);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText('Soft Delete Selected Questions?')).toBeTruthy();
    expect(container.querySelectorAll('button:not([type="button"])').length).toBe(0);
  });

  it('<AdminTestBuilderPage> detects soft-deleted question_ids, blocks publishing, guards against network failure, and prunes cleanly in 1 tap', async () => {
    const activeQId = '11111111-1111-4111-8111-000000000001';
    const deletedQId = '22222222-2222-4222-8222-000000000002';
    let networkShouldFail = true;
    let savedPayload: any = null;

    rpcMock.mockResolvedValue({ data: [{ value: 'History' }], error: null });

    fromMock.mockImplementation((table: string) => {
      if (table === DB_TABLES.MOCK.SERIES) {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({
              data: [
                {
                  id: 'ser-1',
                  name: '70th BPSC Series',
                  mock_categories: { id: 'cat-1', name: 'BPSC' },
                },
              ],
              error: null,
            })),
          })),
        };
      }
      if (table === DB_TABLES.MOCK.TESTS) {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: 'test-1',
                  series_id: 'ser-1',
                  name: 'BPSC Test 1',
                  description: 'Full mock',
                  duration_minutes: 120,
                  total_marks: 150,
                  passing_marks: 95,
                  negative_marks: 0.33,
                  display_order: 1,
                  question_ids: [activeQId, deletedQId],
                  is_published: true,
                },
                error: null,
              })),
            })),
          })),
          update: vi.fn((payload: any) => {
            savedPayload = payload;
            return {
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'test-1', ...payload },
                    error: null,
                  })),
                })),
              })),
            };
          }),
        };
      }
      if (table === DB_TABLES.BANK.QUESTIONS) {
        const chain: any = {
          select: vi.fn(() => chain),
          is: vi.fn(() => chain),
          or: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          range: vi.fn(async () => ({
            data: [makeQuestion({ id: activeQId })],
            count: 1,
            error: null,
          })),
          in: vi.fn(async (_col: string, _chunk: string[]) => {
            if (networkShouldFail) {
              return { data: null, error: { message: 'Temporary connection drop' } };
            }
            return {
              data: [{ id: activeQId, v1_id: 'Q-1', question: 'Active Q', tags: [] }],
              error: null,
            };
          }),
        };
        return chain;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    render(
      <MemoryRouter initialEntries={['/admin/test-series/tests/test-1/edit?step=4']}>
        <Routes>
          <Route path="/admin/test-series/tests/:testId/edit" element={<AdminTestBuilderPage />} />
          <Route path="/admin/test-series" element={<div>Mock Tests List</div>} />
        </Routes>
      </MemoryRouter>
    );

    // 1. Network drop -> shows Retry Check instead of erroneously pruning active questions
    await waitFor(() => {
      expect(screen.getByText('Could not verify question bank status')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Prune Missing Questions' })).toBeNull();

    // 2. Recover network & retry -> detects 1 soft-deleted question and blocks publish
    networkShouldFail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry Check' }));

    await waitFor(() => {
      expect(screen.getByText('1 missing or soft-deleted question detected')).toBeTruthy();
    });

    // Attempting Publish while unpruned is blocked
    fireEvent.click(screen.getByRole('button', { name: 'Publish Test' }));
    expect(savedPayload).toBeNull();
    expect(useNotificationStore.getState().toasts.some((t) => t.title === 'Publish Blocked')).toBe(
      true
    );

    // 3. 1-Tap Prune Missing Questions -> removes deletedQId cleanly and allows Publish
    const pruneBtn = screen.getByRole('button', { name: 'Prune Missing Questions' });
    expect(pruneBtn.getAttribute('type')).toBe('button');
    expect(pruneBtn.className).toContain('min-h-[44px]');
    fireEvent.click(pruneBtn);

    await waitFor(() => {
      expect(screen.queryByText('1 missing or soft-deleted question detected')).toBeNull();
    });
    expect(
      useNotificationStore.getState().toasts.some((t) => t.title === 'Missing Questions Pruned')
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Publish Test' }));
    await waitFor(() => {
      expect(savedPayload).not.toBeNull();
      expect(savedPayload.question_ids).toEqual([activeQId]);
      expect(savedPayload.is_published).toBe(true);
    });
  });

  it('<QuestionBuilder> opens <QuestionPreviewDrawer> from SelectedQuestionsPanel and live-updates selected items after editing in <QuestionInspectorDrawer>', async () => {
    const qId = '11111111-1111-4111-8111-000000000001';
    let currentRecord = makeQuestion({
      id: qId,
      question: 'Original selected stem',
    });

    rpcMock.mockResolvedValue({ data: [{ value: 'Mathematics' }], error: null });

    fromMock.mockImplementation((table: string) => {
      expect(table).toBe(DB_TABLES.BANK.QUESTIONS);
      const chain: any = {
        select: vi.fn(() => chain),
        is: vi.fn(() => chain),
        or: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        range: vi.fn(async () => ({
          data: [currentRecord],
          count: 1,
          error: null,
        })),
        in: vi.fn(async () => ({
          data: [currentRecord],
          error: null,
        })),
        maybeSingle: vi.fn(async () => ({
          data: currentRecord,
          error: null,
        })),
        update: vi.fn((fields: any) => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                currentRecord = { ...currentRecord, ...fields };
                return { data: currentRecord, error: null };
              }),
            })),
          })),
        })),
      };
      return chain;
    });

    const Wrapper: React.FC = () => {
      const [ids, setIds] = React.useState<string[]>([qId]);
      return <QuestionBuilder initialQuestionIds={ids} onChange={setIds} />;
    };

    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getAllByText('Original selected stem').length).toBeGreaterThanOrEqual(2);
    });

    const selectedPreviewBtn = screen.getByRole('button', { name: 'Preview selected question' });
    expect(selectedPreviewBtn.getAttribute('type')).toBe('button');
    expect(selectedPreviewBtn.className).toContain('min-h-[44px]');
    fireEvent.click(selectedPreviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Question Preview')).toBeTruthy();
    });

    // Click Edit inside QuestionPreviewDrawer -> opens stacked QuestionInspectorDrawer
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    const stemInput = screen.getByLabelText(/English Question Text/i) as HTMLTextAreaElement;
    fireEvent.change(stemInput, { target: { value: 'Live-synced edited stem' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Live-synced edited stem').length).toBeGreaterThanOrEqual(2);
    });
  });
});
