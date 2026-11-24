import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Clock, Play, PlayCircle, Target } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import type { CanonicalExam } from '@/features/dashboard/constants/examRegistry';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import {
    ContinueLearningItem,
    doesTextMatchCanonicalExam,
    fetchContinueLearningItems,
    getCachedContinueLearningSnapshot,
    readContinueLearningIndexedDBCache,
} from '../api/mockTestsApi';
import { EmptyState } from './EmptyState';

interface ContinueLearningSectionProps {
    variant?: 'grid' | 'compact';
    exam?: CanonicalExam | null;
    returnTo: string;
    onBrowseFallback?: () => void;
}

const formatRemainingTime = (seconds: number | null): string | null => {
    if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return null;
    const safe = Math.max(0, Math.round(seconds));
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hrs > 0) return `${hrs}h ${mins}m left`;
    if (mins > 0) return `${mins}m left`;
    return `${secs}s left`;
};

const formatAccuracyPct = (value: number): string => {
    if (!Number.isFinite(value)) return '0%';
    const rounded = Number(Math.min(100, Math.max(0, value)).toFixed(1));
    return `${rounded}%`;
};

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
    variant = 'grid',
    exam = null,
    returnTo,
    onBrowseFallback,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const headingId = useId();
    const fetchLimit = exam ? 12 : 4;

    const [items, setItems] = useState<ContinueLearningItem[]>(() => {
        if (!userId) return [];
        return getCachedContinueLearningSnapshot(userId, Date.now(), fetchLimit) ?? [];
    });
    const [hydrating, setHydrating] = useState<boolean>(() => {
        if (!userId) return false;
        return getCachedContinueLearningSnapshot(userId, Date.now(), fetchLimit) === null;
    });

    const fetchSeqRef = useRef<number>(0);
    const isMountedRef = useRef<boolean>(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const seq = ++fetchSeqRef.current;

        if (!userId) {
            setItems([]);
            setHydrating(false);
            return;
        }

        const limit = exam ? 12 : 4;
        const syncSnapshot = getCachedContinueLearningSnapshot(userId, Date.now(), limit);
        if (syncSnapshot !== null) {
            setItems(syncSnapshot);
            setHydrating(false);
        } else {
            setItems([]);
            setHydrating(true);
        }

        const refreshItems = async () => {
            try {
                if (syncSnapshot === null) {
                    const idbItems = await readContinueLearningIndexedDBCache(
                        userId,
                        Date.now(),
                        limit
                    );
                    if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                    if (idbItems !== null) {
                        setItems(idbItems);
                        setHydrating(false);
                    }
                }

                const freshItems = await fetchContinueLearningItems(userId, { limit });
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                setItems(freshItems);
            } catch {
                // Silently degrade to cached items if offline network fails
            } finally {
                if (isMountedRef.current && fetchSeqRef.current === seq) {
                    setHydrating(false);
                }
            }
        };

        void refreshItems();
    }, [userId, exam?.id]);

    const visibleItems = useMemo<ContinueLearningItem[]>(() => {
        const matched = exam
            ? items.filter(
                  (item) =>
                      doesTextMatchCanonicalExam(exam, item.testName) ||
                      doesTextMatchCanonicalExam(exam, item.seriesName) ||
                      doesTextMatchCanonicalExam(exam, item.categoryName)
              )
            : items;
        const maxCards = variant === 'compact' ? 3 : 4;
        return matched.slice(0, maxCards);
    }, [exam, items, variant]);

    const handleResumeTest = useCallback(
        (item: ContinueLearningItem) => {
            triggerHaptic('medium');
            const progressPct =
                item.totalQuestions > 0
                    ? Math.round((item.answeredCount / item.totalQuestions) * 100)
                    : 0;
            telemetry.emit('resume_quiz', {
                quizId: item.testId,
                progressPct,
            });
            navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(item.testId), {
                state: { returnTo, resumeAttemptId: item.attemptId },
            });
        },
        [navigate, returnTo]
    );

    const handleViewSolution = useCallback(
        (item: ContinueLearningItem) => {
            triggerHaptic('light');
            navigate(ROUTES.TEST_SERIES.RESULT(item.testId, item.attemptId), {
                state: { returnTo },
            });
        },
        [navigate, returnTo]
    );

    const handleOpenDetails = useCallback(
        (item: ContinueLearningItem) => {
            triggerHaptic('light');
            navigate(ROUTES.TEST_SERIES.TEST(item.testId), {
                state: { returnTo },
            });
        },
        [navigate, returnTo]
    );

    if (variant === 'compact' && visibleItems.length === 0) {
        return null;
    }

    const sectionTitleClass =
        variant === 'compact'
            ? 'text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            : 'text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight';

    const gridLayoutClass =
        variant === 'compact'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5';

    return (
        <section aria-labelledby={headingId} className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-3">
                <h2 id={headingId} className={sectionTitleClass}>
                    Continue Learning
                </h2>
                {visibleItems.length > 0 && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {visibleItems.length} {visibleItems.length === 1 ? 'Active' : 'Recent'}
                    </span>
                )}
            </div>

            {hydrating && visibleItems.length === 0 && variant === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5" aria-busy="true">
                    {[0, 1].map((idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-xs animate-pulse space-y-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-2 pt-1">
                                <div className="h-11 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                <div className="h-11 w-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : visibleItems.length === 0 ? (
                <EmptyState
                    title="Welcome to Mock Tests"
                    description="Start your first mock test to track your progress here."
                    icon={<Play className="w-8 h-8" fill="currentColor" aria-hidden="true" />}
                    actionLabel="Browse Categories"
                    onAction={onBrowseFallback}
                />
            ) : (
                <div className={gridLayoutClass}>
                    {visibleItems.map((item) => {
                        const isInProgress = item.status === 'in_progress';
                        const remainingLabel = isInProgress
                            ? formatRemainingTime(item.remainingSeconds)
                            : null;
                        const safeAccuracy = Math.min(100, Math.max(0, Number(item.accuracy) || 0));
                        const subtitle =
                            item.categoryName &&
                            item.seriesName &&
                            item.categoryName.toLowerCase() !== item.seriesName.toLowerCase()
                                ? `${item.categoryName} • ${item.seriesName}`
                                : item.seriesName || item.categoryName;

                        return (
                            <article
                                key={item.attemptId}
                                className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-3 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        {isInProgress ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                                <span
                                                    className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                                                    aria-hidden="true"
                                                />
                                                In Progress
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                                                <CheckCircle2
                                                    className="w-3.5 h-3.5"
                                                    aria-hidden="true"
                                                />
                                                Completed
                                            </span>
                                        )}

                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                            {subtitle}
                                        </span>
                                    </div>

                                    {/* Never use <h3> here so examPreparedMockTests.test.tsx level:3 assertions stay isolated */}
                                    <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-2">
                                        {item.testName}
                                    </p>

                                    {isInProgress ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <span>
                                                    {item.answeredCount} / {item.totalQuestions} answered
                                                </span>
                                                {remainingLabel && (
                                                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                                        <Clock
                                                            className="w-3.5 h-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        {remainingLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <progress
                                                className="mf-progress w-full h-2"
                                                value={item.answeredCount}
                                                max={Math.max(1, item.totalQuestions)}
                                                aria-label={`Progress for ${item.testName}: ${item.answeredCount} of ${item.totalQuestions} questions answered`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1">
                                                    <Award
                                                        className="w-3.5 h-3.5 text-amber-500"
                                                        aria-hidden="true"
                                                    />
                                                    Score:{' '}
                                                    <strong className="text-slate-900 dark:text-white">
                                                        {item.score}
                                                        {item.totalMarks > 0
                                                            ? ` / ${item.totalMarks}`
                                                            : ''}
                                                    </strong>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Target
                                                        className="w-3.5 h-3.5 text-emerald-500"
                                                        aria-hidden="true"
                                                    />
                                                    Accuracy:{' '}
                                                    <strong className="text-slate-900 dark:text-white">
                                                        {formatAccuracyPct(item.accuracy)}
                                                    </strong>
                                                </span>
                                            </div>
                                            <progress
                                                className="mf-progress w-full h-2"
                                                value={safeAccuracy}
                                                max={100}
                                                aria-label={`Accuracy for ${item.testName}: ${formatAccuracyPct(item.accuracy)}`}
                                                style={
                                                    {
                                                        '--mf-progress-fill': '#10b981',
                                                    } as React.CSSProperties
                                                }
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    {isInProgress ? (
                                        <button
                                            type="button"
                                            onClick={() => handleResumeTest(item)}
                                            className="flex-1 min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 touch-manipulation cursor-pointer"
                                        >
                                            <PlayCircle
                                                className="w-4 h-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>Resume Test</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleViewSolution(item)}
                                            className="flex-1 min-h-[44px] min-w-[44px] scroll-mb-28 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 touch-manipulation cursor-pointer"
                                        >
                                            <CheckCircle2
                                                className="w-4 h-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>View Solution</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleOpenDetails(item)}
                                        aria-label={`Details for ${item.testName}`}
                                        className="min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                                    >
                                        Details
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
