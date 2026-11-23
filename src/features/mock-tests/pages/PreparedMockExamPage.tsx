import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eraser,
    Flag,
    Languages,
    LayoutGrid,
    PauseCircle,
    Send,
    WifiOff,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { formatOptionText, formatQuestionText } from '@/features/quiz/utils/questionFormatter';
import type { Question } from '@/types/models';
import { useNotification } from '@/hooks/useNotification';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import {
    PreparedMockActiveAttemptState,
    PreparedMockPaletteStatus,
    fetchPreparedMockTestQuestions,
    fetchTestDetails,
    getCachedActivePreparedMockAttempt,
    getCachedPreparedTestQuestionsSnapshot,
    getCachedTestDetailsSnapshot,
    readActivePreparedMockAttemptIndexedDB,
    readPreparedTestQuestionsIndexedDBCache,
    readTestDetailsIndexedDBCache,
    resolveQuestionPaletteStatus,
    savePreparedMockAttemptProgress,
    startOrResumePreparedMockAttempt,
    submitPreparedMockAttempt,
} from '../api/mockTestsApi';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton } from '../components/Skeletons';

type LanguageViewMode = 'bilingual' | 'en' | 'hi';
type PaletteFilterMode = 'all' | 'unanswered' | 'marked';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const resolvePreparedExamBackTarget = (
    locationState: unknown,
    testId?: string | null
): string => {
    const candidate =
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.returnTo ??
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.from;

    if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }

    const trimmedTestId = String(testId ?? '').trim();
    if (trimmedTestId) {
        return ROUTES.TEST_SERIES.TEST(trimmedTestId);
    }

    return ROUTES.TEST_SERIES.BPSC;
};

export const formatExamCountdown = (totalSeconds: number): string => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
};

const getPaletteStatusBadgeLabel = (status: PreparedMockPaletteStatus): string => {
    switch (status) {
        case 'answered':
            return 'Answered';
        case 'answered_and_marked':
            return 'Answered & Marked';
        case 'marked_for_review':
            return 'Marked for Review';
        case 'not_answered':
            return 'Not Answered';
        default:
            return 'Not Visited';
    }
};

const getPaletteButtonClasses = (
    status: PreparedMockPaletteStatus,
    isCurrent: boolean
): string => {
    const ring = isCurrent
        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
        : '';

    switch (status) {
        case 'answered':
            return `bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 ${ring}`;
        case 'answered_and_marked':
            return `bg-indigo-600 text-white border-purple-400 ring-1 ring-purple-400 ${ring}`;
        case 'marked_for_review':
            return `bg-purple-600 text-white border-purple-600 hover:bg-purple-500 ${ring}`;
        case 'not_answered':
            return `bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:border-rose-400 ${ring}`;
        default:
            return `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 ${ring}`;
    }
};

export const PreparedMockExamPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId } = useParams<{ testId: string }>();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const userId = user?.id ?? null;

    const resumeAttemptId =
        typeof (location.state as { resumeAttemptId?: unknown } | null)?.resumeAttemptId === 'string'
            ? ((location.state as { resumeAttemptId: string }).resumeAttemptId ?? null)
            : null;

    const initialCachedTest = testId ? getCachedTestDetailsSnapshot(testId) : null;
    const initialCachedQuestions = testId
        ? getCachedPreparedTestQuestionsSnapshot(testId, initialCachedTest?.question_ids) ?? []
        : [];
    const initialCachedAttempt =
        testId && userId
            ? getCachedActivePreparedMockAttempt(testId, userId, resumeAttemptId)
            : null;

    const [test, setTest] = useState<any>(initialCachedTest);
    const [questions, setQuestions] = useState<Question[]>(initialCachedQuestions);
    const [attemptState, setAttemptState] = useState<PreparedMockActiveAttemptState | null>(
        initialCachedAttempt
    );
    const [loading, setLoading] = useState<boolean>(
        Boolean(testId && (!initialCachedTest || initialCachedQuestions.length === 0 || !initialCachedAttempt))
    );
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(
        typeof navigator !== 'undefined' && navigator.onLine === false
    );
    const [languageMode, setLanguageMode] = useState<LanguageViewMode>('bilingual');
    const [paletteFilter, setPaletteFilter] = useState<PaletteFilterMode>('all');
    const [zoomScale, setZoomScale] = useState<number>(1);
    const [isPaletteDrawerOpen, setIsPaletteDrawerOpen] = useState<boolean>(false);
    const [isExitDialogOpen, setIsExitDialogOpen] = useState<boolean>(false);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const isMountedRef = useRef<boolean>(true);
    const hydrationSeqRef = useRef<number>(0);
    const attemptStateRef = useRef<PreparedMockActiveAttemptState | null>(attemptState);
    const testRef = useRef<any>(test);
    const questionsRef = useRef<Question[]>(questions);
    const isSubmittingRef = useRef<boolean>(false);
    const lastTickAtMsRef = useRef<number>(Date.now());
    const secondsSinceLocalSaveRef = useRef<number>(0);
    const secondsSinceRemoteSyncRef = useRef<number>(0);
    const questionEnteredAtMsRef = useRef<number>(Date.now());

    attemptStateRef.current = attemptState;
    testRef.current = test;
    questionsRef.current = questions;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Track online/offline transitions
    useEffect(() => {
        const handleOnline = () => setIsOfflineMode(false);
        const handleOffline = () => setIsOfflineMode(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadExamSession = useCallback(async () => {
        if (!testId) {
            setTest(null);
            setQuestions([]);
            setAttemptState(null);
            setLoading(false);
            setLoadError('Missing mock test identifier.');
            return;
        }

        const seq = ++hydrationSeqRef.current;
        setLoadError(null);

        const syncTest = getCachedTestDetailsSnapshot(testId);
        const syncQuestions = syncTest
            ? getCachedPreparedTestQuestionsSnapshot(testId, syncTest.question_ids)
            : null;
        const syncAttempt = userId
            ? getCachedActivePreparedMockAttempt(testId, userId, resumeAttemptId)
            : null;

        if (syncTest) setTest(syncTest);
        if (syncQuestions && syncQuestions.length > 0) setQuestions(syncQuestions);
        if (syncAttempt) setAttemptState(syncAttempt);

        if (!syncTest || !syncQuestions || syncQuestions.length === 0 || !syncAttempt) {
            setLoading(true);
        }

        // 1. Hydrate test metadata (IDB fallback -> live Supabase with DEC-0017 schedule check)
        let resolvedTest = syncTest;
        try {
            if (!resolvedTest) {
                resolvedTest = await readTestDetailsIndexedDBCache(testId);
                if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
                if (resolvedTest) setTest(resolvedTest);
            }

            if (typeof navigator === 'undefined' || navigator.onLine !== false) {
                const liveTest = await fetchTestDetails(testId);
                if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
                resolvedTest = liveTest;
                setTest(liveTest);
            }
        } catch (err: any) {
            if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
            const msg = String(err?.message ?? '');
            const isUnavailableByPolicy =
                err?.code === 'PGRST116' ||
                msg.toLowerCase().includes('scheduled window') ||
                msg.toLowerCase().includes('0 rows');

            if (isUnavailableByPolicy || !resolvedTest) {
                setTest(null);
                setQuestions([]);
                setAttemptState(null);
                setLoading(false);
                setLoadError(
                    isUnavailableByPolicy
                        ? 'This mock test does not exist, has been unpublished, or is outside its scheduled window.'
                        : msg || 'Could not load mock test details.'
                );
                telemetry.emit('empty_state_seen', {
                    view: 'prepared_mock_exam_runner',
                    triggerCondition: isUnavailableByPolicy
                        ? 'unpublished_or_outside_schedule_window'
                        : 'network_failed_no_cache',
                });
                return;
            }
            setIsOfflineMode(true);
        }

        if (!resolvedTest) {
            setTest(null);
            setQuestions([]);
            setAttemptState(null);
            setLoading(false);
            setLoadError(
                'This mock test does not exist, has been unpublished, or is outside its scheduled window.'
            );
            return;
        }

        // 2. Hydrate ordered questions (>100-UUID chunking + 0ms IDB fallback)
        const expectedIds: string[] = Array.isArray(resolvedTest.question_ids)
            ? resolvedTest.question_ids
            : [];
        let resolvedQuestions =
            getCachedPreparedTestQuestionsSnapshot(testId, expectedIds) ??
            (await readPreparedTestQuestionsIndexedDBCache(testId, expectedIds));

        if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;

        if (resolvedQuestions && resolvedQuestions.length > 0) {
            setQuestions(resolvedQuestions);
        }

        if (
            (!resolvedQuestions || resolvedQuestions.length === 0) &&
            expectedIds.length > 0
        ) {
            try {
                resolvedQuestions = await fetchPreparedMockTestQuestions(testId, expectedIds);
                if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
                setQuestions(resolvedQuestions);
            } catch (err: any) {
                if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
                setLoading(false);
                setLoadError(err?.message || 'Unable to load mock test questions.');
                return;
            }
        } else if (
            expectedIds.length > 0 &&
            (typeof navigator === 'undefined' || navigator.onLine !== false)
        ) {
            // Silent background refresh when cached questions already rendered
            fetchPreparedMockTestQuestions(testId, expectedIds)
                .then((fresh) => {
                    if (isMountedRef.current && hydrationSeqRef.current === seq && fresh.length > 0) {
                        setQuestions(fresh);
                    }
                })
                .catch(() => {});
        }

        if (!resolvedQuestions || resolvedQuestions.length === 0) {
            setQuestions([]);
            setLoading(false);
            setLoadError('This mock test does not have any active questions assigned yet.');
            return;
        }

        // 3. Start or restore crash-safe in_progress attempt
        const effectiveUserId = userId || 'offline-student';
        const cachedAttempt =
            syncAttempt ??
            (await readActivePreparedMockAttemptIndexedDB(
                testId,
                effectiveUserId,
                resumeAttemptId
            ));

        if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;

        if (cachedAttempt) {
            setAttemptState(cachedAttempt);
            setLoading(false);
        }

        try {
            const initializedAttempt = await startOrResumePreparedMockAttempt({
                test: resolvedTest,
                questions: resolvedQuestions,
                userId: effectiveUserId,
                resumeAttemptId,
            });
            if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
            setAttemptState(initializedAttempt);
            lastTickAtMsRef.current = Date.now();
            questionEnteredAtMsRef.current = Date.now();
            setLoading(false);
            telemetry.emit('quiz_session_started', {
                examId: resolvedTest.name,
                mode: 'mock',
                count: resolvedQuestions.length,
            });
            if (cachedAttempt || resumeAttemptId) {
                telemetry.emit('resume_quiz', {
                    quizId: initializedAttempt.attemptId,
                    progressPct: Math.round(
                        (Object.keys(initializedAttempt.answers).length /
                            Math.max(1, resolvedQuestions.length)) *
                            100
                    ),
                });
            }
        } catch (err: any) {
            if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;
            if (!cachedAttempt) {
                setLoadError(err?.message || 'Could not start mock test session.');
            }
            setLoading(false);
        }
    }, [testId, userId, resumeAttemptId]);

    useEffect(() => {
        loadExamSession();
    }, [loadExamSession]);

    // Helper: accumulate time spent on current question
    const withCurrentQuestionTimeFlushed = useCallback(
        (prev: PreparedMockActiveAttemptState): PreparedMockActiveAttemptState => {
            const now = Date.now();
            const deltaSecs = Math.max(0, Math.floor((now - questionEnteredAtMsRef.current) / 1000));
            questionEnteredAtMsRef.current = now;
            const activeQ = questionsRef.current[prev.currentIndex];
            if (!activeQ || deltaSecs === 0) return prev;
            return {
                ...prev,
                timeSpentByQuestion: {
                    ...prev.timeSpentByQuestion,
                    [activeQ.id]: (prev.timeSpentByQuestion[activeQ.id] || 0) + deltaSecs,
                },
            };
        },
        []
    );

    const handleConfirmSubmit = useCallback(
        async (isAutoSubmit = false) => {
            const currentAttempt = attemptStateRef.current;
            const currentTest = testRef.current;
            const currentQuestions = questionsRef.current;
            if (!currentAttempt || !currentTest || currentQuestions.length === 0) return;
            if (isSubmittingRef.current) return;

            isSubmittingRef.current = true;
            setIsSubmitting(true);
            setIsSubmitDialogOpen(false);
            setIsExitDialogOpen(false);
            setIsPaletteDrawerOpen(false);

            const flushed = withCurrentQuestionTimeFlushed(currentAttempt);

            try {
                const result = await submitPreparedMockAttempt({
                    state: flushed,
                    test: currentTest,
                    questions: currentQuestions,
                });

                telemetry.emit('offline_sync_completed', {
                    recordsSynced: result.remoteSynced ? 1 : 0,
                    durationMs: Math.max(0, flushed.elapsedSeconds * 1000),
                });

                showToast({
                    variant: 'success',
                    title: isAutoSubmit ? "Time's Up — Test Submitted" : 'Mock Test Submitted',
                    message: `Score: ${result.summary.score}/${result.summary.totalMarks} (${result.summary.accuracy}% accuracy)${
                        result.remoteSynced ? '' : ' • Saved offline'
                    }.`,
                    duration: 4500,
                });

                const targetDetailRoute = ROUTES.TEST_SERIES.TEST(currentTest.id);
                const detailBackCandidate = resolvePreparedExamBackTarget(
                    location.state,
                    currentTest.id
                );
                navigate(targetDetailRoute, {
                    replace: true,
                    state:
                        detailBackCandidate !== targetDetailRoute
                            ? { returnTo: detailBackCandidate }
                            : undefined,
                });
            } catch (err: any) {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                showToast({
                    variant: 'error',
                    title: 'Submission Error',
                    message: err?.message || 'Could not submit test. Your answers remain saved locally.',
                });
            }
        },
        [location.state, navigate, showToast, withCurrentQuestionTimeFlushed]
    );

    const handleConfirmSubmitRef = useRef(handleConfirmSubmit);
    handleConfirmSubmitRef.current = handleConfirmSubmit;

    // Monotonic wall-clock countdown timer + visibilitychange reconciliation + crash-safe auto-save
    const hasActiveExam = Boolean(test && questions.length > 0 && attemptState);

    useEffect(() => {
        if (!hasActiveExam) return;

        lastTickAtMsRef.current = Date.now();

        const advanceClock = () => {
            const current = attemptStateRef.current;
            if (!current || isSubmittingRef.current) return;

            const now = Date.now();
            const deltaSecs = Math.floor((now - lastTickAtMsRef.current) / 1000);
            if (deltaSecs <= 0) return;

            lastTickAtMsRef.current += deltaSecs * 1000;
            const nextRemaining = Math.max(0, current.remainingSeconds - deltaSecs);
            const nextElapsed = Math.min(
                current.totalDurationSeconds,
                current.elapsedSeconds + deltaSecs
            );

            const updated: PreparedMockActiveAttemptState = {
                ...current,
                remainingSeconds: nextRemaining,
                elapsedSeconds: nextElapsed,
                updatedAt: new Date(now).toISOString(),
            };
            attemptStateRef.current = updated;
            setAttemptState(updated);

            secondsSinceLocalSaveRef.current += deltaSecs;
            secondsSinceRemoteSyncRef.current += deltaSecs;

            if (nextRemaining <= 0) {
                handleConfirmSubmitRef.current(true);
                return;
            }

            if (secondsSinceRemoteSyncRef.current >= 30) {
                secondsSinceRemoteSyncRef.current = 0;
                secondsSinceLocalSaveRef.current = 0;
                savePreparedMockAttemptProgress(updated, { syncRemote: true }).catch(() => {});
            } else if (secondsSinceLocalSaveRef.current >= 5) {
                secondsSinceLocalSaveRef.current = 0;
                savePreparedMockAttemptProgress(updated, { syncRemote: false }).catch(() => {});
            }
        };

        const intervalId = window.setInterval(advanceClock, 1000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const current = attemptStateRef.current;
                if (current && !isSubmittingRef.current) {
                    savePreparedMockAttemptProgress(current, { syncRemote: false }).catch(() => {});
                }
            } else {
                advanceClock();
            }
        };
        const handlePageHide = () => {
            const current = attemptStateRef.current;
            if (current && !isSubmittingRef.current) {
                savePreparedMockAttemptProgress(current, { syncRemote: false }).catch(() => {});
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [hasActiveExam]);

    // Android hardware back interception: show Pause & Exit <dialog> when exam is active
    useEffect(() => {
        if (!hasActiveExam) return;
        const handleExamBackRequest = (e: Event) => {
            e.preventDefault();
            setIsExitDialogOpen(true);
        };
        window.addEventListener('mindflow:exam-back-request', handleExamBackRequest);
        return () => {
            window.removeEventListener('mindflow:exam-back-request', handleExamBackRequest);
        };
    }, [hasActiveExam]);

    const commitAttemptMutation = useCallback(
        (
            updater: (prev: PreparedMockActiveAttemptState) => PreparedMockActiveAttemptState,
            options?: { syncRemote?: boolean }
        ) => {
            const prev = attemptStateRef.current;
            if (!prev || isSubmittingRef.current) return;
            const next = updater(prev);
            attemptStateRef.current = next;
            setAttemptState(next);
            savePreparedMockAttemptProgress(next, { syncRemote: options?.syncRemote ?? false })
                .then((persisted) => {
                    if (
                        isMountedRef.current &&
                        attemptStateRef.current?.attemptId === persisted.attemptId &&
                        persisted.remotePersisted !== attemptStateRef.current.remotePersisted
                    ) {
                        const synced = {
                            ...attemptStateRef.current,
                            remotePersisted: persisted.remotePersisted,
                        };
                        attemptStateRef.current = synced;
                        setAttemptState(synced);
                    }
                })
                .catch(() => {});
        },
        []
    );

    const handleSelectOption = (option: string) => {
        const current = attemptStateRef.current;
        const activeQ = current ? questions[current.currentIndex] : undefined;
        if (!current || !activeQ) return;

        triggerHaptic('light');
        commitAttemptMutation(
            (prev) => ({
                ...prev,
                answers: {
                    ...prev.answers,
                    [activeQ.id]: option,
                },
                visitedQuestionIds: prev.visitedQuestionIds.includes(activeQ.id)
                    ? prev.visitedQuestionIds
                    : [...prev.visitedQuestionIds, activeQ.id],
            }),
            { syncRemote: true }
        );
    };

    const handleClearResponse = () => {
        const current = attemptStateRef.current;
        const activeQ = current ? questions[current.currentIndex] : undefined;
        if (!current || !activeQ || !current.answers[activeQ.id]) return;

        triggerHaptic('light');
        commitAttemptMutation(
            (prev) => {
                const nextAnswers = { ...prev.answers };
                delete nextAnswers[activeQ.id];
                return {
                    ...prev,
                    answers: nextAnswers,
                };
            },
            { syncRemote: true }
        );
    };

    const handleToggleMarkForReview = () => {
        const current = attemptStateRef.current;
        const activeQ = current ? questions[current.currentIndex] : undefined;
        if (!current || !activeQ) return;

        triggerHaptic('light');
        commitAttemptMutation(
            (prev) => {
                const isAlreadyMarked = prev.markedForReview.includes(activeQ.id);
                return {
                    ...prev,
                    markedForReview: isAlreadyMarked
                        ? prev.markedForReview.filter((id) => id !== activeQ.id)
                        : [...prev.markedForReview, activeQ.id],
                };
            },
            { syncRemote: true }
        );
    };

    const handleJumpToIndex = (targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= questions.length) return;
        const targetQ = questions[targetIndex];
        if (!targetQ) return;

        triggerHaptic('light');
        setIsPaletteDrawerOpen(false);
        commitAttemptMutation(
            (prev) => {
                const flushed = withCurrentQuestionTimeFlushed(prev);
                return {
                    ...flushed,
                    currentIndex: targetIndex,
                    visitedQuestionIds: flushed.visitedQuestionIds.includes(targetQ.id)
                        ? flushed.visitedQuestionIds
                        : [...flushed.visitedQuestionIds, targetQ.id],
                };
            },
            { syncRemote: false }
        );
    };

    const handlePrevious = () => {
        const currentIdx = attemptStateRef.current?.currentIndex ?? 0;
        if (currentIdx > 0) {
            handleJumpToIndex(currentIdx - 1);
        }
    };

    const handleSaveAndNext = () => {
        const currentIdx = attemptStateRef.current?.currentIndex ?? 0;
        if (currentIdx < questions.length - 1) {
            handleJumpToIndex(currentIdx + 1);
        } else {
            setIsSubmitDialogOpen(true);
        }
    };

    const handleConfirmPauseAndExit = async () => {
        triggerHaptic('light');
        const current = attemptStateRef.current;
        if (current) {
            const flushed = withCurrentQuestionTimeFlushed(current);
            await savePreparedMockAttemptProgress(flushed, { syncRemote: true }).catch(() => {});
        }
        setIsExitDialogOpen(false);
        showToast({
            variant: 'info',
            title: 'Attempt Saved',
            message: 'Your mock test progress is safely saved. Resume anytime.',
            duration: 3500,
        });
        navigate(resolvePreparedExamBackTarget(location.state, testId), { replace: true });
    };

    const handleCycleLanguage = () => {
        triggerHaptic('light');
        setLanguageMode((prev) =>
            prev === 'bilingual' ? 'en' : prev === 'en' ? 'hi' : 'bilingual'
        );
    };

    const paletteCounts = useMemo(() => {
        const counts = {
            answered: 0,
            notAnswered: 0,
            markedForReview: 0,
            answeredAndMarked: 0,
            notVisited: 0,
        };
        if (!attemptState) return counts;

        for (const q of questions) {
            const status = resolveQuestionPaletteStatus(q.id, attemptState);
            if (status === 'answered') counts.answered += 1;
            else if (status === 'not_answered') counts.notAnswered += 1;
            else if (status === 'marked_for_review') counts.markedForReview += 1;
            else if (status === 'answered_and_marked') counts.answeredAndMarked += 1;
            else counts.notVisited += 1;
        }
        return counts;
    }, [questions, attemptState]);

    const filteredPaletteItems = useMemo(() => {
        if (!attemptState) return [];
        return questions
            .map((q, index) => ({
                question: q,
                index,
                status: resolveQuestionPaletteStatus(q.id, attemptState),
            }))
            .filter((item) => {
                if (paletteFilter === 'unanswered') {
                    return item.status === 'not_answered' || item.status === 'not_visited';
                }
                if (paletteFilter === 'marked') {
                    return (
                        item.status === 'marked_for_review' ||
                        item.status === 'answered_and_marked'
                    );
                }
                return true;
            });
    }, [questions, attemptState, paletteFilter]);

    if (loading) {
        return (
            <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto">
                    <HeroSkeleton />
                </div>
            </div>
        );
    }

    if (!test || questions.length === 0 || !attemptState) {
        const backTarget = resolvePreparedExamBackTarget(location.state, testId);
        return (
            <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                navigate(backTarget, { replace: true });
                            }}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Back to Test</span>
                        </button>
                    </div>
                    <EmptyState
                        title="Test Not Found"
                        description={
                            loadError ||
                            'This mock test does not exist, has been unpublished, or is outside its scheduled window.'
                        }
                        icon={<BookOpen className="w-8 h-8" aria-hidden="true" />}
                        actionLabel="Back to Test"
                        onAction={() => navigate(backTarget, { replace: true })}
                        secondaryActionLabel="Retry"
                        onSecondaryAction={() => loadExamSession()}
                    />
                </div>
            </div>
        );
    }

    const currentIndex = Math.min(
        Math.max(0, attemptState.currentIndex),
        Math.max(0, questions.length - 1)
    );
    const activeQuestion = questions[currentIndex];
    const selectedAnswer = attemptState.answers[activeQuestion.id];
    const isCurrentMarked = attemptState.markedForReview.includes(activeQuestion.id);
    const activePaletteStatus = resolveQuestionPaletteStatus(activeQuestion.id, attemptState);
    const isUrgentTime = attemptState.remainingSeconds <= 300;
    const totalAnsweredCount = paletteCounts.answered + paletteCounts.answeredAndMarked;
    const totalMarks = Number(test.total_marks ?? questions.length);
    const negativeMarks = Math.abs(Number(test.negative_marks ?? 0));
    const marksPerQuestion =
        questions.length > 0 && totalMarks > 0
            ? Number((totalMarks / questions.length).toFixed(2))
            : 1;
    const isLastQuestion = currentIndex === questions.length - 1;
    const hasHindiContent = Boolean(
        activeQuestion.question_hi ||
            (Array.isArray(activeQuestion.options_hi) && activeQuestion.options_hi.some(Boolean))
    );

    const renderPaletteBody = (headingId?: string) => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2
                        id={headingId}
                        className="text-base font-black text-slate-900 dark:text-white tracking-tight"
                    >
                        Question Palette
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {totalAnsweredCount} of {questions.length} answered
                    </p>
                </div>
                {headingId && (
                    <button
                        type="button"
                        onClick={() => setIsPaletteDrawerOpen(false)}
                        aria-label="Close Question Palette"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* 5-State Legend */}
            <div className="grid grid-cols-2 gap-2 py-3 text-[11px] font-bold">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" />
                    <span>Answered ({paletteCounts.answered})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-900 border border-rose-400 shrink-0" />
                    <span>Not Answered ({paletteCounts.notAnswered})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-purple-600 shrink-0" />
                    <span>Marked ({paletteCounts.markedForReview})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-indigo-600 ring-1 ring-purple-400 shrink-0" />
                    <span>Ans &amp; Marked ({paletteCounts.answeredAndMarked})</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <span>Not Visited ({paletteCounts.notVisited})</span>
                </div>
            </div>

            {/* Palette Filter Chips */}
            <div className="flex items-center gap-2 pb-3" role="group" aria-label="Filter question palette">
                {(
                    [
                        { id: 'all', label: 'All' },
                        { id: 'unanswered', label: 'Unanswered' },
                        { id: 'marked', label: 'Marked' },
                    ] as const
                ).map((chip) => {
                    const active = paletteFilter === chip.id;
                    return (
                        <button
                            key={chip.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setPaletteFilter(chip.id)}
                            className={`flex-1 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                active
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                            }`}
                        >
                            {chip.label}
                        </button>
                    );
                })}
            </div>

            {/* Scrollable Question Grid */}
            <div className="flex-1 overflow-y-auto pr-1 py-1">
                {filteredPaletteItems.length === 0 ? (
                    <div className="text-center py-8 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            No questions match this filter.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {filteredPaletteItems.map(({ question, index, status }) => {
                            const isCurrent = index === currentIndex;
                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => handleJumpToIndex(index)}
                                    aria-label={`Question ${index + 1}, ${getPaletteStatusBadgeLabel(status)}${
                                        isCurrent ? ', current question' : ''
                                    }`}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className={`min-h-[44px] min-w-[44px] scroll-mb-28 rounded-xl border text-xs font-black inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer ${getPaletteButtonClasses(
                                        status,
                                        isCurrent
                                    )}`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sidebar Submit Action */}
            <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        setIsPaletteDrawerOpen(false);
                        setIsSubmitDialogOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Submit Test</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
            {/* Sticky Immersive CBT Header */}
            <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)]">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsExitDialogOpen(true);
                            }}
                            aria-label="Pause and exit mock test"
                            data-testid="cbt-pause-exit-btn"
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Pause</span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate leading-tight">
                                {test.name}
                            </h1>
                            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                Q {currentIndex + 1} / {questions.length} • {totalAnsweredCount} Answered
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        <div
                            role="timer"
                            aria-label="Time remaining"
                            data-testid="cbt-countdown-timer"
                            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 rounded-xl border font-mono font-black text-xs sm:text-sm inline-flex items-center gap-1.5 ${
                                isUrgentTime
                                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 animate-pulse'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                            }`}
                        >
                            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{formatExamCountdown(attemptState.remainingSeconds)}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsPaletteDrawerOpen(true)}
                            aria-label="Open Question Palette"
                            data-testid="open-palette-drawer-btn"
                            className="lg:hidden min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only">Palette</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSubmitDialogOpen(true)}
                            disabled={isSubmitting}
                            data-testid="open-submit-dialog-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                        >
                            <Send className="w-4 h-4 shrink-0 hidden sm:inline" aria-hidden="true" />
                            <span>Submit</span>
                        </button>
                    </div>
                </div>
            </header>

            {isOfflineMode && (
                <div
                    role="status"
                    className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/70 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2"
                >
                    <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Offline mode active — answers &amp; timer continue saving locally.</span>
                </div>
            )}

            {/* Split Workspace: Question Stage + Desktop Sidebar */}
            <div className="flex-1 flex w-full max-w-7xl mx-auto">
                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28">
                    {/* Question Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            {activeQuestion.subject && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                    {activeQuestion.subject}
                                </span>
                            )}
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                                +{marksPerQuestion} / {negativeMarks > 0 ? `-${negativeMarks}` : '0'}
                            </span>
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    activePaletteStatus === 'answered'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : activePaletteStatus === 'answered_and_marked'
                                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                          : activePaletteStatus === 'marked_for_review'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {getPaletteStatusBadgeLabel(activePaletteStatus)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {hasHindiContent && (
                                <button
                                    type="button"
                                    onClick={handleCycleLanguage}
                                    aria-label={`Switch display language (current: ${languageMode})`}
                                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                                >
                                    <Languages className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>
                                        {languageMode === 'bilingual'
                                            ? 'EN + हिं'
                                            : languageMode === 'en'
                                              ? 'English'
                                              : 'हिन्दी'}
                                    </span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.max(0.9, Number((z - 0.1).toFixed(2))))}
                                aria-label="Decrease question text size"
                                className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomOut className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                                aria-label="Increase question text size"
                                className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomIn className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Question Card */}
                    <article
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6"
                        style={{ fontSize: `${zoomScale}rem` }}
                    >
                        {(activeQuestion.examName || activeQuestion.examYear) && (
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                Source: {activeQuestion.examName || 'Mock Bank'}
                                {activeQuestion.examYear ? ` • ${activeQuestion.examYear}` : ''}
                                {activeQuestion.examDateShift ? ` • ${activeQuestion.examDateShift}` : ''}
                            </p>
                        )}

                        <div className="space-y-4">
                            {(languageMode !== 'hi' || !activeQuestion.question_hi) && (
                                <div className="text-slate-900 dark:text-white leading-relaxed font-semibold">
                                    <MarkdownRenderer
                                        content={formatQuestionText(activeQuestion.question)}
                                    />
                                </div>
                            )}

                            {languageMode !== 'en' && activeQuestion.question_hi && (
                                <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-hindi border-l-4 border-indigo-200 dark:border-indigo-800 pl-4">
                                    <MarkdownRenderer
                                        content={formatQuestionText(activeQuestion.question_hi)}
                                    />
                                </div>
                            )}

                            {activeQuestion.question_image_url && (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">
                                    <img
                                        src={activeQuestion.question_image_url}
                                        alt={`Diagram for Question ${currentIndex + 1}`}
                                        loading="lazy"
                                        className="max-h-72 w-auto mx-auto rounded-xl object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Options Radio Group */}
                        <div
                            role="radiogroup"
                            aria-label={`Options for Question ${currentIndex + 1}`}
                            className="space-y-3"
                        >
                            {activeQuestion.options.map((option, idx) => {
                                const isSelected = selectedAnswer === option;
                                const optionHi = activeQuestion.options_hi?.[idx];
                                const showEnglishOption = languageMode !== 'hi' || !optionHi;
                                const showHindiOption =
                                    languageMode !== 'en' &&
                                    Boolean(optionHi) &&
                                    optionHi!.trim().toLowerCase() !== option.trim().toLowerCase();
                                const letter = OPTION_LETTERS[idx] ?? String(idx + 1);

                                return (
                                    <button
                                        key={`${activeQuestion.id}-opt-${idx}`}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => handleSelectOption(option)}
                                        className={`w-full min-h-[56px] scroll-mb-28 text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 dark:text-indigo-100'
                                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 text-slate-800 dark:text-slate-100'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`mt-0.5 w-7 h-7 rounded-lg text-xs font-black inline-flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {letter}
                                        </span>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            {showEnglishOption && (
                                                <div className="leading-snug font-medium">
                                                    <MarkdownRenderer
                                                        content={formatOptionText(option)}
                                                        className="!text-current"
                                                    />
                                                </div>
                                            )}
                                            {showHindiOption && optionHi && (
                                                <div className="font-hindi text-[0.95em] opacity-85 leading-snug">
                                                    <MarkdownRenderer
                                                        content={formatOptionText(optionHi)}
                                                        className="!text-current"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </article>
                </main>

                {/* Persistent Desktop Question Palette Sidebar */}
                <aside
                    aria-label="Question Palette"
                    className="hidden lg:flex lg:w-80 xl:w-96 shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sticky top-16 h-[calc(100dvh-4rem-4.75rem)]"
                >
                    {renderPaletteBody()}
                </aside>
            </div>

            {/* Fixed Bottom CBT Action Bar */}
            <footer className="sticky bottom-0 z-20 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 px-3 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            aria-label="Previous question"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Prev</span>
                        </button>

                        <button
                            type="button"
                            aria-pressed={isCurrentMarked}
                            onClick={handleToggleMarkForReview}
                            aria-label={isCurrentMarked ? 'Unmark review' : 'Mark for Review'}
                            data-testid="cbt-mark-review-btn"
                            className={`min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl border font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                isCurrentMarked
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400'
                            }`}
                        >
                            <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden xs:inline sm:inline">
                                {isCurrentMarked ? 'Marked' : 'Mark'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearResponse}
                            disabled={!selectedAnswer}
                            aria-label="Clear selected response"
                            data-testid="cbt-clear-response-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:border-rose-400 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Eraser className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Clear</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndNext}
                        data-testid="cbt-save-next-btn"
                        className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm shrink-0"
                    >
                        <span>{isLastQuestion ? 'Review & Submit' : 'Save & Next'}</span>
                        {!isLastQuestion && <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </button>
                </div>
            </footer>

            {/* Mobile Slide-Over Question Palette Drawer (Top-Layer NativeDialog) */}
            <NativeDialog
                isOpen={isPaletteDrawerOpen}
                onClose={() => setIsPaletteDrawerOpen(false)}
                variant="drawer-right"
                ariaLabelledBy="mobile-palette-drawer-title"
                dataTestId="cbt-palette-drawer"
                panelClassName="h-full w-full bg-white dark:bg-slate-900 p-5 flex flex-col"
            >
                {renderPaletteBody('mobile-palette-drawer-title')}
            </NativeDialog>

            {/* Pause & Exit Confirmation Dialog */}
            <NativeDialog
                isOpen={isExitDialogOpen}
                onClose={() => setIsExitDialogOpen(false)}
                role="alertdialog"
                ariaLabelledBy="cbt-exit-dialog-title"
                dataTestId="cbt-exit-dialog"
                className="max-w-md"
                panelClassName="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <PauseCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                        <h2
                            id="cbt-exit-dialog-title"
                            className="text-lg font-black text-slate-900 dark:text-white"
                        >
                            Pause &amp; Exit Mock Test?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Your {totalAnsweredCount} answered responses and{' '}
                            {formatExamCountdown(attemptState.remainingSeconds)} remaining time are
                            saved safely so you can resume anytime.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsExitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Continue Test
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPauseAndExit}
                        data-testid="cbt-confirm-exit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                    >
                        Save &amp; Exit
                    </button>
                </div>
            </NativeDialog>

            {/* Submit Test Confirmation Dialog */}
            <NativeDialog
                isOpen={isSubmitDialogOpen}
                onClose={() => !isSubmitting && setIsSubmitDialogOpen(false)}
                role="alertdialog"
                dismissible={!isSubmitting}
                ariaLabelledBy="cbt-submit-dialog-title"
                dataTestId="cbt-submit-dialog"
                className="max-w-md"
                panelClassName="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            paletteCounts.notAnswered + paletteCounts.notVisited > 0
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                    >
                        {paletteCounts.notAnswered + paletteCounts.notVisited > 0 ? (
                            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                        )}
                    </div>
                    <div>
                        <h2
                            id="cbt-submit-dialog-title"
                            className="text-lg font-black text-slate-900 dark:text-white"
                        >
                            Submit Mock Test?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Once submitted, this attempt will be scored and locked in your attempt
                            history.
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 p-3">
                        <dd className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {totalAnsweredCount}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-emerald-700/80 dark:text-emerald-400">
                            Answered
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 p-3">
                        <dd className="text-lg font-black text-rose-700 dark:text-rose-300">
                            {paletteCounts.notAnswered}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-rose-700/80 dark:text-rose-400">
                            Not Answered
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/50 p-3">
                        <dd className="text-lg font-black text-purple-700 dark:text-purple-300">
                            {paletteCounts.markedForReview + paletteCounts.answeredAndMarked}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-purple-700/80 dark:text-purple-400">
                            Marked Review
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                        <dd className="text-lg font-black text-slate-800 dark:text-slate-100">
                            {paletteCounts.notVisited}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            Not Visited
                        </dt>
                    </div>
                </dl>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsSubmitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                        Return to Test
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleConfirmSubmit(false)}
                        data-testid="cbt-confirm-submit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                </div>
            </NativeDialog>
        </div>
    );
};
