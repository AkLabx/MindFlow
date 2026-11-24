import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import {
    AlertTriangle,
    ArrowLeft,
    Award,
    BookmarkCheck,
    BookmarkPlus,
    BookOpen,
    CheckCircle2,
    CheckSquare,
    Clock,
    History,
    PlayCircle,
    RefreshCw,
    Share2,
    Target,
    WifiOff,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { getCanonicalExamById } from '@/features/dashboard/constants/examRegistry';
import { useNotification } from '@/hooks/useNotification';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import {
    UserTestAttemptItem,
    doesTextMatchCanonicalExam,
    fetchTestDetails,
    fetchUserTestAttempts,
    getCachedTestDetailsSnapshot,
    getCachedUserTestAttemptsSnapshot,
    isMockTestSaved,
    readSavedMockTestsIndexedDB,
    readTestDetailsIndexedDBCache,
    readUserTestAttemptsIndexedDBCache,
    toggleSavedMockTest,
} from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton } from '../components/Skeletons';
import { TestLeaderboardCard } from '../components/TestLeaderboardCard';

const PRODUCTION_TEST_BASE_URL = 'https://aklabx.github.io/MindFlow/#/mcqs/test-series/test';

export const resolveTestDetailBackTarget = (locationState: unknown, test: any): string => {
    const candidate =
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.returnTo ??
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.from;

    if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }

    const series = test?.mock_series ?? test?.test_series;
    if (series?.id) {
        return ROUTES.TEST_SERIES.SERIES(series.id);
    }

    const category = series?.mock_categories ?? series?.exam_categories;
    const bpscExam = getCanonicalExamById('bpsc');
    if (
        bpscExam &&
        (doesTextMatchCanonicalExam(bpscExam, category?.name) ||
            doesTextMatchCanonicalExam(bpscExam, series?.name) ||
            doesTextMatchCanonicalExam(bpscExam, test?.name))
    ) {
        return ROUTES.TEST_SERIES.BPSC;
    }

    return ROUTES.TEST_SERIES.ROOT;
};

const formatAttemptStatusLabel = (status?: UserTestAttemptItem['status'] | null): string => {
    if (status === 'completed') return 'Completed';
    if (status === 'abandoned') return 'Abandoned';
    return 'In Progress';
};

const formatDurationSeconds = (seconds: number | null): string => {
    if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
    const whole = Math.round(seconds);
    const hrs = Math.floor(whole / 3600);
    const mins = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    return `${secs}s`;
};

const formatAttemptDate = (isoDate: string | null): string => {
    if (!isoDate) return 'Recently';
    const parsed = Date.parse(isoDate);
    if (Number.isNaN(parsed)) return 'Recently';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(parsed));
    } catch {
        return 'Recently';
    }
};

export const TestDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId } = useParams<{ testId: string }>();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const userId = user?.id ?? null;

    const [test, setTest] = useState<any>(() =>
        testId ? getCachedTestDetailsSnapshot(testId) : null
    );
    const [loading, setLoading] = useState<boolean>(() => {
        if (!testId) return false;
        return !getCachedTestDetailsSnapshot(testId);
    });
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<UserTestAttemptItem[]>(() =>
        testId ? getCachedUserTestAttemptsSnapshot(testId, userId) ?? [] : []
    );
    const [attemptsLoading, setAttemptsLoading] = useState<boolean>(() =>
        Boolean(testId && userId && getCachedUserTestAttemptsSnapshot(testId, userId) === null)
    );
    const [showAllAttempts, setShowAllAttempts] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(() =>
        testId ? isMockTestSaved(testId, userId) : false
    );

    const fetchSeqRef = useRef<number>(0);
    const isMountedRef = useRef<boolean>(true);
    const hasTestRef = useRef<boolean>(Boolean(test));
    hasTestRef.current = Boolean(test);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadTestData = useCallback(
        async (isManualRetry = false) => {
            if (!testId) {
                setTest(null);
                setLoading(false);
                setAttempts([]);
                setAttemptsLoading(false);
                setOfflineNotice(null);
                telemetry.emit('empty_state_seen', {
                    view: 'mock_test_detail',
                    triggerCondition: 'missing_test_id',
                });
                return;
            }

            const seq = ++fetchSeqRef.current;
            const syncTest = getCachedTestDetailsSnapshot(testId);
            const syncAttempts = getCachedUserTestAttemptsSnapshot(testId, userId);

            if (syncTest && !isManualRetry) {
                setTest(syncTest);
                hasTestRef.current = true;
                setLoading(false);
            } else if (!hasTestRef.current) {
                setLoading(true);
            }

            if (syncAttempts !== null) {
                setAttempts(syncAttempts);
                setAttemptsLoading(false);
            } else if (userId) {
                setAttemptsLoading(true);
            } else {
                setAttempts([]);
                setAttemptsLoading(false);
            }

            setIsSaved(isMockTestSaved(testId, userId));
            setOfflineNotice(null);
            setIsRefreshing(true);

            // Async IndexedDB hydration when sync caches are cold
            if (!syncTest || (userId && syncAttempts === null)) {
                const [idbTest, idbAttempts, idbSavedIds] = await Promise.all([
                    syncTest ? Promise.resolve(syncTest) : readTestDetailsIndexedDBCache(testId),
                    userId && syncAttempts === null
                        ? readUserTestAttemptsIndexedDBCache(testId, userId)
                        : Promise.resolve(syncAttempts),
                    userId ? readSavedMockTestsIndexedDB(userId) : Promise.resolve([]),
                ]);

                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;

                if (idbTest && !syncTest) {
                    setTest(idbTest);
                    hasTestRef.current = true;
                    setLoading(false);
                }
                if (idbAttempts !== null && syncAttempts === null) {
                    setAttempts(idbAttempts);
                    setAttemptsLoading(false);
                }
                if (userId) {
                    setIsSaved(idbSavedIds.includes(testId) || isMockTestSaved(testId, userId));
                }
            }

            const [detailResult, attemptsResult] = await Promise.allSettled([
                fetchTestDetails(testId),
                userId ? fetchUserTestAttempts(testId, userId) : Promise.resolve([] as UserTestAttemptItem[]),
            ]);

            if (!isMountedRef.current || fetchSeqRef.current !== seq) return;

            if (detailResult.status === 'fulfilled') {
                setTest(detailResult.value);
                hasTestRef.current = true;
                setOfflineNotice(null);
            } else {
                const err = detailResult.reason as { message?: string; code?: string } | undefined;
                const msg = String(err?.message ?? '');
                const isUnavailableByPolicy =
                    err?.code === 'PGRST116' ||
                    msg.toLowerCase().includes('scheduled window') ||
                    msg.toLowerCase().includes('0 rows');

                if (isUnavailableByPolicy) {
                    setTest(null);
                    hasTestRef.current = false;
                    setOfflineNotice(null);
                    telemetry.emit('empty_state_seen', {
                        view: 'mock_test_detail',
                        triggerCondition: 'unpublished_or_outside_schedule_window',
                    });
                } else if (hasTestRef.current) {
                    setOfflineNotice('Showing cached mock test details while offline.');
                } else {
                    setTest(null);
                    setOfflineNotice(msg || 'Could not load mock test details.');
                    telemetry.emit('empty_state_seen', {
                        view: 'mock_test_detail',
                        triggerCondition: 'network_failed_no_cache',
                    });
                }
            }

            if (attemptsResult.status === 'fulfilled') {
                setAttempts(attemptsResult.value);
            }

            setLoading(false);
            setAttemptsLoading(false);
            setIsRefreshing(false);
        },
        [testId, userId]
    );

    useEffect(() => {
        setShowAllAttempts(false);
        const nextSync = testId ? getCachedTestDetailsSnapshot(testId) : null;
        const nextAttempts = testId ? getCachedUserTestAttemptsSnapshot(testId, userId) : null;
        setTest(nextSync);
        hasTestRef.current = Boolean(nextSync);
        setLoading(Boolean(testId && !nextSync));
        setAttempts(nextAttempts ?? []);
        setAttemptsLoading(Boolean(testId && userId && nextAttempts === null));
        setIsSaved(testId ? isMockTestSaved(testId, userId) : false);
        loadTestData(false);
    }, [testId, userId, loadTestData]);

    const handleLogicalBack = () => {
        triggerHaptic('light');
        navigate(resolveTestDetailBackTarget(location.state, test));
    };

    const handleRetry = () => {
        triggerHaptic('light');
        telemetry.emit('recovery_action_clicked', {
            view: 'mock_test_detail',
            actionChosen: 'retry_fetch',
        });
        loadTestData(true);
    };

    const handleToggleSave = () => {
        if (!test?.id) return;
        triggerHaptic('light');
        if (!userId) {
            showToast({
                variant: 'info',
                title: 'Sign in required',
                message: 'Sign in to bookmark mock tests to your profile.',
            });
            return;
        }
        const next = toggleSavedMockTest(test.id, userId);
        setIsSaved(next.saved);
        showToast({
            variant: 'success',
            title: next.saved ? 'Test Saved' : 'Removed from Saved',
            message: next.saved
                ? `${test.name} saved to your mock test bookmarks.`
                : `${test.name} removed from your saved mock tests.`,
        });
    };

    const handleShare = async () => {
        if (!test?.id) return;
        triggerHaptic('light');

        const canonicalUrl = Capacitor.isNativePlatform()
            ? `${PRODUCTION_TEST_BASE_URL}/${test.id}`
            : typeof window !== 'undefined'
              ? window.location.href
              : `${PRODUCTION_TEST_BASE_URL}/${test.id}`;
        const shareText = `Practice "${test.name}" on MindFlow (${durationMinutes} mins, ${questionCount} Qs).`;

        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({
                    title: test.name,
                    text: shareText,
                    url: canonicalUrl,
                    dialogTitle: 'Share Mock Test',
                });
                showToast({
                    variant: 'success',
                    title: 'Test Shared',
                    message: `Share sheet opened for "${test.name}".`,
                });
                return;
            }

            const isWindowsDesktop =
                typeof navigator !== 'undefined' && /Windows NT/i.test(navigator.userAgent || '');

            if (
                !isWindowsDesktop &&
                typeof navigator !== 'undefined' &&
                typeof navigator.share === 'function'
            ) {
                await navigator.share({
                    title: test.name,
                    text: shareText,
                    url: canonicalUrl,
                });
                showToast({
                    variant: 'success',
                    title: 'Test Shared',
                    message: `Share dialog opened for "${test.name}".`,
                });
                return;
            }
        } catch (err: any) {
            const name = String(err?.name ?? '');
            const msg = String(err?.message ?? '');
            const isExplicitCancel =
                /cancel|dismiss|user/i.test(msg) || (name === 'AbortError' && !/failed/i.test(msg));
            if (isExplicitCancel) {
                return;
            }
            // Fall through to clipboard copy fallback (e.g. desktop Chrome AbortError: "Share failed")
        }

        try {
            if (Capacitor.isNativePlatform()) {
                await Clipboard.write({ string: canonicalUrl });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(canonicalUrl);
            } else {
                await Clipboard.write({ string: canonicalUrl });
            }
            showToast({
                variant: 'success',
                title: 'Link Copied',
                message: 'Mock test link copied to clipboard.',
            });
        } catch {
            showToast({
                variant: 'error',
                title: 'Share Failed',
                message: 'Could not share or copy the mock test link.',
            });
        }
    };

    const series = test?.mock_series ?? test?.test_series;
    const category = series?.mock_categories ?? series?.exam_categories;

    const durationMinutes = Number(test?.duration_minutes ?? 0);
    const questionCount = Array.isArray(test?.question_ids) ? test.question_ids.length : 0;
    const totalMarks = Number(test?.total_marks ?? 0);
    const passingMarks = Number(test?.passing_marks ?? 0);
    const negativeMarks = Number(test?.negative_marks ?? 0);

    const attemptStats = useMemo(() => {
        const totalAttempts = attempts.length;
        const inProgressAttempt = attempts.find((a) => a.status === 'in_progress') ?? null;
        const completedAttempts = attempts.filter((a) => a.status === 'completed');
        const bestScore =
            completedAttempts.length > 0
                ? Math.max(...completedAttempts.map((a) => a.score))
                : null;
        const bestAccuracy =
            completedAttempts.length > 0
                ? Math.max(...completedAttempts.map((a) => a.accuracy))
                : null;
        const latestAttempt = attempts[0] ?? null;
        return {
            totalAttempts,
            inProgressAttempt,
            completedAttempts,
            bestScore,
            bestAccuracy,
            latestAttempt,
        };
    }, [attempts]);

    const visibleAttempts = useMemo(
        () => (showAllAttempts ? attempts : attempts.slice(0, 5)),
        [attempts, showAllAttempts]
    );

    const primaryCtaLabel = attemptStats.inProgressAttempt
        ? 'Resume Attempt'
        : attemptStats.completedAttempts.length > 0
          ? 'Re-attempt Test'
          : 'Start Test';

    const handleLaunchExam = () => {
        if (!test?.id) return;
        triggerHaptic('medium');
        navigate(`/exam/${test.id}`, {
            state: {
                returnTo: location.pathname,
                ...(attemptStats.inProgressAttempt
                    ? { resumeAttemptId: attemptStats.inProgressAttempt.id }
                    : {}),
            },
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
                <div className="w-full max-w-4xl mx-auto">
                    <HeroSkeleton />
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleLogicalBack}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Back</span>
                        </button>
                    </div>
                    <EmptyState
                        title="Test Not Found"
                        description={
                            offlineNotice ||
                            'This test does not exist, has been unpublished, or is outside its scheduled window.'
                        }
                        icon={<BookOpen className="w-8 h-8" aria-hidden="true" />}
                        actionLabel="Back to Mock Tests"
                        onAction={handleLogicalBack}
                        secondaryActionLabel="Retry"
                        onSecondaryAction={handleRetry}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
            <div className="flex-1 w-full max-w-4xl mx-auto">
                {/* Top Navigation & Refresh Bar */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                        type="button"
                        onClick={handleLogicalBack}
                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Back</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleRetry}
                        disabled={isRefreshing}
                        aria-label="Refresh test details"
                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                        />
                        <span>Refresh</span>
                    </button>
                </div>

                <Breadcrumbs
                    items={[
                        { label: 'Mock Tests', path: ROUTES.TEST_SERIES.ROOT },
                        ...(category?.name
                            ? [
                                  {
                                      label: category.name,
                                      path: category.id
                                          ? ROUTES.TEST_SERIES.CATEGORY(category.id)
                                          : undefined,
                                  },
                              ]
                            : []),
                        ...(series?.name
                            ? [
                                  {
                                      label: series.name,
                                      path: series.id
                                          ? ROUTES.TEST_SERIES.SERIES(series.id)
                                          : undefined,
                                  },
                              ]
                            : []),
                        { label: test.name },
                    ]}
                />

                {offlineNotice && (
                    <div
                        role="status"
                        className="mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{offlineNotice}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Hero / Decision Card */}
                <div className="w-full bg-white dark:bg-slate-800 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-700/60 mt-2 relative isolate">
                    {/* Decorative Header Banner (pure CSS, zero external assets) */}
                    <div className="h-28 sm:h-36 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 w-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
                        <BookOpen
                            aria-hidden="true"
                            className="absolute -bottom-8 -right-8 w-40 h-40 text-white opacity-10 -rotate-12"
                        />
                    </div>

                    <div className="px-5 sm:px-10 pt-5 sm:pt-6 pb-8 sm:pb-10 relative z-10">
                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-5 mb-8">
                            <div className="-mt-14 sm:-mt-16 bg-white dark:bg-slate-800 p-3.5 rounded-[22px] shadow-lg border border-slate-100 dark:border-slate-700 inline-block shrink-0 self-start">
                                <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-50 dark:bg-indigo-900/30 rounded-[14px] flex items-center justify-center">
                                    <CheckSquare
                                        aria-hidden="true"
                                        className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-600 dark:text-indigo-400"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 pt-1 md:pt-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                        {category?.name ? `${category.name} • ` : ''}
                                        {series?.name || 'Prepared Mock Test'}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                                            series?.is_premium
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        }`}
                                    >
                                        {series?.is_premium ? 'PRO' : 'Free'}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight [text-wrap:balance]">
                                    {test.name}
                                </h1>
                                {test.description && (
                                    <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed [text-wrap:pretty]">
                                        {test.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Facts Grid */}
                        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <Clock className="w-5 h-5 text-indigo-500 mb-2" aria-hidden="true" />
                                <dd className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {durationMinutes} mins
                                </dd>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Duration
                                </dt>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <CheckSquare className="w-5 h-5 text-emerald-500 mb-2" aria-hidden="true" />
                                <dd className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {questionCount}
                                </dd>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Questions
                                </dt>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <Award className="w-5 h-5 text-amber-500 mb-2" aria-hidden="true" />
                                <dd className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {totalMarks}
                                </dd>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total Marks
                                </dt>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <Target className="w-5 h-5 text-purple-500 mb-2" aria-hidden="true" />
                                <dd className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {passingMarks > 0 ? passingMarks : 'N/A'}
                                </dd>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Passing Marks
                                </dt>
                            </div>

                            <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" aria-hidden="true" />
                                <dd className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {negativeMarks > 0 ? `-${negativeMarks}` : 'None'}
                                </dd>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Negative Marking
                                </dt>
                            </div>
                        </dl>

                        {/* Instructions Preview */}
                        <section className="bg-indigo-50/80 dark:bg-indigo-900/15 rounded-2xl p-5 sm:p-6 mb-8 border border-indigo-100 dark:border-indigo-900/30">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">
                                Before you begin
                            </h2>
                            <ul className="space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <span>
                                        Total duration is {durationMinutes} minutes across {questionCount}{' '}
                                        questions for {totalMarks} marks.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <span>
                                        {negativeMarks > 0
                                            ? `Negative marking applies: -${negativeMarks} marks will be deducted for each incorrect answer.`
                                            : 'There is no negative marking for incorrect responses in this test.'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <span>
                                        Ensure stable connectivity; the test auto-submits when the countdown timer reaches zero.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Real Attempt History */}
                        <section className="mb-8 border-t border-slate-100 dark:border-slate-700/50 pt-7">
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <h2 className="font-bold text-slate-900 dark:text-white text-lg inline-flex items-center gap-2">
                                    <History className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                                    <span>Your Attempt History</span>
                                </h2>
                                {attemptStats.totalAttempts > 0 && (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {attemptStats.totalAttempts}{' '}
                                        {attemptStats.totalAttempts === 1 ? 'Attempt' : 'Attempts'}
                                    </span>
                                )}
                            </div>

                            {attemptsLoading && attempts.length === 0 ? (
                                <div className="space-y-3 animate-pulse" aria-busy="true">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Array.from({ length: 4 }).map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/60"
                                            />
                                        ))}
                                    </div>
                                    <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/60" />
                                </div>
                            ) : attempts.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                                        You haven&apos;t attempted this test yet. Launch the mock test below to record your first benchmark.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Attempts
                                            </dt>
                                            <dd className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                                                {attemptStats.totalAttempts}
                                            </dd>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Best Score
                                            </dt>
                                            <dd className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                                                {attemptStats.bestScore !== null
                                                    ? `${attemptStats.bestScore}/${totalMarks}`
                                                    : '—'}
                                            </dd>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Best Accuracy
                                            </dt>
                                            <dd className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                                                {attemptStats.bestAccuracy !== null
                                                    ? `${attemptStats.bestAccuracy.toFixed(1)}%`
                                                    : '—'}
                                            </dd>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Latest Status
                                            </dt>
                                            <dd className="mt-1 text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                                {formatAttemptStatusLabel(attemptStats.latestAttempt?.status)}
                                            </dd>
                                        </div>
                                    </dl>

                                    <ul className="space-y-2.5">
                                        {visibleAttempts.map((attempt, idx) => {
                                            const attemptNumber = attempts.length - idx;
                                            const isCompleted = attempt.status === 'completed';
                                            const passedCutoff =
                                                isCompleted &&
                                                passingMarks > 0 &&
                                                attempt.score >= passingMarks;
                                            const belowCutoff =
                                                isCompleted &&
                                                passingMarks > 0 &&
                                                attempt.score < passingMarks;

                                            return (
                                                <li
                                                    key={attempt.id || idx}
                                                    className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-4 py-3.5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                            Attempt #{attemptNumber}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                                attempt.status === 'completed'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                    : attempt.status === 'abandoned'
                                                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                            }`}
                                                        >
                                                            {attempt.status === 'completed' && (
                                                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                                            )}
                                                            {formatAttemptStatusLabel(attempt.status)}
                                                        </span>
                                                        {passedCutoff && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                                Passed
                                                            </span>
                                                        )}
                                                        {belowCutoff && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                Below Cutoff
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            <span>
                                                                Score:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {attempt.score} / {totalMarks}
                                                                </strong>
                                                            </span>
                                                            <span>
                                                                Accuracy:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {attempt.accuracy}%
                                                                </strong>
                                                            </span>
                                                            <span>{formatDurationSeconds(attempt.time_taken_seconds)}</span>
                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                {formatAttemptDate(
                                                                    attempt.end_time ??
                                                                        attempt.start_time ??
                                                                        attempt.created_at
                                                                )}
                                                            </span>
                                                        </div>

                                                        {isCompleted && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic();
                                                                    navigate(ROUTES.TEST_SERIES.RESULT(test.id, attempt.id));
                                                                }}
                                                                className="px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition-all active:scale-95 inline-flex items-center gap-1 shrink-0"
                                                                aria-label={`View solutions for Attempt #${attemptNumber}`}
                                                            >
                                                                <span>View Solution</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {attempts.length > 5 && (
                                        <div className="flex justify-center pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAllAttempts((prev) => !prev)}
                                                className="min-h-[44px] min-w-[44px] scroll-mb-28 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer"
                                            >
                                                {showAllAttempts
                                                    ? 'Show less'
                                                    : `Show all (${attempts.length})`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Leaderboard */}
                        <section className="mb-8 border-t border-slate-100 dark:border-slate-700/50 pt-7">
                            <TestLeaderboardCard
                                tests={[test]}
                                fixedTestId={test.id}
                                limit={20}
                                refreshKey={attempts.length}
                            />
                        </section>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-7">
                            <button
                                type="button"
                                onClick={handleLaunchExam}
                                className="w-full sm:w-auto min-h-[48px] min-w-[44px] scroll-mb-28 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black text-base sm:text-lg inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-lg hover:shadow-indigo-500/25 shrink-0"
                            >
                                <PlayCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                                <span>{primaryCtaLabel}</span>
                            </button>

                            <div className="flex w-full sm:w-auto gap-3">
                                <button
                                    type="button"
                                    aria-pressed={isSaved}
                                    onClick={handleToggleSave}
                                    className={`flex-1 sm:flex-none min-h-[44px] min-w-[44px] scroll-mb-28 px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer border ${
                                        isSaved
                                            ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    {isSaved ? (
                                        <BookmarkCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <BookmarkPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    )}
                                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="flex-1 sm:flex-none min-h-[44px] min-w-[44px] scroll-mb-28 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
