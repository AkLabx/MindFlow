import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Award,
    CheckCircle2,
    CheckSquare,
    Clock,
    FileText,
    Lock,
    PlayCircle,
    Sparkles,
    WifiOff,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MockTestType,
    SeriesProgressStats,
    UserCourseEntitlementItem,
    UserTestAttemptItem,
    computeSeriesProgressStats,
    fetchPublishedTests,
    fetchSeriesDetails,
    fetchUserCourseEntitlements,
    fetchUserSeriesAttempts,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    getCachedSeriesBundleSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    getCachedUserSeriesAttemptsSnapshot,
    isMockSeriesPaid,
    normalizeMockSeriesType,
    normalizeMockTestType,
    readAllPublishedMockSeriesCatalogIndexedDBCache,
    readSeriesBundleIndexedDBCache,
    readUserCourseEntitlementsIndexedDBCache,
    readUserSeriesAttemptsIndexedDBCache,
    resolveMockTestAccess,
} from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
    CourseCheckoutDialog,
    type CourseCheckoutSeriesInfo,
} from '../components/CourseCheckoutDialog';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeletons';
import { TestLeaderboardCard } from '../components/TestLeaderboardCard';

type SeriesSourceTypeFilter = 'all' | MockTestType;

const SERIES_SOURCE_TYPE_OPTIONS: Array<{ id: SeriesSourceTypeFilter; label: string }> = [
    { id: 'all', label: 'All Types' },
    { id: 'PYQ', label: 'PYQ Papers' },
    { id: 'MOCK', label: 'Expert Mocks' },
];

export const resolveSeriesListBackTarget = (locationState: unknown, series: any): string => {
    const candidate =
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.returnTo ??
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.from;

    if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }

    const category = series?.mock_categories ?? series?.exam_categories;
    const categoryId = series?.category_id ?? category?.id;
    if (categoryId) {
        return ROUTES.TEST_SERIES.CATEGORY(String(categoryId));
    }

    return ROUTES.TEST_SERIES.ROOT;
};

const formatSeriesTimeSpent = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0m';
    const whole = Math.round(seconds);
    const hrs = Math.floor(whole / 3600);
    const mins = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
};

export const TestsListPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { seriesId } = useParams<{ seriesId: string }>();
    const { user, profile } = useAuth();
    const userId = user?.id ?? null;

    const initialBundle = seriesId ? getCachedSeriesBundleSnapshot(seriesId) : null;
    const [series, setSeries] = useState<any>(() => initialBundle?.series ?? null);
    const [tests, setTests] = useState<any[]>(() => initialBundle?.tests ?? []);
    const [attempts, setAttempts] = useState<UserTestAttemptItem[]>(() =>
        seriesId && userId ? getCachedUserSeriesAttemptsSnapshot(seriesId, userId) ?? [] : []
    );
    const [entitlements, setEntitlements] = useState<UserCourseEntitlementItem[]>(() =>
        userId ? getCachedUserCourseEntitlementsSnapshot(userId) ?? [] : []
    );
    const [sourceFilter, setSourceFilter] = useState<SeriesSourceTypeFilter>('all');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(() => Boolean(seriesId && !initialBundle));
    const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const fetchSeqRef = useRef<number>(0);
    const isMountedRef = useRef<boolean>(true);
    const hasSeriesRef = useRef<boolean>(Boolean(series));
    hasSeriesRef.current = Boolean(series);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadSeriesData = useCallback(
        async (isManualRetry = false) => {
            if (!seriesId) {
                setSeries(null);
                setTests([]);
                setAttempts([]);
                setLoading(false);
                setOfflineNotice(null);
                setLoadError(null);
                return;
            }

            const seq = ++fetchSeqRef.current;
            const syncBundle = getCachedSeriesBundleSnapshot(seriesId);
            const syncCatalogSeries =
                getCachedAllPublishedMockSeriesCatalogSnapshot()?.series.find(
                    (s) => s.id === seriesId
                ) ?? null;
            const syncAttempts = userId
                ? getCachedUserSeriesAttemptsSnapshot(seriesId, userId)
                : null;

            if (syncBundle && !isManualRetry) {
                setSeries(syncBundle.series);
                setTests(syncBundle.tests);
                hasSeriesRef.current = true;
                setLoading(false);
            } else if (!hasSeriesRef.current) {
                setLoading(true);
            }

            if (syncAttempts !== null) {
                setAttempts(syncAttempts);
            } else if (!userId) {
                setAttempts([]);
            }

            setOfflineNotice(null);
            setLoadError(null);

            let currentTests = syncBundle?.tests ?? [];
            let catalogFallback = syncCatalogSeries;

            if (!syncBundle || (userId && syncAttempts === null)) {
                const [idbBundle, idbAttempts, idbEntitlements, idbCatalog] = await Promise.all([
                    syncBundle ? Promise.resolve(syncBundle) : readSeriesBundleIndexedDBCache(seriesId),
                    userId && syncAttempts === null
                        ? readUserSeriesAttemptsIndexedDBCache(seriesId, userId)
                        : Promise.resolve(syncAttempts),
                    userId ? readUserCourseEntitlementsIndexedDBCache(userId) : Promise.resolve(null),
                    !syncBundle && !syncCatalogSeries
                        ? readAllPublishedMockSeriesCatalogIndexedDBCache()
                        : Promise.resolve(null),
                ]);

                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;

                if (!catalogFallback && idbCatalog) {
                    catalogFallback = idbCatalog.series.find((s) => s.id === seriesId) ?? null;
                }

                if (idbBundle && !syncBundle) {
                    setSeries(idbBundle.series);
                    setTests(idbBundle.tests);
                    currentTests = idbBundle.tests;
                    hasSeriesRef.current = true;
                    setLoading(false);
                }
                if (idbAttempts !== null && syncAttempts === null) {
                    setAttempts(idbAttempts);
                }
                if (idbEntitlements !== null) {
                    setEntitlements(idbEntitlements);
                }
            }

            const [seriesRes, testsRes, entRes] = await Promise.allSettled([
                fetchSeriesDetails(seriesId),
                fetchPublishedTests(seriesId),
                userId
                    ? fetchUserCourseEntitlements(userId, { forceRefresh: isManualRetry })
                    : Promise.resolve([] as UserCourseEntitlementItem[]),
            ]);

            if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
            if (entRes.status === 'fulfilled') {
                setEntitlements(entRes.value);
            }

            let resolvedTests = currentTests;
            let networkFailed = false;

            if (seriesRes.status === 'fulfilled') {
                setSeries(seriesRes.value);
                hasSeriesRef.current = Boolean(seriesRes.value);
                setLoadError(null);
            } else {
                const err = seriesRes.reason as { code?: string; message?: string } | undefined;
                const msg = String(err?.message ?? '');
                const isNotFound =
                    err?.code === 'PGRST116' || msg.toLowerCase().includes('0 rows');
                if (isNotFound) {
                    setSeries(null);
                    setTests([]);
                    hasSeriesRef.current = false;
                    setLoadError(null);
                } else {
                    networkFailed = true;
                    if (!hasSeriesRef.current && catalogFallback) {
                        setSeries(catalogFallback);
                        hasSeriesRef.current = true;
                    }
                }
            }

            if (testsRes.status === 'fulfilled') {
                resolvedTests = testsRes.value || [];
                setTests(resolvedTests);
            } else {
                networkFailed = true;
            }

            const testIds = resolvedTests
                .map((t) => String(t?.id ?? '').trim())
                .filter(Boolean);

            if (userId && testIds.length > 0) {
                try {
                    const freshAttempts = await fetchUserSeriesAttempts(seriesId, testIds, userId);
                    if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                    setAttempts(freshAttempts);
                } catch {
                    // Keep cached attempts if offline
                }
            }

            if (networkFailed && hasSeriesRef.current) {
                setOfflineNotice(
                    resolvedTests.length > 0
                        ? 'Showing offline cached series data.'
                        : 'Unable to load tests while offline. Reconnect and tap Retry.'
                );
            } else if (networkFailed && !hasSeriesRef.current) {
                setLoadError(
                    'Unable to reach MindFlow servers right now. Check your connection and tap Retry.'
                );
            } else if (!networkFailed) {
                setOfflineNotice(null);
                if (hasSeriesRef.current) {
                    setLoadError(null);
                }
            }

            setLoading(false);
        },
        [seriesId, userId]
    );

    useEffect(() => {
        setSourceFilter('all');
    }, [seriesId]);

    useEffect(() => {
        const nextBundle = seriesId ? getCachedSeriesBundleSnapshot(seriesId) : null;
        const nextAttempts =
            seriesId && userId ? getCachedUserSeriesAttemptsSnapshot(seriesId, userId) : null;
        setSeries(nextBundle?.series ?? null);
        setTests(nextBundle?.tests ?? []);
        hasSeriesRef.current = Boolean(nextBundle?.series);
        setAttempts(nextAttempts ?? []);
        setLoadError(null);
        setLoading(Boolean(seriesId && !nextBundle));
        void loadSeriesData(false);
    }, [seriesId, userId, loadSeriesData]);

    useEffect(() => {
        const handleCacheInvalidated = () => {
            void loadSeriesData(true);
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        };
    }, [loadSeriesData]);

    const progressStats: SeriesProgressStats = useMemo(
        () => computeSeriesProgressStats(tests, attempts),
        [tests, attempts]
    );

    const category = series?.mock_categories ?? series?.exam_categories;
    const isSeriesPyq = series ? normalizeMockSeriesType(series.series_type) === 'PYQ' : false;
    const isPaidSeries = isMockSeriesPaid(series);
    const seriesPriceInr = Math.max(0, Number(series?.price_inr ?? 0));
    const seriesMrpInr = series?.mrp_inr != null ? Number(series.mrp_inr) : null;
    const seriesValidityDays = Math.max(1, Number(series?.validity_days ?? 365));
    const seriesFreeDemoCount = Math.max(0, Number(series?.free_demo_count ?? 1));

    const activeSeriesEntitlement = useMemo(() => {
        if (!series?.id) return null;
        const nowMs = Date.now();
        return (
            entitlements.find((ent) => {
                if (!ent || ent.status !== 'active') return false;
                const validMs = Date.parse(String(ent.valid_until ?? ''));
                if (!Number.isFinite(validMs) || validMs <= nowMs) return false;
                return String(ent.series_id) === String(series.id);
            }) ?? null
        );
    }, [entitlements, series?.id]);

    const filteredTests = useMemo(() => {
        if (sourceFilter === 'all') return tests;
        return tests.filter((t) => {
            const effectiveType: MockTestType =
                normalizeMockTestType(t.test_type) === 'PYQ' || isSeriesPyq ? 'PYQ' : 'MOCK';
            return effectiveType === sourceFilter;
        });
    }, [tests, sourceFilter, isSeriesPyq]);

    const checkoutSeriesInfo: CourseCheckoutSeriesInfo | null = useMemo(() => {
        if (!series?.id) return null;
        return {
            id: String(series.id),
            name: String(series.name ?? 'Test Series'),
            price_inr: seriesPriceInr,
            mrp_inr: seriesMrpInr,
            validity_days: seriesValidityDays,
            free_demo_count: seriesFreeDemoCount,
            category_name: category?.name ? String(category.name) : undefined,
        };
    }, [series, seriesPriceInr, seriesMrpInr, seriesValidityDays, seriesFreeDemoCount, category?.name]);

    const pyqBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60">
            PYQ Paper
        </span>
    );

    const expertBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
            Expert Mock
        </span>
    );

    const handleLogicalBack = () => {
        navigate(resolveSeriesListBackTarget(location.state, series));
    };

    const handleResumeInProgress = () => {
        const active = progressStats.activeInProgressAttempt;
        if (!active) return;
        triggerHaptic('medium');
        telemetry.emit('resume_quiz', {
            quizId: active.testId,
        });
        navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(active.testId), {
            state: {
                returnTo: location.pathname,
                resumeAttemptId: active.attemptId,
            },
        });
    };

    const avgScoreDisplay =
        progressStats.averageScoreMarks !== null && progressStats.uniformTotalMarks
            ? `${progressStats.averageScoreMarks}/${progressStats.uniformTotalMarks}`
            : progressStats.averageScorePercent !== null
              ? `${progressStats.averageScorePercent}%`
              : '—';

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip transition-colors duration-300">
            <DedicatedPageHeader
                title={series?.name || 'Test Series'}
                subtitle={category?.name ? `${category.name} • ${tests.length} Tests` : `${tests.length} Tests`}
                badge={series ? (isSeriesPyq ? pyqBadge : expertBadge) : undefined}
                rightActions={
                    profile?.student_id ? (
                        <span
                            data-testid="series-detail-student-id"
                            className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300"
                        >
                            {profile.student_id}
                        </span>
                    ) : undefined
                }
                onBack={handleLogicalBack}
                backLabel="Back"
            />

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-12 space-y-4">
                <Breadcrumbs
                    items={[
                        { label: 'Mock Tests', path: ROUTES.TEST_SERIES.ROOT },
                        {
                            label: category?.name || 'Category',
                            path: category?.id ? ROUTES.TEST_SERIES.CATEGORY(category.id) : undefined,
                        },
                        { label: series?.name || 'Series' },
                    ]}
                />

                {offlineNotice && (
                    <div
                        role="status"
                        className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{offlineNotice}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                void loadSeriesData(true);
                            }}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold active:scale-95 transition-all touch-manipulation cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <ListSkeleton count={4} />
                ) : !series ? (
                    loadError ? (
                        <EmptyState
                            icon={<WifiOff className="w-8 h-8 text-amber-500" />}
                            title="Could Not Load Test Series"
                            description={loadError}
                            actionLabel="Retry"
                            onAction={() => {
                                triggerHaptic('light');
                                void loadSeriesData(true);
                            }}
                            secondaryActionLabel="Back to Categories"
                            onSecondaryAction={() => navigate(ROUTES.TEST_SERIES.ROOT)}
                        />
                    ) : (
                        <EmptyState
                            title="Series Not Found"
                            description="This test series does not exist or is currently unavailable."
                            actionLabel="Back to Categories"
                            onAction={() => navigate(ROUTES.TEST_SERIES.ROOT)}
                        />
                    )
                ) : (
                    <>
                        {/* Compact Series Description & Stats Bar (keeps tests above the fold) */}
                        <section className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                                {series.description ? (
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                        {series.description}
                                    </p>
                                ) : (
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        Timed CBT practice tests with instant scorecards and detailed solutions.
                                    </p>
                                )}
                                {isPaidSeries && (
                                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                                        {activeSeriesEntitlement ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                Unlocked • {seriesValidityDays}d Access
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                                <span className="font-black text-indigo-700 dark:text-indigo-300">
                                                    ₹{seriesPriceInr}
                                                </span>
                                                {seriesMrpInr && seriesMrpInr > seriesPriceInr && (
                                                    <span className="line-through text-slate-400">
                                                        ₹{seriesMrpInr}
                                                    </span>
                                                )}
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    • {seriesValidityDays} Days • {seriesFreeDemoCount} Free Demo
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {isPaidSeries && !activeSeriesEntitlement ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsCheckoutOpen(true)}
                                        data-testid="series-unlock-btn"
                                        className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black inline-flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                                    >
                                        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                        <span>Unlock — ₹{seriesPriceInr}</span>
                                    </button>
                                ) : (
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide ${
                                            isPaidSeries
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        }`}
                                    >
                                        {isPaidSeries ? 'Unlocked' : 'Free'}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                                    <FileText className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                                    {tests.length} {tests.length === 1 ? 'Test' : 'Tests'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                                    {progressStats.completedTestsCount}/{progressStats.totalTests} Done
                                </span>
                            </div>
                        </section>

                        {/* Two Column Layout: Test List first on mobile & desktop */}
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Column: Test List */}
                            <div className="flex-1 space-y-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        Tests in this Series
                                    </h2>

                                    <div
                                        role="group"
                                        aria-label="Filter series tests by source type"
                                        data-testid="series-tests-source-filter"
                                        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain"
                                    >
                                        {SERIES_SOURCE_TYPE_OPTIONS.map((opt) => {
                                            const isSelected = sourceFilter === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setSourceFilter(opt.id);
                                                    }}
                                                    className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white shadow-xs'
                                                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {tests.length === 0 ? (
                                    offlineNotice ? (
                                        <EmptyState
                                            icon={<WifiOff className="w-8 h-8 text-amber-500" />}
                                            title="Tests Unavailable Offline"
                                            description={offlineNotice}
                                            actionLabel="Retry"
                                            onAction={() => {
                                                triggerHaptic('light');
                                                void loadSeriesData(true);
                                            }}
                                        />
                                    ) : (
                                        <EmptyState
                                            title="No Tests Uploaded"
                                            description="Tests for this series will be available soon."
                                            icon={<FileText className="w-8 h-8" />}
                                        />
                                    )
                                ) : filteredTests.length === 0 ? (
                                    <EmptyState
                                        title={`No ${sourceFilter === 'PYQ' ? 'PYQ Papers' : 'Expert Mocks'} Found`}
                                        description="Try switching back to All Types to inspect all tests in this series."
                                        icon={<FileText className="w-8 h-8" />}
                                        actionLabel="Show All Types"
                                        onAction={() => setSourceFilter('all')}
                                    />
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {filteredTests.map((t, index) => {
                                            const isInProgress = progressStats.inProgressTestIds.includes(t.id);
                                            const bestAttempt = progressStats.bestAttemptByTestId[t.id];
                                            const isTestPyq =
                                                normalizeMockTestType(t.test_type) === 'PYQ' || isSeriesPyq;
                                            const qCount = Array.isArray(t.question_ids)
                                                ? t.question_ids.length
                                                : 0;
                                            const access = resolveMockTestAccess({
                                                test: t,
                                                series,
                                                entitlements,
                                                orderedSeriesTests: tests,
                                            });

                                            return (
                                                <motion.div
                                                    key={t.id}
                                                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        navigate(ROUTES.TEST_SERIES.TEST(t.id), {
                                                            state: { returnTo: location.pathname },
                                                        });
                                                    }}
                                                    className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5"
                                                >
                                                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-w-0">
                                                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                                            <span className="text-sm sm:text-base font-extrabold text-slate-500">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                {isTestPyq ? pyqBadge : expertBadge}
                                                                {access.reason === 'free_demo' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                                                                        Free Demo
                                                                    </span>
                                                                )}
                                                                {!access.unlocked && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                                                                        <Lock className="w-3 h-3" aria-hidden="true" />
                                                                        Locked
                                                                    </span>
                                                                )}
                                                                {isInProgress ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                                                                        In Progress
                                                                    </span>
                                                                ) : bestAttempt ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                                                                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                                                        Best: {bestAttempt.score}
                                                                        {Number(t.total_marks) > 0 ? `/${t.total_marks}` : ''}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                                {t.name}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                                                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />{' '}
                                                                    {t.duration_minutes}m
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                                                                    <CheckSquare className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />{' '}
                                                                    {qCount} Qs
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md text-amber-700 dark:text-amber-300">
                                                                    <Award className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                                                                    {t.total_marks} Marks
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full sm:w-auto flex shrink-0">
                                                        {!access.unlocked ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerHaptic('light');
                                                                    setIsCheckoutOpen(true);
                                                                }}
                                                                className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-sm inline-flex items-center justify-center gap-1.5 transition-all"
                                                            >
                                                                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                                <span>Unlock</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerHaptic('light');
                                                                    navigate(ROUTES.TEST_SERIES.TEST(t.id), {
                                                                        state: { returnTo: location.pathname },
                                                                    });
                                                                }}
                                                                className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                                            >
                                                                View Details
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Sidebar / Progress & Leaderboard */}
                            <div className="w-full lg:w-80 shrink-0 space-y-5">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-700/70 space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            Your Progress
                                        </h2>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            {progressStats.completionPercent}%
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <progress
                                            className="mf-progress w-full h-2.5"
                                            value={progressStats.completedTestsCount}
                                            max={Math.max(1, progressStats.totalTests)}
                                            aria-label="Series test completion progress"
                                        />
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {progressStats.completedTestsCount} / {progressStats.totalTests} Tests ({progressStats.completionPercent}%)
                                        </p>
                                    </div>

                                    <dl className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Best Score
                                            </dt>
                                            <dd className="mt-1 text-base font-black text-slate-900 dark:text-white leading-tight">
                                                {progressStats.bestScoreMarks !== null
                                                    ? `${progressStats.bestScoreMarks}${progressStats.bestScoreTotalMarks ? ` / ${progressStats.bestScoreTotalMarks}` : ''}`
                                                    : '—'}
                                                {progressStats.bestScorePercent !== null && (
                                                    <span className="block mt-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        {progressStats.bestScorePercent}%
                                                    </span>
                                                )}
                                            </dd>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Avg Score
                                            </dt>
                                            <dd className="mt-1 text-base font-black text-slate-900 dark:text-white leading-tight">
                                                {avgScoreDisplay}
                                            </dd>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Accuracy
                                            </dt>
                                            <dd className="mt-1 text-base font-black text-slate-900 dark:text-white leading-tight">
                                                {progressStats.overallAccuracyPercent !== null
                                                    ? `${progressStats.overallAccuracyPercent}%`
                                                    : '—'}
                                            </dd>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Time Spent
                                            </dt>
                                            <dd className="mt-1 text-base font-black text-slate-900 dark:text-white leading-tight">
                                                {formatSeriesTimeSpent(progressStats.totalTimeSpentSeconds)}
                                            </dd>
                                        </div>
                                    </dl>

                                    {progressStats.activeInProgressAttempt && (
                                        <button
                                            type="button"
                                            onClick={handleResumeInProgress}
                                            className="w-full min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                                        >
                                            <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                            <span>Resume In-Progress Test</span>
                                        </button>
                                    )}

                                    {progressStats.completedTestsCount === 0 && !progressStats.activeInProgressAttempt && (
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center pt-1">
                                            Attempt a test to unlock live series analytics
                                        </p>
                                    )}
                                </div>

                                <TestLeaderboardCard
                                    tests={tests}
                                    defaultTestId={progressStats.latestCompletedTestId ?? tests[0]?.id}
                                    limit={10}
                                    refreshKey={attempts.length}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <CourseCheckoutDialog
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                series={checkoutSeriesInfo}
                studentId={profile?.student_id ?? null}
                userId={userId}
                onRequestSubmitted={() => void loadSeriesData(true)}
            />
        </div>
    );
};
