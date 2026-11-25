/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DB_RPCS, DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { useSyncStore } from '@/features/quiz/stores/useSyncStore';
import { syncService } from '@/lib/syncService';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    MOCK_SWR_STALE_TIMES_MS,
    PreparedMockActiveAttemptState,
    clearPreparedMockTestsCache,
    computePreparedMockScore,
    computePreparedMockSubjectBreakdown,
    fetchAllPublishedMockSeriesCatalog,
    fetchPreparedMockTestQuestions,
    fetchPreparedMockTestsByExam,
    fetchPublishedTests,
    fetchSeriesDetails,
    fetchTestDetails,
    fetchTestLeaderboard,
    getCachedActivePreparedMockAttempt,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    getCachedPreparedMockAttemptByIdSnapshot,
    getCachedPreparedMockTestsSnapshot,
    getCachedSeriesBundleSnapshot,
    getCachedTestDetailsSnapshot,
    getCachedTestLeaderboardSnapshot,
    invalidateMockTestsCatalogCaches,
    isTestWithinScheduleWindow,
    materializePreparedMockTests,
    readAllPublishedMockSeriesCatalogIndexedDBCache,
    readPreparedMockTestsIndexedDBCache,
    readPreparedTestQuestionsIndexedDBCache,
    readTestDetailsIndexedDBCache,
    readTestLeaderboardIndexedDBCache,
    resolveCanonicalExamSlug,
    savePreparedMockAttemptProgress,
    submitPreparedMockAttempt,
} from '../api/mockTestsApi';
import {
    ADMIN_CMS_CATEGORIES_IDB_PREFIX,
    ADMIN_CMS_CATEGORIES_STORAGE_PREFIX,
    ADMIN_CMS_STALE_TIME_MS,
    ADMIN_CMS_TESTS_IDB_PREFIX,
    ADMIN_CMS_TESTS_STORAGE_PREFIX,
    deleteTest,
    fetchExamCategories,
    fetchMockTestAnalytics,
    fetchTestSeries,
    fetchTests,
    getCachedAdminCategoriesSnapshot,
    getCachedAdminSeriesSnapshot,
    getCachedAdminTestsSnapshot,
    getCachedMockTestAnalyticsSnapshot,
    invalidateAdminCmsCatalogCaches,
    updateTest,
    updateTestSeries,
} from '@/features/admin/test-series/api/adminTestSeriesApi';
import { PreparedMockTestsShortcutCard } from '../components/PreparedMockTestsShortcutCard';
import { ExamPreparedMockTestsPage } from '../pages/ExamPreparedMockTestsPage';
import type { Question } from '@/types/models';

const {
    fromMock,
    rpcMock,
    getSessionMock,
    syncMetadataMap,
    activeSessionMap,
    getCacheEntryMock,
    setCacheEntryMock,
    deleteCacheEntriesByPrefixMock,
    getActiveSessionMock,
    saveActiveSessionMock,
    clearActiveSessionMock,
    mockUser,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
    getSessionMock: vi.fn(),
    syncMetadataMap: new Map<string, { key: string; data: any; updatedAt: number }>(),
    activeSessionMap: new Map<string, any>(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    deleteCacheEntriesByPrefixMock: vi.fn(),
    getActiveSessionMock: vi.fn(),
    saveActiveSessionMock: vi.fn(),
    clearActiveSessionMock: vi.fn(),
    mockUser: { id: 'student-swr-1', email: 'swr-aspirant@mindflow.app' },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
        auth: {
            getSession: getSessionMock,
        },
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
        deleteCacheEntriesByPrefix: deleteCacheEntriesByPrefixMock,
        getActiveSession: getActiveSessionMock,
        saveActiveSession: saveActiveSessionMock,
        clearActiveSession: clearActiveSessionMock,
    },
}));

vi.mock('@/features/auth', () => ({
    useAuth: () => ({
        user: mockUser,
        profile: null,
        loading: false,
    }),
}));

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

const makeUuid = (n: number): string =>
    `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const createQuestion = (id: string, subject: string, correct = 'Option A'): Question => ({
    id,
    subject,
    question: `Question text for ${id}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct,
    explanation: { summary: `Explanation ${id}` },
    sourceInfo: { examName: 'BPSC', examYear: 2026 },
    classification: { subject, topic: 'General' },
    tags: [],
    properties: { difficulty: 'Medium', questionType: 'MCQ' },
});

interface MockBackendState {
    categories: any[];
    series: any[];
    tests: any[];
    questions: any[];
    attempts: any[];
    leaderboard: any[];
    callCounts: Record<string, number>;
    upsertCalls: Array<{ payload: any; options: any }>;
    upsertDeferred?: {
        promise: Promise<{ error: any }>;
        resolve: (val: { error: any }) => void;
    };
}

const createBackendState = (): MockBackendState => {
    const catBpsc = { id: 'cat-bpsc', name: 'BPSC', is_active: true, display_order: 1 };
    const serPrelims = {
        id: 'ser-bpsc-1',
        category_id: 'cat-bpsc',
        name: '70th BPSC Prelims Series',
        slug: '70th-bpsc-prelims',
        is_premium: false,
        is_published: true,
        mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
    };

    const q1Id = makeUuid(1);
    const q2Id = makeUuid(2);

    const tests = [
        {
            id: 'test-1',
            series_id: 'ser-bpsc-1',
            name: 'BPSC 70th Full-Length Mock #1',
            description: 'Full GS paper',
            duration_minutes: 120,
            total_marks: 150,
            passing_marks: 95,
            negative_marks: 0.33,
            question_ids: [q1Id, q2Id],
            is_published: true,
            display_order: 1,
            release_date: null,
            expiry_date: null,
            created_at: '2026-11-20T10:00:00Z',
            mock_series: serPrelims,
        },
        {
            id: 'test-2',
            series_id: 'ser-bpsc-1',
            name: 'BPSC Bihar Special Sectional #2',
            description: 'Sectional practice paper',
            duration_minutes: 45,
            total_marks: 50,
            passing_marks: 30,
            negative_marks: 0.25,
            question_ids: [q1Id],
            is_published: true,
            display_order: 2,
            release_date: null,
            expiry_date: null,
            created_at: '2026-11-21T10:00:00Z',
            mock_series: serPrelims,
        },
    ];

    const questions = [
        {
            id: q1Id,
            subject: 'History',
            topic: 'Modern India',
            question: 'Sample Q1',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 'Option A',
            explanation: { summary: 'Exp 1' },
            deleted_at: null,
        },
        {
            id: q2Id,
            subject: 'Polity',
            topic: 'Constitution',
            question: 'Sample Q2',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 'Option B',
            explanation: { summary: 'Exp 2' },
            deleted_at: null,
        },
    ];

    return {
        categories: [catBpsc],
        series: [serPrelims],
        tests,
        questions,
        attempts: [
            {
                id: 'att-existing-1',
                test_id: 'test-1',
                user_id: mockUser.id,
                status: 'completed',
                score: 110,
                accuracy: 80,
                time_taken_seconds: 3200,
                answers: { [q1Id]: 'Option A' },
                start_time: '2026-11-21T08:00:00Z',
                end_time: '2026-11-21T08:53:20Z',
                created_at: '2026-11-21T08:00:00Z',
            },
        ],
        leaderboard: [
            {
                rank: 1,
                user_id: mockUser.id,
                display_name: 'Topper Aspirant',
                avatar_url: null,
                score: 110,
                accuracy: 80,
                time_taken_seconds: 3200,
                completed_at: '2026-11-21T08:53:20Z',
                is_current_user: true,
            },
        ],
        callCounts: {},
        upsertCalls: [],
    };
};

const setupSupabaseBackend = (state: MockBackendState) => {
    const bump = (key: string) => {
        state.callCounts[key] = (state.callCounts[key] || 0) + 1;
    };

    rpcMock.mockImplementation(async (fnName: string) => {
        bump(`rpc:${fnName}`);
        if (fnName === DB_RPCS.MOCK_LEADERBOARD) {
            return { data: state.leaderboard, error: null };
        }
        return { data: [], error: null };
    });

    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.CATEGORIES) {
            return {
                select: vi.fn(() => {
                    bump(`select:${table}`);
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        single: vi.fn(async () => ({
                            data: state.categories[0] ?? null,
                            error: null,
                        })),
                        then: (resolve: any, reject: any) =>
                            Promise.resolve({ data: state.categories, error: null }).then(resolve, reject),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.SERIES) {
            return {
                select: vi.fn(() => {
                    bump(`select:${table}`);
                    const filters: Record<string, any> = {};
                    const chain: any = {
                        eq: vi.fn((col: string, val: any) => {
                            filters[col] = val;
                            return chain;
                        }),
                        order: vi.fn(() => chain),
                        single: vi.fn(async () => {
                            const found =
                                (filters.id
                                    ? state.series.find((s) => s.id === filters.id)
                                    : state.series[0]) ?? null;
                            return { data: found, error: found ? null : { code: 'PGRST116', message: 'Not found' } };
                        }),
                        then: (resolve: any, reject: any) => {
                            const rows = filters.category_id
                                ? state.series.filter((s) => s.category_id === filters.category_id)
                                : state.series;
                            return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
                update: vi.fn((payload: any) => ({
                    eq: vi.fn((_col: string, id: string) => ({
                        select: vi.fn(() => ({
                            single: vi.fn(async () => {
                                bump(`update:${table}`);
                                const existing = state.series.find((s) => s.id === id);
                                const updated = { ...existing, ...payload };
                                state.series = state.series.map((s) => (s.id === id ? updated : s));
                                return { data: updated, error: null };
                            }),
                        })),
                    })),
                })),
            };
        }

        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    bump(`select:${table}`);
                    const filters: Record<string, any> = {};
                    const chain: any = {
                        eq: vi.fn((col: string, val: any) => {
                            filters[col] = val;
                            return chain;
                        }),
                        order: vi.fn(() => chain),
                        single: vi.fn(async () => {
                            const found =
                                (filters.id
                                    ? state.tests.find((t) => t.id === filters.id)
                                    : state.tests[0]) ?? null;
                            return { data: found, error: found ? null : { code: 'PGRST116', message: 'Not found' } };
                        }),
                        maybeSingle: vi.fn(async () => {
                            const found = state.tests.find((t) => {
                                if (filters.id && t.id !== filters.id) return false;
                                if (filters.is_published !== undefined && t.is_published !== filters.is_published) {
                                    return false;
                                }
                                return true;
                            });
                            return { data: found ?? null, error: null };
                        }),
                        then: (resolve: any, reject: any) => {
                            const rows = state.tests.filter((t) => {
                                if (filters.series_id && t.series_id !== filters.series_id) return false;
                                if (filters.is_published !== undefined && t.is_published !== filters.is_published) {
                                    return false;
                                }
                                return true;
                            });
                            return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
                update: vi.fn((payload: any) => ({
                    eq: vi.fn((_col: string, id: string) => ({
                        select: vi.fn(() => ({
                            single: vi.fn(async () => {
                                bump(`update:${table}`);
                                const existing = state.tests.find((t) => t.id === id);
                                const updated = { ...existing, ...payload };
                                state.tests = state.tests.map((t) => (t.id === id ? updated : t));
                                return { data: updated, error: null };
                            }),
                        })),
                    })),
                })),
                delete: vi.fn(() => ({
                    eq: vi.fn(async (_col: string, id: string) => {
                        bump(`delete:${table}`);
                        state.tests = state.tests.filter((t) => t.id !== id);
                        return { error: null };
                    }),
                })),
            };
        }

        if (table === DB_TABLES.BANK.QUESTIONS) {
            return {
                select: vi.fn(() => {
                    bump(`select:${table}`);
                    let idsFilter: string[] | null = null;
                    const chain: any = {
                        in: vi.fn((_col: string, ids: string[]) => {
                            idsFilter = ids;
                            return chain;
                        }),
                        is: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            const rows = idsFilter
                                ? state.questions.filter((q) => idsFilter!.includes(q.id))
                                : state.questions;
                            return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return {
                select: vi.fn(() => {
                    bump(`select:${table}`);
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        in: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        limit: vi.fn(() => chain),
                        range: vi.fn(async () => ({ data: state.attempts, error: null })),
                        maybeSingle: vi.fn(async () => ({ data: state.attempts[0] ?? null, error: null })),
                        then: (resolve: any, reject: any) =>
                            Promise.resolve({ data: state.attempts, error: null }).then(resolve, reject),
                    };
                    return chain;
                }),
                upsert: vi.fn(async (payload: any, options?: any) => {
                    bump(`upsert:${table}`);
                    state.upsertCalls.push({ payload, options });
                    if (state.upsertDeferred) {
                        return state.upsertDeferred.promise;
                    }
                    return { error: null };
                }),
            };
        }

        return {
            select: vi.fn(() => ({
                then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
            })),
        };
    });
};

const resetDbMocks = () => {
    syncMetadataMap.clear();
    activeSessionMap.clear();

    getCacheEntryMock.mockImplementation(async (key: string) => syncMetadataMap.get(key) ?? null);
    setCacheEntryMock.mockImplementation(async (key: string, data: any) => {
        if (data === null) {
            syncMetadataMap.delete(key);
            return;
        }
        syncMetadataMap.set(key, { key, data, updatedAt: Date.now() });
    });
    deleteCacheEntriesByPrefixMock.mockImplementation(async (prefixes: string[]) => {
        const clean = prefixes.map((p) => String(p ?? '').trim()).filter(Boolean);
        for (const key of Array.from(syncMetadataMap.keys())) {
            if (clean.some((prefix) => key.startsWith(prefix))) {
                syncMetadataMap.delete(key);
            }
        }
    });
    getActiveSessionMock.mockImplementation(async (id: string) => activeSessionMap.get(id) ?? null);
    saveActiveSessionMock.mockImplementation(async (id: string, data: any) => {
        activeSessionMap.set(id, { id, ...data });
    });
    clearActiveSessionMock.mockImplementation(async (id: string) => {
        activeSessionMap.delete(id);
    });
};

describe('v1.0.379 Mock Tests SWR Cache, Admin Invalidation Cascade, Scoring Math & Offline Replay Regression', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetDbMocks();
        window.localStorage.clear();
        useSyncStore.getState().clearQueue();
        clearPreparedMockTestsCache();
        invalidateAdminCmsCatalogCaches();
        useExamContextStore.setState({ activeExamId: 'bpsc', pinnedExamIds: ['bpsc', 'ssc_cgl'] });
        getSessionMock.mockResolvedValue({
            data: { session: { user: mockUser } },
            error: null,
        });
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        clearPreparedMockTestsCache();
        invalidateAdminCmsCatalogCaches();
        window.localStorage.clear();
        useSyncStore.getState().clearQueue();
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
        });
    });

    it('enforces SWR stale-time gates, forceRefresh bypass, and 3-tier IndexedDB hydration across student and admin APIs', async () => {
        const backend = createBackendState();
        setupSupabaseBackend(backend);

        const baseNow = Date.parse('2026-11-24T10:00:00Z');
        let currentNow = baseNow;
        vi.spyOn(Date, 'now').mockImplementation(() => currentNow);

        // 1. fetchPreparedMockTestsByExam (CATALOG 5m, ATTEMPTS 2m)
        const catRes1 = await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, nowMs: currentNow });
        expect(catRes1.source).toBe('network');
        expect(catRes1.tests).toHaveLength(2);
        const initialCatalogCalls = backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`];

        // Fresh (< 2m attempts & < 5m catalog): 0ms cache hit, zero Supabase queries
        currentNow = baseNow + 60 * 1000;
        const catRes2 = await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, nowMs: currentNow });
        expect(catRes2.source).toBe('cache');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(initialCatalogCalls);

        // Expired (> 5m): revalidates from Supabase
        currentNow = baseNow + MOCK_SWR_STALE_TIMES_MS.CATALOG + 1000;
        const catRes3 = await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, nowMs: currentNow });
        expect(catRes3.source).toBe('network');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBeGreaterThan(initialCatalogCalls);

        // forceRefresh bypasses fresh cache
        const callsBeforeForce = backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`];
        const catRes4 = await fetchPreparedMockTestsByExam('bpsc', {
            userId: mockUser.id,
            nowMs: currentNow,
            forceRefresh: true,
        });
        expect(catRes4.source).toBe('network');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBeGreaterThan(callsBeforeForce);

        // Cold Memory + localStorage -> hydrates from IndexedDB sync_metadata
        const savedCatalogIdb = syncMetadataMap.get('prepared_mock_catalog_v1');
        const savedAttemptsIdb = syncMetadataMap.get(`mock_attempts_v1_${mockUser.id}`);
        expect(savedCatalogIdb).toBeDefined();
        clearPreparedMockTestsCache();
        window.localStorage.clear();
        syncMetadataMap.set('prepared_mock_catalog_v1', savedCatalogIdb!);
        if (savedAttemptsIdb) {
            syncMetadataMap.set(`mock_attempts_v1_${mockUser.id}`, savedAttemptsIdb);
        }

        const hydratedCatalog = await readPreparedMockTestsIndexedDBCache('bpsc', {
            userId: mockUser.id,
            nowMs: currentNow,
        });
        expect(hydratedCatalog).not.toBeNull();
        expect(hydratedCatalog?.tests.map((t) => t.id)).toEqual(['test-1', 'test-2']);
        expect(getCachedPreparedMockTestsSnapshot('bpsc', { userId: mockUser.id, nowMs: currentNow })).not.toBeNull();

        // 2. fetchTestDetails (5m stale time)
        clearPreparedMockTestsCache();
        backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`] = 0;
        const det1 = await fetchTestDetails('test-1', currentNow);
        expect(det1.id).toBe('test-1');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(1);

        currentNow += MOCK_SWR_STALE_TIMES_MS.TEST_DETAILS - 5000;
        const det2 = await fetchTestDetails('test-1', currentNow);
        expect(det2.id).toBe('test-1');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(1);

        currentNow += 10_000;
        await fetchTestDetails('test-1', currentNow);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(2);

        await fetchTestDetails('test-1', currentNow, { forceRefresh: true });
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(3);

        const savedDetailIdb = syncMetadataMap.get('mock_test_detail_v1_test-1');
        clearPreparedMockTestsCache();
        window.localStorage.clear();
        syncMetadataMap.set('mock_test_detail_v1_test-1', savedDetailIdb!);
        const hydratedDetail = await readTestDetailsIndexedDBCache('test-1', currentNow);
        expect(hydratedDetail?.id).toBe('test-1');

        // 3. fetchPreparedMockTestQuestions (15m stale time)
        const qIds = [makeUuid(1), makeUuid(2)];
        backend.callCounts[`select:${DB_TABLES.BANK.QUESTIONS}`] = 0;
        const qs1 = await fetchPreparedMockTestQuestions('test-1', qIds);
        expect(qs1).toHaveLength(2);
        expect(backend.callCounts[`select:${DB_TABLES.BANK.QUESTIONS}`]).toBe(1);

        currentNow += MOCK_SWR_STALE_TIMES_MS.QUESTIONS - 10_000;
        await fetchPreparedMockTestQuestions('test-1', qIds);
        expect(backend.callCounts[`select:${DB_TABLES.BANK.QUESTIONS}`]).toBe(1);

        currentNow += 20_000;
        await fetchPreparedMockTestQuestions('test-1', qIds);
        expect(backend.callCounts[`select:${DB_TABLES.BANK.QUESTIONS}`]).toBe(2);

        await fetchPreparedMockTestQuestions('test-1', qIds, { forceRefresh: true });
        expect(backend.callCounts[`select:${DB_TABLES.BANK.QUESTIONS}`]).toBe(3);

        const savedQsIdb = syncMetadataMap.get('mock_test_questions_v1_test-1');
        clearPreparedMockTestsCache();
        window.localStorage.clear();
        syncMetadataMap.set('mock_test_questions_v1_test-1', savedQsIdb!);
        const hydratedQs = await readPreparedTestQuestionsIndexedDBCache('test-1', qIds);
        expect(hydratedQs).toHaveLength(2);

        // 4. fetchTestLeaderboard (60s stale time)
        backend.callCounts[`rpc:${DB_RPCS.MOCK_LEADERBOARD}`] = 0;
        const lb1 = await fetchTestLeaderboard('test-1', 50);
        expect(lb1).toHaveLength(1);
        expect(backend.callCounts[`rpc:${DB_RPCS.MOCK_LEADERBOARD}`]).toBe(1);

        currentNow += MOCK_SWR_STALE_TIMES_MS.LEADERBOARD - 5000;
        await fetchTestLeaderboard('test-1', 50);
        expect(backend.callCounts[`rpc:${DB_RPCS.MOCK_LEADERBOARD}`]).toBe(1);

        currentNow += 10_000;
        await fetchTestLeaderboard('test-1', 50);
        expect(backend.callCounts[`rpc:${DB_RPCS.MOCK_LEADERBOARD}`]).toBe(2);

        await fetchTestLeaderboard('test-1', 50, { forceRefresh: true });
        expect(backend.callCounts[`rpc:${DB_RPCS.MOCK_LEADERBOARD}`]).toBe(3);

        const savedLbIdb = syncMetadataMap.get('mock_leaderboard_v1_test-1');
        clearPreparedMockTestsCache();
        window.localStorage.clear();
        syncMetadataMap.set('mock_leaderboard_v1_test-1', savedLbIdb!);
        const hydratedLb = await readTestLeaderboardIndexedDBCache('test-1');
        expect(hydratedLb).toHaveLength(1);

        // 5. Admin fetchExamCategories & fetchTests (2m stale time + direct IDB fallback inside fetch*)
        invalidateAdminCmsCatalogCaches();
        backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`] = 0;
        backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`] = 0;

        const adminCats1 = await fetchExamCategories();
        const adminTests1 = await fetchTests('ser-bpsc-1');
        expect(adminCats1).toHaveLength(1);
        expect(adminTests1).toHaveLength(2);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`]).toBe(1);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(1);

        // Fresh (< 2m): cached without Supabase
        currentNow += ADMIN_CMS_STALE_TIME_MS - 5000;
        await fetchExamCategories();
        await fetchTests('ser-bpsc-1');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`]).toBe(1);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(1);

        // Expired (> 2m): revalidates
        currentNow += 10_000;
        await fetchExamCategories();
        await fetchTests('ser-bpsc-1');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`]).toBe(2);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(2);

        // forceRefresh: revalidates immediately
        await fetchExamCategories({ forceRefresh: true });
        await fetchTests('ser-bpsc-1', { forceRefresh: true });
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`]).toBe(3);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(3);

        // IDB hydration when memory + localStorage are cold
        const savedAdminCatsIdb = syncMetadataMap.get(`${ADMIN_CMS_CATEGORIES_IDB_PREFIX}all`);
        const savedAdminTestsIdb = syncMetadataMap.get(`${ADMIN_CMS_TESTS_IDB_PREFIX}ser-bpsc-1`);
        invalidateAdminCmsCatalogCaches();
        window.localStorage.clear();
        syncMetadataMap.set(`${ADMIN_CMS_CATEGORIES_IDB_PREFIX}all`, savedAdminCatsIdb!);
        syncMetadataMap.set(`${ADMIN_CMS_TESTS_IDB_PREFIX}ser-bpsc-1`, savedAdminTestsIdb!);

        const idbAdminCats = await fetchExamCategories();
        const idbAdminTests = await fetchTests('ser-bpsc-1');
        expect(idbAdminCats).toHaveLength(1);
        expect(idbAdminTests).toHaveLength(2);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.CATEGORIES}`]).toBe(3);
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.TESTS}`]).toBe(3);
        expect(window.localStorage.getItem(`${ADMIN_CMS_CATEGORIES_STORAGE_PREFIX}all`)).not.toBeNull();
        expect(window.localStorage.getItem(`${ADMIN_CMS_TESTS_STORAGE_PREFIX}ser-bpsc-1`)).not.toBeNull();
    });

    it('cascades Admin mutations across all 3 cache tiers, updates PreparedMockTestsShortcutCard live badge, and preserves active student attempts', async () => {
        const backend = createBackendState();
        setupSupabaseBackend(backend);

        // Seed Admin CMS + Analytics caches
        await fetchExamCategories();
        await fetchTestSeries();
        await fetchTests();
        await fetchMockTestAnalytics('test-1');
        expect(getCachedAdminCategoriesSnapshot()).toHaveLength(1);
        expect(getCachedAdminSeriesSnapshot()).toHaveLength(1);
        expect(getCachedAdminTestsSnapshot()).toHaveLength(2);
        expect(getCachedMockTestAnalyticsSnapshot('test-1')).not.toBeNull();

        // Seed Student caches (catalog, test detail, series bundle, leaderboard)
        await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id });
        await fetchTestDetails('test-1');
        await fetchSeriesDetails('ser-bpsc-1');
        await fetchPublishedTests('ser-bpsc-1');
        await fetchTestLeaderboard('test-1');
        expect(getCachedPreparedMockTestsSnapshot('bpsc', { userId: mockUser.id })?.tests).toHaveLength(2);
        expect(getCachedTestDetailsSnapshot('test-1')).not.toBeNull();
        expect(getCachedSeriesBundleSnapshot('ser-bpsc-1')?.tests).toHaveLength(2);
        expect(getCachedTestLeaderboardSnapshot('test-1')).toHaveLength(1);

        // Seed active student CBT attempt across Memory, localStorage, sync_metadata, and active_test_session
        const activeState: PreparedMockActiveAttemptState = {
            attemptId: 'att-live-student-1',
            testId: 'test-1',
            userId: mockUser.id,
            status: 'in_progress',
            startedAt: '2026-11-24T09:00:00Z',
            updatedAt: '2026-11-24T09:10:00Z',
            totalDurationSeconds: 7200,
            remainingSeconds: 6600,
            elapsedSeconds: 600,
            currentIndex: 1,
            answers: { [makeUuid(1)]: 'Option A' },
            markedForReview: [makeUuid(2)],
            visitedQuestionIds: [makeUuid(1), makeUuid(2)],
            timeSpentByQuestion: { [makeUuid(1)]: 45 },
            remotePersisted: false,
        };
        await savePreparedMockAttemptProgress(activeState, { syncRemote: false });

        const activeCacheKey = `${mockUser.id}_test-1`;
        expect(getCachedActivePreparedMockAttempt('test-1', mockUser.id)).not.toBeNull();
        expect(window.localStorage.getItem(`mindflow_mock_active_attempt_v1_${activeCacheKey}`)).not.toBeNull();
        expect(syncMetadataMap.has(`mock_active_attempt_v1_${activeCacheKey}`)).toBe(true);
        expect(activeSessionMap.has(`mock_exam_${activeCacheKey}`)).toBe(true);

        // Render Shortcut Card -> shows "2 Live"
        const invalidatedEvents: Array<CustomEventDetail> = [];
        type CustomEventDetail = { scope?: string; testId?: string; seriesId?: string };
        const onInvalidated = (e: Event) => {
            invalidatedEvents.push((e as CustomEvent<CustomEventDetail>).detail || {});
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, onInvalidated);

        try {
            render(
                <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
                    <Routes>
                        <Route
                            path={ROUTES.DASHBOARD}
                            element={<PreparedMockTestsShortcutCard source="dashboard" returnTo={ROUTES.DASHBOARD} />}
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByText('2 Live BPSC')).toBeTruthy();

            // Admin deletes test-2 -> invalidateAdminCmsCatalogCaches purges all Admin & Student catalog caches
            await deleteTest('test-2');

            expect(invalidatedEvents.some((d) => d.scope === 'catalog' && d.testId === 'test-2')).toBe(true);
            expect(window.localStorage.getItem(MOCK_CACHE_VERSION_KEY)).toBeTruthy();

            // Admin caches & analytics purged across Memory, localStorage, and IDB
            expect(getCachedAdminCategoriesSnapshot()).toBeNull();
            expect(getCachedAdminSeriesSnapshot()).toBeNull();
            expect(getCachedAdminTestsSnapshot()).toBeNull();
            expect(syncMetadataMap.has(`${ADMIN_CMS_CATEGORIES_IDB_PREFIX}all`)).toBe(false);

            // Student catalog, test detail, series bundle, leaderboard purged across 3 tiers
            expect(getCachedPreparedMockTestsSnapshot('bpsc', { userId: mockUser.id })).toBeNull();
            expect(getCachedTestDetailsSnapshot('test-2')).toBeNull();
            expect(getCachedSeriesBundleSnapshot('ser-bpsc-1')).toBeNull();
            expect(getCachedTestLeaderboardSnapshot('test-2')).toBeNull();
            expect(syncMetadataMap.has('prepared_mock_catalog_v1')).toBe(false);

            // Shortcut card reacts to invalidation event (badge cleared while invalidated)
            await waitFor(() => {
                expect(screen.queryByText('2 Live BPSC')).toBeNull();
            });

            // Student re-fetches updated catalog (now 1 live test) and shortcut card displays "1 Live BPSC"
            await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, forceRefresh: true });
            window.dispatchEvent(new CustomEvent(MOCK_CACHE_INVALIDATED_EVENT, { detail: { scope: 'catalog' } }));

            await waitFor(() => {
                expect(screen.getByText('1 Live BPSC')).toBeTruthy();
            });

            // Re-seed analytics & student detail for test-1, then verify updateTest & updateTestSeries also cascade
            await fetchMockTestAnalytics('test-1');
            await fetchTestDetails('test-1');
            await fetchTestLeaderboard('test-1');
            expect(getCachedMockTestAnalyticsSnapshot('test-1')).not.toBeNull();

            await updateTest('test-1', { name: 'BPSC 70th Full-Length Mock #1 (Updated)' });
            expect(getCachedMockTestAnalyticsSnapshot('test-1')).toBeNull();
            expect(getCachedTestDetailsSnapshot('test-1')).toBeNull();
            expect(getCachedTestLeaderboardSnapshot('test-1')).toBeNull();
            expect(getCachedPreparedMockTestsSnapshot('bpsc', { userId: mockUser.id })).toBeNull();

            await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id, forceRefresh: true });
            await fetchSeriesDetails('ser-bpsc-1');
            await fetchPublishedTests('ser-bpsc-1');
            expect(getCachedSeriesBundleSnapshot('ser-bpsc-1')).not.toBeNull();

            await updateTestSeries('ser-bpsc-1', { name: '70th BPSC Prelims Updated' });
            expect(getCachedSeriesBundleSnapshot('ser-bpsc-1')).toBeNull();
            expect(getCachedPreparedMockTestsSnapshot('bpsc', { userId: mockUser.id })).toBeNull();

            // Active student attempt & active_test_session MUST remain strictly preserved
            const preservedActive = getCachedActivePreparedMockAttempt('test-1', mockUser.id);
            expect(preservedActive).not.toBeNull();
            expect(preservedActive?.attemptId).toBe('att-live-student-1');
            expect(preservedActive?.answers[makeUuid(1)]).toBe('Option A');
            expect(window.localStorage.getItem(`mindflow_mock_active_attempt_v1_${activeCacheKey}`)).not.toBeNull();
            expect(syncMetadataMap.has(`mock_active_attempt_v1_${activeCacheKey}`)).toBe(true);
            expect(activeSessionMap.get(`mock_exam_${activeCacheKey}`)?.answers?.[makeUuid(1)]).toBe('Option A');
        } finally {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, onInvalidated);
        }
    });

    it('enforces schedule window edge cases and purges all 3 cache tiers when fetchTestDetails finds an unavailable test', async () => {
        const nowMs = Date.parse('2026-11-24T12:00:00Z');

        expect(isTestWithinScheduleWindow(null, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow(undefined, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow({}, nowMs)).toBe(true);
        expect(isTestWithinScheduleWindow({ release_date: null, expiry_date: null }, nowMs)).toBe(true);
        expect(isTestWithinScheduleWindow({ release_date: '2026-11-24T12:00:01Z' }, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow({ release_date: '2026-11-24T12:00:00Z' }, nowMs)).toBe(true);
        expect(isTestWithinScheduleWindow({ expiry_date: '2026-11-24T11:59:59Z' }, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow({ expiry_date: '2026-11-24T12:00:00Z' }, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow({ release_date: 'not-a-valid-date' }, nowMs)).toBe(false);
        expect(isTestWithinScheduleWindow({ expiry_date: 'not-a-valid-date' }, nowMs)).toBe(false);

        const backend = createBackendState();
        backend.tests[0].release_date = '2026-11-01T00:00:00Z';
        backend.tests[0].expiry_date = '2026-12-01T00:00:00Z';
        setupSupabaseBackend(backend);

        // Seed valid cache across Memory, localStorage, and IDB
        const seeded = await fetchTestDetails('test-1', nowMs);
        expect(seeded.id).toBe('test-1');
        expect(getCachedTestDetailsSnapshot('test-1', nowMs)).not.toBeNull();
        expect(window.localStorage.getItem('mindflow_mock_test_detail_v1_test-1')).not.toBeNull();
        expect(syncMetadataMap.has('mock_test_detail_v1_test-1')).toBe(true);

        // Remote test becomes expired at exact expiry boundary -> fetchTestDetails throws and purges all 3 tiers
        backend.tests[0].expiry_date = '2026-11-24T12:00:00Z';
        await expect(fetchTestDetails('test-1', nowMs, { forceRefresh: true })).rejects.toThrow(
            /outside its scheduled window/i
        );

        expect(deleteCacheEntriesByPrefixMock).toHaveBeenCalledWith(['mock_test_detail_v1_test-1']);
        expect(getCachedTestDetailsSnapshot('test-1', nowMs)).toBeNull();
        expect(window.localStorage.getItem('mindflow_mock_test_detail_v1_test-1')).toBeNull();
        expect(syncMetadataMap.has('mock_test_detail_v1_test-1')).toBe(false);
        expect(await readTestDetailsIndexedDBCache('test-1', nowMs)).toBeNull();
    });

    it('computes BPSC 4-option (-0.33) vs 5-option (-0.25) negative marking math with sign-normalization, 2-decimal rounding, and cutoff checks', () => {
        const questions: Question[] = Array.from({ length: 103 }, (_, idx) =>
            createQuestion(`q-${idx + 1}`, idx < 50 ? 'History' : 'Polity', 'Option A')
        );

        const answers: Record<string, string> = {};
        // 65 correct (35 History, 30 Polity)
        for (let i = 0; i < 35; i += 1) answers[`q-${i + 1}`] = 'Option A';
        for (let i = 50; i < 80; i += 1) answers[`q-${i + 1}`] = 'Option A';
        // 19 wrong (10 History, 9 Polity)
        for (let i = 35; i < 45; i += 1) answers[`q-${i + 1}`] = 'Option B';
        for (let i = 80; i < 89; i += 1) answers[`q-${i + 1}`] = 'Option C';
        // 19 unanswered (including explicit blank/whitespace)
        answers['q-46'] = '';
        answers['q-47'] = '   ';

        // BPSC 4-option (-0.33 / 0.33)
        // 65 * (150/103) - 19 * 0.33 = 94.660194... - 6.27 = 88.390194... -> 88.39
        const posBpsc4 = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: 0.33,
            passingMarks: 88.39,
        });
        const negBpsc4 = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: -0.33,
            passingMarks: 88.4,
        });

        expect(posBpsc4.score).toBe(88.39);
        expect(negBpsc4.score).toBe(88.39);
        expect(posBpsc4.negativeMarks).toBe(0.33);
        expect(negBpsc4.negativeMarks).toBe(0.33);
        expect(posBpsc4.correctCount).toBe(65);
        expect(posBpsc4.wrongCount).toBe(19);
        expect(posBpsc4.unansweredCount).toBe(19);
        expect(posBpsc4.accuracy).toBe(77.38);
        expect(posBpsc4.passed).toBe(true);
        expect(negBpsc4.passed).toBe(false);

        // BPSC 5-option (-0.25 / 0.25)
        // 65 * (150/103) - 19 * 0.25 = 94.660194... - 4.75 = 89.910194... -> 89.91
        const posBpsc5 = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: 0.25,
            passingMarks: 0,
        });
        const negBpsc5 = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: -0.25,
            passingMarks: 90,
        });

        expect(posBpsc5.score).toBe(89.91);
        expect(negBpsc5.score).toBe(89.91);
        expect(posBpsc5.negativeMarks).toBe(0.25);
        expect(posBpsc5.passed).toBe(true);
        expect(negBpsc5.passed).toBe(false);

        // Subject breakdown sign-normalization & 2-decimal rounding
        const marksPerQ = 150 / 103;
        const breakdown4Pos = computePreparedMockSubjectBreakdown(questions, answers, marksPerQ, 0.33);
        const breakdown4Neg = computePreparedMockSubjectBreakdown(questions, answers, marksPerQ, -0.33);
        expect(breakdown4Pos).toEqual(breakdown4Neg);

        const history4 = breakdown4Pos.find((b) => b.subject === 'History')!;
        expect(history4.correctCount).toBe(35);
        expect(history4.wrongCount).toBe(10);
        expect(history4.unansweredCount).toBe(5);
        // 35 * (150/103) - 10 * 0.33 = 50.97087 - 3.3 = 47.67
        expect(history4.marks).toBe(47.67);
        expect(history4.accuracy).toBe(77.8);

        const breakdown5Pos = computePreparedMockSubjectBreakdown(questions, answers, marksPerQ, 0.25);
        const breakdown5Neg = computePreparedMockSubjectBreakdown(questions, answers, marksPerQ, -0.25);
        expect(breakdown5Pos).toEqual(breakdown5Neg);

        const polity5 = breakdown5Pos.find((b) => b.subject === 'Polity')!;
        // 30 * (150/103) - 9 * 0.25 = 43.68932 - 2.25 = 41.44
        expect(polity5.marks).toBe(41.44);
        expect(polity5.unansweredCount).toBe(14);
    });

    it('queues offline attempt without __cbt_meta, coalesces concurrent flushOfflineQueue calls, skips foreign user_id, and invalidates post-replay caches', async () => {
        const backend = createBackendState();
        let resolveUpsert!: (val: { error: any }) => void;
        backend.upsertDeferred = {
            promise: new Promise((resolve) => {
                resolveUpsert = resolve;
            }),
            resolve: resolveUpsert,
        };
        setupSupabaseBackend(backend);

        const q1Id = makeUuid(1);
        const attemptUuid = '11111111-1111-4111-8111-111111111111';
        const state: PreparedMockActiveAttemptState = {
            attemptId: attemptUuid,
            testId: 'test-1',
            userId: mockUser.id,
            status: 'in_progress',
            startedAt: '2026-11-24T09:00:00Z',
            updatedAt: '2026-11-24T09:30:00Z',
            totalDurationSeconds: 7200,
            remainingSeconds: 5400,
            elapsedSeconds: 1800,
            currentIndex: 0,
            answers: {
                [q1Id]: 'Option A',
                __cbt_meta: 'must-be-stripped' as unknown as string,
            },
            markedForReview: [],
            visitedQuestionIds: [q1Id],
            timeSpentByQuestion: { [q1Id]: 40 },
            remotePersisted: false,
        };

        // Submit while offline
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        const submitRes = await submitPreparedMockAttempt({
            state,
            test: backend.tests[0],
            questions: [createQuestion(q1Id, 'History', 'Option A')],
        });

        expect(submitRes.remoteSynced).toBe(false);
        expect(backend.upsertCalls).toHaveLength(0);

        const queueAfterOfflineSubmit = useSyncStore.getState().queue;
        expect(queueAfterOfflineSubmit).toHaveLength(1);
        expect(queueAfterOfflineSubmit[0].type).toBe('mock_test_attempt_submit');
        expect(queueAfterOfflineSubmit[0].payload.id).toBe(attemptUuid);
        expect(queueAfterOfflineSubmit[0].payload.answers).toEqual({ [q1Id]: 'Option A' });
        expect(queueAfterOfflineSubmit[0].payload.answers.__cbt_meta).toBeUndefined();

        // Add a foreign user's event that must NOT be upserted or removed
        useSyncStore.getState().addEvent({
            type: 'mock_test_attempt_submit',
            payload: {
                id: '22222222-2222-4222-8222-222222222222',
                user_id: 'foreign-user-999',
                test_id: 'test-1',
                status: 'completed',
                score: 50,
                accuracy: 50,
                answers: {},
            },
        });
        expect(useSyncStore.getState().queue).toHaveLength(2);

        // Seed leaderboard cache & verify attempt detail cache exists prior to replay
        await fetchTestLeaderboard('test-1');
        expect(getCachedTestLeaderboardSnapshot('test-1')).not.toBeNull();
        expect(getCachedPreparedMockAttemptByIdSnapshot(attemptUuid)).not.toBeNull();

        const replayEvents: Array<{ scope?: string }> = [];
        const onReplayInvalidation = (e: Event) => {
            replayEvents.push((e as CustomEvent<{ scope?: string }>).detail || {});
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, onReplayInvalidation);

        try {
            // Come back online and fire 3 concurrent flushOfflineQueue calls
            Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });

            const p1 = syncService.flushOfflineQueue();
            const p2 = syncService.flushOfflineQueue();
            const p3 = syncService.flushOfflineQueue();

            await waitFor(() => {
                expect(backend.upsertCalls).toHaveLength(1);
            });

            resolveUpsert({ error: null });
            await Promise.all([p1, p2, p3]);

            // Only 1 upsert executed (inFlightEventQueueSync coalesced concurrent flushes)
            expect(backend.upsertCalls).toHaveLength(1);
            expect(backend.upsertCalls[0].payload.id).toBe(attemptUuid);
            expect(backend.upsertCalls[0].options).toEqual({ onConflict: 'id' });

            // Local event removed, foreign user_id event preserved
            const remainingQueue = useSyncStore.getState().queue;
            expect(remainingQueue).toHaveLength(1);
            expect(remainingQueue[0].payload.user_id).toBe('foreign-user-999');

            // Post-replay cache invalidation cleared leaderboard & emitted attempt_replay while preserving attempt detail
            expect(getCachedTestLeaderboardSnapshot('test-1')).toBeNull();
            expect(getCachedPreparedMockAttemptByIdSnapshot(attemptUuid)).not.toBeNull();
            expect(replayEvents.some((d) => d.scope === 'attempt_replay')).toBe(true);
        } finally {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, onReplayInvalidation);
        }
    });

    it('meets the <16ms budget for synchronous 120-test materialization/filtering and switches ExamPreparedMockTestsPage filter chips accurately', async () => {
        const catBpsc = { id: 'cat-bpsc', name: 'BPSC', is_active: true, display_order: 1 };
        const serFree = {
            id: 'ser-bpsc-free',
            category_id: 'cat-bpsc',
            name: 'BPSC Free 70th Prelims',
            slug: 'bpsc-free-70',
            is_premium: false,
            is_published: true,
            mock_categories: catBpsc,
        };
        const serPaid = {
            id: 'ser-bpsc-paid',
            category_id: 'cat-bpsc',
            name: 'BPSC Pro Sectional Pack',
            slug: 'bpsc-pro-sectional',
            is_premium: true,
            is_published: true,
            mock_categories: catBpsc,
        };

        const rawTests = Array.from({ length: 120 }, (_, i) => {
            const isFull = i % 2 === 0;
            const isFree = i % 3 === 0;
            const seriesObj = isFree ? serFree : serPaid;
            return {
                id: `perf-test-${i + 1}`,
                series_id: seriesObj.id,
                name: isFull ? `BPSC Full-Length Mock #${i + 1}` : `BPSC Sectional Test #${i + 1}`,
                duration_minutes: isFull ? 120 : 45,
                total_marks: isFull ? 150 : 50,
                passing_marks: isFull ? 95 : 30,
                negative_marks: 0.33,
                question_ids: isFull ? new Array(100).fill('q1') : new Array(40).fill('q1'),
                is_published: true,
                display_order: i + 1,
                release_date: null,
                expiry_date: null,
                mock_series: seriesObj,
            };
        });

        const exam = resolveCanonicalExamSlug('bpsc')!;
        const attemptedIds = rawTests.slice(0, 20).map((t) => t.id);

        const t0 = performance.now();
        const materialized = materializePreparedMockTests(
            exam,
            [catBpsc],
            [serFree, serPaid],
            rawTests,
            attemptedIds,
            Date.now(),
            'cache'
        );
        const fullLengthList = materialized.tests.filter((t) => t.is_full_length);
        const freeList = materialized.tests.filter((t) => t.is_free);
        const elapsedMs = performance.now() - t0;

        expect(materialized.tests).toHaveLength(120);
        expect(fullLengthList).toHaveLength(60);
        expect(freeList).toHaveLength(40);
        expect(elapsedMs).toBeLessThan(16);

        // Seed 120 tests into catalog cache & render ExamPreparedMockTestsPage
        const backend = createBackendState();
        backend.categories = [catBpsc];
        backend.series = [serFree, serPaid];
        backend.tests = rawTests;
        backend.attempts = attemptedIds.map((testId) => ({ test_id: testId, status: 'completed' }));
        setupSupabaseBackend(backend);

        await fetchPreparedMockTestsByExam('bpsc', { userId: mockUser.id });

        render(
            <MemoryRouter initialEntries={[ROUTES.TEST_SERIES.BPSC]}>
                <Routes>
                    <Route path={ROUTES.TEST_SERIES.BPSC} element={<ExamPreparedMockTestsPage />} />
                </Routes>
            </MemoryRouter>
        );

        const filterGroup = screen.getByRole('group', { name: 'Mock test category filters' });
        const allChip = within(filterGroup).getByRole('button', { name: /All\s+120/i });
        const fullLengthChip = within(filterGroup).getByRole('button', { name: /Full-Length\s+60/i });
        const freeChip = within(filterGroup).getByRole('button', { name: /Free\s+40/i });

        expect(allChip.getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #1' })).toBeTruthy();
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC Sectional Test #2' })).toBeTruthy();
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #3' })).toBeTruthy();
        expect(screen.getByRole('heading', { level: 3, name: 'BPSC Sectional Test #4' })).toBeTruthy();

        fireEvent.click(fullLengthChip);
        await waitFor(() => {
            expect(fullLengthChip.getAttribute('aria-pressed')).toBe('true');
            expect(screen.getByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #1' })).toBeTruthy();
            expect(screen.getByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #3' })).toBeTruthy();
            expect(screen.queryByRole('heading', { level: 3, name: 'BPSC Sectional Test #2' })).toBeNull();
            expect(screen.queryByRole('heading', { level: 3, name: 'BPSC Sectional Test #4' })).toBeNull();
        });

        fireEvent.click(freeChip);
        await waitFor(() => {
            expect(freeChip.getAttribute('aria-pressed')).toBe('true');
            expect(screen.getByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #1' })).toBeTruthy();
            expect(screen.getByRole('heading', { level: 3, name: 'BPSC Sectional Test #4' })).toBeTruthy();
            expect(screen.queryByRole('heading', { level: 3, name: 'BPSC Full-Length Mock #3' })).toBeNull();
            expect(screen.queryByRole('heading', { level: 3, name: 'BPSC Sectional Test #2' })).toBeNull();
        });
    });

    it('fetches published mock series catalog with schedule-window counts, series_type across 3-tier SWR cache, and invalidation support', async () => {
        const backend = createBackendState();
        const nowMs = Date.parse('2026-11-24T12:00:00Z');
        backend.series.push({
            id: 'ser-bpsc-pyq',
            category_id: 'cat-bpsc',
            name: 'BPSC Official PYQ Archive',
            slug: 'bpsc-pyq-archive',
            series_type: 'PYQ',
            is_premium: false,
            is_published: true,
            mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
        });
        backend.tests.push({
            id: 'test-expired',
            series_id: 'ser-bpsc-1',
            name: 'Expired Paper',
            is_published: true,
            release_date: '2026-11-01T00:00:00Z',
            expiry_date: '2026-11-20T00:00:00Z',
        });
        setupSupabaseBackend(backend);

        const res1 = await fetchAllPublishedMockSeriesCatalog({ nowMs });
        expect(res1.source).toBe('network');
        expect(res1.categories).toHaveLength(1);
        expect(res1.series).toHaveLength(2);
        const mockSeries1 = res1.series.find((s) => s.id === 'ser-bpsc-1');
        const pyqSeries1 = res1.series.find((s) => s.id === 'ser-bpsc-pyq');
        expect(mockSeries1?.category_name).toBe('BPSC');
        expect(mockSeries1?.published_test_count).toBe(2);
        expect(mockSeries1?.series_type).toBe('MOCK');
        expect(pyqSeries1?.series_type).toBe('PYQ');

        const callsAfterFirst = backend.callCounts[`select:${DB_TABLES.MOCK.SERIES}`];
        const res2 = await fetchAllPublishedMockSeriesCatalog({ nowMs });
        expect(res2.source).toBe('cache');
        expect(backend.callCounts[`select:${DB_TABLES.MOCK.SERIES}`]).toBe(callsAfterFirst);
        expect(res2.series.find((s) => s.id === 'ser-bpsc-1')?.series_type).toBe('MOCK');
        expect(res2.series.find((s) => s.id === 'ser-bpsc-pyq')?.series_type).toBe('PYQ');

        // Cold Memory + localStorage hydrates from IndexedDB preserving series_type
        const idbEntry = syncMetadataMap.get('mock_series_catalog_v1');
        expect(idbEntry).toBeDefined();
        invalidateMockTestsCatalogCaches();
        expect(getCachedAllPublishedMockSeriesCatalogSnapshot(nowMs)).toBeNull();
        expect(syncMetadataMap.has('mock_series_catalog_v1')).toBe(false);

        syncMetadataMap.set('mock_series_catalog_v1', idbEntry!);
        const hydrated = await readAllPublishedMockSeriesCatalogIndexedDBCache(nowMs);
        expect(hydrated?.series.find((s) => s.id === 'ser-bpsc-1')?.published_test_count).toBe(2);
        expect(hydrated?.series.find((s) => s.id === 'ser-bpsc-1')?.series_type).toBe('MOCK');
        expect(hydrated?.series.find((s) => s.id === 'ser-bpsc-pyq')?.series_type).toBe('PYQ');
    });
});
