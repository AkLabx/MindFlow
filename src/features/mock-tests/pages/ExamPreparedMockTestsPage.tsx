import React, { useState, useEffect, useMemo, useCallback, useRef, useId, startTransition } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Award,
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    CheckSquare,
    Clock,
    Layers,
    PlayCircle,
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
import {
    PreparedMockTestsResult,
    PreparedMockTestItem,
    fetchPreparedMockTestsByExam,
    getCachedPreparedMockTestsSnapshot,
    isTestWithinScheduleWindow,
    readPreparedMockTestsIndexedDBCache,
    resolveCanonicalExamSlug,
} from '../api/mockTestsApi';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { EmptyState } from '../components/EmptyState';
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
    const { user } = useAuth();
    const searchInputId = useId();

    const effectiveSlug = examSlug || 'bpsc';
    const resolvedExam = useMemo(() => resolveCanonicalExamSlug(effectiveSlug), [effectiveSlug]);
    const userId = user?.id ?? null;

    const [result, setResult] = useState<PreparedMockTestsResult | null>(() =>
        resolvedExam ? getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId }) : null
    );
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
            if (!syncCached) {
                const idbCached = await readPreparedMockTestsIndexedDBCache(resolvedExam.id, { userId });
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                if (idbCached) {
                    setResult(idbCached);
                    hasResultRef.current = true;
                    setLoading(false);
                }
            }

            try {
                const fresh = await fetchPreparedMockTestsByExam(resolvedExam.id, { userId });
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                setResult(fresh);
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
                    triggerCondition: hasResultRef.current ? 'network_refresh_failed_with_cache' : 'network_failed_no_cache',
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
        const nextSync = resolvedExam ? getCachedPreparedMockTestsSnapshot(resolvedExam.id, { userId }) : null;
        setResult(nextSync);
        hasResultRef.current = Boolean(nextSync);
        setLoading(Boolean(resolvedExam && !nextSync));
        loadExamMockTests(false);
    }, [resolvedExam, userId, loadExamMockTests]);

    const handleLogicalBack = () => {
        triggerHaptic('light');
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

    const filteredTests = useMemo<PreparedMockTestItem[]>(() => {
        const trimmedSearch = searchQuery.trim().toLowerCase();
        return scheduleValidTests.filter((t) => {
            if (activeFilter === 'full-length' && !t.is_full_length) return false;
            if (activeFilter === 'free' && !t.is_free) return false;
            if (activeFilter === 'attempted' && !t.is_attempted) return false;
            if (trimmedSearch) {
                const haystack = `${t.name} ${t.series_name} ${t.category_name} ${t.description ?? ''}`.toLowerCase();
                if (!haystack.includes(trimmedSearch)) return false;
            }
            return true;
        });
    }, [scheduleValidTests, activeFilter, searchQuery]);

    const publishedSeries = result?.series || [];

    if (!resolvedExam) {
        return (
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleLogicalBack}
                            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm inline-flex items-center gap-2 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Back to Mock Tests</span>
                        </button>
                    </div>
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
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex-1 w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Top Navigation & Logical Parent Back */}
                <header className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleLogicalBack}
                            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Back</span>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={isRefreshing}
                                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs hover:border-indigo-400 disabled:opacity-60 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
                                    aria-hidden="true"
                                />
                                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    navigate(ROUTES.TEST_SERIES.ROOT);
                                }}
                                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>All Categories</span>
                            </button>
                        </div>
                    </div>

                    {/* Hero Card */}
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-amber-950/90 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 isolate">
                        <div
                            aria-hidden="true"
                            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"
                        />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2.5 max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                                    <span>{resolvedExam.category} • Admin Prepared</span>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight [text-wrap:balance]">
                                    {resolvedExam.displayName} Prepared Mock Tests
                                </h1>
                                <p className="text-sm sm:text-base text-indigo-100/85 font-medium leading-relaxed [text-wrap:pretty]">
                                    {resolvedExam.id === 'bpsc'
                                        ? 'Official BPSC Prelims, TRE 1.0–3.0, Auditor, AEDO & Bihar Special mock test series prepared and published in MindFlow Admin.'
                                        : `${resolvedExam.subtitle} — published timed mock tests, negative marking specs, and offline-cached access.`}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 shrink-0">
                                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 min-w-[100px]">
                                    <div className="text-xl sm:text-2xl font-black leading-none">
                                        {publishedSeries.length}
                                    </div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80 mt-1">
                                        Series
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 min-w-[100px]">
                                    <div className="text-xl sm:text-2xl font-black leading-none">
                                        {scheduleValidTests.length}
                                    </div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80 mt-1">
                                        Published Tests
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Exam Quick Switcher */}
                        <nav aria-label="Canonical exam mock tests" className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
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
                                        className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer ${
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
                    </div>
                </header>

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

                {/* Filter Chips & Search Toolbar */}
                <section aria-label="Filter prepared mock tests" className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 p-3.5 sm:p-4 shadow-xs space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mock test category filters">
                            {FILTER_CHIPS.map((chip) => {
                                const isActive = activeFilter === chip.id;
                                return (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => handleSelectFilterChip(chip.id)}
                                        className={`min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-full text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{chip.label}</span>{' '}
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
                                <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                                    Published {resolvedExam.shortCode} Test Series
                                </h2>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {publishedSeries.map((seriesItem) => (
                                        <li key={seriesItem.id} className="flex">
                                            <article className="flex flex-col w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/70 dark:border-slate-700/70 transition-shadow">
                                                <div className="aspect-video w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                                    <BrandedThumbnail
                                                        title={seriesItem.name}
                                                        type="series"
                                                        imageUrl={seriesItem.thumbnail_url}
                                                        className="w-full h-full"
                                                    />
                                                    <span
                                                        className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide shadow-sm ${
                                                            seriesItem.is_premium
                                                                ? 'bg-amber-400 text-amber-950'
                                                                : 'bg-emerald-500 text-white'
                                                        }`}
                                                    >
                                                        {seriesItem.is_premium ? 'PRO' : 'FREE'}
                                                    </span>
                                                </div>

                                                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                                                    <header>
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                                                            {seriesItem.category_name}
                                                        </p>
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
                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                            {seriesItem.test_count} {seriesItem.test_count === 1 ? 'Test' : 'Tests'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic('light');
                                                                navigate(ROUTES.TEST_SERIES.SERIES(seriesItem.id), {
                                                                    state: { returnTo: location.pathname },
                                                                });
                                                            }}
                                                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer"
                                                        >
                                                            View Series
                                                            <span className="sr-only"> {seriesItem.name}</span>
                                                        </button>
                                                    </footer>
                                                </div>
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Prepared Mock Tests */}
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                                    Prepared {resolvedExam.shortCode} Mock Tests
                                </h2>
                                <span role="status" className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                                    Showing {filteredTests.length} of {scheduleValidTests.length}
                                </span>
                            </div>

                            {scheduleValidTests.length === 0 ? (
                                <div className="space-y-4">
                                    <EmptyState
                                        title={`No ${resolvedExam.displayName} Mock Tests Published Yet`}
                                        description={`Admin-prepared ${resolvedExam.displayName} mock tests will appear here automatically as soon as they are published and within their schedule window.`}
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
                            ) : hasFilteredOutAllTests ? (
                                <EmptyState
                                    title="No Matching Mock Tests"
                                    description="No prepared mock tests match the current filter chip or search query."
                                    icon={<SlidersHorizontal className="w-8 h-8" aria-hidden="true" />}
                                    actionLabel="Reset Filters"
                                    onAction={handleResetFilters}
                                />
                            ) : (
                                <ul className="flex flex-col gap-4">
                                    {filteredTests.map((test, index) => {
                                        const isOffscreenOptimized = index >= 6;
                                        return (
                                            <li
                                                key={test.id}
                                                className={
                                                    isOffscreenOptimized
                                                        ? '[content-visibility:auto] [contain-intrinsic-size:auto_190px]'
                                                        : undefined
                                                }
                                            >
                                                <article className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-6 shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                                                    <div className="space-y-3 flex-1 min-w-0">
                                                        <header className="space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                                                    {test.series_name}
                                                                </span>
                                                                <span
                                                                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                                                        test.is_free
                                                                            ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                                                    }`}
                                                                >
                                                                    {test.is_free ? 'Free' : 'PRO'}
                                                                </span>
                                                                {test.is_full_length && (
                                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                                                        Full-Length
                                                                    </span>
                                                                )}
                                                                {test.is_attempted && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                                                                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                                                        Attempted
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                                                                {test.name}
                                                            </h3>
                                                        </header>

                                                        {test.description && (
                                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 [text-wrap:pretty]">
                                                                {test.description}
                                                            </p>
                                                        )}

                                                        <dl className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1.5 rounded-lg">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                                <dt className="sr-only">Duration</dt>
                                                                <dd>{test.duration_minutes} mins</dd>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1.5 rounded-lg">
                                                                <CheckSquare className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                                                <dt className="sr-only">Questions</dt>
                                                                <dd>{test.question_count} Qs</dd>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-lg">
                                                                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                                                                <dt className="sr-only">Total Marks</dt>
                                                                <dd>{test.total_marks} Marks</dd>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2.5 py-1.5 rounded-lg">
                                                                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                                                                <dt className="sr-only">Negative Marking</dt>
                                                                <dd>
                                                                    {test.negative_marks > 0
                                                                        ? `-${test.negative_marks} Neg`
                                                                        : 'No Negative'}
                                                                </dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <footer className="flex items-center justify-end shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic('light');
                                                                navigate(ROUTES.TEST_SERIES.TEST(test.id), {
                                                                    state: { returnTo: location.pathname },
                                                                });
                                                            }}
                                                            className="w-full md:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 touch-manipulation cursor-pointer"
                                                        >
                                                            <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                            <span>
                                                                {test.is_attempted ? 'View & Re-attempt' : 'View & Start Test'}
                                                                <span className="sr-only"> {test.name}</span>
                                                            </span>
                                                        </button>
                                                    </footer>
                                                </article>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};
