/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import {
    buildClonedTestName,
    validateTestForPublish,
    cloneTest,
    createTest,
    updateTest,
    validateQuestionIds,
} from '../api/adminTestSeriesApi';
import {
    isTestWithinScheduleWindow,
    sanitizeLeaderboardEntry,
    fetchTestLeaderboard,
    fetchPublishedTests,
    fetchTestDetails,
    searchTestsApi,
} from '@/features/mock-tests/api/mockTestsApi';
import { AdminTestSeriesDashboard } from '../pages/AdminTestSeriesDashboard';
import { SeriesDrawer } from '../components/SeriesDrawer';
import { TestCard } from '../components/TestCard';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { DB_TABLES, DB_RPCS } from '@/config/dbTables';

const { fromMock, rpcMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
    },
}));

const LocationProbe: React.FC<{ onChange: (search: string) => void }> = ({ onChange }) => {
    const location = useLocation();
    React.useEffect(() => {
        onChange(location.search);
    }, [location.search, onChange]);
    return null;
};

interface MockStoreState {
    categories: any[];
    series: any[];
    tests: any[];
    activeQuestionIds?: Set<string>;
    categoriesPending?: boolean;
    seriesPending?: boolean;
    testsPending?: boolean;
    onUpdateTest?: (id: string, payload: any) => Promise<any>;
    onInsertTest?: (payload: any) => Promise<any>;
    onDeleteCategory?: (id: string) => Promise<void>;
    onDeleteSeries?: (id: string) => Promise<void>;
    onDeleteTest?: (id: string) => Promise<void>;
}

const createSupabaseMock = (state: MockStoreState) => {
    const calls = {
        selectTestsQueries: [] as string[],
        insertTestPayloads: [] as any[],
        updateTestCalls: [] as Array<{ id: string; payload: any }>,
        deleteCategoryIds: [] as string[],
        deleteSeriesIds: [] as string[],
        deleteTestIds: [] as string[],
        questionInChunks: [] as string[][],
        questionDeletedAtNullChecked: false,
        fetchCategoriesCount: 0,
        fetchSeriesCount: 0,
        fetchTestsCount: 0,
    };

    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.CATEGORIES) {
            return {
                select: vi.fn(() => {
                    calls.fetchCategoriesCount += 1;
                    const chain: any = {
                        order: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (state.categoriesPending) {
                                return new Promise(() => {}).then(resolve, reject);
                            }
                            return Promise.resolve({ data: state.categories, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
                delete: vi.fn(() => ({
                    eq: vi.fn(async (_col: string, id: string) => {
                        calls.deleteCategoryIds.push(id);
                        if (state.onDeleteCategory) {
                            await state.onDeleteCategory(id);
                        } else {
                            state.categories = state.categories.filter(c => c.id !== id);
                            const removedSeriesIds = new Set(
                                state.series.filter(s => s.category_id === id).map(s => s.id)
                            );
                            state.series = state.series.filter(s => s.category_id !== id);
                            state.tests = state.tests.filter(t => !removedSeriesIds.has(t.series_id));
                        }
                        return { error: null };
                    }),
                })),
            };
        }

        if (table === DB_TABLES.MOCK.SERIES) {
            return {
                select: vi.fn(() => {
                    calls.fetchSeriesCount += 1;
                    const chain: any = {
                        order: vi.fn(() => chain),
                        eq: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (state.seriesPending) {
                                return new Promise(() => {}).then(resolve, reject);
                            }
                            return Promise.resolve({ data: state.series, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
                delete: vi.fn(() => ({
                    eq: vi.fn(async (_col: string, id: string) => {
                        calls.deleteSeriesIds.push(id);
                        if (state.onDeleteSeries) {
                            await state.onDeleteSeries(id);
                        } else {
                            state.series = state.series.filter(s => s.id !== id);
                            state.tests = state.tests.filter(t => t.series_id !== id);
                        }
                        return { error: null };
                    }),
                })),
            };
        }

        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn((query: string) => {
                    calls.selectTestsQueries.push(query);
                    calls.fetchTestsCount += 1;
                    const chain: any = {
                        order: vi.fn(() => chain),
                        eq: vi.fn(() => chain),
                        ilike: vi.fn(() => chain),
                        limit: vi.fn(() => chain),
                        single: vi.fn(async () => ({
                            data: state.tests[0] ?? null,
                            error: state.tests[0] ? null : { message: 'Not found' },
                        })),
                        maybeSingle: vi.fn(async () => ({
                            data: state.tests[0] ?? null,
                            error: null,
                        })),
                        then: (resolve: any, reject: any) => {
                            if (state.testsPending) {
                                return new Promise(() => {}).then(resolve, reject);
                            }
                            return Promise.resolve({ data: state.tests, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
                insert: vi.fn((rows: any[]) => ({
                    select: vi.fn((query: string) => {
                        calls.selectTestsQueries.push(query);
                        return {
                            single: vi.fn(async () => {
                                const payload = rows[0];
                                calls.insertTestPayloads.push(payload);
                                if (state.onInsertTest) {
                                    const res = await state.onInsertTest(payload);
                                    return { data: res, error: null };
                                }
                                const parentSeries = state.series.find(s => s.id === payload.series_id) ?? null;
                                const created = {
                                    ...payload,
                                    id: `test-cloned-${calls.insertTestPayloads.length}`,
                                    created_at: '2026-11-22T00:00:00Z',
                                    mock_series: parentSeries,
                                };
                                state.tests = [...state.tests, created];
                                return { data: created, error: null };
                            }),
                        };
                    }),
                })),
                update: vi.fn((payload: any) => ({
                    eq: vi.fn((_col: string, id: string) => ({
                        select: vi.fn((query: string) => {
                            calls.selectTestsQueries.push(query);
                            return {
                                single: vi.fn(async () => {
                                    calls.updateTestCalls.push({ id, payload });
                                    if (state.onUpdateTest) {
                                        const res = await state.onUpdateTest(id, payload);
                                        return { data: res, error: null };
                                    }
                                    const existing = state.tests.find(t => t.id === id);
                                    const updated = { ...existing, ...payload };
                                    state.tests = state.tests.map(t => (t.id === id ? updated : t));
                                    return { data: updated, error: null };
                                }),
                            };
                        }),
                    })),
                })),
                delete: vi.fn(() => ({
                    eq: vi.fn(async (_col: string, id: string) => {
                        calls.deleteTestIds.push(id);
                        if (state.onDeleteTest) {
                            await state.onDeleteTest(id);
                        } else {
                            state.tests = state.tests.filter(t => t.id !== id);
                        }
                        return { error: null };
                    }),
                })),
            };
        }

        if (table === DB_TABLES.BANK.QUESTIONS) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        is: vi.fn((col: string, val: any) => {
                            if (col === 'deleted_at' && val === null) {
                                calls.questionDeletedAtNullChecked = true;
                            }
                            return chain;
                        }),
                        in: vi.fn(async (_col: string, ids: string[]) => {
                            calls.questionInChunks.push(ids);
                            const activeSet = state.activeQuestionIds ?? new Set<string>();
                            const matched = ids.filter((id) => activeSet.has(id)).map((id) => ({ id }));
                            return { data: matched, error: null };
                        }),
                    };
                    return chain;
                }),
            };
        }

        throw new Error(`Unexpected table: ${table}`);
    });

    return calls;
};

const makeFixtureState = (): MockStoreState => {
    const catBpsc = { id: 'cat-1', name: 'BPSC', display_order: 1, is_active: true };
    const catSsc = { id: 'cat-2', name: 'SSC', display_order: 2, is_active: true };

    const serBpscPub = {
        id: 'ser-1',
        category_id: 'cat-1',
        name: 'BPSC Prelims 2026',
        is_published: true,
        mock_categories: { id: 'cat-1', name: 'BPSC' },
    };
    const serBpscDraft = {
        id: 'ser-2',
        category_id: 'cat-1',
        name: 'BPSC Draft Series',
        is_published: false,
        mock_categories: { id: 'cat-1', name: 'BPSC' },
    };
    const serSscPub = {
        id: 'ser-3',
        category_id: 'cat-2',
        name: 'SSC CGL Tier 1',
        is_published: true,
        mock_categories: { id: 'cat-2', name: 'SSC' },
    };

    const tests = [
        {
            id: 'test-1',
            series_id: 'ser-1',
            name: 'BPSC Full Mock 1',
            description: 'Full length mock',
            duration_minutes: 120,
            total_marks: 150,
            passing_marks: 95,
            negative_marks: 0.33,
            question_ids: ['q1', 'q2'],
            is_published: true,
            display_order: 1,
            created_at: '2026-11-20T10:00:00Z',
            mock_series: serBpscPub,
        },
        {
            id: 'test-2',
            series_id: 'ser-2',
            name: 'BPSC Draft Ready',
            description: 'Ready to publish inside draft series',
            duration_minutes: 60,
            total_marks: 100,
            passing_marks: 40,
            negative_marks: 0.25,
            question_ids: ['q3'],
            is_published: false,
            display_order: 2,
            created_at: '2026-11-20T09:00:00Z',
            mock_series: serBpscDraft,
        },
        {
            id: 'test-3',
            series_id: 'ser-3',
            name: 'SSC Incomplete Draft',
            description: 'Missing questions',
            duration_minutes: 60,
            total_marks: 100,
            passing_marks: 33,
            negative_marks: 0.25,
            question_ids: [],
            is_published: false,
            display_order: 3,
            created_at: '2026-11-20T08:00:00Z',
            mock_series: serSscPub,
        },
    ];

    return {
        categories: [catBpsc, catSsc],
        series: [serBpscPub, serBpscDraft, serSscPub],
        tests,
    };
};

describe('Admin Mock Tests CMS Controls (v1.0.369)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useNotificationStore.setState({ toasts: [], activePopup: null });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('buildClonedTestName', () => {
        it('handles trimming, empty fallback, and incremental copy numbering without existingNames', () => {
            expect(buildClonedTestName('  ')).toBe('Untitled Test (Copy)');
            expect(buildClonedTestName('  BPSC Mock 1  ')).toBe('BPSC Mock 1 (Copy)');
            expect(buildClonedTestName('BPSC Mock 1 (Copy)')).toBe('BPSC Mock 1 (Copy 2)');
            expect(buildClonedTestName('BPSC Mock 1 (Copy 2)')).toBe('BPSC Mock 1 (Copy 3)');
            expect(buildClonedTestName('BPSC Mock 1 (copy 9)')).toBe('BPSC Mock 1 (Copy 10)');
        });

        it('deduplicates case-insensitively against existingNames', () => {
            expect(
                buildClonedTestName('BPSC Mock 1', ['  bpsc mock 1 (copy)  ', 'BPSC Mock 1 (Copy 2)'])
            ).toBe('BPSC Mock 1 (Copy 3)');

            expect(
                buildClonedTestName('BPSC Mock 1 (Copy 2)', ['BPSC Mock 1'])
            ).toBe('BPSC Mock 1 (Copy)');
        });
    });

    describe('validateTestForPublish', () => {
        const validTest = {
            name: 'Valid Mock',
            series_id: 'ser-1',
            question_ids: ['q1', 'q2'],
            duration_minutes: 60,
            total_marks: 100,
            passing_marks: 33,
            negative_marks: 0.25,
            release_date: '2026-11-01T10:00:00Z',
            expiry_date: '2026-11-10T10:00:00Z',
        };

        it('passes a fully valid test', () => {
            expect(validateTestForPublish(validTest)).toEqual({ canPublish: true, reasons: [] });
        });

        it('flags every invalid field and date constraint', () => {
            const invalid = {
                name: '   ',
                series_id: '',
                question_ids: ['q1', 'q1'],
                duration_minutes: 45.5,
                total_marks: 0,
                passing_marks: 10,
                negative_marks: -0.5,
                release_date: '2026-11-10T10:00:00Z',
                expiry_date: '2026-11-01T10:00:00Z',
            };
            const res = validateTestForPublish(invalid);
            expect(res.canPublish).toBe(false);
            expect(res.reasons).toEqual([
                'Test name is required before publishing.',
                'Assign a Test Series before publishing.',
                'Remove duplicate questions before publishing.',
                'Duration must be a whole number greater than 0 minutes.',
                'Total marks must be greater than 0.',
                'Passing marks must be between 0 and Total Marks.',
                'Negative marks must be 0 or greater.',
                'Expiry date must be after Release date.',
            ]);

            const emptyQuestions = validateTestForPublish({ ...validTest, question_ids: [] });
            expect(emptyQuestions.canPublish).toBe(false);
            expect(emptyQuestions.reasons).toContain('Add at least one question before publishing.');
        });
    });

    describe('cloneTest', () => {
        it('creates an unpublished Draft clone with cleared schedule dates and incremented display_order', async () => {
            const state = makeFixtureState();
            const calls = createSupabaseMock(state);

            const source = {
                ...state.tests[0],
                release_date: '2026-11-01T00:00:00Z',
                expiry_date: '2026-12-01T00:00:00Z',
            };

            const cloned = await cloneTest(source, ['BPSC Full Mock 1', 'BPSC Full Mock 1 (Copy)']);

            expect(calls.insertTestPayloads).toHaveLength(1);
            const payload = calls.insertTestPayloads[0];
            expect(payload).toEqual({
                series_id: 'ser-1',
                name: 'BPSC Full Mock 1 (Copy 2)',
                description: 'Full length mock',
                test_type: 'MOCK',
                duration_minutes: 120,
                total_marks: 150,
                passing_marks: 95,
                negative_marks: 0.33,
                question_ids: ['q1', 'q2'],
                is_published: false,
                display_order: 2,
                release_date: null,
                expiry_date: null,
            });
            expect(payload.question_ids).not.toBe(source.question_ids);
            expect(cloned.is_published).toBe(false);
            expect(calls.selectTestsQueries[0]).toBe(
                '*, mock_series(id, name, category_id, is_published, mock_categories(id, name))'
            );

            await cloneTest({ ...source, test_type: 'PYQ' }, ['BPSC Full Mock 1']);
            expect(calls.insertTestPayloads[1].test_type).toBe('PYQ');
        });
    });

    describe('AdminTestSeriesDashboard CMS workflows', () => {
        it('supports URL-synced filters, cross-tab category preservation, reconciliation, Reset Filters, and explicit button types', async () => {
            const state = makeFixtureState();
            createSupabaseMock(state);
            let latestSearch = '';

            const { container } = render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=tests&category=cat-1&series=ser-3']}>
                    <LocationProbe onChange={(s) => { latestSearch = s; }} />
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            // Post-hydration reconciliation prunes mismatched series=ser-3 (belongs to cat-2, not cat-1)
            await waitFor(() => {
                expect(new URLSearchParams(latestSearch).get('series')).toBeNull();
                expect(screen.getByText('BPSC Full Mock 1')).toBeTruthy();
                expect(screen.getByText('BPSC Draft Ready')).toBeTruthy();
                expect(screen.queryByText('SSC Incomplete Draft')).toBeNull();
            }, { timeout: 5000 });
            expect(new URLSearchParams(latestSearch).get('series')).toBeNull();
            expect(new URLSearchParams(latestSearch).get('category')).toBe('cat-1');

            // Zero button:not([type="button"])
            expect(container.querySelectorAll('button:not([type="button"])').length).toBe(0);

            // Scoped series dropdown only lists cat-1 series
            const seriesSelect = screen.getByLabelText('Test Series') as HTMLSelectElement;
            const optionLabels = Array.from(seriesSelect.options).map(o => o.text);
            expect(optionLabels).toEqual(['All Series', 'BPSC Prelims 2026', 'BPSC Draft Series']);

            // Filter by status=Published
            fireEvent.click(screen.getByRole('button', { name: 'Published' }));
            await waitFor(() => {
                expect(screen.getByText('BPSC Full Mock 1')).toBeTruthy();
                expect(screen.queryByText('BPSC Draft Ready')).toBeNull();
            });
            expect(new URLSearchParams(latestSearch).get('status')).toBe('published');

            // Switch to Series tab: preserves category=cat-1, drops series & status
            fireEvent.click(screen.getByRole('button', { name: 'Series' }));
            await waitFor(() => {
                expect(screen.getByText('BPSC Prelims 2026')).toBeTruthy();
                expect(screen.queryByText('SSC CGL Tier 1')).toBeNull();
            });
            const seriesTabParams = new URLSearchParams(latestSearch);
            expect(seriesTabParams.get('tab')).toBe('series');
            expect(seriesTabParams.get('category')).toBe('cat-1');
            expect(seriesTabParams.get('status')).toBeNull();

            // Switch back to Tests tab and apply impossible combination via Draft + ser-1 -> filter-aware EmptyState
            fireEvent.click(screen.getByRole('button', { name: 'Tests' }));
            await waitFor(() => expect(screen.getByLabelText('Test Series')).toBeTruthy());
            fireEvent.change(screen.getByLabelText('Test Series'), { target: { value: 'ser-1' } });
            fireEvent.click(screen.getByRole('button', { name: 'Draft' }));

            await waitFor(() => {
                expect(screen.getByText('No Matching Mock Tests')).toBeTruthy();
            });

            // Reset Filters from EmptyState restores all 3 tests
            const resetButtons = screen.getAllByRole('button', { name: 'Reset Filters' });
            fireEvent.click(resetButtons[resetButtons.length - 1]);

            await waitFor(() => {
                expect(screen.getByText('BPSC Full Mock 1')).toBeTruthy();
                expect(screen.getByText('BPSC Draft Ready')).toBeTruthy();
                expect(screen.getByText('SSC Incomplete Draft')).toBeTruthy();
            });
            const resetParams = new URLSearchParams(latestSearch);
            expect(resetParams.get('category')).toBeNull();
            expect(resetParams.get('series')).toBeNull();
            expect(resetParams.get('status')).toBeNull();
        });

        it('enforces 1-tap Publish readiness guard, Draft-series warning, and Unpublish flow', async () => {
            const state = makeFixtureState();
            const calls = createSupabaseMock(state);

            render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=tests']}>
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('SSC Incomplete Draft')).toBeTruthy();
            });

            // 1. Invalid test (0 questions) -> blocked with warning toast, no API update
            fireEvent.click(screen.getByRole('button', { name: 'Publish SSC Incomplete Draft' }));
            expect(calls.updateTestCalls).toHaveLength(0);
            const warnToasts = useNotificationStore.getState().toasts;
            expect(warnToasts[warnToasts.length - 1].variant).toBe('warning');
            expect(warnToasts[warnToasts.length - 1].title).toBe('Test Not Ready to Publish');

            // 2. Valid test in Draft series -> publishes with warning toast about parent Draft series
            fireEvent.click(screen.getByRole('button', { name: 'Publish BPSC Draft Ready' }));
            await waitFor(() => {
                expect(calls.updateTestCalls).toHaveLength(1);
            });
            expect(calls.updateTestCalls[0]).toEqual({
                id: 'test-2',
                payload: { is_published: true },
            });
            await waitFor(() => {
                const toasts = useNotificationStore.getState().toasts;
                const last = toasts[toasts.length - 1];
                expect(last.variant).toBe('warning');
                expect(last.title).toContain('Draft');
            });

            // 3. Unpublish a published test -> moves to draft with success toast
            fireEvent.click(screen.getByRole('button', { name: 'Unpublish BPSC Full Mock 1' }));
            await waitFor(() => {
                expect(calls.updateTestCalls).toHaveLength(2);
            });
            expect(calls.updateTestCalls[1]).toEqual({
                id: 'test-1',
                payload: { is_published: false },
            });
            await waitFor(() => {
                const toasts = useNotificationStore.getState().toasts;
                const last = toasts[toasts.length - 1];
                expect(last.variant).toBe('success');
                expect(last.title).toBe('Test Moved to Draft');
            });
        });

        it('handles 1-tap Clone: switches status=published to All and locks against double-click', async () => {
            const state = makeFixtureState();
            let resolveInsert!: (val: any) => void;
            state.onInsertTest = () =>
                new Promise((resolve) => {
                    resolveInsert = resolve;
                });
            const calls = createSupabaseMock(state);
            let latestSearch = '';

            render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=tests&status=published']}>
                    <LocationProbe onChange={(s) => { latestSearch = s; }} />
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BPSC Full Mock 1')).toBeTruthy();
            });

            const cloneBtn = screen.getByRole('button', { name: 'Clone BPSC Full Mock 1' });
            fireEvent.click(cloneBtn);
            fireEvent.click(cloneBtn);

            // Synchronous ref lock prevents second insert while first is in-flight
            expect(calls.insertTestPayloads).toHaveLength(1);
            expect((cloneBtn as HTMLButtonElement).disabled).toBe(true);
            expect((screen.getByRole('button', { name: 'Unpublish BPSC Full Mock 1' }) as HTMLButtonElement).disabled).toBe(true);
            expect((screen.getByRole('button', { name: 'Delete BPSC Full Mock 1' }) as HTMLButtonElement).disabled).toBe(true);

            await act(async () => {
                resolveInsert({
                    ...state.tests[0],
                    id: 'test-cloned-1',
                    name: 'BPSC Full Mock 1 (Copy)',
                    is_published: false,
                    display_order: 2,
                    release_date: null,
                    expiry_date: null,
                });
            });

            await waitFor(() => {
                expect(screen.getByText('BPSC Full Mock 1 (Copy)')).toBeTruthy();
            });
            expect(new URLSearchParams(latestSearch).get('status')).toBeNull();
            const toasts = useNotificationStore.getState().toasts;
            expect(toasts[toasts.length - 1].variant).toBe('success');
            expect(String(toasts[toasts.length - 1].message)).toContain('All');
        });

        it('shows exact cascade counts in ConfirmDialog, guards loading state, and refreshes downstream hooks on delete', async () => {
            const state = makeFixtureState();
            const calls = createSupabaseMock(state);
            let latestSearch = '';

            render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=categories']}>
                    <LocationProbe onChange={(s) => { latestSearch = s; }} />
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BPSC')).toBeTruthy();
            });

            const initialSeriesFetches = calls.fetchSeriesCount;
            const initialTestsFetches = calls.fetchTestsCount;

            // Delete BPSC category (has 2 series and 2 tests)
            fireEvent.click(screen.getByRole('button', { name: 'Delete BPSC' }));

            await waitFor(() => {
                expect(screen.getByText('Delete Exam Category?')).toBeTruthy();
                expect(
                    screen.getByText(/2 test series and 2 mock tests, along with all associated student attempts/i)
                ).toBeTruthy();
            });

            fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));

            await waitFor(() => {
                expect(calls.deleteCategoryIds).toEqual(['cat-1']);
                expect(calls.fetchSeriesCount).toBeGreaterThan(initialSeriesFetches);
                expect(calls.fetchTestsCount).toBeGreaterThan(initialTestsFetches);
                expect(screen.queryByText('BPSC')).toBeNull();
            });

            // Switch to Series tab and delete SSC CGL Tier 1 (has 1 mock test)
            fireEvent.click(screen.getByRole('button', { name: 'Series' }));
            await waitFor(() => {
                expect(screen.getByText('SSC CGL Tier 1')).toBeTruthy();
            });

            const seriesTabTestsFetches = calls.fetchTestsCount;
            fireEvent.click(screen.getByRole('button', { name: 'Delete SSC CGL Tier 1' }));

            await waitFor(() => {
                expect(screen.getByText('Delete Test Series?')).toBeTruthy();
                expect(screen.getByText(/1 mock tests and all associated student attempts/i)).toBeTruthy();
            });

            fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));

            await waitFor(() => {
                expect(calls.deleteSeriesIds).toEqual(['ser-3']);
                expect(calls.fetchTestsCount).toBeGreaterThan(seriesTabTestsFetches);
                expect(new URLSearchParams(latestSearch).get('series')).toBeNull();
            });
        });

        it('blocks category delete with info toast while child series/tests are still loading', async () => {
            const state = makeFixtureState();
            state.seriesPending = true;
            createSupabaseMock(state);

            render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=categories']}>
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BPSC')).toBeTruthy();
            });

            fireEvent.click(screen.getByRole('button', { name: 'Delete BPSC' }));
            expect(screen.queryByText('Delete Exam Category?')).toBeNull();
            const toasts = useNotificationStore.getState().toasts;
            expect(toasts[toasts.length - 1].variant).toBe('info');
        });
    });

    describe('Mock Tests Security, Schedule Window & Publish Integrity (v1.0.370)', () => {
        it('enforces synchronous publish integrity guards in createTest and updateTest', async () => {
            const state = makeFixtureState();
            const calls = createSupabaseMock(state);

            await expect(
                createTest({
                    series_id: 'ser-1',
                    name: 'Empty Published Test',
                    duration_minutes: 60,
                    total_marks: 100,
                    passing_marks: 40,
                    negative_marks: 0.25,
                    question_ids: [],
                    is_published: true,
                })
            ).rejects.toThrow(/Add at least one question before publishing/i);
            expect(calls.insertTestPayloads).toHaveLength(0);

            await expect(
                createTest({
                    series_id: 'ser-1',
                    name: 'Duplicate Question Published Test',
                    duration_minutes: 60,
                    total_marks: 100,
                    passing_marks: 40,
                    negative_marks: 0.25,
                    question_ids: ['q1', 'q1'],
                    is_published: true,
                })
            ).rejects.toThrow(/Remove duplicate questions before publishing/i);
            expect(calls.insertTestPayloads).toHaveLength(0);

            await expect(
                updateTest('test-1', {
                    is_published: true,
                    question_ids: [],
                })
            ).rejects.toThrow(/Add at least one question before publishing/i);

            await expect(
                updateTest('test-1', {
                    release_date: '2026-11-25T10:00:00Z',
                    expiry_date: '2026-11-20T10:00:00Z',
                })
            ).rejects.toThrow(/Expiry date must be after Release date/i);
            expect(calls.updateTestCalls).toHaveLength(0);
        });

        it('chunks >100 UUIDs in validateQuestionIds and filters out soft-deleted or malformed IDs', async () => {
            const validUuids = Array.from({ length: 150 }, (_, idx) => {
                const hex = idx.toString(16).padStart(12, '0');
                return `00000000-0000-4000-8000-${hex}`;
            });
            const softDeletedUuid = validUuids[149];
            const activeSet = new Set(validUuids.slice(0, 149));

            const state = makeFixtureState();
            state.activeQuestionIds = activeSet;
            const calls = createSupabaseMock(state);

            const result = await validateQuestionIds([...validUuids, 'not-a-uuid', validUuids[0]]);
            expect(calls.questionDeletedAtNullChecked).toBe(true);
            expect(calls.questionInChunks).toHaveLength(2);
            expect(calls.questionInChunks[0]).toHaveLength(100);
            expect(calls.questionInChunks[1]).toHaveLength(50);
            expect(result.valid).toHaveLength(149);
            expect(result.invalid).toEqual([softDeletedUuid, 'not-a-uuid']);
        });

        it('enforces schedule window filtering across isTestWithinScheduleWindow, fetchPublishedTests, searchTestsApi, and fetchTestDetails', async () => {
            const nowMs = Date.parse('2026-11-22T09:00:00Z');
            expect(isTestWithinScheduleWindow({ release_date: null, expiry_date: null }, nowMs)).toBe(true);
            expect(isTestWithinScheduleWindow({ release_date: '2026-11-22T08:00:00Z', expiry_date: '2026-11-23T00:00:00Z' }, nowMs)).toBe(true);
            expect(isTestWithinScheduleWindow({ release_date: '2026-11-23T00:00:00Z', expiry_date: null }, nowMs)).toBe(false);
            expect(isTestWithinScheduleWindow({ release_date: null, expiry_date: '2026-11-22T08:59:59Z' }, nowMs)).toBe(false);
            expect(isTestWithinScheduleWindow({ release_date: 'invalid-date' }, nowMs)).toBe(false);

            const state = makeFixtureState();
            state.tests = [
                { ...state.tests[0], id: 'test-active', name: 'Active BPSC Mock', release_date: '2026-11-20T00:00:00Z', expiry_date: '2026-11-25T00:00:00Z' },
                { ...state.tests[0], id: 'test-unscheduled', name: 'Always-On BPSC Mock', release_date: null, expiry_date: null },
                { ...state.tests[0], id: 'test-future', name: 'Upcoming BPSC Mock', release_date: '2026-11-25T00:00:00Z', expiry_date: null },
                { ...state.tests[0], id: 'test-expired', name: 'Expired BPSC Mock', release_date: '2026-11-01T00:00:00Z', expiry_date: '2026-11-21T00:00:00Z' },
            ];
            createSupabaseMock(state);

            const listed = await fetchPublishedTests('ser-1', nowMs);
            expect(listed.map((t: any) => t.id)).toEqual(['test-active', 'test-unscheduled']);

            const searched = await searchTestsApi('BPSC', nowMs);
            expect(searched.map((t: any) => t.id)).toEqual(['test-active', 'test-unscheduled']);

            state.tests = [
                { ...state.tests[0], id: 'test-expired', release_date: '2026-11-01T00:00:00Z', expiry_date: '2026-11-21T00:00:00Z' },
            ];
            await expect(fetchTestDetails('test-expired', nowMs)).rejects.toThrow(
                /not currently available outside its scheduled window/i
            );
        });

        it('projects privacy-safe leaderboard DTOs via get_test_leaderboard RPC and strips answers payloads', async () => {
            rpcMock.mockResolvedValueOnce({
                data: [
                    {
                        rank: 1,
                        user_id: 'user-1',
                        display_name: '  Aarav Kumar  ',
                        avatar_url: 'https://example.com/a.png',
                        score: 128.5,
                        accuracy: 85.67,
                        time_taken_seconds: 5400,
                        completed_at: '2026-11-22T08:00:00Z',
                        is_current_user: false,
                        answers: { q1: 'A', q2: 'C' },
                    },
                    {
                        rank: 2,
                        user_id: 'user-2',
                        display_name: '   ',
                        avatar_url: null,
                        score: 112,
                        accuracy: 74.67,
                        time_taken_seconds: null,
                        completed_at: null,
                        is_current_user: true,
                    },
                ],
                error: null,
            });

            const leaderboard = await fetchTestLeaderboard('test-1', 250);
            expect(rpcMock).toHaveBeenCalledWith('get_test_leaderboard', {
                p_test_id: 'test-1',
                p_limit: 100,
            });
            expect(leaderboard).toHaveLength(2);
            expect(leaderboard[0]).toEqual({
                rank: 1,
                user_id: 'user-1',
                display_name: 'Aarav Kumar',
                avatar_url: 'https://example.com/a.png',
                score: 128.5,
                accuracy: 85.67,
                time_taken_seconds: 5400,
                completed_at: '2026-11-22T08:00:00Z',
                is_current_user: false,
            });
            expect('answers' in leaderboard[0]).toBe(false);
            expect(leaderboard[1].display_name).toBe('MindFlow Aspirant');
            expect(leaderboard[1].is_current_user).toBe(true);

            const sanitized = sanitizeLeaderboardEntry({ user_id: 'u9', answers: { secret: true } }, 0);
            expect(sanitized.rank).toBe(1);
            expect((sanitized as any).answers).toBeUndefined();
        });
    });

    describe('DB_TABLES & DB_RPCS registry contracts', () => {
        it('exposes canonical table names and RPC identifiers across all assessment blocks', () => {
            expect(DB_TABLES.MOCK).toEqual({
                CATEGORIES: 'mock_categories',
                SERIES: 'mock_series',
                TESTS: 'mock_tests',
                ATTEMPTS: 'mock_test_attempts',
            });
            expect(DB_TABLES.QUIZ).toEqual({
                SESSIONS: 'quiz_sessions',
                SESSION_QUESTIONS: 'quiz_session_questions',
                SESSION_RESULTS: 'quiz_session_results',
            });
            expect(DB_TABLES.BANK).toEqual({
                QUESTIONS: 'questions',
                MASTERY: 'user_question_mastery',
                SUBJECT_METADATA_CACHE: 'subject_metadata_cache',
                EXAM_CATALOG: 'exam_catalog',
                EXAM_CYCLES: 'exam_cycles',
            });
            expect(DB_TABLES.BLUEPRINT).toEqual({
                BLUEPRINTS: 'user_exam_blueprints',
                SEEN_QUESTIONS: 'blueprint_seen_questions',
            });
            expect(DB_TABLES.RANKER).toEqual({
                CONFIGS: 'exam_configs',
                SUBMISSIONS: 'exam_submissions',
                SECTION_RESULTS: 'exam_section_results',
                STATS_SNAPSHOTS: 'exam_stats_snapshots',
                OFFICIAL_KEYS: 'official_answer_keys',
            });
            expect(DB_RPCS.MOCK_LEADERBOARD).toBe('get_test_leaderboard');
        });
    });

    describe('Series & Test PYQ vs Expert Controls (Wave 1 Component 4)', () => {
        it('SeriesDrawer defaults series_type to MOCK, toggles to PYQ, and hydrates existing PYQ series', async () => {
            const categories = [{ id: 'cat-1', name: 'BPSC' }];
            const onSave = vi.fn().mockResolvedValue(undefined);
            const onClose = vi.fn();

            const { rerender, container } = render(
                <SeriesDrawer
                    isOpen={true}
                    onClose={onClose}
                    categories={categories}
                    onSave={onSave}
                />
            );

            const expertBtn = screen.getByRole('button', { name: 'Expert Curated Mock' });
            const pyqBtn = screen.getByRole('button', { name: 'Previous Year Paper (PYQ)' });

            expect(expertBtn.getAttribute('aria-pressed')).toBe('true');
            expect(pyqBtn.getAttribute('aria-pressed')).toBe('false');
            expect(expertBtn.className).toContain('min-h-[44px]');
            expect(pyqBtn.className).toContain('min-h-[44px]');

            fireEvent.change(screen.getByPlaceholderText('e.g. SSC CGL 2026'), {
                target: { value: '70th BPSC PYQ' },
            });
            fireEvent.click(pyqBtn);
            expect(pyqBtn.getAttribute('aria-pressed')).toBe('true');

            const form = container.querySelector('form#series-form') as HTMLFormElement;
            await act(async () => {
                fireEvent.submit(form);
            });

            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: '70th BPSC PYQ',
                    series_type: 'PYQ',
                })
            );

            onSave.mockClear();
            rerender(
                <SeriesDrawer
                    isOpen={true}
                    onClose={onClose}
                    categories={categories}
                    series={{
                        id: 'ser-pyq',
                        category_id: 'cat-1',
                        name: 'Existing PYQ Series',
                        slug: 'existing-pyq-series',
                        description: '',
                        series_type: 'PYQ',
                        is_premium: false,
                        is_published: true,
                    }}
                    onSave={onSave}
                />
            );

            expect(screen.getByRole('button', { name: 'Previous Year Paper (PYQ)' }).getAttribute('aria-pressed')).toBe('true');
            fireEvent.click(screen.getByRole('button', { name: 'Expert Curated Mock' }));

            await act(async () => {
                fireEvent.submit(container.querySelector('form#series-form') as HTMLFormElement);
            });

            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Existing PYQ Series',
                    series_type: 'MOCK',
                })
            );
        });

        it('TestCard renders PYQ Paper vs Expert Mock badge based on test.test_type', () => {
            const baseTest = {
                id: 't-pyq',
                name: '69th BPSC Prelims Paper',
                duration_minutes: 120,
                total_marks: 150,
                passing_marks: 95,
                negative_marks: 0.33,
                question_ids: ['q1'],
                is_published: true,
                test_type: 'PYQ',
                mock_series: { name: 'BPSC PYQs', mock_categories: { name: 'BPSC' } },
            };

            const { rerender } = render(
                <TestCard test={baseTest} onEdit={vi.fn()} onDelete={vi.fn()} />
            );
            expect(screen.getByText('PYQ Paper')).toBeTruthy();

            rerender(
                <TestCard
                    test={{ ...baseTest, id: 't-mock', test_type: 'MOCK' }}
                    onEdit={vi.fn()}
                    onDelete={vi.fn()}
                />
            );
            expect(screen.getByText('Expert Mock')).toBeTruthy();
        });

        it('AdminTestSeriesDashboard displays PYQ Paper badges on Series cards and filters by Series Type', async () => {
            const state = makeFixtureState();
            state.series[0] = { ...state.series[0], series_type: 'PYQ' };
            state.series[1] = { ...state.series[1], series_type: 'MOCK' };
            state.series[2] = { ...state.series[2], series_type: 'MOCK' };
            createSupabaseMock(state);

            render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=series']}>
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BPSC Prelims 2026')).toBeTruthy();
                expect(screen.getByText('BPSC Draft Series')).toBeTruthy();
            });

            expect(screen.getByText('PYQ Paper')).toBeTruthy();
            expect(screen.getAllByText('Expert Mock').length).toBeGreaterThanOrEqual(2);

            fireEvent.click(screen.getByRole('button', { name: 'PYQ' }));
            await waitFor(() => {
                expect(screen.getByText('BPSC Prelims 2026')).toBeTruthy();
                expect(screen.queryByText('BPSC Draft Series')).toBeNull();
                expect(screen.queryByText('SSC CGL Tier 1')).toBeNull();
            });

            fireEvent.click(screen.getByRole('button', { name: 'Expert Mock' }));
            await waitFor(() => {
                expect(screen.queryByText('BPSC Prelims 2026')).toBeNull();
                expect(screen.getByText('BPSC Draft Series')).toBeTruthy();
                expect(screen.getByText('SSC CGL Tier 1')).toBeTruthy();
            });

            fireEvent.click(screen.getByRole('button', { name: 'All Types' }));
            await waitFor(() => {
                expect(screen.getByText('BPSC Prelims 2026')).toBeTruthy();
                expect(screen.getByText('BPSC Draft Series')).toBeTruthy();
            });
        });
    });
});
