import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock,
    Eye,
    HelpCircle,
    RefreshCw,
    RotateCcw,
    TrendingUp,
    Users,
    WifiOff,
    XCircle,
} from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { StatusBadge } from './StatusBadge';
import { useNotification } from '@/stores/useNotificationStore';
import { telemetry } from '@/lib/telemetry';
import {
    MockTestAnalytics,
    MockTestQuestionDiagnostic,
    ScoreDistributionBucket,
    fetchMockTestAnalytics,
    getCachedMockTestAnalyticsSnapshot,
    readMockTestAnalyticsIndexedDBCache,
} from '../api/adminTestSeriesApi';

interface AdminTestAnalyticsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    test: any | null;
    onPreviewQuestion: (questionId: string) => void;
}

type InspectorTab = 'hardest' | 'skipped';

const TONE_HEX: Record<ScoreDistributionBucket['tone'], string> = {
    rose: '#f43f5e',
    amber: '#f59e0b',
    indigo: '#4f46e5',
    emerald: '#10b981',
};

const TONE_BADGE_CLASSES: Record<ScoreDistributionBucket['tone'], string> = {
    rose: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30',
    amber: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30',
    indigo: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/30',
    emerald: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
};

const formatDuration = (seconds: number | null): string => {
    if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return '—';
    const whole = Math.round(seconds);
    const hrs = Math.floor(whole / 3600);
    const mins = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    return `${secs}s`;
};

const formatUpdatedTime = (timestamp: number): string => {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Just now';
    try {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'Just now';
    }
};

export const AdminTestAnalyticsDrawer: React.FC<AdminTestAnalyticsDrawerProps> = ({
    isOpen,
    onClose,
    test,
    onPreviewQuestion,
}) => {
    const { showToast } = useNotification();
    const testId = typeof test?.id === 'string' ? test.id.trim() : '';

    const [analytics, setAnalytics] = useState<MockTestAnalytics | null>(() =>
        isOpen && testId ? getCachedMockTestAnalyticsSnapshot(testId) : null
    );
    const [loading, setLoading] = useState<boolean>(() =>
        Boolean(isOpen && testId && getCachedMockTestAnalyticsSnapshot(testId) === null)
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<InspectorTab>('hardest');
    const [showAllQuestions, setShowAllQuestions] = useState(false);
    const [isOffline, setIsOffline] = useState<boolean>(() =>
        typeof navigator !== 'undefined' ? navigator.onLine === false : false
    );

    const isMountedRef = useRef(true);
    const requestSeqRef = useRef(0);
    const activeTestIdRef = useRef(testId);
    const analyticsRef = useRef<MockTestAnalytics | null>(analytics);
    const lastEmptyTelemetryRef = useRef<string | null>(null);
    const touchStartRef = useRef<{ x: number; y: number; lock: 'none' | 'x' | 'y' } | null>(null);

    activeTestIdRef.current = testId;
    analyticsRef.current = analytics;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadAnalytics = useCallback(
        async (targetId: string, testSnapshot: any, isManualRefresh: boolean) => {
            const seq = ++requestSeqRef.current;

            if (!targetId) {
                setAnalytics(null);
                analyticsRef.current = null;
                setLoading(false);
                setIsRefreshing(false);
                setError(null);
                return;
            }

            const syncSnapshot = getCachedMockTestAnalyticsSnapshot(targetId);
            let hasVisibleData = Boolean(syncSnapshot);

            if (syncSnapshot) {
                setAnalytics(syncSnapshot);
                analyticsRef.current = syncSnapshot;
                setLoading(false);
                setError(null);
            } else if (!isManualRefresh || !analyticsRef.current || analyticsRef.current.testId !== targetId) {
                setAnalytics(null);
                analyticsRef.current = null;
                setLoading(true);
                setError(null);
            }

            if (isManualRefresh) {
                setIsRefreshing(true);
            }

            try {
                if (!syncSnapshot) {
                    const idbSnapshot = await readMockTestAnalyticsIndexedDBCache(targetId);
                    if (
                        !isMountedRef.current ||
                        requestSeqRef.current !== seq ||
                        activeTestIdRef.current !== targetId
                    ) {
                        return;
                    }
                    if (idbSnapshot) {
                        hasVisibleData = true;
                        setAnalytics(idbSnapshot);
                        analyticsRef.current = idbSnapshot;
                        setLoading(false);
                        setError(null);
                    }
                }

                const fresh = await fetchMockTestAnalytics(targetId, { testSnapshot });
                if (
                    !isMountedRef.current ||
                    requestSeqRef.current !== seq ||
                    activeTestIdRef.current !== targetId
                ) {
                    return;
                }

                setAnalytics(fresh);
                analyticsRef.current = fresh;
                setError(null);
            } catch (err: any) {
                if (
                    !isMountedRef.current ||
                    requestSeqRef.current !== seq ||
                    activeTestIdRef.current !== targetId
                ) {
                    return;
                }

                const message = err?.message || 'Unable to load test analytics right now.';
                if (isManualRefresh && (hasVisibleData || analyticsRef.current)) {
                    showToast({
                        variant: 'error',
                        title: 'Refresh Failed',
                        message,
                    });
                } else if (!hasVisibleData && !analyticsRef.current) {
                    setError(message);
                }
            } finally {
                if (
                    isMountedRef.current &&
                    requestSeqRef.current === seq &&
                    activeTestIdRef.current === targetId
                ) {
                    setLoading(false);
                    setIsRefreshing(false);
                }
            }
        },
        [showToast]
    );

    useEffect(() => {
        if (!isOpen || !testId) {
            requestSeqRef.current += 1;
            setLoading(false);
            setIsRefreshing(false);
            setError(null);
            lastEmptyTelemetryRef.current = null;
            return;
        }

        setActiveTab('hardest');
        setShowAllQuestions(false);
        lastEmptyTelemetryRef.current = null;
        telemetry.emit('page_viewed', {
            path: '/admin/test-series/insights',
        });

        void loadAnalytics(testId, test, false);
    }, [isOpen, testId, test, loadAnalytics]);

    useEffect(() => {
        if (!isOpen || !analytics) return;
        if (analytics.totalAttempts === 0) {
            const key = `${analytics.testId}:zero_attempts`;
            if (lastEmptyTelemetryRef.current !== key) {
                lastEmptyTelemetryRef.current = key;
                telemetry.emit('empty_state_seen', {
                    view: 'admin_test_analytics',
                    triggerCondition: 'zero_attempts',
                });
            }
        } else if (analytics.completedAttempts === 0) {
            const key = `${analytics.testId}:in_progress_only`;
            if (lastEmptyTelemetryRef.current !== key) {
                lastEmptyTelemetryRef.current = key;
                telemetry.emit('empty_state_seen', {
                    view: 'admin_test_analytics',
                    triggerCondition: 'in_progress_only',
                });
            }
        }
    }, [isOpen, analytics]);

    // 2D axis-locked swipe-right-to-dismiss (DEC-0012)
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches?.[0];
        if (!touch) return;
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            lock: 'none',
        };
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const start = touchStartRef.current;
        const touch = e.touches?.[0];
        if (!start || !touch) return;

        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (start.lock === 'none') {
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 4) {
                start.lock = 'y';
            } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
                start.lock = 'x';
            }
        }
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent<HTMLDivElement>) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start || start.lock === 'y') return;

            const touch = e.changedTouches?.[0];
            if (!touch) return;

            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            const effectiveLock =
                start.lock === 'x' ? 'x' : Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';

            if (effectiveLock === 'x' && dx >= 88 && dx > Math.abs(dy) * 1.3) {
                onClose();
            }
        },
        [onClose]
    );

    const handleRefresh = useCallback(() => {
        if (!testId || isRefreshing) return;
        void loadAnalytics(testId, test, true);
    }, [testId, test, isRefreshing, loadAnalytics]);

    const handleRetry = useCallback(() => {
        if (!testId) return;
        telemetry.emit('recovery_action_clicked', {
            view: 'admin_test_analytics',
            actionChosen: 'retry_fetch',
        });
        void loadAnalytics(testId, test, true);
    }, [testId, test, loadAnalytics]);

    const visibleQuestionDiagnostics = useMemo<MockTestQuestionDiagnostic[]>(() => {
        if (!analytics) return [];
        if (!showAllQuestions) {
            return activeTab === 'hardest'
                ? analytics.hardestQuestions
                : analytics.mostSkippedQuestions;
        }
        const copy = [...analytics.allQuestionDiagnostics];
        if (activeTab === 'hardest') {
            return copy.sort((a, b) => {
                if ((a.attemptedCount > 0) !== (b.attemptedCount > 0)) {
                    return a.attemptedCount > 0 ? -1 : 1;
                }
                if (a.accuracyPct !== b.accuracyPct) return a.accuracyPct - b.accuracyPct;
                if (a.incorrectCount !== b.incorrectCount) return b.incorrectCount - a.incorrectCount;
                return a.orderIndex - b.orderIndex;
            });
        }
        return copy.sort((a, b) => {
            if (a.skipRatePct !== b.skipRatePct) return b.skipRatePct - a.skipRatePct;
            if (a.skippedCount !== b.skippedCount) return b.skippedCount - a.skippedCount;
            return a.orderIndex - b.orderIndex;
        });
    }, [analytics, activeTab, showAllQuestions]);

    const fallbackSeries = test?.mock_series ?? test?.test_series;
    const fallbackCategory = fallbackSeries?.mock_categories ?? fallbackSeries?.exam_categories;
    const headerTestName = analytics?.testName || test?.name || 'Mock Test';
    const headerSeriesLine = analytics
        ? analytics.categoryName
            ? `${analytics.categoryName} · ${analytics.seriesName}`
            : analytics.seriesName
        : fallbackCategory?.name
          ? `${fallbackCategory.name} · ${fallbackSeries?.name}`
          : fallbackSeries?.name || 'Unassigned Series';

    const canExpandAllQuestions = Boolean(
        analytics &&
            analytics.allQuestionDiagnostics.length > 0 &&
            (showAllQuestions ||
                visibleQuestionDiagnostics.length < analytics.allQuestionDiagnostics.length)
    );

    return (
        <RightDrawer
            width="lg"
            isOpen={isOpen}
            onClose={onClose}
            title="Test Insights & Quality"
        >
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="space-y-5 pb-12 scroll-mb-28 overflow-x-hidden"
            >
                {isOffline && analytics && (
                    <div
                        role="status"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs font-medium text-amber-800 dark:text-amber-200"
                    >
                        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Offline mode — showing cached analytics snapshot.</span>
                    </div>
                )}

                {/* Context Header Card */}
                <section className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 break-words">
                                    {headerSeriesLine}
                                </span>
                                <StatusBadge
                                    status={
                                        (analytics?.isPublished ?? Boolean(test?.is_published))
                                            ? 'published'
                                            : 'draft'
                                    }
                                />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white break-words">
                                {headerTestName}
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing || !testId}
                            aria-label="Refresh test insights"
                            className="min-h-[44px] min-w-[44px] shrink-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                aria-hidden="true"
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {analytics?.totalQuestions ?? (test?.question_ids?.length || 0)} Questions
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {analytics?.totalMarks ?? (test?.total_marks ?? 0)} Marks
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {analytics?.durationMinutes ?? (test?.duration_minutes ?? 0)} min
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {Number(analytics?.negativeMarks ?? test?.negative_marks ?? 0) > 0
                                ? `-${analytics?.negativeMarks ?? test?.negative_marks} Neg`
                                : 'No Negative'}
                        </span>
                    </div>

                    {analytics && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                            <span>Updated {formatUpdatedTime(analytics.computedAt)}</span>
                            {analytics.isSampled && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">
                                    Sampled latest {analytics.sampledLimit.toLocaleString()} attempts
                                </span>
                            )}
                        </div>
                    )}
                </section>

                {/* Loading Skeleton */}
                {loading && !analytics && (
                    <div className="space-y-4" aria-label="Loading test analytics">
                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                                />
                            ))}
                        </div>
                        <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        <div className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                )}

                {/* Error State (no cached data) */}
                {!loading && error && !analytics && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-6 text-center space-y-3"
                    >
                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" aria-hidden="true" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                Unable to Load Insights
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            <span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty State (zero attempts) */}
                {analytics && analytics.totalAttempts === 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                            <BarChart3 className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                No Student Attempts Yet
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Participation KPIs, score bands, and question difficulty diagnostics will appear once students start this mock test.
                            </p>
                        </div>
                    </div>
                )}

                {/* KPI Tiles (shown whenever totalAttempts > 0) */}
                {analytics && analytics.totalAttempts > 0 && (
                    <>
                        <section aria-label="Attempt Summary KPIs" className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Users className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                                    <span>Total Attempts</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {analytics.totalAttempts}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {analytics.uniqueStudents} unique students
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                    <span>Completion Rate</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {analytics.completionRatePct}%
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {analytics.completedAttempts} completed · {analytics.inProgressAttempts} active
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <TrendingUp className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                                    <span>Avg Score</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {analytics.averageScore !== null
                                        ? `${analytics.averageScore} / ${analytics.totalMarks}`
                                        : '—'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {analytics.completedAttempts > 0
                                        ? `Median ${analytics.medianScore ?? '—'} · Best ${analytics.highestScore ?? '—'}`
                                        : analytics.hasPassCutoff
                                          ? `Pass cutoff: ${analytics.passingMarks}`
                                          : 'Awaiting completed attempt'}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                                    <span>Avg Time</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {formatDuration(analytics.averageTimeSeconds)}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Limit: {analytics.durationMinutes}m
                                    {analytics.averageAccuracyPct !== null
                                        ? ` · ${analytics.averageAccuracyPct}% acc`
                                        : ''}
                                </p>
                            </div>
                        </section>

                        {/* In-progress only notice */}
                        {analytics.completedAttempts === 0 ? (
                            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/30 p-5 text-center space-y-2">
                                <Clock className="w-7 h-7 text-amber-500 mx-auto" aria-hidden="true" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Attempts In Progress Only
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                                    {analytics.inProgressAttempts} in-progress
                                    {analytics.abandonedAttempts > 0
                                        ? ` and ${analytics.abandonedAttempts} abandoned`
                                        : ''}{' '}
                                    attempt(s) recorded. Score distribution and question difficulty will populate as soon as a student submits.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Score Distribution & Pass/Fail Breakdown */}
                                <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Score Distribution & Pass Cutoff
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                                            {analytics.hasPassCutoff ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                        Pass (≥{analytics.passingMarks}): {analytics.passedCount}
                                                        {analytics.passRatePct !== null
                                                            ? ` (${analytics.passRatePct}%)`
                                                            : ''}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                        Below Cutoff: {analytics.failedCount}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                    No pass cutoff configured
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {analytics.scoreDistribution.map((bucket) => (
                                            <div key={bucket.key} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs font-medium">
                                                    <span className="text-slate-700 dark:text-slate-200 font-semibold">
                                                        {bucket.label}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${TONE_BADGE_CLASSES[bucket.tone]}`}
                                                    >
                                                        {bucket.count} ({bucket.percentage}%)
                                                    </span>
                                                </div>
                                                <progress
                                                    className="mf-progress w-full h-2.5"
                                                    value={bucket.percentage}
                                                    max={100}
                                                    aria-label={`${bucket.label}: ${bucket.count} attempts (${bucket.percentage}%)`}
                                                    style={
                                                        {
                                                            '--mf-progress-fill': TONE_HEX[bucket.tone],
                                                        } as React.CSSProperties
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Dual-Tab Question Quality Inspector */}
                                <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Question Quality Inspector
                                        </h4>
                                        <div
                                            role="tablist"
                                            aria-label="Question quality diagnostic mode"
                                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
                                        >
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'hardest'}
                                                onClick={() => setActiveTab('hardest')}
                                                className={`flex-1 sm:flex-initial min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                                                    activeTab === 'hardest'
                                                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                Hardest Questions
                                            </button>
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'skipped'}
                                                onClick={() => setActiveTab('skipped')}
                                                className={`flex-1 sm:flex-initial min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                                                    activeTab === 'skipped'
                                                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                Most Skipped
                                            </button>
                                        </div>
                                    </div>

                                    {visibleQuestionDiagnostics.length === 0 ? (
                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                            <HelpCircle className="w-5 h-5 mx-auto mb-1.5 text-slate-400" aria-hidden="true" />
                                            {activeTab === 'hardest'
                                                ? 'No attempted questions recorded in completed attempts yet.'
                                                : 'No skipped questions — students attempted every question.'}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {visibleQuestionDiagnostics.map((item) => {
                                                const barValue =
                                                    activeTab === 'hardest'
                                                        ? item.accuracyPct
                                                        : item.skipRatePct;
                                                const barColor =
                                                    activeTab === 'hardest'
                                                        ? item.accuracyPct < 40
                                                            ? '#f43f5e'
                                                            : item.accuracyPct < 70
                                                              ? '#f59e0b'
                                                              : '#10b981'
                                                        : '#6366f1';

                                                return (
                                                    <article
                                                        key={item.questionId}
                                                        style={{
                                                            contentVisibility: 'auto',
                                                            containIntrinsicSize: 'auto 160px',
                                                        }}
                                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                                                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">
                                                                    Q{item.orderIndex + 1}
                                                                </span>
                                                                {item.v1Id && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                                                        {item.v1Id}
                                                                    </span>
                                                                )}
                                                                {item.subject && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                                        {item.subject}
                                                                    </span>
                                                                )}
                                                                {item.difficulty && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                                        {item.difficulty}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {item.isMissingFromBank ? (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    aria-label={`Question ${item.orderIndex + 1} archived`}
                                                                    className="min-h-[44px] min-w-[44px] shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-75 cursor-not-allowed"
                                                                >
                                                                    Archived
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onPreviewQuestion(item.questionId)}
                                                                    aria-label={`Preview question ${item.orderIndex + 1}`}
                                                                    className="min-h-[44px] min-w-[44px] shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                                                    <span>Preview</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                                                            {item.questionText}
                                                        </p>

                                                        <div className="space-y-1.5">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
                                                                <span className="text-slate-600 dark:text-slate-300">
                                                                    {activeTab === 'hardest'
                                                                        ? `Accuracy: ${item.accuracyPct}%`
                                                                        : `Skip Rate: ${item.skipRatePct}%`}
                                                                </span>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-emerald-700 dark:text-emerald-400">
                                                                        Correct: {item.correctCount}
                                                                    </span>
                                                                    <span className="text-rose-700 dark:text-rose-400">
                                                                        Wrong: {item.incorrectCount}
                                                                    </span>
                                                                    <span className="text-slate-600 dark:text-slate-400">
                                                                        Skipped: {item.skippedCount}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <progress
                                                                className="mf-progress w-full h-2"
                                                                value={barValue}
                                                                max={100}
                                                                aria-label={
                                                                    activeTab === 'hardest'
                                                                        ? `Question ${item.orderIndex + 1} accuracy ${item.accuracyPct}%`
                                                                        : `Question ${item.orderIndex + 1} skip rate ${item.skipRatePct}%`
                                                                }
                                                                style={
                                                                    {
                                                                        '--mf-progress-fill': barColor,
                                                                    } as React.CSSProperties
                                                                }
                                                            />
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {canExpandAllQuestions && (
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAllQuestions((prev) => !prev)}
                                                className="w-full min-h-[44px] scroll-mb-28 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all active:scale-95"
                                            >
                                                {showAllQuestions
                                                    ? 'Show top 5'
                                                    : `Show all ${analytics.allQuestionDiagnostics.length} questions`}
                                            </button>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </>
                )}
            </div>
        </RightDrawer>
    );
};
