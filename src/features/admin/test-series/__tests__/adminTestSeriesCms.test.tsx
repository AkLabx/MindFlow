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
} from '../api/adminTestSeriesApi';
import { AdminTestSeriesDashboard } from '../pages/AdminTestSeriesDashboard';
import { useNotificationStore } from '@/stores/useNotificationStore';

const { fromMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
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
        fetchCategoriesCount: 0,
        fetchSeriesCount: 0,
        fetchTestsCount: 0,
    };

    fromMock.mockImplementation((table: string) => {
        if (table === 'exam_categories') {
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

        if (table === 'test_series') {
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

        if (table === 'tests') {
            return {
                select: vi.fn((query: string) => {
                    calls.selectTestsQueries.push(query);
                    calls.fetchTestsCount += 1;
                    const chain: any = {
                        order: vi.fn(() => chain),
                        eq: vi.fn(() => chain),
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
                                    test_series: parentSeries,
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
        exam_categories: { id: 'cat-1', name: 'BPSC' },
    };
    const serBpscDraft = {
        id: 'ser-2',
        category_id: 'cat-1',
        name: 'BPSC Draft Series',
        is_published: false,
        exam_categories: { id: 'cat-1', name: 'BPSC' },
    };
    const serSscPub = {
        id: 'ser-3',
        category_id: 'cat-2',
        name: 'SSC CGL Tier 1',
        is_published: true,
        exam_categories: { id: 'cat-2', name: 'SSC' },
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
            test_series: serBpscPub,
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
            test_series: serBpscDraft,
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
            test_series: serSscPub,
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
                '*, test_series(id, name, category_id, is_published, exam_categories(id, name))'
            );
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
});
