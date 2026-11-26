import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lock } from 'lucide-react';
import { DB_TABLES } from '@/config/dbTables';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import type { Question } from '@/types/models';
import { useNotification } from '@/hooks/useNotification';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    PreparedMockActiveAttemptState,
    fetchPreparedMockTestQuestions,
    fetchPublishedTests,
    fetchTestDetails,
    fetchUserCourseEntitlements,
    getCachedActivePreparedMockAttempt,
    getCachedPreparedTestQuestionsSnapshot,
    getCachedSeriesBundleSnapshot,
    getCachedTestDetailsSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    isMockSeriesPaid,
    readActivePreparedMockAttemptIndexedDB,
    readPreparedTestQuestionsIndexedDBCache,
    readTestDetailsIndexedDBCache,
    readUserCourseEntitlementsIndexedDBCache,
    resolveMockTestAccess,
    resolveQuestionPaletteStatus,
    savePreparedMockAttemptProgress,
    startOrResumePreparedMockAttempt,
    submitPreparedMockAttempt,
} from '../api/mockTestsApi';
import {
    CourseCheckoutDialog,
    type CourseCheckoutSeriesInfo,
} from '../components/CourseCheckoutDialog';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton } from '../components/Skeletons';
import { BpscDefaultExamShell } from '../components/cbt/BpscDefaultExamShell';
import { EduquityExamShell } from '../components/cbt/EduquityExamShell';
import { TcsIonExamShell } from '../components/cbt/TcsIonExamShell';
import {
    buildCbtSections,
    resolveExamCbtSkin,
    type LanguageViewMode,
    type PaletteFilterMode,
} from '../components/cbt/types';

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

export const PreparedMockExamPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId } = useParams<{ testId: string }>();
    const { user, profile } = useAuth();
    const { showToast } = useNotification();
    const userId = user?.id ?? null;

    const resumeAttemptId =
        typeof (location.state as { resumeAttemptId?: unknown } | null)?.resumeAttemptId === 'string'
            ? ((location.state as { resumeAttemptId: string }).resumeAttemptId ?? null)
            : null;

    const initialCachedTest = testId ? getCachedTestDetailsSnapshot(testId) : null;
    const initialCachedSeries =
        initialCachedTest?.[DB_TABLES.MOCK.SERIES] ??
        initialCachedTest?.mock_series ??
        initialCachedTest?.test_series ??
        null;
    const initialSyncAccessUnlocked = initialCachedTest
        ? resolveMockTestAccess({
              test: initialCachedTest,
              series: initialCachedSeries,
              entitlements: userId ? getCachedUserCourseEntitlementsSnapshot(userId) : [],
              orderedSeriesTests: initialCachedTest?.series_id
                  ? getCachedSeriesBundleSnapshot(initialCachedTest.series_id)?.tests ?? null
                  : null,
          }).unlocked
        : false;
    const initialCachedQuestions =
        testId && initialSyncAccessUnlocked
            ? getCachedPreparedTestQuestionsSnapshot(testId, initialCachedTest?.question_ids) ?? []
            : [];
    const initialCachedAttempt =
        testId && userId && initialSyncAccessUnlocked
            ? getCachedActivePreparedMockAttempt(testId, userId, resumeAttemptId)
            : null;

    const [test, setTest] = useState<any>(initialCachedTest);
    const [questions, setQuestions] = useState<Question[]>(initialCachedQuestions);
    const [attemptState, setAttemptState] = useState<PreparedMockActiveAttemptState | null>(
        initialCachedAttempt
    );
    const [loading, setLoading] = useState<boolean>(
        Boolean(
            testId &&
                (!initialCachedTest ||
                    !initialSyncAccessUnlocked ||
                    initialCachedQuestions.length === 0 ||
                    !initialCachedAttempt)
        )
    );
    const [loadError, setLoadError] = useState<string | null>(null);
    const [blockedCourseSeries, setBlockedCourseSeries] = useState<CourseCheckoutSeriesInfo | null>(
        null
    );
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(
        typeof navigator !== 'undefined' && navigator.onLine === false
    );
    const rawInitialLanguage = (location.state as { initialLanguage?: unknown } | null)
        ?.initialLanguage;
    const resolvedInitialLanguage: LanguageViewMode =
        rawInitialLanguage === 'en' ||
        rawInitialLanguage === 'hi' ||
        rawInitialLanguage === 'bilingual'
            ? rawInitialLanguage
            : 'bilingual';

    const [languageMode, setLanguageMode] = useState<LanguageViewMode>(resolvedInitialLanguage);

    useEffect(() => {
        if (
            rawInitialLanguage === 'en' ||
            rawInitialLanguage === 'hi' ||
            rawInitialLanguage === 'bilingual'
        ) {
            setLanguageMode(rawInitialLanguage);
        }
    }, [testId, rawInitialLanguage]);
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
        setBlockedCourseSeries(null);

        const syncTest = getCachedTestDetailsSnapshot(testId);
        const syncSeries =
            syncTest?.[DB_TABLES.MOCK.SERIES] ??
            syncTest?.mock_series ??
            syncTest?.test_series ??
            null;
        const syncAccessUnlocked = syncTest
            ? resolveMockTestAccess({
                  test: syncTest,
                  series: syncSeries,
                  entitlements: userId ? getCachedUserCourseEntitlementsSnapshot(userId) : [],
                  orderedSeriesTests: syncTest?.series_id
                      ? getCachedSeriesBundleSnapshot(syncTest.series_id)?.tests ?? null
                      : null,
              }).unlocked
            : false;

        const syncQuestions =
            syncTest && syncAccessUnlocked
                ? getCachedPreparedTestQuestionsSnapshot(testId, syncTest.question_ids)
                : null;
        const syncAttempt =
            userId && syncAccessUnlocked
                ? getCachedActivePreparedMockAttempt(testId, userId, resumeAttemptId)
                : null;

        if (syncTest) setTest(syncTest);
        if (syncQuestions && syncQuestions.length > 0) setQuestions(syncQuestions);
        if (syncAttempt) setAttemptState(syncAttempt);

        if (!syncTest || !syncAccessUnlocked || !syncQuestions || syncQuestions.length === 0 || !syncAttempt) {
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

        // 1b. Enforce paid-course / demo entitlement guard before loading questions (covers direct #/exam/:testId URLs)
        const resolvedSeries =
            resolvedTest[DB_TABLES.MOCK.SERIES] ??
            resolvedTest.mock_series ??
            resolvedTest.test_series ??
            null;
        const seriesId = String(resolvedTest.series_id ?? resolvedSeries?.id ?? '').trim();
        if (isMockSeriesPaid(resolvedSeries)) {
            let entitlements = userId
                ? getCachedUserCourseEntitlementsSnapshot(userId) ??
                  (await readUserCourseEntitlementsIndexedDBCache(userId))
                : [];
            if (userId && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
                try {
                    entitlements = await fetchUserCourseEntitlements(userId);
                } catch {
                    // Preserve cached entitlement snapshot on network error
                }
            }

            let orderedSeriesTests = seriesId
                ? getCachedSeriesBundleSnapshot(seriesId)?.tests ?? null
                : null;
            if (
                !orderedSeriesTests &&
                seriesId &&
                !resolvedTest.is_free_demo &&
                Number(resolvedSeries?.free_demo_count ?? 1) > 0 &&
                (typeof navigator === 'undefined' || navigator.onLine !== false)
            ) {
                try {
                    orderedSeriesTests = await fetchPublishedTests(seriesId);
                } catch {
                    orderedSeriesTests = null;
                }
            }

            if (!isMountedRef.current || hydrationSeqRef.current !== seq) return;

            const access = resolveMockTestAccess({
                test: resolvedTest,
                series: resolvedSeries,
                entitlements,
                orderedSeriesTests,
            });

            if (!access.unlocked) {
                setQuestions([]);
                setAttemptState(null);
                setBlockedCourseSeries({
                    id: seriesId || String(resolvedTest.id),
                    name: String(resolvedSeries?.name ?? resolvedTest.name ?? 'Paid Course'),
                    price_inr: access.priceInr,
                    mrp_inr: access.mrpInr,
                    validity_days: access.validityDays,
                    free_demo_count: access.freeDemoCount,
                    category_name: String(
                        resolvedSeries?.[DB_TABLES.MOCK.CATEGORIES]?.name ??
                            resolvedSeries?.mock_categories?.name ??
                            'Mock Series'
                    ),
                });
                setLoading(false);
                return;
            }
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

    useEffect(() => {
        if (!blockedCourseSeries) return;
        const handleInvalidation = () => {
            loadExamSession();
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidation);
        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidation);
        };
    }, [blockedCourseSeries, loadExamSession]);

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

                const targetResultRoute = ROUTES.TEST_SERIES.RESULT(currentTest.id, result.attempt.id);
                navigate(targetResultRoute, {
                    replace: true,
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

    const sections = useMemo(() => {
        if (!attemptState || questions.length === 0) return [];
        return buildCbtSections(questions, attemptState, resolveQuestionPaletteStatus);
    }, [questions, attemptState]);

    if (loading) {
        return (
            <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto">
                    <HeroSkeleton />
                </div>
            </div>
        );
    }

    if (blockedCourseSeries) {
        const backTarget = ROUTES.TEST_SERIES.SERIES(blockedCourseSeries.id);
        return (
            <div
                data-testid="cbt-paid-lock-screen"
                className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6"
            >
                <div className="max-w-2xl mx-auto space-y-6 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            navigate(backTarget, { replace: true });
                        }}
                        className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Back to Series</span>
                    </button>

                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-center space-y-5">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Lock className="w-8 h-8" aria-hidden="true" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Course Access Required
                            </p>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                {blockedCourseSeries.name}
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                                This test belongs to a paid course series. Unlock full access for{' '}
                                <strong className="text-slate-900 dark:text-white">
                                    ₹{blockedCourseSeries.price_inr}
                                </strong>{' '}
                                ({blockedCourseSeries.validity_days ?? 365} days validity) using your
                                Student ID{' '}
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {profile?.student_id || ''}
                                </span>
                                .
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCheckoutOpen(true)}
                                data-testid="cbt-lock-unlock-btn"
                                className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                            >
                                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>Unlock Series — ₹{blockedCourseSeries.price_inr}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(backTarget, { replace: true })}
                                className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                View Free Demo Tests
                            </button>
                        </div>
                    </div>
                </div>

                <CourseCheckoutDialog
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    series={blockedCourseSeries}
                    studentId={profile?.student_id ?? null}
                    userId={userId}
                    onRequestSubmitted={() => {
                        loadExamSession();
                    }}
                />
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

    const requestedSkin = (location.state as { cbtSkin?: unknown } | null)?.cbtSkin;
    const cbtSkin = resolveExamCbtSkin({ test, requestedSkin });
    const studentName = String(
        profile?.full_name ||
            user?.user_metadata?.full_name ||
            user?.email?.split('@')[0] ||
            'Student'
    );
    const studentId = profile?.student_id ?? null;

    const skinProps = {
        test,
        questions,
        attemptState,
        currentIndex,
        activeQuestion,
        selectedAnswer,
        isCurrentMarked,
        activePaletteStatus,
        paletteCounts,
        filteredPaletteItems,
        paletteFilter,
        setPaletteFilter,
        sections,
        languageMode,
        onCycleLanguage: handleCycleLanguage,
        setLanguageMode,
        hasHindiContent,
        zoomScale,
        setZoomScale,
        studentName,
        studentId,
        isOfflineMode,
        isSubmitting,
        isPaletteDrawerOpen,
        setIsPaletteDrawerOpen,
        isExitDialogOpen,
        setIsExitDialogOpen,
        isSubmitDialogOpen,
        setIsSubmitDialogOpen,
        formatCountdown: formatExamCountdown,
        onSelectOption: handleSelectOption,
        onToggleMarkForReview: handleToggleMarkForReview,
        onClearResponse: handleClearResponse,
        onSaveAndNext: handleSaveAndNext,
        onPrevious: handlePrevious,
        onJumpToIndex: handleJumpToIndex,
        onConfirmPauseAndExit: handleConfirmPauseAndExit,
        onConfirmSubmit: handleConfirmSubmit,
    };

    if (cbtSkin === 'ssc_cgl_tcs_ion') {
        return <TcsIonExamShell {...skinProps} />;
    }

    if (cbtSkin === 'ssc_cgl_eduquity') {
        return <EduquityExamShell {...skinProps} />;
    }

    return <BpscDefaultExamShell {...skinProps} />;
};
