/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
    ADMIN_TEST_ANALYTICS_IDB_PREFIX,
    ADMIN_TEST_ANALYTICS_STORAGE_PREFIX,
    ATTEMPTS_PAGE_SIZE,
    MAX_ANALYTICS_ATTEMPTS,
    computeMockTestAnalytics,
    fetchMockTestAnalytics,
    getCachedMockTestAnalyticsSnapshot,
    invalidateMockTestAnalyticsCache,
    memoryTestAnalyticsCache,
    readMockTestAnalyticsIndexedDBCache,
    stripHtmlToSnippet,
} from '../api/adminTestSeriesApi';
import { AdminTestAnalyticsDrawer } from '../components/AdminTestAnalyticsDrawer';
import { AdminTestSeriesDashboard } from '../pages/AdminTestSeriesDashboard';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { DB_TABLES } from '@/config/dbTables';

const { fromMock, idbCacheStore, getCacheEntryMock, setCacheEntryMock } = vi.hoisted(() => {
    const store = new Map<string, { key: string; data: unknown; updatedAt: number }>();
    return {
        fromMock: vi.fn(),
        idbCacheStore: store,
        getCacheEntryMock: vi.fn(async (key: string) => store.get(key) ?? null),
        setCacheEntryMock: vi.fn(async (key: string, data: unknown) => {
            store.set(key, { key, data, updatedAt: Date.now() });
        }),
    };
});

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
    },
}));

interface MockAnalyticsDbState {
    categories: any[];
    series: any[];
    tests: any[];
    attemptsByTestId: Record<string, any[]>;
    questionsById: Record<string, any>;
    attemptsFetchErrorForTestId?: Record<string, string>;
    onAttemptsFetch?: (testId: string, offset: number, limit: number) => Promise<any[]>;
}

const createSupabaseAnalyticsMock = (state: MockAnalyticsDbState) => {
    const calls = {
        queriedTables: [] as string[],
        attemptRanges: [] as Array<{ testId: string; from: number; to: number }>,
        attemptSelects: [] as string[],
        questionChunks: [] as string[][],
        questionDeletedAtNullChecked: false,
        previewQuestionIds: [] as string[],
        deletedTestIds: [] as string[],
    };

    fromMock.mockImplementation((table: string) => {
        calls.queriedTables.push(table);

        if (table === DB_TABLES.MOCK.CATEGORIES) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        order: vi.fn(() => chain),
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
                    const chain: any = {
                        order: vi.fn(() => chain),
                        eq: vi.fn(() => chain),
                        then: (resolve: any, reject: any) =>
                            Promise.resolve({ data: state.series, error: null }).then(resolve, reject),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    let filterId: string | null = null;
                    const chain: any = {
                        order: vi.fn(() => chain),
                        eq: vi.fn((col: string, val: string) => {
                            if (col === 'id') filterId = val;
                            return chain;
                        }),
                        single: vi.fn(async () => {
                            const matched = state.tests.find((t) => t.id === filterId) ?? null;
                            return {
                                data: matched,
                                error: matched ? null : { message: 'Test not found' },
                            };
                        }),
                        then: (resolve: any, reject: any) =>
                            Promise.resolve({ data: state.tests, error: null }).then(resolve, reject),
                    };
                    return chain;
                }),
                delete: vi.fn(() => ({
                    eq: vi.fn(async (_col: string, id: string) => {
                        calls.deletedTestIds.push(id);
                        state.tests = state.tests.filter((t) => t.id !== id);
                        return { error: null };
                    }),
                })),
            };
        }

        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return {
                select: vi.fn((selectCols: string) => {
                    calls.attemptSelects.push(selectCols);
                    let targetTestId = '';
                    let rangeFrom = 0;
                    let rangeTo = ATTEMPTS_PAGE_SIZE - 1;
                    const chain: any = {
                        eq: vi.fn((col: string, val: string) => {
                            if (col === 'test_id') targetTestId = val;
                            return chain;
                        }),
                        order: vi.fn(() => chain),
                        range: vi.fn(async (from: number, to: number) => {
                            rangeFrom = from;
                            rangeTo = to;
                            calls.attemptRanges.push({ testId: targetTestId, from, to });

                            const errMsg = state.attemptsFetchErrorForTestId?.[targetTestId];
                            if (errMsg) {
                                return { data: null, error: { message: errMsg } };
                            }

                            if (state.onAttemptsFetch) {
                                const custom = await state.onAttemptsFetch(
                                    targetTestId,
                                    rangeFrom,
                                    rangeTo - rangeFrom + 1
                                );
                                return { data: custom, error: null };
                            }

                            const rows = state.attemptsByTestId[targetTestId] ?? [];
                            return {
                                data: rows.slice(rangeFrom, rangeTo + 1),
                                error: null,
                            };
                        }),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.BANK.QUESTIONS) {
            return {
                select: vi.fn(() => {
                    let previewId: string | null = null;
                    const chain: any = {
                        is: vi.fn((col: string, val: any) => {
                            if (col === 'deleted_at' && val === null) {
                                calls.questionDeletedAtNullChecked = true;
                            }
                            return chain;
                        }),
                        in: vi.fn(async (_col: string, ids: string[]) => {
                            calls.questionChunks.push(ids);
                            const matched = ids
                                .map((id) => state.questionsById[id])
                                .filter((q) => Boolean(q) && !q.deleted_at);
                            return { data: matched, error: null };
                        }),
                        eq: vi.fn((col: string, val: string) => {
                            if (col === 'id') previewId = val;
                            return chain;
                        }),
                        single: vi.fn(async () => {
                            if (previewId) calls.previewQuestionIds.push(previewId);
                            const q = previewId ? state.questionsById[previewId] ?? null : null;
                            return {
                                data: q,
                                error: q ? null : { message: 'Question not found' },
                            };
                        }),
                    };
                    return chain;
                }),
            };
        }

        if (table === 'analytics_events') {
            return {
                insert: vi.fn(async () => ({ error: null })),
            };
        }

        throw new Error(`Unexpected table queried: ${table}`);
    });

    return calls;
};

const makeRichState = (): MockAnalyticsDbState => {
    const cat = { id: 'cat-bpsc', name: 'BPSC', display_order: 1, is_active: true };
    const series = {
        id: 'ser-bpsc-1',
        category_id: 'cat-bpsc',
        name: '70th BPSC Prelims',
        is_published: true,
        mock_categories: { id: 'cat-bpsc', name: 'BPSC' },
    };

    const questionIds = ['q-1', 'q-2', 'q-3', 'q-4', 'q-5', 'q-6', 'q-archived'];
    const questionsById: Record<string, any> = {
        'q-1': {
            id: 'q-1',
            v1_id: 'BPSC-001',
            question: '<p>Who founded <b>Nalanda</b>&nbsp;University &amp; Vikramshila?</p>',
            subject: 'History',
            difficulty: 'Hard',
            correct: 'A',
            options: [
                { key: 'A', value: 'Kumaragupta I' },
                { key: 'B', value: 'Ashoka' },
            ],
            explanation: { fact: 'Founded in 5th century CE.' },
            deleted_at: null,
        },
        'q-2': {
            id: 'q-2',
            v1_id: 'BPSC-002',
            question: 'What is &quot;Article 356&quot; &lt;Constitutional&gt;?',
            subject: 'Polity',
            difficulty: 'Medium',
            correct: 'B',
            options: [
                { key: 'A', value: 'Financial Emergency' },
                { key: 'B', value: 'President&#39;s Rule' },
            ],
            deleted_at: null,
        },
        'q-3': {
            id: 'q-3',
            v1_id: 'BPSC-003',
            question: '<p>River Son joins Ganga near Patna.</p>',
            subject: 'Geography',
            difficulty: 'Easy',
            correct: 'C',
            options: [{ key: 'C', value: 'Danapur' }],
            deleted_at: null,
        },
        'q-4': {
            id: 'q-4',
            v1_id: 'BPSC-004',
            question: '<p>Repo rate is set by RBI&#39;s MPC.</p>',
            subject: 'Economy',
            difficulty: 'Medium',
            correct: 'A',
            options: [{ key: 'A', value: 'Monetary Policy Committee' }],
            deleted_at: null,
        },
        'q-5': {
            id: 'q-5',
            v1_id: 'BPSC-005',
            question: '<p>SI unit of luminous intensity is Candela.</p>',
            subject: 'Science',
            difficulty: 'Easy',
            correct: 'D',
            options: [{ key: 'D', value: 'Candela' }],
            deleted_at: null,
        },
        'q-6': {
            id: 'q-6',
            v1_id: 'BPSC-006',
            question: '<p>1917 Champaran Satyagraha year.</p>',
            subject: 'History',
            difficulty: 'Easy',
            correct: 'B',
            options: [{ key: 'B', value: '1917' }],
            deleted_at: null,
        },
        'q-archived': {
            id: 'q-archived',
            v1_id: 'BPSC-999',
            question: '<p>Archived deleted question</p>',
            subject: 'Misc',
            difficulty: 'Hard',
            correct: 'A',
            deleted_at: '2026-11-01T00:00:00Z',
        },
    };

    const testPrimary = {
        id: 'test-analytics-1',
        series_id: 'ser-bpsc-1',
        name: 'BPSC GS Full Test 1',
        description: 'Comprehensive prelims mock',
        duration_minutes: 120,
        total_marks: 100,
        passing_marks: 50,
        negative_marks: 0.33,
        question_ids: questionIds,
        is_published: true,
        display_order: 1,
        created_at: '2026-11-20T10:00:00Z',
        mock_series: series,
    };

    const testZeroAttempts = {
        id: 'test-empty-2',
        series_id: 'ser-bpsc-1',
        name: 'BPSC Empty Mock',
        description: 'Zero attempts yet',
        duration_minutes: 60,
        total_marks: 100,
        passing_marks: 0,
        negative_marks: 0,
        question_ids: ['q-1', 'q-2'],
        is_published: false,
        display_order: 2,
        created_at: '2026-11-20T09:00:00Z',
        mock_series: series,
    };

    const attempts = [
        // Student 1 attempt 1 (completed, pass >= 50)
        {
            id: 'att-1',
            user_id: 'stu-1',
            status: 'completed',
            score: 85,
            accuracy: 85,
            time_taken_seconds: 1800,
            answers: {
                __cbt_meta: { currentIndex: 2, savedAt: 12345 },
                'q-1': 'B', // wrong
                'q-2': ' B ', // correct (trimmed)
                'q-3': 'C',
                'q-4': 'A',
                'q-5': 'D',
                'q-6': 'B',
                'q-archived': '',
            },
        },
        // Student 1 retake (completed, 45 < 50)
        {
            id: 'att-2',
            user_id: 'stu-1',
            status: 'completed',
            score: 45,
            accuracy: 50,
            time_taken_seconds: 2400,
            answers: {
                'q-1': 'B', // wrong
                'q-2': 'B', // correct
                'q-3': '', // skipped
                'q-4': 'B', // wrong
                'q-5': 'D', // correct
                'q-6': ' ', // skipped
            },
        },
        // Student 2 (completed, 65 >= 50)
        {
            id: 'att-3',
            user_id: 'stu-2',
            status: 'completed',
            score: 65,
            accuracy: 70,
            time_taken_seconds: 1200,
            answers: {
                'q-1': 'A', // correct
                'q-2': 'A', // wrong
                'q-3': 'C', // correct
                'q-4': '', // skipped
                'q-5': 'D', // correct
                'q-6': 'B', // correct
            },
        },
        // Student 3 (completed, 30 < 50)
        {
            id: 'att-4',
            user_id: 'stu-3',
            status: 'completed',
            score: 30,
            accuracy: 35,
            time_taken_seconds: 600,
            answers: {
                'q-1': 'B', // wrong
                'q-2': 'C', // wrong
                'q-3': '', // skipped
                'q-4': '', // skipped
                'q-5': 'A', // wrong
                'q-6': '', // skipped
            },
        },
        // Student 4 (in_progress — must NOT skew scores or question diagnostics)
        {
            id: 'att-5',
            user_id: 'stu-4',
            status: 'in_progress',
            score: 99,
            accuracy: 99,
            time_taken_seconds: 300,
            answers: { 'q-1': 'A' },
        },
        // Student 5 (abandoned)
        {
            id: 'att-6',
            user_id: 'stu-5',
            status: 'abandoned',
            score: 10,
            accuracy: 10,
            time_taken_seconds: 120,
            answers: {},
        },
    ];

    return {
        categories: [cat],
        series: [series],
        tests: [testPrimary, testZeroAttempts],
        attemptsByTestId: {
            'test-analytics-1': attempts,
            'test-empty-2': [],
        },
        questionsById,
    };
};

describe('Admin Mock Test Analytics & Quality Inspector (v1.0.376)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        idbCacheStore.clear();
        memoryTestAnalyticsCache.clear();
        window.localStorage.clear();
        useNotificationStore.setState({ toasts: [], activePopup: null });

        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
        });

        HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
            this.setAttribute('open', '');
        });
        HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('1. Pure Aggregation Math, Retakes, Median, HTML & __cbt_meta', () => {
        it('decodes HTML entities and collapses whitespace in stripHtmlToSnippet', () => {
            expect(
                stripHtmlToSnippet(
                    '<p>Who&nbsp;wrote &quot;India&quot; &amp; &lt;History&gt;&#39;s   story?</p>'
                )
            ).toBe('Who wrote "India" & <History>\'s story?');
            expect(stripHtmlToSnippet('<p>1234567890</p>', 7)).toBe('123456…');
            expect(stripHtmlToSnippet(null)).toBe('');
        });

        it('computes retakes, uniqueStudents, even median, score bands, pass cutoff, __cbt_meta, and missing/soft-deleted questions', async () => {
            const state = makeRichState();
            const test = state.tests[0];
            const attempts = state.attemptsByTestId[test.id];
            const questions = Object.values(state.questionsById);

            const dto = await computeMockTestAnalytics({
                test,
                attempts,
                questions,
                computedAt: 1700000000000,
            });

            // 6 total attempts, 5 unique students (stu-1 retook once)
            expect(dto.totalAttempts).toBe(6);
            expect(dto.completedAttempts).toBe(4);
            expect(dto.inProgressAttempts).toBe(1);
            expect(dto.abandonedAttempts).toBe(1);
            expect(dto.uniqueStudents).toBe(5);
            expect(dto.completionRatePct).toBe(66.7);

            // Scores across completed [30, 45, 65, 85] -> avg 56.25, even median (45+65)/2 = 55
            expect(dto.averageScore).toBe(56.25);
            expect(dto.medianScore).toBe(55);
            expect(dto.highestScore).toBe(85);
            expect(dto.lowestScore).toBe(30);
            expect(dto.averageAccuracyPct).toBe(60); // (85+50+70+35)/4 = 60
            expect(dto.averageTimeSeconds).toBe(1500); // (1800+2400+1200+600)/4 = 1500

            // Pass cutoff = 50 -> 65 and 85 pass (2 of 4 = 50%)
            expect(dto.hasPassCutoff).toBe(true);
            expect(dto.passedCount).toBe(2);
            expect(dto.failedCount).toBe(2);
            expect(dto.passRatePct).toBe(50);

            // Score bands: 30 (<40%), 45 (40-59%), 65 (60-79%), 85 (>=80%) -> 1 each (25%)
            expect(dto.scoreDistribution.map((b) => ({ key: b.key, count: b.count, pct: b.percentage }))).toEqual([
                { key: 'under_40', count: 1, pct: 25 },
                { key: '40_to_59', count: 1, pct: 25 },
                { key: '60_to_79', count: 1, pct: 25 },
                { key: '80_plus', count: 1, pct: 25 },
            ]);

            // Archived/soft-deleted question flagged and never includes __cbt_meta as a question
            expect(dto.allQuestionDiagnostics.some((q) => q.questionId === '__cbt_meta')).toBe(false);
            const archived = dto.allQuestionDiagnostics.find((q) => q.questionId === 'q-archived');
            expect(archived).toBeTruthy();
            expect(archived?.isMissingFromBank).toBe(true);
            expect(archived?.questionText).toBe('Question unavailable or archived in question bank');
            expect(archived?.skippedCount).toBe(4);

            // q-1: 1 correct (stu-2), 3 wrong -> 25% accuracy -> hardest!
            expect(dto.hardestQuestions).toHaveLength(5);
            expect(dto.hardestQuestions[0].questionId).toBe('q-1');
            expect(dto.hardestQuestions[0].accuracyPct).toBe(25);
            expect(dto.hardestQuestions[0].incorrectCount).toBe(3);

            // q-archived, q-3, q-4, q-6 have skippedCount > 0 (4 total); q-archived is top (100% skip rate)
            expect(dto.mostSkippedQuestions).toHaveLength(4);
            expect(dto.mostSkippedQuestions[0].questionId).toBe('q-archived');
            expect(dto.mostSkippedQuestions[0].skipRatePct).toBe(100);

            // Strict zero-PII check on returned DTO
            const serialized = JSON.stringify(dto);
            expect(serialized).not.toContain('stu-1');
            expect(serialized).not.toContain('__cbt_meta');
            expect(serialized).not.toContain('"answers"');
            expect(serialized).not.toContain('"user_id"');
        });

        it('computes odd median and handles passing_marks = 0 and zero completed attempts', async () => {
            const state = makeRichState();
            const testNoCutoff = { ...state.tests[1], passing_marks: 0, total_marks: 100 };

            const oddDto = await computeMockTestAnalytics({
                test: testNoCutoff,
                attempts: [
                    { user_id: 'u1', status: 'completed', score: 20, accuracy: 20, time_taken_seconds: 0, answers: {} },
                    { user_id: 'u2', status: 'completed', score: 70, accuracy: 70, time_taken_seconds: 100, answers: {} },
                    { user_id: 'u3', status: 'completed', score: 90, accuracy: 90, time_taken_seconds: 200, answers: {} },
                ],
                questions: Object.values(state.questionsById),
            });

            expect(oddDto.medianScore).toBe(70);
            expect(oddDto.averageTimeSeconds).toBe(150); // ignores 0s
            expect(oddDto.hasPassCutoff).toBe(false);
            expect(oddDto.passedCount).toBe(3);
            expect(oddDto.failedCount).toBe(0);
            expect(oddDto.passRatePct).toBeNull();

            const inProgressOnlyDto = await computeMockTestAnalytics({
                test: state.tests[0],
                attempts: [{ user_id: 'u1', status: 'in_progress', score: 50, answers: { 'q-1': 'A' } }],
                questions: Object.values(state.questionsById),
            });

            expect(inProgressOnlyDto.totalAttempts).toBe(1);
            expect(inProgressOnlyDto.completedAttempts).toBe(0);
            expect(inProgressOnlyDto.averageScore).toBeNull();
            expect(inProgressOnlyDto.medianScore).toBeNull();
            expect(inProgressOnlyDto.highestScore).toBeNull();
            expect(inProgressOnlyDto.lowestScore).toBeNull();
            expect(inProgressOnlyDto.averageAccuracyPct).toBeNull();
            expect(inProgressOnlyDto.averageTimeSeconds).toBeNull();
            expect(inProgressOnlyDto.passRatePct).toBeNull();
        });
    });

    describe('2. Pagination, 100-UUID Chunking, Zero-PII Storage & 3-Tier SWR Cache', () => {
        it('paginates 505 attempts across 2 pages, chunks 125 question UUIDs into 100+25, never queries profiles, and strips PII from caches', async () => {
            const uuids = Array.from({ length: 125 }, (_, i) => {
                const hex = i.toString(16).padStart(12, '0');
                return `00000000-0000-4000-8000-${hex}`;
            });
            const questionsById: Record<string, any> = {};
            for (let i = 0; i < 120; i++) {
                questionsById[uuids[i]] = {
                    id: uuids[i],
                    v1_id: `Q-${i + 1}`,
                    question: `<p>Question ${i + 1}</p>`,
                    subject: 'GS',
                    difficulty: 'Medium',
                    correct: 'A',
                    deleted_at: null,
                };
            }

            const attempts505 = Array.from({ length: 505 }, (_, idx) => ({
                id: `att-${idx}`,
                user_id: `secret-student-${idx % 250}`,
                status: 'completed',
                score: 60,
                accuracy: 60,
                time_taken_seconds: 900,
                answers: { [uuids[0]]: 'A', __cbt_meta: { ts: idx } },
            }));

            const state: MockAnalyticsDbState = {
                categories: [],
                series: [],
                tests: [
                    {
                        id: 'test-125q',
                        name: '125Q Mega Mock',
                        total_marks: 125,
                        passing_marks: 50,
                        negative_marks: 0,
                        duration_minutes: 90,
                        question_ids: uuids,
                        is_published: true,
                        mock_series: { name: 'Mega Series', mock_categories: { name: 'UPSC' } },
                    },
                ],
                attemptsByTestId: { 'test-125q': attempts505 },
                questionsById,
            };

            const calls = createSupabaseAnalyticsMock(state);
            const result = await fetchMockTestAnalytics('test-125q');

            expect(calls.queriedTables).not.toContain('profiles');
            expect(calls.attemptRanges).toEqual([
                { testId: 'test-125q', from: 0, to: ATTEMPTS_PAGE_SIZE - 1 },
                { testId: 'test-125q', from: ATTEMPTS_PAGE_SIZE, to: ATTEMPTS_PAGE_SIZE * 2 - 1 },
            ]);
            expect(calls.questionDeletedAtNullChecked).toBe(true);
            expect(calls.questionChunks).toHaveLength(2);
            expect(calls.questionChunks[0]).toHaveLength(100);
            expect(calls.questionChunks[1]).toHaveLength(25);

            expect(result.totalAttempts).toBe(505);
            expect(result.uniqueStudents).toBe(250);
            expect(result.isSampled).toBe(false);
            expect(result.sampledLimit).toBe(MAX_ANALYTICS_ATTEMPTS);
            expect(result.allQuestionDiagnostics.filter((q) => q.isMissingFromBank)).toHaveLength(5);

            // Check localStorage & IDB payloads have zero student PII
            const lsRaw = window.localStorage.getItem(`${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}test-125q`);
            expect(lsRaw).toBeTruthy();
            expect(lsRaw).not.toContain('secret-student');
            expect(lsRaw).not.toContain('__cbt_meta');
            expect(lsRaw).not.toContain('"user_id"');
            expect(lsRaw).not.toContain('"answers"');

            expect(setCacheEntryMock).toHaveBeenCalledTimes(1);
            const [idbKey, idbPayload] = setCacheEntryMock.mock.calls[0];
            expect(idbKey).toBe(`${ADMIN_TEST_ANALYTICS_IDB_PREFIX}test-125q`);
            const idbRaw = JSON.stringify(idbPayload);
            expect(idbRaw).not.toContain('secret-student');
            expect(idbRaw).not.toContain('"answers"');

            // 0ms SWR cache lookup + IndexedDB fallback + invalidation
            expect(getCachedMockTestAnalyticsSnapshot('test-125q')?.totalAttempts).toBe(505);

            memoryTestAnalyticsCache.clear();
            window.localStorage.clear();
            const fromIdb = await readMockTestAnalyticsIndexedDBCache('test-125q');
            expect(fromIdb?.totalAttempts).toBe(505);

            invalidateMockTestAnalyticsCache('test-125q');
            expect(getCachedMockTestAnalyticsSnapshot('test-125q')).toBeNull();
            expect(await readMockTestAnalyticsIndexedDBCache('test-125q')).toBeNull();
        });

        it('rejects tampered cached snapshots containing PII keys', () => {
            window.localStorage.setItem(
                `${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}bad-test`,
                JSON.stringify({
                    testId: 'bad-test',
                    testName: 'Bad',
                    seriesName: 'S',
                    totalQuestions: 1,
                    totalMarks: 10,
                    passingMarks: 0,
                    negativeMarks: 0,
                    durationMinutes: 10,
                    totalAttempts: 1,
                    completedAttempts: 1,
                    inProgressAttempts: 0,
                    abandonedAttempts: 0,
                    uniqueStudents: 1,
                    completionRatePct: 100,
                    passedCount: 1,
                    failedCount: 0,
                    computedAt: Date.now(),
                    scoreDistribution: [],
                    hardestQuestions: [],
                    mostSkippedQuestions: [],
                    allQuestionDiagnostics: [],
                    user_id: 'leaked-uid',
                })
            );
            expect(getCachedMockTestAnalyticsSnapshot('bad-test')).toBeNull();
        });
    });

    describe('3. Full UI Integration, SWR Race Protection, Swipe & Accessibility', () => {
        it('opens insights from TestCard, renders KPIs & quality tabs, expands all questions, launches QuestionPreviewDrawer, and invalidates on delete', async () => {
            const state = makeRichState();
            const calls = createSupabaseAnalyticsMock(state);

            const { container } = render(
                <MemoryRouter initialEntries={['/admin/test-series?tab=tests']}>
                    <AdminTestSeriesDashboard />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BPSC GS Full Test 1')).toBeTruthy();
            });

            const insightsBtn = screen.getByRole('button', {
                name: 'View insights for BPSC GS Full Test 1',
            });
            expect(insightsBtn.getAttribute('type')).toBe('button');
            expect(insightsBtn.className).toContain('min-h-[44px]');

            fireEvent.click(insightsBtn);

            await waitFor(() => {
                expect(screen.getByText('Test Insights & Quality')).toBeTruthy();
                expect(screen.getByText('5 unique students')).toBeTruthy();
                expect(screen.getByText('66.7%')).toBeTruthy();
                expect(screen.getByText('56.25 / 100')).toBeTruthy();
                expect(screen.getByText('25m')).toBeTruthy();
                expect(screen.getByText(/Pass \(≥50\): 2 \(50%\)/)).toBeTruthy();
                expect(screen.getByText(/Below Cutoff: 2/)).toBeTruthy();
            });

            // Hardest Questions tab is active by default (top 5 shown out of 7)
            expect(screen.getByText(/Who founded Nalanda University & Vikramshila\?/)).toBeTruthy();
            const showAllBtn = screen.getByRole('button', { name: 'Show all 7 questions' });
            fireEvent.click(showAllBtn);

            await waitFor(() => {
                expect(screen.getByText('Question unavailable or archived in question bank')).toBeTruthy();
                expect(screen.getByRole('button', { name: 'Question 7 archived' })).toBeTruthy();
            });

            const archivedBtn = screen.getByRole('button', { name: 'Question 7 archived' }) as HTMLButtonElement;
            expect(archivedBtn.disabled).toBe(true);

            // Switch to Most Skipped tab
            fireEvent.click(screen.getByRole('tab', { name: 'Most Skipped' }));
            fireEvent.click(screen.getByRole('button', { name: 'Show top 5' }));
            await waitFor(() => {
                expect(screen.getByText(/Skip Rate: 100%/)).toBeTruthy();
            });

            // Switch back to Hardest Questions and preview Q1 -> opens QuestionPreviewDrawer on top
            fireEvent.click(screen.getByRole('tab', { name: 'Hardest Questions' }));
            fireEvent.click(screen.getByRole('button', { name: 'Preview question 1' }));

            await waitFor(() => {
                expect(screen.getByText('Question Preview')).toBeTruthy();
                expect(calls.previewQuestionIds).toContain('q-1');
                expect(screen.getByText('Kumaragupta I')).toBeTruthy();
            });

            // Close QuestionPreviewDrawer -> Test Insights drawer remains open underneath
            const closeButtons = screen.getAllByRole('button', { name: 'Close drawer' });
            fireEvent.click(closeButtons[closeButtons.length - 1]);

            await waitFor(() => {
                expect(screen.queryByText('Question Preview')).toBeNull();
                expect(screen.getByText('Test Insights & Quality')).toBeTruthy();
            });

            // Verify zero missing button types and >=44px touch targets inside drawer
            expect(container.querySelectorAll('button:not([type="button"])').length).toBe(0);
            const drawerDialog = screen.getByText('Test Insights & Quality').closest('dialog')!;
            const drawerButtons = Array.from(drawerDialog.querySelectorAll('button'));
            for (const btn of drawerButtons) {
                expect(btn.getAttribute('type')).toBe('button');
                expect(btn.className).toContain('min-h-[44px]');
            }

            // Close Insights Drawer and delete test -> invalidates cached analytics
            fireEvent.click(within(drawerDialog).getByRole('button', { name: 'Close drawer' }));
            await waitFor(() => {
                expect(screen.queryByText('Test Insights & Quality')).toBeNull();
            });

            expect(getCachedMockTestAnalyticsSnapshot('test-analytics-1')).not.toBeNull();
            fireEvent.click(screen.getByRole('button', { name: 'Delete BPSC GS Full Test 1' }));
            await waitFor(() => expect(screen.getByText('Delete Mock Test?')).toBeTruthy());
            fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));

            await waitFor(() => {
                expect(calls.deletedTestIds).toEqual(['test-analytics-1']);
                expect(getCachedMockTestAnalyticsSnapshot('test-analytics-1')).toBeNull();
            });
        });

        it('protects against stale-response races when switching tests rapidly and handles empty, offline, error recovery, and swipe-right dismissal', async () => {
            const state = makeRichState();
            let resolveSlowA!: (rows: any[]) => void;
            state.onAttemptsFetch = async (testId) => {
                if (testId === 'test-analytics-1') {
                    return await new Promise<any[]>((resolve) => {
                        resolveSlowA = resolve;
                    });
                }
                return state.attemptsByTestId[testId] ?? [];
            };
            createSupabaseAnalyticsMock(state);

            const onClose = vi.fn();
            const onPreview = vi.fn();

            const { rerender } = render(
                <AdminTestAnalyticsDrawer
                    isOpen={true}
                    onClose={onClose}
                    test={state.tests[0]}
                    onPreviewQuestion={onPreview}
                />
            );

            await waitFor(() => {
                expect(typeof resolveSlowA).toBe('function');
            });

            // Switch to Test 2 (zero attempts) before Test 1 resolves
            rerender(
                <AdminTestAnalyticsDrawer
                    isOpen={true}
                    onClose={onClose}
                    test={state.tests[1]}
                    onPreviewQuestion={onPreview}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('No Student Attempts Yet')).toBeTruthy();
            });

            // Now resolve slow Test 1 late -> must NOT overwrite Test 2's empty state
            await act(async () => {
                resolveSlowA(state.attemptsByTestId['test-analytics-1']);
            });
            expect(screen.getByText('No Student Attempts Yet')).toBeTruthy();
            expect(screen.queryByText('5 unique students')).toBeNull();

            // Error + Retry recovery
            state.onAttemptsFetch = undefined;
            state.attemptsFetchErrorForTestId = { 'test-err': 'Network timeout' };
            const errTest = { ...state.tests[1], id: 'test-err', name: 'Broken Test' };
            rerender(
                <AdminTestAnalyticsDrawer
                    isOpen={true}
                    onClose={onClose}
                    test={errTest}
                    onPreviewQuestion={onPreview}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Unable to Load Insights')).toBeTruthy();
                expect(screen.getByText('Network timeout')).toBeTruthy();
            });

            // Clear error and click Retry
            delete state.attemptsFetchErrorForTestId['test-err'];
            state.attemptsByTestId['test-err'] = [
                {
                    id: 'att-ip',
                    user_id: 'stu-9',
                    status: 'in_progress',
                    score: 0,
                    answers: {},
                },
            ];
            fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

            await waitFor(() => {
                expect(screen.getByText('Attempts In Progress Only')).toBeTruthy();
            });

            // Offline banner check with cached snapshot
            Object.defineProperty(navigator, 'onLine', {
                configurable: true,
                value: false,
            });
            act(() => {
                window.dispatchEvent(new Event('offline'));
            });
            await waitFor(() => {
                expect(screen.getByText(/Offline mode — showing cached analytics snapshot/i)).toBeTruthy();
            });

            // 2D axis-locked swipe-right-to-dismiss (DEC-0012): vertical scroll must NOT close, horizontal >= 88px closes
            const contentRegion = screen.getByText('Attempts In Progress Only').closest('.space-y-5')!;
            fireEvent.touchStart(contentRegion, { touches: [{ clientX: 20, clientY: 100 }] });
            fireEvent.touchMove(contentRegion, { touches: [{ clientX: 25, clientY: 140 }] });
            fireEvent.touchEnd(contentRegion, { changedTouches: [{ clientX: 130, clientY: 145 }] });
            expect(onClose).not.toHaveBeenCalled();

            fireEvent.touchStart(contentRegion, { touches: [{ clientX: 20, clientY: 100 }] });
            fireEvent.touchMove(contentRegion, { touches: [{ clientX: 50, clientY: 104 }] });
            fireEvent.touchEnd(contentRegion, { changedTouches: [{ clientX: 120, clientY: 108 }] });
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
