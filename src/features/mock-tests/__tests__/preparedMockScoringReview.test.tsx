/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { useSyncStore } from '@/features/quiz/stores/useSyncStore';
import { resolveHardwareBackTarget } from '@/hooks/useHardwareBackButton';
import { syncService } from '@/lib/syncService';
import {
    PreparedMockActiveAttemptState,
    computePreparedMockScore,
    computePreparedMockSubjectBreakdown,
    fetchPreparedMockAttemptById,
    submitPreparedMockAttempt,
    cachePreparedMockAttemptDetail,
    getCachedPreparedMockAttemptByIdSnapshot,
} from '../api/mockTestsApi';
import { TestDetailPage } from '../pages/TestDetailPage';
import type { Question } from '@/types/models';

const {
    fromMock,
    getCacheEntryMock,
    setCacheEntryMock,
    mockUser,
} = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getCacheEntryMock: vi.fn(),
    setCacheEntryMock: vi.fn(),
    mockUser: { id: 'aspirant-test-uid-1', email: 'aspirant@mindflow.app' },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: fromMock,
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: mockUser } },
                error: null,
            }),
        },
    },
}));

vi.mock('@/lib/db', () => ({
    db: {
        getCacheEntry: getCacheEntryMock,
        setCacheEntry: setCacheEntryMock,
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
        </div>
    );
};

const createMockQuestion = (id: string, subject: string, correct: string = 'Option A'): Question => ({
    id,
    subject,
    question: `Sample question statement for ${id}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct,
    explanation: { summary: `Explanation for ${id}` },
    sourceInfo: { examName: 'BPSC', examYear: 2024 },
    classification: { subject, topic: 'General' },
    tags: [],
    properties: { difficulty: 'Medium', questionType: 'MCQ' },
});

describe('Prepared Mock Scoring, Negative Marking & Solution Review Pipeline (v1.0.374)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSyncStore.getState().clearQueue();
        localStorage.clear();
        getCacheEntryMock.mockResolvedValue(null);
        setCacheEntryMock.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('computes exact BPSC negative marking math (-0.33) and passing threshold', () => {
        // 103 questions, 150 total marks -> ~1.4563 marks per question
        const questions: Question[] = Array.from({ length: 103 }, (_, i) =>
            createMockQuestion(`q-${i + 1}`, i < 50 ? 'History' : 'General Science', 'Option A')
        );

        // 70 correct, 20 wrong, 13 unanswered
        const answers: Record<string, string> = {};
        for (let i = 0; i < 70; i++) {
            answers[`q-${i + 1}`] = 'Option A'; // Correct
        }
        for (let i = 70; i < 90; i++) {
            answers[`q-${i + 1}`] = 'Option B'; // Wrong
        }
        // 90..102 remain unanswered

        const result = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: 0.33,
            passingMarks: 95,
        });

        // 70 * (150/103) - 20 * 0.33 = 101.9417 - 6.60 = 95.34
        expect(result.totalQuestions).toBe(103);
        expect(result.correctCount).toBe(70);
        expect(result.wrongCount).toBe(20);
        expect(result.unansweredCount).toBe(13);
        expect(result.attemptedCount).toBe(90);
        expect(result.score).toBe(95.34);
        expect(result.accuracy).toBe(77.78);
        expect(result.passed).toBe(true);

        // Test below cutoff condition
        const strictCutoffResult = computePreparedMockScore({
            questions,
            answers,
            totalMarks: 150,
            negativeMarks: 0.33,
            passingMarks: 100,
        });
        expect(strictCutoffResult.passed).toBe(false);
    });

    it('computes subject-wise accuracy and score breakdown correctly', () => {
        const questions: Question[] = [
            createMockQuestion('q1', 'History', 'Option A'),
            createMockQuestion('q2', 'History', 'Option A'),
            createMockQuestion('q3', 'History', 'Option A'),
            createMockQuestion('q4', 'Bihar Special', 'Option A'),
            createMockQuestion('q5', 'Bihar Special', 'Option A'),
            createMockQuestion('q6', 'General Science', 'Option A'),
        ];

        const answers: Record<string, string> = {
            q1: 'Option A', // History Correct
            q2: 'Option B', // History Wrong
            // q3: Unanswered
            q4: 'Option A', // Bihar Special Correct
            q5: 'Option A', // Bihar Special Correct
            q6: 'Option C', // General Science Wrong
        };

        const breakdown = computePreparedMockSubjectBreakdown(
            questions,
            answers,
            2.0, // 2 marks per question
            0.5  // 0.5 negative mark
        );

        expect(breakdown).toHaveLength(3);
        // History: 3 total, 1 correct, 1 wrong, 1 unanswered -> score = 2.0 - 0.5 = 1.5, accuracy = 50%
        const history = breakdown.find((s) => s.subject === 'History');
        expect(history).toBeDefined();
        expect(history?.totalQuestions).toBe(3);
        expect(history?.correctCount).toBe(1);
        expect(history?.wrongCount).toBe(1);
        expect(history?.unansweredCount).toBe(1);
        expect(history?.marks).toBe(1.5);
        expect(history?.accuracy).toBe(50);

        // Bihar Special: 2 total, 2 correct, 0 wrong -> score = 4.0, accuracy = 100%
        const bihar = breakdown.find((s) => s.subject === 'Bihar Special');
        expect(bihar).toBeDefined();
        expect(bihar?.totalQuestions).toBe(2);
        expect(bihar?.correctCount).toBe(2);
        expect(bihar?.wrongCount).toBe(0);
        expect(bihar?.marks).toBe(4.0);
        expect(bihar?.accuracy).toBe(100);

        // General Science: 1 total, 0 correct, 1 wrong -> score = -0.5, accuracy = 0%
        const science = breakdown.find((s) => s.subject === 'General Science');
        expect(science).toBeDefined();
        expect(science?.totalQuestions).toBe(1);
        expect(science?.correctCount).toBe(0);
        expect(science?.wrongCount).toBe(1);
        expect(science?.marks).toBe(-0.5);
        expect(science?.accuracy).toBe(0);
    });

    it('queues attempt to useSyncStore when offline and replays via syncService', async () => {
        const state: PreparedMockActiveAttemptState = {
            attemptId: 'att-offline-1',
            testId: 'test-bpsc-1',
            userId: mockUser.id,
            status: 'in_progress',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalDurationSeconds: 7200,
            remainingSeconds: 3600,
            elapsedSeconds: 3600,
            currentIndex: 0,
            answers: { q1: 'Option A', __cbt_meta: 'should_be_stripped' },
            markedForReview: [],
            visitedQuestionIds: ['q1'],
            timeSpentByQuestion: { q1: 60 },
            remotePersisted: false,
        };

        const testMeta = {
            id: 'test-bpsc-1',
            total_marks: 100,
            negative_marks: 0.33,
            passing_marks: 40,
        };

        const questions: Question[] = [createMockQuestion('q1', 'History', 'Option A')];

        // Simulate offline submission failure
        fromMock.mockReturnValue({
            upsert: vi.fn().mockRejectedValue(new Error('Network offline')),
        });

        const submitResult = await submitPreparedMockAttempt({
            state,
            test: testMeta,
            questions,
        });

        expect(submitResult.remoteSynced).toBe(false);
        expect(submitResult.summary.score).toBe(100);

        // Verify event was enqueued into useSyncStore
        const queue = useSyncStore.getState().queue;
        expect(queue).toHaveLength(1);
        expect(queue[0].type).toBe('mock_test_attempt_submit');
        expect(queue[0].payload.id).toBe('att-offline-1');
        expect(queue[0].payload.status).toBe('completed');
        expect(queue[0].payload.answers).toEqual({ q1: 'Option A' }); // __cbt_meta stripped

        // Verify syncService.processEventQueue replays the queued event
        const upsertSpy = vi.fn().mockResolvedValue({ error: null });
        fromMock.mockReturnValue({
            upsert: upsertSpy,
        });

        await syncService.processEventQueue(mockUser.id);

        expect(upsertSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'att-offline-1',
                status: 'completed',
                score: 100,
            }),
            { onConflict: 'id' }
        );
        // Queue should now be empty after successful replay
        expect(useSyncStore.getState().queue).toHaveLength(0);
    });

    it('hydrates attempt details in 0ms from local cache and falls back to Supabase', async () => {
        const testId = 'test-idb-1';
        const attemptId = 'att-cache-1';

        // Pre-seed local cache
        cachePreparedMockAttemptDetail({
            id: attemptId,
            test_id: testId,
            user_id: mockUser.id,
            start_time: '2026-11-23T10:00:00Z',
            end_time: '2026-11-23T12:00:00Z',
            time_taken_seconds: 7200,
            score: 105.5,
            accuracy: 80,
            status: 'completed',
            answers: { q1: 'Option A' },
            created_at: '2026-11-23T10:00:00Z',
        });

        // Synchronous snapshot check
        const snapshot = getCachedPreparedMockAttemptByIdSnapshot(attemptId);
        expect(snapshot).not.toBeNull();
        expect(snapshot?.score).toBe(105.5);

        // fetchPreparedMockAttemptById with offline navigator returns local cache without network call
        const originalOnLine = navigator.onLine;
        try {
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            const loaded = await fetchPreparedMockAttemptById(testId, attemptId, mockUser.id);
            expect(loaded.id).toBe(attemptId);
            expect(loaded.score).toBe(105.5);
            expect(fromMock).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
        }
    });

    it('resolves hardware back target for result route back to TestDetailPage (DEC-0002)', () => {
        const target = resolveHardwareBackTarget('/mcqs/test-series/test/bpsc-prelims-69/result/att-abc-123');
        expect(target).toBe(ROUTES.TEST_SERIES.TEST('bpsc-prelims-69'));
    });

    it('renders View Solution button in TestDetailPage for completed attempts and deep-links', async () => {
        const testId = 'test-detail-link-1';
        const mockTestRecord = {
            id: testId,
            name: '69th BPSC Prelims PYQs',
            total_marks: 150,
            passing_marks: 95,
            negative_marks: 0.33,
            duration_minutes: 120,
            is_published: true,
            question_ids: ['q1', 'q2'],
            mock_series: {
                id: 'series-bpsc-1',
                name: 'BPSC Test Series',
                is_published: true,
                mock_categories: { id: 'cat-bpsc', name: 'BPSC', is_active: true },
            },
        };

        const mockAttempts = [
            {
                id: 'att-completed-99',
                test_id: testId,
                user_id: mockUser.id,
                score: 110,
                accuracy: 85,
                time_taken_seconds: 5400,
                status: 'completed',
                start_time: '2026-11-23T08:00:00Z',
                end_time: '2026-11-23T09:30:00Z',
                created_at: '2026-11-23T08:00:00Z',
            },
        ];

        fromMock.mockImplementation((table: string) => {
            if (table === DB_TABLES.MOCK.TESTS) {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockTestRecord, error: null }),
                    }),
                };
            }
            if (table === DB_TABLES.MOCK.ATTEMPTS) {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ data: mockAttempts, error: null }),
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
        });

        render(
            <MemoryRouter initialEntries={[`/mcqs/test-series/test/${testId}`]}>
                <Routes>
                    <Route path="/mcqs/test-series/test/:testId" element={<TestDetailPage />} />
                    <Route path="/mcqs/test-series/test/:testId/result/:attemptId" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for attempt history to render
        await waitFor(() => {
            expect(screen.getByText('Your Attempt History')).toBeTruthy();
        });

        const viewSolutionBtn = await screen.findByRole('button', {
            name: /View solutions for Attempt #1/i,
        });
        expect(viewSolutionBtn).toBeTruthy();

        fireEvent.click(viewSolutionBtn);

        await waitFor(() => {
            expect(screen.getByTestId('location-display').textContent).toBe(
                ROUTES.TEST_SERIES.RESULT(testId, 'att-completed-99')
            );
        });
    });
});
