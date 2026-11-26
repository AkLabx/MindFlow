import React, { useState, useEffect, useMemo, useCallback, useRef, useId, startTransition } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    BookOpen,
    CheckCircle2,
    Layers,
    Lock,
    RefreshCw,
    Scale,
    Search,
    SlidersHorizontal,
    Sparkles,
    WifiOff,
    X,
} from 'lucide-react';
import { ROUTES, getPreparedMockTestsRoute } from '@/config/routes';
import { CANONICAL_EXAMS } from '@/features/dashboard/constants/examRegistry';
import { useAuth } from '@/features/auth';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import { SwipeableTabViewport } from '@/components/ui/SwipeableTabViewport';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    PreparedMockSeriesItem,
    PreparedMockTestsResult,
    PreparedMockTestItem,
    UserCourseEntitlementItem,
    fetchPreparedMockTestsByExam,
    fetchUserCourseEntitlements,
    getCachedPreparedMockTestsSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    isMockSeriesPaid,
    isTestWithinScheduleWindow,
    readPreparedMockTestsIndexedDBCache,
    readUserCourseEntitlementsIndexedDBCache,
    resolveCanonicalExamSlug,
    resolveEffectiveSeriesEntitlement,
    resolveMockTestAccess,
} from '../api/mockTestsApi';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import {
    CourseCheckoutDialog,
    type CourseCheckoutSeriesInfo,
} from '../components/CourseCheckoutDialog';
import { EmptyState } from '../components/EmptyState';
import { MockTestListCard } from '../components/MockTestListCard';
import { ListSkeleton } from '../components/Skeletons';

type MockFilterChipId = 'all' | 'full-length' | 'free' | 'attempted';

const FILTER_CHIPS: Array<{ id: MockFilterChipId; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'full-length', label: 'Full-Length' },
    { id: 'free', label: 'Free' },
    { id: 'attempted', label: 'Attempted' },
];

const resolveSafeReturnTarget = (locationState: unknown): string => {
    const candidate =
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.returnTo ??
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.from;

    if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }
    return ROUTES.TEST_SERIES.ROOT;
};

export const ExamPreparedMockTestsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { examSlug } = useParams<{ examSlug?: string }>();
    const { user, profile } = useAuth();
    const searchInputId = useId();

    const effectiveSlug = examSlug || 'bpsc';
    const resolvedExam = useMemo(() => resolveCanonicalExamSlug(effectiveSlug), [effectiveSlug]);
    const userId = user?.id ?? null;

    const [result, setResult] = useState<PreparedMockTestsResult | null>(() =>
        resolvedExam ? getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId }) : null
    );
    const [entitlements, setEntitlements] = useState<UserCourseEntitlementItem[]>(() =>
        userId ? getCachedUserCourseEntitlementsSnapshot(userId) ?? [] : []
    );
    const [checkoutSeries, setCheckoutSeries] = useState<CourseCheckoutSeriesInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(() => {
        if (!resolvedExam) return false;
        return !getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId });
    });
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<MockFilterChipId>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchSeqRef = useRef<number>(0);
    const isMountedRef = useRef<boolean>(true);
    const hasResultRef = useRef<boolean>(Boolean(result));

    hasResultRef.current = Boolean(result);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadExamMockTests = useCallback(
        async (isManualRetry = false) => {
            if (!resolvedExam) {
                setResult(null);
                setLoading(false);
                setErrorMessage(null);
                return;
            }

            const seq = ++fetchSeqRef.current;
            const syncCached = getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId });

            if (syncCached && !isManualRetry) {
                setResult(syncCached);
                hasResultRef.current = true;
                setLoading(false);
            } else if (!hasResultRef.current) {
                setLoading(true);
            }

            setErrorMessage(null);
            setIsRefreshing(true);

            // Hydrate from IndexedDB asynchronously if synchronous cache missed
            if (!syncCached || userId) {
                const [idbCached, idbEntitlements] = await Promise.all([
                    syncCached
                        ? Promise.resolve(syncCached)
                        : readPreparedMockTestsIndexedDBCache(resolvedExam.id, { userId }),
                    userId
                        ? readUserCourseEntitlementsIndexedDBCache(userId)
                        : Promise.resolve(null),
                ]);
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                if (idbCached && !syncCached) {
                    setResult(idbCached);
                    hasResultRef.current = true;
                    setLoading(false);
                }
                if (idbEntitlements !== null) {
                    setEntitlements(idbEntitlements);
                }
            }

            try {
                const [fresh, freshEntitlements] = await Promise.all([
                    fetchPreparedMockTestsByExam(resolvedExam.id, {
                        userId,
                        forceRefresh: isManualRetry,
                    }),
                    userId
                        ? fetchUserCourseEntitlements(userId, { forceRefresh: isManualRetry }).catch(
                              () => null
                          )
                        : Promise.resolve(null),
                ]);
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                setResult(fresh);
                if (freshEntitlements !== null) {
                    setEntitlements(freshEntitlements);
                }
                hasResultRef.current = true;
                setErrorMessage(null);
            } catch (err: any) {
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                console.error('Failed to load prepared mock tests:', err);
                const msg =
                    err?.message ||
                    'Could not refresh mock tests from the server. Check your connection and try again.';
                setErrorMessage(msg);
                telemetry.emit('empty_state_seen', {
                    view: 'exam_prepared_mock_tests',
                    triggerCondition: hasResultRef.current
                        ? 'network_refresh_failed_with_cache'
                        : 'network_failed_no_cache',
                });
            } finally {
                if (isMountedRef.current && fetchSeqRef.current === seq) {
                    setLoading(false);
                    setIsRefreshing(false);
                }
            }
        },
        [resolvedExam, userId]
    );

    useEffect(() => {
        setActiveFilter('all');
        setSearchQuery('');
        const nextSync = resolvedExam
            ? getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId })
            : null;
        setResult(nextSync);
        hasResultRef.current = Boolean(nextSync);
        setLoading(Boolean(resolvedExam && !nextSync));
        loadExamMockTests(false);
    }, [resolvedExam, userId, loadExamMockTests]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleCacheInvalidation = () => {
            loadExamMockTests(true);
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === MOCK_CACHE_VERSION_KEY) {
                handleCacheInvalidation();
            }
        };

        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidation);
        window.addEventListener('storage', handleStorage);

        let channel: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel('mindflow-mock-cache');
                channel.onmessage = () => {
                    handleCacheInvalidation();
                };
            } catch {
                channel = null;
            }
        }

        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidation);
            window.removeEventListener('storage', handleStorage);
            if (channel) {
                channel.close();
            }
        };
    }, [loadExamMockTests]);

    const handleLogicalBack = () => {
        const target = resolveSafeReturnTarget(location.state);
        navigate(target);
    };

    const handleRetry = () => {
        triggerHaptic('light');
        telemetry.emit('recovery_action_clicked', {
            view: 'exam_prepared_mock_tests',
            actionChosen: 'retry_fetch',
        });
        loadExamMockTests(true);
    };

    const handleSelectFilterChip = (chipId: MockFilterChipId) => {
        triggerHaptic('light');
        startTransition(() => {
            setActiveFilter(chipId);
        });
    };

    const handleResetFilters = () => {
        triggerHaptic('light');
        setActiveFilter('all');
        setSearchQuery('');
        telemetry.emit('filters_cleared', {
            preservedExamId: resolvedExam?.id,
            clearedFields: ['mock_filter_chip', 'mock_search_query'],
        });
    };

    // Re-evaluate schedule window defensively on render
    const scheduleValidTests = useMemo<PreparedMockTestItem[]>(() => {
        const nowMs = Date.now();
        return (result?.tests || []).filter((t) => isTestWithinScheduleWindow(t, nowMs));
    }, [result]);

    const chipCounts = useMemo<Record<MockFilterChipId, number>>(() => {
        let fullLength = 0;
        let free = 0;
        let attempted = 0;
        for (const t of scheduleValidTests) {
            if (t.is_full_length) fullLength += 1;
            if (t.is_free) free += 1;
            if (t.is_attempted) attempted += 1;
        }
        return {
            all: scheduleValidTests.length,
            'full-length': fullLength,
            free,
            attempted,
        };
    }, [scheduleValidTests]);

    const getFilteredTestsForTab = useCallback(
        (tabId: MockFilterChipId): PreparedMockTestItem[] => {
            const trimmedSearch = searchQuery.trim().toLowerCase();
            return scheduleValidTests.filter((t) => {
                if (tabId === 'full-length' && !t.is_full_length) return false;
                if (tabId === 'free' && !t.is_free) return false;
                if (tabId === 'attempted' && !t.is_attempted) return false;
                if (trimmedSearch) {
                    const haystack = `${t.name} ${t.series_name} ${t.category_name} ${t.description ?? ''}`.toLowerCase();
                    if (!haystack.includes(trimmedSearch)) return false;
                }
                return true;
            });
        },
        [scheduleValidTests, searchQuery]
    );

    const filteredTests = useMemo<PreparedMockTestItem[]>(
        () => getFilteredTestsForTab(activeFilter),
        [getFilteredTestsForTab, activeFilter]
    );

    const publishedSeries = result?.series || [];

    const seriesByIdMap = useMemo(() => {
        const map = new Map<string, PreparedMockSeriesItem>();
        for (const s of publishedSeries) {
            if (s?.id) map.set(String(s.id), s);
        }
        return map;
    }, [publishedSeries]);

    const testsBySeriesMap = useMemo(() => {
        const map = new Map<string, PreparedMockTestItem[]>();
        for (const t of scheduleValidTests) {
            const sid = String(t.series_id ?? '');
            if (!sid) continue;
            const list = map.get(sid);
            if (list) list.push(t);
            else map.set(sid, [t]);
        }
        return map;
    }, [scheduleValidTests]);

    const handleOpenUnlockForTest = useCallback(
        (test: PreparedMockTestItem) => {
            const matchedSeries = seriesByIdMap.get(String(test.series_id));
            setCheckoutSeries({
                id: String(matchedSeries?.id ?? test.series_id),
                name: String(matchedSeries?.name ?? test.series_name ?? 'Mock Test Series'),
                price_inr: Math.max(0, Number(matchedSeries?.price_inr ?? test.series_price_inr ?? 0)),
                mrp_inr: matchedSeries?.mrp_inr ?? null,
                validity_days: Math.max(1, Number(matchedSeries?.validity_days ?? 365)),
                free_demo_count: Math.max(0, Number(matchedSeries?.free_demo_count ?? 1)),
                category_name: matchedSeries?.category_name ?? test.category_name,
            });
        },
        [seriesByIdMap]
    );

    const refreshBtn = (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleRetry}
                disabled={isRefreshing}
                aria-label="Refresh mock tests"
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
                <RefreshCw
                    className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
                    aria-hidden="true"
                />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    triggerHaptic('light');
                    navigate(ROUTES.TEST_SERIES.ROOT);
                }}
                aria-label="All Categories"
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">All Categories</span>
            </button>
        </div>
    );

    if (!resolvedExam) {
        return (
            <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip">
                <DedicatedPageHeader
                    title="Prepared Mock Tests"
                    onBack={handleLogicalBack}
                    backLabel="Back"
                    maxWidthClass="max-w-5xl"
                />
                <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6">
                    <EmptyState
                        title="Exam Not Recognized"
                        description={`We could not match "${effectiveSlug}" to a canonical exam category.`}
                        icon={<Scale className="w-8 h-8" aria-hidden="true" />}
                        actionLabel="Open BPSC Mock Tests"
                        onAction={() => navigate(ROUTES.TEST_SERIES.BPSC)}
                    />
                </div>
            </div>
        );
    }

    const featuredSwitchExams = CANONICAL_EXAMS.filter(
        (exam) => exam.isDefaultFeatured || exam.id === resolvedExam.id
    );

    const hasFilteredOutAllTests =
        scheduleValidTests.length > 0 && filteredTests.length === 0;

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-28 scroll-mb-28 overflow-x-clip">
            <DedicatedPageHeader
                title={`${resolvedExam.displayName} Prepared Mock Tests`}
                subtitle={`${publishedSeries.length} Series • ${scheduleValidTests.length} Published Tests`}
                onBack={handleLogicalBack}
                backLabel="Back"
                badge={
                    profile?.student_id ? (
                        <span
                            data-testid="exam-header-student-id"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300"
                        >
                            {profile.student_id}
                        </span>
                    ) : undefined
                }
                rightActions={refreshBtn}
                maxWidthClass="max-w-6xl"
            />

            <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-5 sm:space-y-6">
                {/* Compact Exam Summary & Quick Switcher */}
                <section
                    aria-label="Exam overview and switcher"
                    className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-amber-950/90 p-4 sm:p-5 text-white shadow-md border border-indigo-500/20 space-y-3.5"
                >
                    <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-amber-200 text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />
                            <span>{resolvedExam.category}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-indigo-100/90 font-medium leading-snug line-clamp-2">
                            {resolvedExam.id === 'bpsc'
                                ? 'Official BPSC Prelims, TRE 1.0–3.0, Auditor & AEDO timed CBT mocks and PYQs.'
                                : `${resolvedExam.subtitle} — timed mock tests, negative marking specs, and offline-cached access.`}
                        </p>
                    </div>

                    <nav
                        aria-label="Canonical exam mock tests"
                        className="pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain"
                    >
                        {featuredSwitchExams.map((exam) => {
                            const isCurrent = exam.id === resolvedExam.id;
                            return (
                                <button
                                    key={exam.id}
                                    type="button"
                                    aria-current={isCurrent ? 'page' : undefined}
                                    onClick={() => {
                                        if (isCurrent) return;
                                        triggerHaptic('light');
                                        navigate(getPreparedMockTestsRoute(exam.id), {
                                            state: location.state,
                                        });
                                    }}
                                    className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                        isCurrent
                                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                                    }`}
                                >
                                    {exam.displayName}
                                </button>
                            );
                        })}
                    </nav>
                </section>

                {/* Offline / Refresh Warning Banner (when stale cached data is visible) */}
                {errorMessage && result && (
                    <div
                        role="status"
                        className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
                            <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                            <span>Showing offline cached tests. Live refresh failed: {errorMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold active:scale-95 transition-all touch-manipulation cursor-pointer"
                        >
                            Retry Sync
                        </button>
                    </div>
                )}

                <ContinueLearningSection
                    variant="compact"
                    exam={resolvedExam}
                    returnTo={location.pathname}
                />

                {/* Filter Chips & Search Toolbar */}
                <section
                    aria-label="Filter prepared mock tests"
                    className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 p-3.5 sm:p-4 shadow-xs space-y-3"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div
                            className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain border-b border-slate-100 dark:border-slate-700/70"
                            role="tablist"
                            aria-label="Mock test category filters"
                        >
                            {FILTER_CHIPS.map((chip) => {
                                const isActive = activeFilter === chip.id;
                                return (
                                    <button
                                        key={chip.id}
                                        id={`exam-mock-tab-${chip.id}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-controls={`exam-mock-panel-${chip.id}`}
                                        onClick={() => handleSelectFilterChip(chip.id)}
                                        className={`min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 py-2 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border-b-2 inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                            isActive
                                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span>{chip.label}</span>{' '}
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                                isActive
                                                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {chipCounts[chip.id]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full lg:w-72">
                            <label htmlFor={searchInputId} className="sr-only">
                                Search {resolvedExam.displayName} prepared mock tests
                            </label>
                            <Search
                                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                id={searchInputId}
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${resolvedExam.shortCode} tests...`}
                                className="w-full min-h-[44px] scroll-mb-28 pl-10 pr-11 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setSearchQuery('')}
                                    className="min-w-[44px] min-h-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 touch-manipulation cursor-pointer"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Main Content Area */}
                {loading ? (
                    <ListSkeleton count={4} />
                ) : errorMessage && !result ? (
                    <EmptyState
                        title="Could Not Load Mock Tests"
                        description={errorMessage}
                        icon={<WifiOff className="w-8 h-8" aria-hidden="true" />}
                        actionLabel="Retry Sync"
                        onAction={handleRetry}
                    />
                ) : (
                    <>
                        {/* Published Series */}
                        {publishedSeries.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                                    Published {resolvedExam.shortCode} Test Series
                                </h2>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {publishedSeries.map((seriesItem) => {
                                        const isPyqSeries = seriesItem.series_type === 'PYQ';
                                        const isBundle = seriesItem.course_type === 'bundle';
                                        const isPaid = isMockSeriesPaid(seriesItem);
                                        const isUnlocked = Boolean(
                                            resolveEffectiveSeriesEntitlement(seriesItem.id, entitlements)
                                        );
                                        const priceInr = Math.max(0, Number(seriesItem.price_inr ?? 0));
                                        const mrpInr = seriesItem.mrp_inr != null ? Number(seriesItem.mrp_inr) : null;
                                        const discountPct =
                                            mrpInr && mrpInr > priceInr
                                                ? Math.round(((mrpInr - priceInr) / mrpInr) * 100)
                                                : 0;
                                        const includedCount = seriesItem.included_series_ids?.length ?? 0;

                                        return (
                                            <li key={seriesItem.id} className="flex">
                                                <article className="flex flex-col w-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/70 dark:border-slate-700/70 transition-shadow">
                                                    <div className="aspect-video w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                                        <BrandedThumbnail
                                                            title={seriesItem.name}
                                                            type="series"
                                                            imageUrl={seriesItem.thumbnail_url}
                                                            className="w-full h-full"
                                                        />
                                                        {isBundle && (
                                                            <span className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                                                                BUNDLE
                                                            </span>
                                                        )}
                                                        {!isPaid ? (
                                                            <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm bg-emerald-500 text-white">
                                                                FREE
                                                            </span>
                                                        ) : isUnlocked ? (
                                                            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm bg-emerald-600 text-white">
                                                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                                                Unlocked
                                                            </span>
                                                        ) : (
                                                            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm bg-slate-900/90 text-amber-300">
                                                                <Lock className="w-3 h-3" aria-hidden="true" />
                                                                <span>PRO</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                                                        <header>
                                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                <span
                                                                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                                        isPyqSeries
                                                                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60'
                                                                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                                                                    }`}
                                                                >
                                                                    {isPyqSeries ? 'PYQ Paper' : 'Expert Mock'}
                                                                </span>
                                                                {isBundle && includedCount > 0 && (
                                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                                                        Includes {includedCount} Series
                                                                    </span>
                                                                )}
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                                    {seriesItem.category_name}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                                                {seriesItem.name}
                                                            </h3>
                                                        </header>

                                                        {seriesItem.description && (
                                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 [text-wrap:pretty]">
                                                                {seriesItem.description}
                                                            </p>
                                                        )}

                                                        <footer className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                                <span>
                                                                    {seriesItem.test_count}{' '}
                                                                    {seriesItem.test_count === 1 ? 'Test' : 'Tests'}
                                                                </span>
                                                                {isPaid && !isUnlocked && priceInr > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-slate-900 dark:text-white font-black">
                                                                        <span>₹{priceInr}</span>
                                                                        {mrpInr && mrpInr > priceInr && (
                                                                            <span className="line-through text-slate-400 font-normal">
                                                                                ₹{mrpInr}
                                                                            </span>
                                                                        )}
                                                                        {discountPct > 0 && (
                                                                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                                                                                {discountPct}% OFF
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('light');
                                                                    navigate(ROUTES.TEST_SERIES.SERIES(seriesItem.id), {
                                                                        state: { returnTo: location.pathname },
                                                                    });
                                                                }}
                                                                className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                                                            >
                                                                View Series
                                                                <span className="sr-only"> {seriesItem.name}</span>
                                                            </button>
                                                        </footer>
                                                    </div>
                                                </article>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}

                        {/* Prepared Mock Tests */}
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                                    Prepared {resolvedExam.shortCode} Mock Tests
                                </h2>
                                <span
                                    role="status"
                                    className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400"
                                >
                                    Showing {filteredTests.length} of {scheduleValidTests.length}
                                </span>
                            </div>

                            <SwipeableTabViewport
                                tabs={FILTER_CHIPS}
                                activeTabId={activeFilter}
                                onTabChange={(tabId) => handleSelectFilterChip(tabId as MockFilterChipId)}
                                ariaLabel="Prepared Mock Tests Views"
                                tabIdPrefix="exam-mock-tab"
                                panelIdPrefix="exam-mock-panel"
                                renderPanel={(tabId) => {
                                    const panelTests = getFilteredTestsForTab(tabId as MockFilterChipId);

                                    if (scheduleValidTests.length === 0) {
                                        return (
                                            <div className="space-y-4">
                                                <EmptyState
                                                    title={`No ${resolvedExam.displayName} Mock Tests Published Yet`}
                                                    description={`Published ${resolvedExam.displayName} mock tests will appear here automatically within their schedule window.`}
                                                    icon={<BookOpen className="w-8 h-8" aria-hidden="true" />}
                                                    actionLabel={`Practice ${resolvedExam.shortCode} PYQs Now`}
                                                    onAction={() => {
                                                        triggerHaptic('light');
                                                        navigate(`/quiz/config?exam=${resolvedExam.id}`, {
                                                            state: {
                                                                returnTo: location.pathname,
                                                                canonicalExamId: resolvedExam.id,
                                                                fixedExamContext: true,
                                                                initialFilters: {
                                                                    subject: [],
                                                                    topic: [],
                                                                    subTopic: [],
                                                                    difficulty: [],
                                                                    questionType: [],
                                                                    examName: resolvedExam.dbExamNames,
                                                                    examYear: [],
                                                                    examDateShift: [],
                                                                    tags: [],
                                                                },
                                                            },
                                                        });
                                                    }}
                                                />
                                            </div>
                                        );
                                    }

                                    if (panelTests.length === 0) {
                                        return (
                                            <EmptyState
                                                title="No Matching Mock Tests"
                                                description="No prepared mock tests match the current filter chip or search query."
                                                icon={<SlidersHorizontal className="w-8 h-8" aria-hidden="true" />}
                                                actionLabel="Reset Filters"
                                                onAction={handleResetFilters}
                                            />
                                        );
                                    }

                                    return (
                                        <ul className="flex flex-col gap-3.5">
                                            {panelTests.map((test, index) => {
                                                const matchedSeries = seriesByIdMap.get(String(test.series_id));
                                                const orderedSeriesTests =
                                                    testsBySeriesMap.get(String(test.series_id)) ?? null;
                                                const access = resolveMockTestAccess({
                                                    test,
                                                    series: matchedSeries,
                                                    entitlements,
                                                    orderedSeriesTests,
                                                });

                                                return (
                                                    <li key={test.id}>
                                                        <MockTestListCard
                                                            test={test}
                                                            index={index}
                                                            access={access}
                                                            seriesName={test.series_name}
                                                            isInProgress={Boolean(test.active_in_progress_attempt_id)}
                                                            inProgressAttemptId={test.active_in_progress_attempt_id ?? null}
                                                            completedAttemptId={test.latest_completed_attempt_id ?? null}
                                                            isAttempted={test.is_attempted}
                                                            returnTo={location.pathname}
                                                            offscreenOptimize={index >= 6}
                                                            onUnlock={() => handleOpenUnlockForTest(test)}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    );
                                }}
                            />
                        </section>
                    </>
                )}
            </div>

            <CourseCheckoutDialog
                isOpen={Boolean(checkoutSeries)}
                onClose={() => setCheckoutSeries(null)}
                series={checkoutSeries}
                studentId={profile?.student_id ?? null}
                userId={userId}
                onRequestSubmitted={() => void loadExamMockTests(true)}
            />
        </div>
    );
};
