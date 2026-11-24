/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_RPCS, DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { getCanonicalExamById } from '@/features/dashboard/constants/examRegistry';
import {
    ContinueLearningItem,
    buildContinueLearningItems,
    cachePreparedMockAttemptDetail,
    clearPreparedMockTestsCache,
    computeSeriesProgressStats,
    fetchContinueLearningItems,
    fetchPublishedTests,
    fetchSeriesDetails,
    fetchTestLeaderboard,
    fetchUserSeriesAttempts,
    getCachedContinueLearningSnapshot,
    getCachedTestLeaderboardSnapshot,
    readContinueLearningIndexedDBCache,
    sanitizeLeaderboardEntry,
} from '../api/mockTestsApi';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { TestLeaderboardCard } from '../components/TestLeaderboardCard';
import { TestsListPage } from '../pages/TestsListPage';

const {
    fromMock,
    rpcMock,
    getCacheEntryMock,
    setCacheEntryMock,
    getActiveSessionMock,
    saveActiveSessionMock,
    clearActiveSessionMock,
    telemetryEmitMock,
    mockUser,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    rpcMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    getActiveSessionMock: vi.fn(),
    saveActiveSessionMock: vi.fn(),
    clearActiveSessionMock: vi.fn(),
    telemetryEmitMock: vi.fn(),
    mockUser: { id: 'student-qa-1', email: 'qa@example.com' },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
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

vi.mock('@/lib/telemetry', () => ({
    telemetry: {
        emit: telemetryEmitMock,
    },
}));

const LocationDisplay: React.FC = () => {
    const loc = useLocation();
    return (
        <div data-testid="location-display">
            {loc.pathname}
            {loc.state ? `|${JSON.stringify(loc.state)}` : ''}
        </div>
    );
};

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const makeJoinedAttemptRow = (overrides: Record<string, any> = {}) => {
    const testId = overrides.test_id ?? 'test-bpsc-1';
    const seriesId = overrides.series_id ?? 'ser-bpsc-1';
    const categoryId = overrides.category_id ?? 'cat-bpsc';
    return {
        id: overrides.id ?? `att-${testId}`,
        test_id: testId,
        user_id: mockUser.id,
        start_time: overrides.start_time ?? '2026-11-24T08:00:00Z',
        end_time: overrides.end_time ?? null,
        time_taken_seconds: overrides.time_taken_seconds ?? 600,
        score: overrides.score ?? 0,
        accuracy: overrides.accuracy ?? 0,
        status: overrides.status ?? 'in_progress',
        answers: overrides.answers ?? {
            q1: 'A',
            __cbt_meta: {
                remainingSeconds: 5400,
                updatedAt: overrides.updatedAt ?? '2026-11-24T08:10:00Z',
            },
        },
        created_at: overrides.created_at ?? '2026-11-24T08:00:00Z',
        [DB_TABLES.MOCK.TESTS]: {
            id: testId,
            series_id: seriesId,
            name: overrides.testName ?? `BPSC Mock ${testId}`,
            duration_minutes: overrides.duration_minutes ?? 120,
            total_marks: overrides.total_marks ?? 150,
            passing_marks: overrides.passing_marks ?? 90,
            negative_marks: overrides.negative_marks ?? 0.33,
            question_ids: overrides.question_ids ?? ['q1', 'q2', 'q3', 'q4'],
            is_published: overrides.is_published ?? true,
            release_date: overrides.release_date ?? '2026-11-01T00:00:00Z',
            expiry_date: overrides.expiry_date ?? '2027-01-01T00:00:00Z',
            [DB_TABLES.MOCK.SERIES]: {
                id: seriesId,
                category_id: categoryId,
                name: overrides.seriesName ?? 'BPSC Prelims Series',
                is_published: overrides.series_is_published ?? true,
                [DB_TABLES.MOCK.CATEGORIES]: {
                    id: categoryId,
                    name: overrides.categoryName ?? 'BPSC',
                    is_active: overrides.category_is_active ?? true,
                },
            },
        },
    };
};

interface MockSupabaseConfig {
    continueRows?: any[];
    continueError?: any;
    series?: any;
    seriesError?: any;
    tests?: any[];
    testsError?: any;
    seriesAttempts?: any[];
    seriesAttemptsError?: any;
}

const setupSupabaseMocks = (config: MockSupabaseConfig) => {
    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.SERIES) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        single: vi.fn(() => {
                            if (config.seriesError) {
                                return Promise.resolve({ data: null, error: config.seriesError });
                            }
                            if (!config.series) {
                                return Promise.resolve({
                                    data: null,
                                    error: { code: 'PGRST116', message: '0 rows' },
                                });
                            }
                            return Promise.resolve({ data: config.series, error: null });
                        }),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (config.testsError) {
                                return Promise.resolve({
                                    data: null,
                                    error: config.testsError,
                                }).then(resolve, reject);
                            }
                            return Promise.resolve({
                                data: config.tests ?? [],
                                error: null,
                            }).then(resolve, reject);
                        },
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return {
                select: vi.fn((cols?: string) => {
                    const isContinueQuery = String(cols ?? '').includes(DB_TABLES.MOCK.TESTS);
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        in: vi.fn(() => chain),
                        order: vi.fn(() => chain),
                        limit: vi.fn(() => chain),
                        then: (resolve: any, reject: any) => {
                            if (isContinueQuery) {
                                if (config.continueError) {
                                    return Promise.resolve({
                                        data: null,
                                        error: config.continueError,
                                    }).then(resolve, reject);
                                }
                                return Promise.resolve({
                                    data: config.continueRows ?? [],
                                    error: null,
                                }).then(resolve, reject);
                            }

                            if (config.seriesAttemptsError) {
                                return Promise.resolve({
                                    data: null,
                                    error: config.seriesAttemptsError,
                                }).then(resolve, reject);
                            }
                            return Promise.resolve({
                                data: config.seriesAttempts ?? [],
                                error: null,
                            }).then(resolve, reject);
                        },
                    };
                    return chain;
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

const assertAllButtonsAccessible = (container: HTMLElement) => {
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
        expect(btn.getAttribute('type')).toBe('button');
        expect(btn.className).toMatch(/min-h-\[(44|48)px\]/);
    }
};

const renderContinueLearning = (
    ui: React.ReactElement,
    initialEntries: Array<string | { pathname: string; state?: any }> = [ROUTES.TEST_SERIES.ROOT]
) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path={ROUTES.TEST_SERIES.ROOT} element={ui} />
                <Route path={ROUTES.TEST_SERIES.BPSC} element={ui} />
                <Route path="/exam/:testId" element={<LocationDisplay />} />
                <Route
                    path="/mcqs/test-series/test/:testId/result/:attemptId"
                    element={<LocationDisplay />}
                />
                <Route path="/mcqs/test-series/test/:testId" element={<LocationDisplay />} />
            </Routes>
        </MemoryRouter>
    );

const renderTestsListPage = (
    initialEntry: string | { pathname: string; state?: any } = ROUTES.TEST_SERIES.SERIES('ser-1')
) =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/mcqs/test-series/series/:seriesId" element={<TestsListPage />} />
                <Route path={ROUTES.TEST_SERIES.BPSC} element={<LocationDisplay />} />
                <Route path={ROUTES.TEST_SERIES.ROOT} element={<LocationDisplay />} />
                <Route path="/mcqs/test-series/category/:categoryId" element={<LocationDisplay />} />
                <Route path="/mcqs/test-series/test/:testId" element={<LocationDisplay />} />
                <Route path="/exam/:testId" element={<LocationDisplay />} />
            </Routes>
        </MemoryRouter>
    );

describe('v1.0.375 Continue Learning, Series Progress Analytics & Privacy-Safe Leaderboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        clearPreparedMockTestsCache();
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
        getActiveSessionMock.mockResolvedValue(null);
        saveActiveSessionMock.mockResolvedValue(undefined);
        clearActiveSessionMock.mockResolvedValue(undefined);
        rpcMock.mockResolvedValue({ data: [], error: null });
    });

    afterEach(() => {
        cleanup();
    });

    describe('1. Continue Learning (buildContinueLearningItems & <ContinueLearningSection />)', () => {
        it('deduplicates multiple attempts per test (prefers in_progress, then newest activityAt), pins in_progress first, caps grid at 4, and strips answers JSONB', async () => {
            const nowMs = Date.parse('2026-11-24T12:00:00Z');
            const rows = [
                // t1 has an older completed row and an in_progress row -> keeps in_progress
                makeJoinedAttemptRow({
                    id: 'att-t1-done',
                    test_id: 't1',
                    status: 'completed',
                    score: 120,
                    accuracy: 85,
                    end_time: '2026-11-24T11:50:00Z',
                    answers: { q1: 'A', q2: 'B' },
                }),
                makeJoinedAttemptRow({
                    id: 'att-t1-ip',
                    test_id: 't1',
                    status: 'in_progress',
                    updatedAt: '2026-11-24T11:00:00Z',
                    answers: {
                        q1: 'A',
                        q2: 'C',
                        __cbt_meta: { remainingSeconds: 3200, updatedAt: '2026-11-24T11:00:00Z' },
                    },
                }),
                // t2 has two completed rows -> keeps newer activityAt
                makeJoinedAttemptRow({
                    id: 'att-t2-old',
                    test_id: 't2',
                    status: 'completed',
                    score: 90,
                    accuracy: 70,
                    end_time: '2026-11-22T09:00:00Z',
                    answers: { q1: 'D' },
                }),
                makeJoinedAttemptRow({
                    id: 'att-t2-new',
                    test_id: 't2',
                    status: 'completed',
                    score: 110,
                    accuracy: 82,
                    end_time: '2026-11-24T09:30:00Z',
                    answers: { q1: 'A' },
                }),
                // t3 is abandoned -> ignored
                makeJoinedAttemptRow({
                    id: 'att-t3-abandoned',
                    test_id: 't3',
                    status: 'abandoned',
                    answers: { q1: 'A' },
                }),
                // t4 is in_progress (older than t1, still pinned ahead of completed items)
                makeJoinedAttemptRow({
                    id: 'att-t4-ip',
                    test_id: 't4',
                    status: 'in_progress',
                    updatedAt: '2026-11-24T07:00:00Z',
                    answers: {
                        q1: 'B',
                        __cbt_meta: { remainingSeconds: 4100, updatedAt: '2026-11-24T07:00:00Z' },
                    },
                }),
                // t5 is completed (newer than t2)
                makeJoinedAttemptRow({
                    id: 'att-t5-done',
                    test_id: 't5',
                    status: 'completed',
                    score: 130,
                    accuracy: 91,
                    end_time: '2026-11-24T10:30:00Z',
                    answers: { q1: 'A' },
                }),
                // t6 is completed (oldest -> trimmed by grid cap of 4)
                makeJoinedAttemptRow({
                    id: 'att-t6-done',
                    test_id: 't6',
                    status: 'completed',
                    score: 80,
                    accuracy: 60,
                    end_time: '2026-11-23T08:00:00Z',
                    answers: { q1: 'C' },
                }),
            ];

            const items = buildContinueLearningItems({
                rows,
                userId: mockUser.id,
                nowMs,
            });

            expect(items).toHaveLength(4);
            expect(items.map((i) => `${i.testId}:${i.attemptId}:${i.status}`)).toEqual([
                't1:att-t1-ip:in_progress',
                't4:att-t4-ip:in_progress',
                't5:att-t5-done:completed',
                't2:att-t2-new:completed',
            ]);
            expect(items[0].answeredCount).toBe(2);
            expect(items[0].remainingSeconds).toBe(3200);

            for (const item of items) {
                expect(item).not.toHaveProperty('answers');
                expect('answers' in item).toBe(false);
            }

            // Live fetch also caps at 4 and omits answers from persisted localStorage cache
            setupSupabaseMocks({ continueRows: rows });
            const fetched = await fetchContinueLearningItems(mockUser.id, { limit: 4, nowMs });
            expect(fetched).toHaveLength(4);
            for (const entry of fetched) {
                expect(entry).not.toHaveProperty('answers');
            }

            const rawStored = window.localStorage.getItem(
                `mindflow_mock_continue_learning_v1_${mockUser.id}`
            );
            expect(rawStored).toBeTruthy();
            const parsedStored = JSON.parse(rawStored!);
            expect(parsedStored.items.length).toBeGreaterThanOrEqual(4);
            for (const cachedItem of parsedStored.items) {
                expect(cachedItem).not.toHaveProperty('answers');
            }
        });

        it('filters out expired and unpublished tests (DEC-0017) on both live and cached reads', async () => {
            const activeTime = Date.parse('2026-11-24T12:00:00Z');
            const rows = [
                makeJoinedAttemptRow({
                    id: 'att-valid',
                    test_id: 'test-valid',
                    testName: 'Active Mock Test',
                    release_date: '2026-11-01T00:00:00Z',
                    expiry_date: '2026-11-25T00:00:00Z',
                }),
                makeJoinedAttemptRow({
                    id: 'att-expired',
                    test_id: 'test-expired',
                    testName: 'Expired Mock Test',
                    expiry_date: '2026-11-20T00:00:00Z',
                }),
                makeJoinedAttemptRow({
                    id: 'att-future',
                    test_id: 'test-future',
                    testName: 'Future Mock Test',
                    release_date: '2026-12-01T00:00:00Z',
                }),
                makeJoinedAttemptRow({
                    id: 'att-unpub-test',
                    test_id: 'test-unpub',
                    testName: 'Unpublished Test',
                    is_published: false,
                }),
                makeJoinedAttemptRow({
                    id: 'att-unpub-series',
                    test_id: 'test-unpub-ser',
                    testName: 'Unpublished Series Test',
                    series_is_published: false,
                }),
                makeJoinedAttemptRow({
                    id: 'att-inactive-cat',
                    test_id: 'test-inactive-cat',
                    testName: 'Inactive Cat Test',
                    category_is_active: false,
                }),
            ];

            setupSupabaseMocks({ continueRows: rows });
            const liveItems = await fetchContinueLearningItems(mockUser.id, { nowMs: activeTime });
            expect(liveItems.map((i) => i.testId)).toEqual(['test-valid']);

            // Cached read valid at activeTime, automatically hidden after expiry_date
            const validCached = getCachedContinueLearningSnapshot(mockUser.id, activeTime);
            expect(validCached?.map((i) => i.testId)).toEqual(['test-valid']);

            const afterExpiryTime = Date.parse('2026-11-26T00:00:00Z');
            const expiredCached = getCachedContinueLearningSnapshot(mockUser.id, afterExpiryTime);
            expect(expiredCached).toEqual([]);

            // Cold sync -> IndexedDB fallback also enforces DEC-0017
            clearPreparedMockTestsCache();
            window.localStorage.clear();
            const idbPayload: ContinueLearningItem[] = [
                {
                    attemptId: 'att-idb-valid',
                    testId: 'test-idb-valid',
                    seriesId: 'ser-1',
                    categoryId: 'cat-1',
                    testName: 'IDB Active Mock',
                    seriesName: 'BPSC Series',
                    categoryName: 'BPSC',
                    status: 'in_progress',
                    answeredCount: 1,
                    totalQuestions: 10,
                    remainingSeconds: 600,
                    durationMinutes: 20,
                    score: 0,
                    totalMarks: 20,
                    passingMarks: 10,
                    accuracy: 0,
                    timeTakenSeconds: 120,
                    activityAt: '2026-11-24T10:00:00Z',
                    release_date: '2026-11-01T00:00:00Z',
                    expiry_date: '2026-12-01T00:00:00Z',
                    is_published: true,
                    series_is_published: true,
                    category_is_active: true,
                },
                {
                    attemptId: 'att-idb-exp',
                    testId: 'test-idb-exp',
                    seriesId: 'ser-1',
                    categoryId: 'cat-1',
                    testName: 'IDB Expired Mock',
                    seriesName: 'BPSC Series',
                    categoryName: 'BPSC',
                    status: 'completed',
                    answeredCount: 10,
                    totalQuestions: 10,
                    remainingSeconds: null,
                    durationMinutes: 20,
                    score: 18,
                    totalMarks: 20,
                    passingMarks: 10,
                    accuracy: 90,
                    timeTakenSeconds: 400,
                    activityAt: '2026-11-24T09:00:00Z',
                    release_date: '2026-10-01T00:00:00Z',
                    expiry_date: '2026-11-10T00:00:00Z',
                    is_published: true,
                    series_is_published: true,
                    category_is_active: true,
                },
            ];
            getCacheEntryMock.mockResolvedValueOnce({
                key: `mock_continue_learning_v1_${mockUser.id}`,
                data: { items: idbPayload, fetchedAt: activeTime },
                updatedAt: activeTime,
            });

            const idbHydrated = await readContinueLearningIndexedDBCache(mockUser.id, activeTime);
            expect(idbHydrated?.map((i) => i.testId)).toEqual(['test-idb-valid']);
        });

        it('enforces monotonic offline-submit protection: locally completed attempt overrides stale remote in_progress row', async () => {
            cachePreparedMockAttemptDetail({
                id: 'att-offline-submit-1',
                test_id: 'test-bpsc-mono',
                user_id: mockUser.id,
                start_time: '2026-11-24T09:00:00Z',
                end_time: '2026-11-24T09:45:00Z',
                time_taken_seconds: 2700,
                score: 124,
                accuracy: 88.5,
                status: 'completed',
                answers: { q1: 'A', q2: 'B', q3: 'C' },
                created_at: '2026-11-24T09:00:00Z',
            });

            setupSupabaseMocks({
                continueRows: [
                    makeJoinedAttemptRow({
                        id: 'att-offline-submit-1',
                        test_id: 'test-bpsc-mono',
                        testName: '70th BPSC Offline Submit Test',
                        status: 'in_progress',
                        score: 0,
                        accuracy: 0,
                        answers: {
                            q1: 'A',
                            __cbt_meta: { remainingSeconds: 4200, updatedAt: '2026-11-24T09:15:00Z' },
                        },
                    }),
                ],
            });

            renderContinueLearning(
                <ContinueLearningSection variant="grid" returnTo={ROUTES.TEST_SERIES.ROOT} />
            );

            await waitFor(() => {
                expect(screen.getByText('70th BPSC Offline Submit Test')).toBeTruthy();
            });

            expect(screen.queryByRole('button', { name: /Resume Test/i })).toBeNull();
            const viewSolutionBtn = screen.getByRole('button', { name: /View Solution/i });
            expect(viewSolutionBtn).toBeTruthy();
            expect(screen.getByText('124 / 150')).toBeTruthy();

            fireEvent.click(viewSolutionBtn);
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    `${ROUTES.TEST_SERIES.RESULT('test-bpsc-mono', 'att-offline-submit-1')}|${JSON.stringify({
                        returnTo: ROUTES.TEST_SERIES.ROOT,
                    })}`
                );
            });
        });

        it('navigates 1-tap Resume Test & View Solution, renders grid empty state, hides compact mode on 0 exam matches, and passes button audit', async () => {
            setupSupabaseMocks({
                continueRows: [
                    makeJoinedAttemptRow({
                        id: 'att-ip-1',
                        test_id: 'test-ip-1',
                        testName: '70th BPSC Full Test 1',
                        status: 'in_progress',
                        updatedAt: '2026-11-24T10:30:00Z',
                    }),
                    makeJoinedAttemptRow({
                        id: 'att-done-1',
                        test_id: 'test-done-1',
                        testName: 'SSC CGL Tier 1 Mock',
                        seriesName: 'SSC CGL Series',
                        categoryName: 'SSC CGL',
                        status: 'completed',
                        score: 135,
                        total_marks: 200,
                        accuracy: 90,
                        end_time: '2026-11-24T09:00:00Z',
                    }),
                ],
            });

            // 1. Grid mode with 1 in_progress and 1 completed card + button audit
            const gridRender = renderContinueLearning(
                <ContinueLearningSection variant="grid" returnTo={ROUTES.TEST_SERIES.ROOT} />
            );

            await waitFor(() => {
                expect(screen.getByText('70th BPSC Full Test 1')).toBeTruthy();
                expect(screen.getByText('SSC CGL Tier 1 Mock')).toBeTruthy();
            });

            assertAllButtonsAccessible(gridRender.container);

            fireEvent.click(screen.getByRole('button', { name: /Resume Test/i }));
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    `${ROUTES.TEST_SERIES.EXAM_RUNNER('test-ip-1')}|${JSON.stringify({
                        returnTo: ROUTES.TEST_SERIES.ROOT,
                        resumeAttemptId: 'att-ip-1',
                    })}`
                );
            });
            expect(telemetryEmitMock).toHaveBeenCalledWith(
                'resume_quiz',
                expect.objectContaining({ quizId: 'test-ip-1' })
            );

            cleanup();

            // 2. Grid mode View Solution navigation
            renderContinueLearning(
                <ContinueLearningSection variant="grid" returnTo={ROUTES.TEST_SERIES.ROOT} />
            );
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /View Solution/i })).toBeTruthy();
            });
            fireEvent.click(screen.getByRole('button', { name: /View Solution/i }));
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    `${ROUTES.TEST_SERIES.RESULT('test-done-1', 'att-done-1')}|${JSON.stringify({
                        returnTo: ROUTES.TEST_SERIES.ROOT,
                    })}`
                );
            });

            cleanup();
            clearPreparedMockTestsCache();
            window.localStorage.clear();

            // 3. Compact mode with 0 canonical exam matches -> returns null
            setupSupabaseMocks({
                continueRows: [
                    makeJoinedAttemptRow({
                        id: 'att-ssc-only',
                        test_id: 'test-ssc-only',
                        testName: 'SSC CGL Tier 2',
                        seriesName: 'SSC CGL Target',
                        categoryName: 'SSC CGL',
                        status: 'in_progress',
                    }),
                ],
            });
            const bpscExam = getCanonicalExamById('bpsc')!;
            const compactRender = renderContinueLearning(
                <ContinueLearningSection
                    variant="compact"
                    exam={bpscExam}
                    returnTo={ROUTES.TEST_SERIES.BPSC}
                />,
                [ROUTES.TEST_SERIES.BPSC]
            );
            await waitFor(() => {
                expect(fromMock).toHaveBeenCalled();
            });
            expect(compactRender.container.innerHTML).toBe('');

            cleanup();
            clearPreparedMockTestsCache();
            window.localStorage.clear();

            // 4. Grid mode with 0 attempts -> renders "Welcome to Mock Tests"
            setupSupabaseMocks({ continueRows: [] });
            const onBrowseFallback = vi.fn();
            const emptyGrid = renderContinueLearning(
                <ContinueLearningSection
                    variant="grid"
                    returnTo={ROUTES.TEST_SERIES.ROOT}
                    onBrowseFallback={onBrowseFallback}
                />
            );
            await waitFor(() => {
                expect(screen.getByText('Welcome to Mock Tests')).toBeTruthy();
            });
            assertAllButtonsAccessible(emptyGrid.container);
            fireEvent.click(screen.getByRole('button', { name: /Browse Categories/i }));
            expect(onBrowseFallback).toHaveBeenCalledTimes(1);

            cleanup();
            clearPreparedMockTestsCache();
            window.localStorage.clear();

            // 5. Grid mode renders at most 4 cards even when 5 distinct tests exist
            setupSupabaseMocks({
                continueRows: [
                    makeJoinedAttemptRow({ id: 'att-g1', test_id: 'tg1', testName: 'Grid Test 1', status: 'completed', end_time: '2026-11-24T10:00:00Z' }),
                    makeJoinedAttemptRow({ id: 'att-g2', test_id: 'tg2', testName: 'Grid Test 2', status: 'in_progress', updatedAt: '2026-11-24T09:00:00Z' }),
                    makeJoinedAttemptRow({ id: 'att-g3', test_id: 'tg3', testName: 'Grid Test 3', status: 'completed', end_time: '2026-11-24T08:00:00Z' }),
                    makeJoinedAttemptRow({ id: 'att-g4', test_id: 'tg4', testName: 'Grid Test 4', status: 'completed', end_time: '2026-11-24T07:00:00Z' }),
                    makeJoinedAttemptRow({ id: 'att-g5', test_id: 'tg5', testName: 'Grid Test 5', status: 'completed', end_time: '2026-11-24T06:00:00Z' }),
                ],
            });
            const cappedGrid = renderContinueLearning(
                <ContinueLearningSection variant="grid" returnTo={ROUTES.TEST_SERIES.ROOT} />
            );
            await waitFor(() => {
                expect(cappedGrid.container.querySelectorAll('article').length).toBe(4);
            });
            expect(screen.queryByText('Grid Test 5')).toBeNull();
        });
    });

    describe('2. Series Progress (computeSeriesProgressStats & <TestsListPage />)', () => {
        it('aggregates each test best completed attempt (score DESC, time_taken_seconds ASC) while summing totalTimeSpentSeconds across all series attempts', () => {
            const uniformTests = [
                { id: 't1', total_marks: 100 },
                { id: 't2', total_marks: 100 },
                { id: 't3', total_marks: 100 },
            ];

            const stats = computeSeriesProgressStats(uniformTests, [
                // t1 retries: score 85 in 400s beats score 85 in 700s and score 60 in 500s
                {
                    id: 'a1',
                    test_id: 't1',
                    start_time: '2026-11-20T08:00:00Z',
                    end_time: '2026-11-20T08:10:00Z',
                    time_taken_seconds: 500,
                    score: 60,
                    accuracy: 60,
                    status: 'completed',
                    created_at: '2026-11-20T08:00:00Z',
                },
                {
                    id: 'a2',
                    test_id: 't1',
                    start_time: '2026-11-21T08:00:00Z',
                    end_time: '2026-11-21T08:12:00Z',
                    time_taken_seconds: 700,
                    score: 85,
                    accuracy: 88,
                    status: 'completed',
                    created_at: '2026-11-21T08:00:00Z',
                },
                {
                    id: 'a3',
                    test_id: 't1',
                    start_time: '2026-11-22T08:00:00Z',
                    end_time: '2026-11-22T08:07:00Z',
                    time_taken_seconds: 400,
                    score: 85,
                    accuracy: 82,
                    status: 'completed',
                    created_at: '2026-11-22T08:00:00Z',
                },
                // t2 completed + in_progress
                {
                    id: 'a4',
                    test_id: 't2',
                    start_time: '2026-11-23T08:00:00Z',
                    end_time: '2026-11-23T08:10:00Z',
                    time_taken_seconds: 600,
                    score: 90,
                    accuracy: 94,
                    status: 'completed',
                    created_at: '2026-11-23T08:00:00Z',
                },
                {
                    id: 'a5',
                    test_id: 't2',
                    start_time: '2026-11-24T08:00:00Z',
                    end_time: null,
                    time_taken_seconds: 250,
                    score: 0,
                    accuracy: 0,
                    status: 'in_progress',
                    created_at: '2026-11-24T08:00:00Z',
                },
                // t3 abandoned still contributes time spent
                {
                    id: 'a6',
                    test_id: 't3',
                    start_time: '2026-11-24T09:00:00Z',
                    end_time: null,
                    time_taken_seconds: 150,
                    score: 0,
                    accuracy: 0,
                    status: 'abandoned',
                    created_at: '2026-11-24T09:00:00Z',
                },
                // Foreign test outside series -> ignored
                {
                    id: 'a-foreign',
                    test_id: 't-other-series',
                    start_time: '2026-11-24T09:00:00Z',
                    end_time: '2026-11-24T09:20:00Z',
                    time_taken_seconds: 999,
                    score: 100,
                    accuracy: 100,
                    status: 'completed',
                    created_at: '2026-11-24T09:00:00Z',
                },
            ]);

            expect(stats.totalTests).toBe(3);
            expect(stats.completedTestsCount).toBe(2);
            expect(stats.completionPercent).toBe(67);
            expect(stats.bestAttemptByTestId['t1'].id).toBe('a3');
            expect(stats.bestAttemptByTestId['t2'].id).toBe('a4');
            expect(stats.bestScoreMarks).toBe(90);
            expect(stats.bestScoreTotalMarks).toBe(100);
            expect(stats.bestScorePercent).toBe(90);
            expect(stats.uniformTotalMarks).toBe(100);
            expect(stats.averageScoreMarks).toBe(87.5);
            expect(stats.averageScorePercent).toBe(87.5);
            expect(stats.overallAccuracyPercent).toBe(88);
            expect(stats.totalTimeSpentSeconds).toBe(2600);
            expect(stats.inProgressTestIds).toEqual(['t2']);
            expect(stats.activeInProgressAttempt).toEqual({ testId: 't2', attemptId: 'a5' });
            expect(stats.latestCompletedTestId).toBe('t2');

            // Mixed total_marks disables uniform averageScoreMarks and uses percentages
            const mixedStats = computeSeriesProgressStats(
                [
                    { id: 'm1', total_marks: 100 },
                    { id: 'm2', total_marks: 150 },
                ],
                [
                    {
                        id: 'am1',
                        test_id: 'm1',
                        start_time: null,
                        end_time: '2026-11-24T08:00:00Z',
                        time_taken_seconds: 100,
                        score: 80,
                        accuracy: 80,
                        status: 'completed',
                        created_at: '2026-11-24T08:00:00Z',
                    },
                    {
                        id: 'am2',
                        test_id: 'm2',
                        start_time: null,
                        end_time: '2026-11-24T09:00:00Z',
                        time_taken_seconds: 200,
                        score: 120,
                        accuracy: 84,
                        status: 'completed',
                        created_at: '2026-11-24T09:00:00Z',
                    },
                ]
            );
            expect(mixedStats.uniformTotalMarks).toBeNull();
            expect(mixedStats.averageScoreMarks).toBeNull();
            expect(mixedStats.averageScorePercent).toBe(80);
            expect(mixedStats.overallAccuracyPercent).toBe(82);
        });

        it('renders TestsListPage with live Your Progress metrics, <progress>, Resume CTA, status pills, DEC-0002 logical Back, and accessible buttons', async () => {
            const series = {
                id: 'ser-1',
                category_id: 'cat-1',
                name: '70th BPSC Prelims Mastery',
                description: 'Full length & sectional mock tests',
                is_published: true,
                is_premium: false,
                mock_categories: { id: 'cat-1', name: 'BPSC', is_active: true },
            };
            const tests = [
                {
                    id: 'test-1',
                    series_id: 'ser-1',
                    name: 'BPSC Full Mock 1',
                    duration_minutes: 120,
                    total_marks: 150,
                    question_ids: ['q1', 'q2', 'q3'],
                    is_published: true,
                    release_date: '2026-11-01T00:00:00Z',
                    expiry_date: '2027-01-01T00:00:00Z',
                },
                {
                    id: 'test-2',
                    series_id: 'ser-1',
                    name: 'BPSC Full Mock 2',
                    duration_minutes: 120,
                    total_marks: 150,
                    question_ids: ['q4', 'q5'],
                    is_published: true,
                    release_date: '2026-11-01T00:00:00Z',
                    expiry_date: '2027-01-01T00:00:00Z',
                },
            ];
            const seriesAttempts = [
                {
                    id: 'att-1',
                    test_id: 'test-1',
                    start_time: '2026-11-23T08:00:00Z',
                    end_time: '2026-11-23T09:00:00Z',
                    time_taken_seconds: 3600,
                    score: 120,
                    accuracy: 85.5,
                    status: 'completed',
                    created_at: '2026-11-23T08:00:00Z',
                },
                {
                    id: 'att-2-ip',
                    test_id: 'test-2',
                    start_time: '2026-11-24T08:00:00Z',
                    end_time: null,
                    time_taken_seconds: 900,
                    score: 0,
                    accuracy: 0,
                    status: 'in_progress',
                    created_at: '2026-11-24T08:00:00Z',
                },
            ];

            setupSupabaseMocks({ series, tests, seriesAttempts });

            const rendered = renderTestsListPage({
                pathname: ROUTES.TEST_SERIES.SERIES('ser-1'),
                state: { returnTo: ROUTES.TEST_SERIES.BPSC },
            });

            await waitFor(() => {
                expect(screen.getByText('Your Progress')).toBeTruthy();
                expect(screen.getByText('1 / 2 Tests (50%)')).toBeTruthy();
            });

            const progressBar = screen.getByRole('progressbar', {
                name: /Series test completion progress/i,
            });
            expect(progressBar.tagName).toBe('PROGRESS');
            expect(progressBar.getAttribute('value')).toBe('1');
            expect(progressBar.getAttribute('max')).toBe('2');

            expect(screen.getByText('120 / 150')).toBeTruthy();
            expect(screen.getByText('80%')).toBeTruthy();
            expect(screen.getByText('120/150')).toBeTruthy();
            expect(screen.getByText('85.5%')).toBeTruthy();
            expect(screen.getByText('1h 15m')).toBeTruthy();
            expect(screen.getByText('Best: 120/150')).toBeTruthy();
            expect(screen.getByText('In Progress')).toBeTruthy();

            assertAllButtonsAccessible(rendered.container);

            // Resume In-Progress Test CTA
            fireEvent.click(screen.getByRole('button', { name: /Resume In-Progress Test/i }));
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    `${ROUTES.TEST_SERIES.EXAM_RUNNER('test-2')}|${JSON.stringify({
                        returnTo: ROUTES.TEST_SERIES.SERIES('ser-1'),
                        resumeAttemptId: 'att-2-ip',
                    })}`
                );
            });

            cleanup();

            // Logical Back button with valid returnTo
            renderTestsListPage({
                pathname: ROUTES.TEST_SERIES.SERIES('ser-1'),
                state: { returnTo: ROUTES.TEST_SERIES.BPSC },
            });
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /^Back$/i })).toBeTruthy();
            });
            fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    ROUTES.TEST_SERIES.BPSC
                );
            });

            cleanup();

            // Rejects unsafe //evil.com and falls back to category route
            renderTestsListPage({
                pathname: ROUTES.TEST_SERIES.SERIES('ser-1'),
                state: { returnTo: '//evil.com' },
            });
            await waitFor(() => {
                expect(
                    screen.getByRole('heading', { level: 1, name: '70th BPSC Prelims Mastery' })
                ).toBeTruthy();
            });
            fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
            await waitFor(() => {
                expect(screen.getByTestId('location-display').textContent).toBe(
                    ROUTES.TEST_SERIES.CATEGORY('cat-1')
                );
            });
        });

        it('renders 0-attempt analytics prompt and recovers gracefully offline from cached series bundle & attempts (DEC-0004)', async () => {
            const series = {
                id: 'ser-off',
                category_id: 'cat-1',
                name: 'Offline Resilient Series',
                is_published: true,
                mock_categories: { id: 'cat-1', name: 'BPSC', is_active: true },
            };
            const tests = [
                {
                    id: 'test-off-1',
                    series_id: 'ser-off',
                    name: 'Offline Test 1',
                    duration_minutes: 60,
                    total_marks: 100,
                    question_ids: ['q1', 'q2'],
                    is_published: true,
                },
            ];

            // 1. 0-attempt state
            setupSupabaseMocks({ series, tests, seriesAttempts: [] });
            renderTestsListPage(ROUTES.TEST_SERIES.SERIES('ser-off'));

            await waitFor(() => {
                expect(
                    screen.getByText('Attempt a test to unlock live series analytics')
                ).toBeTruthy();
            });
            expect(screen.getByText('0 / 1 Tests (0%)')).toBeTruthy();

            cleanup();
            clearPreparedMockTestsCache();
            window.localStorage.clear();

            // 2. Seed cache online, then render offline -> immediate cached render + offline notice + Retry recovery
            const cachedAttempts = [
                {
                    id: 'att-off-1',
                    test_id: 'test-off-1',
                    start_time: '2026-11-24T07:00:00Z',
                    end_time: '2026-11-24T07:30:00Z',
                    time_taken_seconds: 1800,
                    score: 76,
                    accuracy: 80,
                    status: 'completed',
                    created_at: '2026-11-24T07:00:00Z',
                },
            ];
            setupSupabaseMocks({ series, tests, seriesAttempts: cachedAttempts });
            await fetchSeriesDetails('ser-off');
            await fetchPublishedTests('ser-off', Date.parse('2026-11-24T12:00:00Z'));
            await fetchUserSeriesAttempts('ser-off', ['test-off-1'], mockUser.id);

            setupSupabaseMocks({
                seriesError: new Error('Offline'),
                testsError: new Error('Offline'),
                seriesAttemptsError: new Error('Offline'),
            });

            renderTestsListPage(ROUTES.TEST_SERIES.SERIES('ser-off'));
            expect(
                screen.getByRole('heading', { level: 1, name: 'Offline Resilient Series' })
            ).toBeTruthy();
            expect(screen.getByText('1 / 1 Tests (100%)')).toBeTruthy();

            await waitFor(() => {
                expect(screen.getByText('Showing offline cached series data.')).toBeTruthy();
            });

            setupSupabaseMocks({ series, tests, seriesAttempts: cachedAttempts });
            fireEvent.click(screen.getByRole('button', { name: /^Retry$/i }));

            await waitFor(() => {
                expect(screen.queryByText('Showing offline cached series data.')).toBeNull();
            });
        });
    });

    describe('3. Privacy-Safe Leaderboard (<TestLeaderboardCard />, fetchTestLeaderboard & sanitizeLeaderboardEntry)', () => {
        it('calls DB_RPCS.MOCK_LEADERBOARD and strips any injected answers field across returned entries and localStorage cache', async () => {
            const directSanitized = sanitizeLeaderboardEntry(
                {
                    rank: 1,
                    user_id: 'u-1',
                    display_name: '   ',
                    score: 142,
                    accuracy: 94.5,
                    time_taken_seconds: 2100,
                    is_current_user: false,
                    answers: { q1: 'A', q2: 'B' },
                },
                0
            );
            expect(directSanitized.display_name).toBe('MindFlow Aspirant');
            expect(directSanitized).not.toHaveProperty('answers');

            rpcMock.mockResolvedValueOnce({
                data: [
                    {
                        rank: 1,
                        user_id: 'u-1',
                        display_name: 'Neha Singh',
                        avatar_url: null,
                        score: 138,
                        accuracy: 92,
                        time_taken_seconds: 1950,
                        completed_at: '2026-11-24T09:00:00Z',
                        is_current_user: true,
                        answers: { q1: 'A', leaked: true },
                    },
                ],
                error: null,
            });

            const entries = await fetchTestLeaderboard('test-lb-privacy', 20);
            expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.MOCK_LEADERBOARD, {
                p_test_id: 'test-lb-privacy',
                p_limit: 20,
            });
            expect(entries).toHaveLength(1);
            expect(entries[0]).not.toHaveProperty('answers');
            expect('answers' in entries[0]).toBe(false);

            const rawCached = window.localStorage.getItem(
                'mindflow_mock_leaderboard_v1_test-lb-privacy'
            );
            expect(rawCached).toBeTruthy();
            const parsedCached = JSON.parse(rawCached!);
            expect(parsedCached.entries[0]).not.toHaveProperty('answers');

            // Even if localStorage is externally poisoned with answers, synchronous snapshot strips it
            window.localStorage.setItem(
                'mindflow_mock_leaderboard_v1_test-lb-poison',
                JSON.stringify({
                    entries: [
                        {
                            rank: 1,
                            user_id: 'u-p',
                            display_name: 'Poisoned Entry',
                            score: 100,
                            accuracy: 80,
                            answers: { q1: 'C' },
                        },
                    ],
                    fetchedAt: Date.now(),
                })
            );
            const sanitizedSnapshot = getCachedTestLeaderboardSnapshot('test-lb-poison');
            expect(sanitizedSnapshot).toHaveLength(1);
            expect(sanitizedSnapshot![0]).not.toHaveProperty('answers');
        });

        it('highlights is_current_user with "You" badge & aria-current="true", switches tests via <select>, and ignores stale out-of-order RPC promises', async () => {
            const deferredTestA = createDeferred<{ data: any[]; error: any }>();
            const deferredTestB = createDeferred<{ data: any[]; error: any }>();

            rpcMock.mockImplementation((_rpcName: string, params: { p_test_id: string }) => {
                if (params.p_test_id === 'test-a') return deferredTestA.promise;
                if (params.p_test_id === 'test-b') return deferredTestB.promise;
                return Promise.resolve({ data: [], error: null });
            });

            const rendered = render(
                <TestLeaderboardCard
                    tests={[
                        { id: 'test-a', name: 'Test Alpha', total_marks: 150 },
                        { id: 'test-b', name: 'Test Beta', total_marks: 150 },
                    ]}
                    defaultTestId="test-a"
                    limit={10}
                />
            );

            await waitFor(() => {
                expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.MOCK_LEADERBOARD, {
                    p_test_id: 'test-a',
                    p_limit: 10,
                });
            });

            // Switch to Test Beta before Test Alpha resolves
            const selectEl = screen.getByLabelText('Test Rankings') as HTMLSelectElement;
            fireEvent.change(selectEl, { target: { value: 'test-b' } });

            await waitFor(() => {
                expect(rpcMock).toHaveBeenCalledWith(DB_RPCS.MOCK_LEADERBOARD, {
                    p_test_id: 'test-b',
                    p_limit: 10,
                });
            });

            // Resolve Test Beta first
            deferredTestB.resolve({
                data: [
                    {
                        rank: 1,
                        user_id: 'u-b1',
                        display_name: 'Riya Verma',
                        score: 144,
                        accuracy: 96,
                        time_taken_seconds: 1850,
                        is_current_user: true,
                        answers: { q1: 'A' },
                    },
                    {
                        rank: 2,
                        user_id: 'u-b2',
                        display_name: 'Karan Mehta',
                        score: 132,
                        accuracy: 88,
                        time_taken_seconds: 2100,
                        is_current_user: false,
                    },
                ],
                error: null,
            });

            await waitFor(() => {
                expect(screen.getAllByText('Riya Verma').length).toBe(2);
            });
            expect(screen.getAllByText('You').length).toBe(2);
            const currentEls = rendered.container.querySelectorAll('[aria-current="true"]');
            expect(currentEls.length).toBe(2);

            // Resolve stale Test Alpha response after Test Beta -> must be ignored
            deferredTestA.resolve({
                data: [
                    {
                        rank: 1,
                        user_id: 'u-stale',
                        display_name: 'Stale Alpha Winner',
                        score: 50,
                        accuracy: 40,
                        time_taken_seconds: 500,
                        is_current_user: false,
                    },
                ],
                error: null,
            });

            await new Promise((r) => setTimeout(r, 20));
            expect(screen.queryByText('Stale Alpha Winner')).toBeNull();
            expect(screen.getAllByText('Riya Verma').length).toBe(2);
        });

        it('renders empty state "Be the first to complete this test!" and offline cached fallback with "Retry" recovery', async () => {
            // 1. Empty state
            rpcMock.mockResolvedValueOnce({ data: [], error: null });
            render(
                <TestLeaderboardCard
                    tests={[{ id: 'test-empty', name: 'Empty Test', total_marks: 100 }]}
                    fixedTestId="test-empty"
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Be the first to complete this test!')).toBeTruthy();
            });

            cleanup();
            clearPreparedMockTestsCache();
            window.localStorage.clear();

            // 2. Seed cached rankings, then fail network -> offline banner + Retry recovery
            rpcMock.mockResolvedValueOnce({
                data: [
                    {
                        rank: 1,
                        user_id: 'u-cached',
                        display_name: 'Cached Ranker',
                        score: 88,
                        accuracy: 88,
                        time_taken_seconds: 1200,
                        is_current_user: true,
                    },
                ],
                error: null,
            });
            await fetchTestLeaderboard('test-offline-lb', 10);

            rpcMock.mockResolvedValueOnce({
                data: null,
                error: new Error('Offline network error'),
            });

            const renderedOffline = render(
                <TestLeaderboardCard
                    tests={[{ id: 'test-offline-lb', name: 'Offline Test', total_marks: 100 }]}
                    fixedTestId="test-offline-lb"
                />
            );

            expect(screen.getAllByText('Cached Ranker').length).toBe(2);
            await waitFor(() => {
                expect(screen.getByText('Offline cached rankings shown.')).toBeTruthy();
            });

            assertAllButtonsAccessible(renderedOffline.container);

            rpcMock.mockResolvedValueOnce({
                data: [
                    {
                        rank: 1,
                        user_id: 'u-fresh',
                        display_name: 'Fresh Live Leader',
                        score: 96,
                        accuracy: 96,
                        time_taken_seconds: 1000,
                        is_current_user: false,
                    },
                ],
                error: null,
            });

            fireEvent.click(screen.getByRole('button', { name: /^Retry$/i }));

            await waitFor(() => {
                expect(screen.queryByText('Offline cached rankings shown.')).toBeNull();
                expect(screen.getAllByText('Fresh Live Leader').length).toBe(2);
            });
        });
    });
});
