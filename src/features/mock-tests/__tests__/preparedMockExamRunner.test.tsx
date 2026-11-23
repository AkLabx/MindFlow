/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
    MAX_QUIZ_QUESTIONS,
    MAX_PREPARED_MOCK_QUESTIONS,
} from '@/features/quiz/services/quizCreationService';
import { resolveHardwareBackTarget } from '@/hooks/useHardwareBackButton';
import {
    clearPreparedMockTestsCache,
    computePreparedMockScore,
    fetchPreparedMockTestQuestions,
} from '../api/mockTestsApi';
import { ExamPlaceholderPage } from '../pages/ExamPlaceholderPage';
import { PreparedMockExamPage } from '../pages/PreparedMockExamPage';

const {
    fromMock,
    getCacheEntryMock,
    setCacheEntryMock,
    getActiveSessionMock,
    saveActiveSessionMock,
    clearActiveSessionMock,
    getAllSavedQuizzesMock,
    mockUser,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    getActiveSessionMock: vi.fn(),
    saveActiveSessionMock: vi.fn(),
    clearActiveSessionMock: vi.fn(),
    getAllSavedQuizzesMock: vi.fn(),
    mockUser: { id: 'student-cbt-1', email: 'aspirant@example.com' },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
        getActiveSession: getActiveSessionMock,
        saveActiveSession: saveActiveSessionMock,
        clearActiveSession: clearActiveSessionMock,
        getAllSavedQuizzes: getAllSavedQuizzesMock,
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

const LocationDisplay: React.FC = () => {
    const loc = useLocation();
    return (
        <div data-testid="location-display">
            {loc.pathname}
            {loc.state ? `|${JSON.stringify(loc.state)}` : ''}
        </div>
    );
};

const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const buildQuestionRow = (id: string, index: number) => ({
    id,
    subject: index % 2 === 0 ? 'Bihar Special' : 'Indian Polity',
    topic: `Topic ${index + 1}`,
    examName: 'BPSC',
    examYear: 2024,
    question: `Sample BPSC question #${index + 1} stem?`,
    options: [
        `Option A for Q${index + 1}`,
        `Option B for Q${index + 1}`,
        `Option C for Q${index + 1}`,
        `Option D for Q${index + 1}`,
    ],
    correct: `Option A for Q${index + 1}`,
    explanation: { summary: `Explanation for Q${index + 1}` },
    tags: [],
    sourceInfo: {
        examName: 'BPSC',
        examYear: 2024,
    },
    classification: {
        subject: index % 2 === 0 ? 'Bihar Special' : 'Indian Polity',
        topic: `Topic ${index + 1}`,
    },
    properties: {
        difficulty: 'Medium',
        questionType: 'MCQ',
    },
    deleted_at: null,
});

const buildQuestionsList = (count: number) =>
    Array.from({ length: count }, (_, idx) => buildQuestionRow(makeUuid(idx + 1), idx));

const buildMockTest = (questionIds: string[], overrides: Record<string, any> = {}) => ({
    id: 'test-bpsc-69',
    series_id: 'ser-bpsc-pyq',
    name: '69th BPSC Prelims PYQs',
    description: 'Official previous year question paper with BPSC negative marking.',
    duration_minutes: 120,
    total_marks: 150,
    passing_marks: 95,
    negative_marks: 0.33,
    question_ids: questionIds,
    is_published: true,
    release_date: '2026-01-01T00:00:00Z',
    expiry_date: '2027-12-31T00:00:00Z',
    mock_series: {
        id: 'ser-bpsc-pyq',
        name: 'BPSC Prelims PYQ Series',
        is_premium: false,
        is_published: true,
        mock_categories: {
            id: 'cat-bpsc',
            name: 'BPSC',
            is_active: true,
        },
    },
    ...overrides,
});

interface QuestionChunkCall {
    column: string;
    ids: string[];
    deletedAtFilterApplied: boolean;
}

interface MockSupabaseSetupResult {
    questionChunks: QuestionChunkCall[];
    attemptUpdates: Array<{ payload: any; filters: Record<string, any> }>;
    attemptUpserts: Array<{ payload: any; options: any }>;
    attemptInserts: any[];
    remoteAttempts: Map<string, any>;
}

const setupSupabaseMocks = (config: {
    test?: any;
    testError?: any;
    questions?: any[];
    reverseQuestionRows?: boolean;
    initialAttempts?: any[];
}): MockSupabaseSetupResult => {
    const state: MockSupabaseSetupResult = {
        questionChunks: [],
        attemptUpdates: [],
        attemptUpserts: [],
        attemptInserts: [],
        remoteAttempts: new Map((config.initialAttempts ?? []).map((row) => [row.id, { ...row }])),
    };

    const questionRows = config.questions ?? [];

    fromMock.mockImplementation((table: string) => {
        if (table === DB_TABLES.MOCK.TESTS) {
            return {
                select: vi.fn(() => {
                    const executeSingle = () => {
                        if (config.testError) {
                            return Promise.resolve({ data: null, error: config.testError });
                        }
                        return Promise.resolve({ data: config.test ?? null, error: null });
                    };
                    const chain: any = {
                        eq: vi.fn(() => chain),
                        single: vi.fn(executeSingle),
                        maybeSingle: vi.fn(executeSingle),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.BANK.QUESTIONS) {
            return {
                select: vi.fn(() => {
                    const callRecord: QuestionChunkCall = {
                        column: 'id',
                        ids: [],
                        deletedAtFilterApplied: false,
                    };
                    const chain: any = {
                        in: vi.fn((col: string, ids: string[]) => {
                            callRecord.column = col;
                            callRecord.ids = [...ids];
                            state.questionChunks.push(callRecord);
                            return chain;
                        }),
                        is: vi.fn((col: string, val: null) => {
                            if (col === 'deleted_at' && val === null) {
                                callRecord.deletedAtFilterApplied = true;
                            }
                            const idSet = new Set(callRecord.ids);
                            const matched = questionRows.filter((row) =>
                                callRecord.column === 'v1_id'
                                    ? idSet.has(row.v1_id)
                                    : idSet.has(row.id)
                            );
                            const orderedResult = config.reverseQuestionRows
                                ? matched.slice().reverse()
                                : matched;
                            return Promise.resolve({ data: orderedResult, error: null });
                        }),
                    };
                    return chain;
                }),
            };
        }

        if (table === DB_TABLES.MOCK.ATTEMPTS) {
            return {
                select: vi.fn(() => {
                    const filters: Record<string, any> = {};
                    const executeQuery = () => {
                        let list = Array.from(state.remoteAttempts.values());
                        if (filters.id) {
                            list = list.filter((r) => r.id === filters.id);
                        }
                        if (filters.test_id) {
                            list = list.filter((r) => r.test_id === filters.test_id);
                        }
                        if (filters.user_id) {
                            list = list.filter((r) => r.user_id === filters.user_id);
                        }
                        if (filters.status) {
                            list = list.filter((r) => r.status === filters.status);
                        }
                        return list;
                    };
                    const chain: any = {
                        eq: vi.fn((col: string, val: any) => {
                            filters[col] = val;
                            return chain;
                        }),
                        order: vi.fn(() => chain),
                        limit: vi.fn(() => chain),
                        maybeSingle: vi.fn(() => {
                            const matched = executeQuery()[0] ?? null;
                            return Promise.resolve({ data: matched, error: null });
                        }),
                    };
                    return chain;
                }),
                insert: vi.fn((payload: any) => {
                    const row = {
                        ...payload,
                        created_at: payload.created_at ?? payload.start_time ?? new Date().toISOString(),
                    };
                    state.attemptInserts.push(row);
                    state.remoteAttempts.set(row.id, row);
                    return {
                        select: vi.fn(() => ({
                            maybeSingle: vi.fn(() =>
                                Promise.resolve({
                                    data: { id: row.id, start_time: row.start_time },
                                    error: null,
                                })
                            ),
                        })),
                    };
                }),
                update: vi.fn((payload: any) => {
                    const filters: Record<string, any> = {};
                    const applyUpdate = () => {
                        state.attemptUpdates.push({ payload: { ...payload }, filters: { ...filters } });
                        const existing = state.remoteAttempts.get(filters.id);
                        if (existing) {
                            state.remoteAttempts.set(filters.id, { ...existing, ...payload });
                        }
                        return Promise.resolve({ error: null });
                    };
                    const chain: any = {
                        eq: vi.fn((col: string, val: any) => {
                            filters[col] = val;
                            return chain;
                        }),
                        then: (resolve: any, reject: any) => applyUpdate().then(resolve, reject),
                    };
                    return chain;
                }),
                upsert: vi.fn((payload: any, options: any) => {
                    state.attemptUpserts.push({ payload: { ...payload }, options });
                    const existing = state.remoteAttempts.get(payload.id) ?? {};
                    state.remoteAttempts.set(payload.id, { ...existing, ...payload });
                    return Promise.resolve({ error: null });
                }),
            };
        }

        return {
            select: vi.fn(() => ({
                then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
            })),
        };
    });

    return state;
};

const renderExamRunner = (
    initialEntry: string | { pathname: string; state?: any } = ROUTES.TEST_SERIES.EXAM_RUNNER('test-bpsc-69')
) =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/exam/:testId" element={<PreparedMockExamPage />} />
                <Route path="/mcqs/test-series/test/:testId" element={<LocationDisplay />} />
                <Route path="/mcqs/test-series/test/:testId/result/:attemptId" element={<LocationDisplay />} />
                <Route path={ROUTES.TEST_SERIES.BPSC} element={<LocationDisplay />} />
                <Route path={ROUTES.TEST_SERIES.ROOT} element={<LocationDisplay />} />
            </Routes>
        </MemoryRouter>
    );

describe('v1.0.373 Live Timed CBT Mock Runner (PreparedMockExamPage)', () => {
    let idbCacheStore: Map<string, any>;
    let idbActiveSessionStore: Map<string, any>;

    beforeAll(() => {
        if (typeof HTMLDialogElement !== 'undefined') {
            HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
                this.setAttribute('open', '');
            };
            HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
                this.removeAttribute('open');
                this.dispatchEvent(new Event('close'));
            };
        }
    });

    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        clearPreparedMockTestsCache();
        useNotificationStore.setState({ toasts: [], activePopup: null });

        idbCacheStore = new Map();
        idbActiveSessionStore = new Map();

        getCacheEntryMock.mockImplementation(async (key: string) => idbCacheStore.get(key) ?? null);
        setCacheEntryMock.mockImplementation(async (key: string, data: any) => {
            if (data === null) {
                idbCacheStore.delete(key);
            } else {
                idbCacheStore.set(key, { key, data, updatedAt: Date.now() });
            }
        });
        getActiveSessionMock.mockImplementation(
            async (key: string) => idbActiveSessionStore.get(key) ?? null
        );
        saveActiveSessionMock.mockImplementation(async (key: string, data: any) => {
            idbActiveSessionStore.set(key, data);
        });
        clearActiveSessionMock.mockImplementation(async (key: string) => {
            idbActiveSessionStore.delete(key);
        });
        getAllSavedQuizzesMock.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanup();
    });

    it('hydrates 103 & 150 UUIDs in <=100-item chunks with deleted_at=null, preserves exact order from reversed rows, and keeps quizCreationService ceilings', async () => {
        expect(MAX_QUIZ_QUESTIONS).toBe(100);
        expect(MAX_PREPARED_MOCK_QUESTIONS).toBe(250);

        // 150-question BPSC-scale hydration with reversed DB rows
        const questions150 = buildQuestionsList(150);
        const ids150 = questions150.map((q) => q.id);
        const supa150 = setupSupabaseMocks({
            questions: questions150,
            reverseQuestionRows: true,
        });

        const hydrated150 = await fetchPreparedMockTestQuestions('test-150', ids150);

        expect(supa150.questionChunks).toHaveLength(2);
        expect(supa150.questionChunks[0].ids).toHaveLength(100);
        expect(supa150.questionChunks[1].ids).toHaveLength(50);
        expect(supa150.questionChunks.every((c) => c.ids.length <= 100)).toBe(true);
        expect(supa150.questionChunks.every((c) => c.deletedAtFilterApplied)).toBe(true);
        expect(hydrated150).toHaveLength(150);
        expect(hydrated150.map((q) => q.id)).toEqual(ids150);

        // 103-question hydration check
        clearPreparedMockTestsCache();
        const questions103 = buildQuestionsList(103);
        const ids103 = questions103.map((q) => q.id);
        const supa103 = setupSupabaseMocks({
            questions: questions103,
            reverseQuestionRows: true,
        });

        const hydrated103 = await fetchPreparedMockTestQuestions('test-103', ids103);

        expect(supa103.questionChunks).toHaveLength(2);
        expect(supa103.questionChunks[0].ids).toHaveLength(100);
        expect(supa103.questionChunks[1].ids).toHaveLength(3);
        expect(supa103.questionChunks.every((c) => c.deletedAtFilterApplied)).toBe(true);
        expect(hydrated103).toHaveLength(103);
        expect(hydrated103.map((q) => q.id)).toEqual(ids103);
    });

    it('renders 103-question CBT runner with 02:00:00 timer, handles option select / Mark for Review / Clear transitions, and opens cbt-palette-drawer <dialog>', async () => {
        const questions = buildQuestionsList(103);
        const test = buildMockTest(questions.map((q) => q.id));
        setupSupabaseMocks({ test, questions });

        renderExamRunner();

        await waitFor(() => {
            expect(screen.getByText('Question 1 of 103')).toBeTruthy();
        });

        expect(screen.getByTestId('cbt-countdown-timer').textContent).toContain('02:00:00');
        expect(screen.getByText(/Sample BPSC question #1 stem\?/)).toBeTruthy();

        const paletteAside = screen.getByRole('complementary', { name: 'Question Palette' });
        expect(
            within(paletteAside).getByRole('button', { name: /Question 1, Not Answered, current question/i })
        ).toBeTruthy();

        // Select Option A -> Answered
        const optionABtn = screen.getByRole('radio', { name: /Option A for Q1/i });
        fireEvent.click(optionABtn);

        expect(optionABtn.getAttribute('aria-checked')).toBe('true');
        expect(
            within(paletteAside).getByRole('button', { name: /Question 1, Answered, current question/i })
        ).toBeTruthy();

        // Mark for Review -> Answered & Marked
        const markBtn = screen.getByTestId('cbt-mark-review-btn');
        expect(markBtn.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(markBtn);

        expect(markBtn.getAttribute('aria-pressed')).toBe('true');
        expect(
            within(paletteAside).getByRole('button', {
                name: /Question 1, Answered & Marked, current question/i,
            })
        ).toBeTruthy();

        // Clear response -> Marked for Review
        const clearBtn = screen.getByTestId('cbt-clear-response-btn');
        fireEvent.click(clearBtn);

        expect(optionABtn.getAttribute('aria-checked')).toBe('false');
        expect(
            within(paletteAside).getByRole('button', {
                name: /Question 1, Marked for Review, current question/i,
            })
        ).toBeTruthy();

        // Open mobile slide-over palette <dialog>
        fireEvent.click(screen.getByTestId('open-palette-drawer-btn'));
        const paletteDrawer = screen.getByTestId('cbt-palette-drawer');
        expect(paletteDrawer.tagName).toBe('DIALOG');
        expect(paletteDrawer.hasAttribute('open')).toBe(true);
        expect(within(paletteDrawer).getByText('Question Palette')).toBeTruthy();
    });

    it('restores crash-safe mid-exam state (Q3, Q1 answer, elapsed countdown) on fresh reload and resumeAttemptId navigation', async () => {
        let fakeNowMs = Date.parse('2026-11-23T10:00:00.000Z');
        vi.spyOn(Date, 'now').mockImplementation(() => fakeNowMs);

        const questions = buildQuestionsList(10);
        const test = buildMockTest(questions.map((q) => q.id), {
            total_marks: 10,
            passing_marks: 4,
        });
        const supa = setupSupabaseMocks({ test, questions });

        // 1. Initial session: answer Q1, jump to Q3, advance 65s via visibilitychange
        const firstRender = renderExamRunner();
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 10')).toBeTruthy();
        });
        expect(screen.getByTestId('cbt-countdown-timer').textContent).toContain('02:00:00');

        fireEvent.click(screen.getByRole('radio', { name: /Option B for Q1/i }));

        const paletteAside = screen.getByRole('complementary', { name: 'Question Palette' });
        fireEvent.click(within(paletteAside).getByRole('button', { name: /^Question 3,/i }));

        await waitFor(() => {
            expect(screen.getByText('Question 3 of 10')).toBeTruthy();
        });

        await act(async () => {
            fakeNowMs += 65_000;
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await waitFor(() => {
            expect(screen.getByTestId('cbt-countdown-timer').textContent).toContain('01:58:55');
            expect(supa.attemptUpdates.length).toBeGreaterThan(0);
        });

        const persistedAttemptId = Array.from(supa.remoteAttempts.keys())[0];
        expect(persistedAttemptId).toBeTruthy();

        firstRender.unmount();

        // 2. Fresh reload without location.state -> restores Q3, timer 01:58:55, and Q1 answer
        const secondRender = renderExamRunner();
        await waitFor(() => {
            expect(screen.getByText('Question 3 of 10')).toBeTruthy();
        });
        expect(screen.getByTestId('cbt-countdown-timer').textContent).toContain('01:58:55');

        const reloadAside = screen.getByRole('complementary', { name: 'Question Palette' });
        fireEvent.click(within(reloadAside).getByRole('button', { name: /^Question 1,/i }));
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 10')).toBeTruthy();
        });
        expect(screen.getByRole('radio', { name: /Option B for Q1/i }).getAttribute('aria-checked')).toBe(
            'true'
        );

        // Return to Q3 before simulating cold reload with resumeAttemptId
        fireEvent.click(within(reloadAside).getByRole('button', { name: /^Question 3,/i }));
        await waitFor(() => {
            expect(screen.getByText('Question 3 of 10')).toBeTruthy();
        });
        secondRender.unmount();

        // 3. Wipe all local caches (Memory + localStorage + IDB) and remount with resumeAttemptId
        clearPreparedMockTestsCache();
        window.localStorage.clear();
        idbCacheStore.clear();
        idbActiveSessionStore.clear();

        renderExamRunner({
            pathname: ROUTES.TEST_SERIES.EXAM_RUNNER('test-bpsc-69'),
            state: { resumeAttemptId: persistedAttemptId },
        });

        await waitFor(() => {
            expect(screen.getByText('Question 3 of 10')).toBeTruthy();
        });
        expect(screen.getByTestId('cbt-countdown-timer').textContent).toContain('01:58:55');

        const resumedAside = screen.getByRole('complementary', { name: 'Question Palette' });
        fireEvent.click(within(resumedAside).getByRole('button', { name: /^Question 1,/i }));
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 10')).toBeTruthy();
        });
        expect(screen.getByRole('radio', { name: /Option B for Q1/i }).getAttribute('aria-checked')).toBe(
            'true'
        );
    });

    it('blocks execution for unpublished / outside-schedule mock tests (DEC-0017) and navigates back deterministically', async () => {
        setupSupabaseMocks({
            test: null,
            testError: new Error('This mock test is not currently available outside its scheduled window.'),
            questions: [],
        });

        renderExamRunner();

        await waitFor(() => {
            expect(screen.getByText('Test Not Found')).toBeTruthy();
        });
        expect(screen.queryByTestId('cbt-countdown-timer')).toBeNull();

        fireEvent.click(screen.getAllByRole('button', { name: /Back to Test/i })[0]);

        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(
                '/mcqs/test-series/test/test-bpsc-69'
            );
        });
    });

    it('handles Pause & Exit <dialog> persistence + toast and Submit <dialog> BPSC -0.33 scoring cleanly', async () => {
        // Pure computePreparedMockScore check: 2 correct, 1 wrong on 10-Q / 10-mark test with -0.33 negative marking
        const questions = buildQuestionsList(10);
        const directSummary = computePreparedMockScore({
            questions,
            answers: {
                [questions[0].id]: questions[0].correct,
                [questions[1].id]: questions[1].correct,
                [questions[2].id]: questions[2].options[1], // wrong
            },
            totalMarks: 10,
            negativeMarks: 0.33,
            passingMarks: 4,
        });
        expect(directSummary.correctCount).toBe(2);
        expect(directSummary.wrongCount).toBe(1);
        expect(directSummary.unansweredCount).toBe(7);
        expect(directSummary.score).toBe(1.67);
        expect(directSummary.accuracy).toBe(66.67);
        expect(directSummary.passed).toBe(false);

        // Part A: Pause & Exit via native <dialog>
        const test = buildMockTest(questions.map((q) => q.id), {
            duration_minutes: 60,
            total_marks: 10,
            passing_marks: 4,
            negative_marks: 0.33,
        });
        const supa = setupSupabaseMocks({ test, questions });

        const firstSession = renderExamRunner();
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 10')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('radio', { name: /Option A for Q1/i }));
        fireEvent.click(screen.getByTestId('cbt-pause-exit-btn'));

        const exitDialog = screen.getByTestId('cbt-exit-dialog');
        expect(exitDialog.tagName).toBe('DIALOG');
        expect(exitDialog.getAttribute('role')).toBe('alertdialog');
        expect(exitDialog.hasAttribute('open')).toBe(true);

        fireEvent.click(screen.getByTestId('cbt-confirm-exit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(
                '/mcqs/test-series/test/test-bpsc-69'
            );
        });
        expect(saveActiveSessionMock).toHaveBeenCalled();
        expect(useNotificationStore.getState().toasts.at(-1)?.title).toBe('Attempt Saved');
        const lastInProgressUpdate = supa.attemptUpdates.at(-1)?.payload;
        expect(lastInProgressUpdate?.status).toBe('in_progress');
        expect(lastInProgressUpdate?.answers?.[questions[0].id]).toBe(questions[0].correct);

        firstSession.unmount();
        cleanup();

        // Part B: Resume & Submit with 2 correct + 1 wrong => score 1.67, accuracy 66.67%, clean answers without __cbt_meta
        renderExamRunner();
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 10')).toBeTruthy();
        });

        const aside = screen.getByRole('complementary', { name: 'Question Palette' });
        fireEvent.click(within(aside).getByRole('button', { name: /^Question 2,/i }));
        await waitFor(() => {
            expect(screen.getByText('Question 2 of 10')).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('radio', { name: /Option A for Q2/i })); // Correct

        fireEvent.click(within(aside).getByRole('button', { name: /^Question 3,/i }));
        await waitFor(() => {
            expect(screen.getByText('Question 3 of 10')).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('radio', { name: /Option B for Q3/i })); // Wrong

        fireEvent.click(screen.getByTestId('open-submit-dialog-btn'));
        const submitDialog = screen.getByTestId('cbt-submit-dialog');
        expect(submitDialog.tagName).toBe('DIALOG');
        expect(submitDialog.getAttribute('role')).toBe('alertdialog');
        expect(submitDialog.hasAttribute('open')).toBe(true);

        fireEvent.click(screen.getByTestId('cbt-confirm-submit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toContain(
                '/mcqs/test-series/test/test-bpsc-69/result/'
            );
        });

        const completedUpdate = supa.attemptUpdates.find(
            (entry) => entry.payload?.status === 'completed'
        );
        expect(completedUpdate).toBeTruthy();
        expect(completedUpdate?.payload.score).toBe(1.67);
        expect(completedUpdate?.payload.accuracy).toBe(66.67);
        expect(completedUpdate?.payload.answers).toEqual({
            [questions[0].id]: questions[0].correct,
            [questions[1].id]: questions[1].correct,
            [questions[2].id]: questions[2].options[1],
        });
        expect(completedUpdate?.payload.answers).not.toHaveProperty('__cbt_meta');
        expect(clearActiveSessionMock).toHaveBeenCalled();
        expect(useNotificationStore.getState().toasts.at(-1)?.title).toBe('Mock Test Submitted');
    });

    it('resolves hardware back targets deterministically (rejecting //evil.com) and redirects ExamPlaceholderPage without navigate(-1)', async () => {
        const historyBackSpy = vi.spyOn(window.history, 'back');

        expect(
            resolveHardwareBackTarget('/exam/test-bpsc-69', {
                returnTo: '/mcqs/test-series/test/test-bpsc-69',
            })
        ).toBe('/mcqs/test-series/test/test-bpsc-69');
        expect(resolveHardwareBackTarget('/exam/test-bpsc-69')).toBe(
            '/mcqs/test-series/test/test-bpsc-69'
        );
        expect(
            resolveHardwareBackTarget('/exam/test-bpsc-69', {
                returnTo: '//evil.com',
            })
        ).toBe('/mcqs/test-series/test/test-bpsc-69');

        // 1. /mcqs/test-series/coming-soon -> deterministic Browse Mock Tests navigation
        render(
            <MemoryRouter initialEntries={[ROUTES.TEST_SERIES.COMING_SOON]}>
                <Routes>
                    <Route path={ROUTES.TEST_SERIES.COMING_SOON} element={<ExamPlaceholderPage />} />
                    <Route path={ROUTES.TEST_SERIES.BPSC} element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /Browse Mock Tests/i }));
        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(ROUTES.TEST_SERIES.BPSC);
        });

        cleanup();

        // 2. Legacy /exam/:testId placeholder route -> redirects cleanly to /exam/test-bpsc-69
        render(
            <MemoryRouter initialEntries={['/legacy-exam/test-bpsc-69']}>
                <Routes>
                    <Route path="/legacy-exam/:testId" element={<ExamPlaceholderPage />} />
                    <Route path="/exam/:testId" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe('/exam/test-bpsc-69');
        });
        expect(historyBackSpy).not.toHaveBeenCalled();
    });
});
