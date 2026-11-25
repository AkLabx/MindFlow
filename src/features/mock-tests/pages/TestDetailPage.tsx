import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import {
    AlertTriangle,
    Award,
    BookmarkCheck,
    BookmarkPlus,
    BookOpen,
    CheckCircle2,
    CheckSquare,
    Clock,
    History,
    Lock,
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
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    UserCourseEntitlementItem,
    UserTestAttemptItem,
    doesTextMatchCanonicalExam,
    fetchPublishedTests,
    fetchTestDetails,
    fetchUserCourseEntitlements,
    fetchUserTestAttempts,
    getCachedSeriesBundleSnapshot,
    getCachedTestDetailsSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    getCachedUserTestAttemptsSnapshot,
    isMockSeriesPaid,
    isMockTestSaved,
    normalizeMockSeriesType,
    normalizeMockTestType,
    readSavedMockTestsIndexedDB,
    readTestDetailsIndexedDBCache,
    readUserCourseEntitlementsIndexedDBCache,
    readUserTestAttemptsIndexedDBCache,
    resolveMockTestAccess,
    toggleSavedMockTest,
} from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CourseCheckoutDialog } from '../components/CourseCheckoutDialog';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton } from '../components/Skeletons';
import { TestLeaderboardCard } from '../components/TestLeaderboardCard';
import {
    getPreferredSscCglSkin,
    isSscCglContext,
    setPreferredSscCglSkin,
    type SscCglCbtSkin,
} from '../components/cbt/types';

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
    const { user, profile } = useAuth();
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
    const [entitlements, setEntitlements] = useState<UserCourseEntitlementItem[]>(() =>
        userId ? getCachedUserCourseEntitlementsSnapshot(userId) ?? [] : []
    );
    const [orderedSeriesTests, setOrderedSeriesTests] = useState<any[] | null>(null);
    const [selectedCbtSkin, setSelectedCbtSkin] = useState<SscCglCbtSkin>(() =>
        getPreferredSscCglSkin()
    );
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
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
                const [idbTest, idbAttempts, idbSavedIds, idbEnt] = await Promise.all([
                    syncTest ? Promise.resolve(syncTest) : readTestDetailsIndexedDBCache(testId),
                    userId && syncAttempts === null
                        ? readUserTestAttemptsIndexedDBCache(testId, userId)
                        : Promise.resolve(syncAttempts),
                    userId ? readSavedMockTestsIndexedDB(userId) : Promise.resolve([]),
                    userId ? readUserCourseEntitlementsIndexedDBCache(userId) : Promise.resolve(null),
                ]);

                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;

                if (idbEnt !== null) {
                    setEntitlements(idbEnt);
                }
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

            const [detailResult, attemptsResult, entResult] = await Promise.allSettled([
                fetchTestDetails(testId),
                userId ? fetchUserTestAttempts(testId, userId) : Promise.resolve([] as UserTestAttemptItem[]),
                userId
                    ? fetchUserCourseEntitlements(userId, { forceRefresh: isManualRetry })
                    : Promise.resolve([] as UserCourseEntitlementItem[]),
            ]);

            if (!isMountedRef.current || fetchSeqRef.current !== seq) return;

            if (entResult.status === 'fulfilled') {
                setEntitlements(entResult.value);
            }

            if (detailResult.status === 'fulfilled') {
                setTest(detailResult.value);
                hasTestRef.current = true;
                setOfflineNotice(null);

                const resolvedTest = detailResult.value;
                const resolvedSeries = resolvedTest?.mock_series ?? resolvedTest?.test_series;
                const sid = String(resolvedTest?.series_id ?? resolvedSeries?.id ?? '').trim();
                if (sid && isMockSeriesPaid(resolvedSeries) && !resolvedTest?.is_free_demo) {
                    const cachedTests = getCachedSeriesBundleSnapshot(sid)?.tests ?? null;
                    if (cachedTests) {
                        setOrderedSeriesTests(cachedTests);
                    } else {
                        fetchPublishedTests(sid)
                            .then((list) => {
                                if (isMountedRef.current && fetchSeqRef.current === seq) {
                                    setOrderedSeriesTests(list);
                                }
                            })
                            .catch(() => {});
                    }
                }
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

    useEffect(() => {
        const handleCacheInvalidated = () => {
            void loadTestData(true);
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        };
    }, [loadTestData]);

    const handleLogicalBack = () => {
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

    const series = test?.mock_series ?? test?.test_series;
    const category = series?.mock_categories ?? series?.exam_categories;

    const durationMinutes = Number(test?.duration_minutes ?? 0);
    const questionCount = Array.isArray(test?.question_ids) ? test.question_ids.length : 0;
    const totalMarks = Number(test?.total_marks ?? 0);
    const passingMarks = Number(test?.passing_marks ?? 0);
    const negativeMarks = Number(test?.negative_marks ?? 0);

    const isPyq =
        normalizeMockTestType(test?.test_type) === 'PYQ' ||
        normalizeMockSeriesType(series?.series_type) === 'PYQ';

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

    const testAccess = useMemo(
        () =>
            resolveMockTestAccess({
                test,
                series,
                entitlements,
                orderedSeriesTests,
            }),
        [test, series, entitlements, orderedSeriesTests]
    );

    const showSscCglSkinChooser = useMemo(() => Boolean(test && isSscCglContext(test)), [test]);

    const primaryCtaLabel = !testAccess.unlocked
        ? `Unlock Series — ₹${testAccess.priceInr}`
        : attemptStats.inProgressAttempt
          ? 'Resume Attempt'
          : attemptStats.completedAttempts.length > 0
            ? 'Re-attempt Test'
            : 'Start Test';

    const handleLaunchExam = () => {
        if (!test?.id) return;
        if (!testAccess.unlocked) {
            triggerHaptic('light');
            setIsCheckoutOpen(true);
            return;
        }
        triggerHaptic('medium');
        navigate(`/exam/${test.id}`, {
            state: {
                returnTo: location.pathname,
                ...(attemptStats.inProgressAttempt
                    ? { resumeAttemptId: attemptStats.inProgressAttempt.id }
                    : {}),
                ...(showSscCglSkinChooser ? { cbtSkin: selectedCbtSkin } : {}),
            },
        });
    };

    const headerActions = test ? (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                aria-pressed={isSaved}
                onClick={handleToggleSave}
                className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer border ${
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
                <span className="sr-only sm:not-sr-only">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
                <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Share</span>
            </button>
            <button
                type="button"
                onClick={handleRetry}
                disabled={isRefreshing}
                aria-label="Refresh test details"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-60"
            >
                <RefreshCw
                    className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
                    aria-hidden="true"
                />
            </button>
        </div>
    ) : null;

    if (loading) {
        return (
            <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip transition-colors duration-300">
                <DedicatedPageHeader
                    title="Test Details"
                    onBack={handleLogicalBack}
                    backLabel="Back"
                    maxWidthClass="max-w-4xl"
                />
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4">
                    <HeroSkeleton />
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip transition-colors duration-300">
                <DedicatedPageHeader
                    title="Test Details"
                    onBack={handleLogicalBack}
                    backLabel="Back"
                    maxWidthClass="max-w-4xl"
                />
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6">
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
        <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip transition-colors duration-300">
            <DedicatedPageHeader
                title={test.name || 'Test Details'}
                subtitle={series?.name}
                onBack={handleLogicalBack}
                backLabel="Back"
                rightActions={headerActions}
                maxWidthClass="max-w-4xl"
            />

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
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
                        className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
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

                {/* Compact Test Summary Card */}
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-700/70 space-y-6">
                    {/* Summary Header & Primary CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                                        isPyq
                                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60'
                                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                                    }`}
                                >
                                    {isPyq ? 'PYQ Paper' : 'Expert Mock'}
                                </span>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                                        testAccess.reason === 'free_demo'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                            : testAccess.reason === 'entitled'
                                              ? 'bg-emerald-600 text-white'
                                              : series?.is_premium
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    }`}
                                >
                                    {testAccess.reason === 'free_demo'
                                        ? 'Free Demo'
                                        : testAccess.reason === 'entitled'
                                          ? 'Unlocked'
                                          : series?.is_premium
                                            ? 'PRO'
                                            : 'Free'}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                                    {category?.name ? `${category.name} • ` : ''}
                                    {series?.name || 'Prepared Mock Test'}
                                </span>
                                {profile?.student_id && (
                                    <span
                                        data-testid="test-detail-student-id"
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                    >
                                        {profile.student_id}
                                    </span>
                                )}
                            </div>

                            {test.description && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {test.description}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleLaunchExam}
                            data-testid="test-detail-primary-cta"
                            className={`w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 px-6 py-3 rounded-xl font-black text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-md shrink-0 ${
                                !testAccess.unlocked
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'
                            }`}
                        >
                            {!testAccess.unlocked ? (
                                <Lock className="w-5 h-5 shrink-0" aria-hidden="true" />
                            ) : (
                                <PlayCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                            )}
                            <span>{primaryCtaLabel}</span>
                        </button>
                    </div>

                    {/* Quick Facts Grid */}
                    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                            <Clock className="w-4 h-4 text-indigo-500 mb-1.5" aria-hidden="true" />
                            <dd className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mb-1">
                                {durationMinutes} mins
                            </dd>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Duration
                            </dt>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                            <CheckSquare className="w-4 h-4 text-emerald-500 mb-1.5" aria-hidden="true" />
                            <dd className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mb-1">
                                {questionCount}
                            </dd>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Questions
                            </dt>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                            <Award className="w-4 h-4 text-amber-500 mb-1.5" aria-hidden="true" />
                            <dd className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mb-1">
                                {totalMarks}
                            </dd>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Total Marks
                            </dt>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                            <Target className="w-4 h-4 text-purple-500 mb-1.5" aria-hidden="true" />
                            <dd className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mb-1">
                                {passingMarks > 0 ? passingMarks : 'N/A'}
                            </dd>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Passing Marks
                            </dt>
                        </div>

                        <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                            <AlertTriangle className="w-4 h-4 text-rose-500 mb-1.5" aria-hidden="true" />
                            <dd className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none mb-1">
                                {negativeMarks > 0 ? `-${negativeMarks}` : 'None'}
                            </dd>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Negative Marking
                            </dt>
                        </div>
                    </dl>

                    {showSscCglSkinChooser && (
                        <div
                            data-testid="ssc-cgl-cbt-skin-selector"
                            className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-2.5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                    SSC CGL CBT Interface Pattern
                                </p>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    Switch exam UI style anytime before start
                                </span>
                            </div>
                            <div
                                role="radiogroup"
                                aria-label="SSC CGL CBT Interface Pattern"
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                            >
                                {(
                                    [
                                        {
                                            id: 'ssc_cgl_tcs_ion' as const,
                                            title: 'TCS iON Classic',
                                            desc: 'Navy header, collapsible right 5-symbol palette & section tabs',
                                        },
                                        {
                                            id: 'ssc_cgl_eduquity' as const,
                                            title: 'Eduquity New Pattern',
                                            desc: 'Left-docked navigator, live session shield & A-/A+ zoom bar',
                                        },
                                    ]
                                ).map((opt) => {
                                    const active = selectedCbtSkin === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            data-testid={`cbt-skin-option-${opt.id}`}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setSelectedCbtSkin(opt.id);
                                                setPreferredSscCglSkin(opt.id);
                                            }}
                                            className={`min-h-[48px] text-left p-3 rounded-xl border-2 transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                                                active
                                                    ? 'bg-white dark:bg-slate-800 border-indigo-600 ring-1 ring-indigo-600 shadow-xs'
                                                    : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                            }`}
                                        >
                                            <span className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                                {opt.title}
                                            </span>
                                            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                {opt.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Concise Instructions */}
                    <section className="bg-indigo-50/80 dark:bg-indigo-900/15 rounded-2xl p-4 sm:p-5 border border-indigo-100 dark:border-indigo-900/30">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-2.5 text-sm sm:text-base">
                            Before you begin
                        </h2>
                        <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            <li className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>
                                    Total duration is {durationMinutes} minutes across {questionCount}{' '}
                                    questions for {totalMarks} marks.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>
                                    {negativeMarks > 0
                                        ? `Negative marking applies: -${negativeMarks} marks will be deducted for each incorrect answer.`
                                        : 'There is no negative marking for incorrect responses in this test.'}
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>Ensure stable connectivity; the test auto-submits when the countdown timer reaches zero.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Real Attempt History */}
                    <section className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg inline-flex items-center gap-2">
                                <History className="w-4 h-4 text-indigo-500" aria-hidden="true" />
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
                                            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-900/60"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : attempts.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-center border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm">
                                    You haven&apos;t attempted this test yet. Tap {primaryCtaLabel} to record your first benchmark.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Attempts
                                        </dt>
                                        <dd className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                            {attemptStats.totalAttempts}
                                        </dd>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Best Score
                                        </dt>
                                        <dd className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                            {attemptStats.bestScore !== null
                                                ? `${attemptStats.bestScore}/${totalMarks}`
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Best Accuracy
                                        </dt>
                                        <dd className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                            {attemptStats.bestAccuracy !== null
                                                ? `${attemptStats.bestAccuracy.toFixed(1)}%`
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Latest Status
                                        </dt>
                                        <dd className="mt-1 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                            {formatAttemptStatusLabel(attemptStats.latestAttempt?.status)}
                                        </dd>
                                    </div>
                                </dl>

                                <ul className="space-y-2">
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
                                                className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-4 py-3 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
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
                                                                triggerHaptic('light');
                                                                navigate(ROUTES.TEST_SERIES.RESULT(test.id, attempt.id));
                                                            }}
                                                            className="px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition-all active:scale-95 inline-flex items-center gap-1 shrink-0 cursor-pointer"
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
                    <section className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
                        <TestLeaderboardCard
                            tests={[test]}
                            fixedTestId={test.id}
                            limit={20}
                            refreshKey={attempts.length}
                        />
                    </section>
                </div>
            </div>

            {series?.id && (
                <CourseCheckoutDialog
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    series={{
                        id: String(series.id),
                        name: String(series.name ?? 'Test Series'),
                        price_inr: testAccess.priceInr,
                        mrp_inr: testAccess.mrpInr,
                        validity_days: testAccess.validityDays,
                        free_demo_count: testAccess.freeDemoCount,
                        category_name: category?.name ? String(category.name) : undefined,
                    }}
                    studentId={profile?.student_id ?? null}
                    userId={userId}
                    onRequestSubmitted={() => void loadTestData(true)}
                />
            )}
        </div>
    );
};
