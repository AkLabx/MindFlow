import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Award,
    BarChart3,
    CheckCircle2,
    CheckSquare,
    Clock,
    Lock,
    PlayCircle,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';
import { telemetry } from '@/lib/telemetry';
import { cn } from '@/utils/cn';
import {
    MockTestAccessResolution,
    normalizeMockTestType,
} from '../api/mockTestsApi';
import { extractShiftBadgeInfo, type ShiftSlot } from '../utils/shiftMetadata';

export interface MockTestListCardProps {
    test: any;
    index?: number;
    access: MockTestAccessResolution;
    seriesName?: string;
    hideTypeBadge?: boolean;
    isSeriesPyq?: boolean;
    isInProgress?: boolean;
    inProgressAttemptId?: string | null;
    completedAttemptId?: string | null;
    bestScore?: number | null;
    isAttempted?: boolean;
    returnTo: string;
    offscreenOptimize?: boolean;
    onUnlock?: (test: any) => void;
}

const SHIFT_BADGE_CLASSES: Record<ShiftSlot, string> = {
    morning:
        'bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-200/90 dark:border-sky-800/70',
    afternoon:
        'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800/70',
    evening:
        'bg-violet-50 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 border border-violet-200/90 dark:border-violet-800/70',
};

const MockTestListCardComponent: React.FC<MockTestListCardProps> = ({
    test,
    index,
    access,
    seriesName,
    hideTypeBadge = false,
    isSeriesPyq = false,
    isInProgress = false,
    inProgressAttemptId,
    completedAttemptId,
    bestScore,
    isAttempted = false,
    returnTo,
    offscreenOptimize = false,
    onUnlock,
}) => {
    const navigate = useNavigate();

    const testId = String(test?.id ?? '');
    const testName = String(test?.name ?? 'Untitled Test');
    const isTestPyq = normalizeMockTestType(test?.test_type) === 'PYQ' || isSeriesPyq;
    const questionCount =
        typeof test?.question_count === 'number'
            ? test.question_count
            : Array.isArray(test?.question_ids)
              ? test.question_ids.length
              : 0;
    const durationMinutes = Number(test?.duration_minutes ?? 0);
    const totalMarks = Number(test?.total_marks ?? 0);
    const negativeMarks = Number(test?.negative_marks ?? 0);

    const shiftInfo = extractShiftBadgeInfo(test);
    const shiftText = shiftInfo
        ? shiftInfo.timing
            ? `${shiftInfo.slotLabel} • ${shiftInfo.timing}`
            : shiftInfo.shiftLabel
              ? `${shiftInfo.slotLabel} • ${shiftInfo.shiftLabel}`
              : shiftInfo.slotLabel
        : null;

    const showInProgress = Boolean(isInProgress || inProgressAttemptId);
    const hasCompleted = Boolean(completedAttemptId || isAttempted || bestScore != null);

    const handleOpenDetails = () => {
        if (!testId) return;
        triggerHaptic('light');
        navigate(ROUTES.TEST_SERIES.TEST(testId), {
            state: { returnTo },
        });
    };

    const handlePrimaryCta = () => {
        if (!access.unlocked) {
            triggerHaptic('light');
            onUnlock?.(test);
            return;
        }
        if (inProgressAttemptId && testId) {
            triggerHaptic('medium');
            telemetry.emit('resume_quiz', { quizId: testId });
            navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(testId), {
                state: {
                    returnTo,
                    resumeAttemptId: inProgressAttemptId,
                },
            });
            return;
        }
        if (completedAttemptId && testId) {
            triggerHaptic('light');
            navigate(ROUTES.TEST_SERIES.RESULT(testId, completedAttemptId), {
                state: { returnTo },
            });
            return;
        }
        handleOpenDetails();
    };

    return (
        <article
            data-testid={`mock-test-card-${testId}`}
            className={cn(
                'w-full bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                offscreenOptimize && '[content-visibility:auto] [contain-intrinsic-size:auto_170px]'
            )}
        >
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    {typeof index === 'number' && index >= 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                            #{String(index + 1).padStart(2, '0')}
                        </span>
                    )}

                    {!hideTypeBadge && (
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                isTestPyq
                                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                            }`}
                        >
                            {isTestPyq ? 'PYQ Paper' : 'Expert Mock'}
                        </span>
                    )}

                    {seriesName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 max-w-full truncate">
                            {seriesName}
                        </span>
                    )}

                    {shiftInfo && shiftText && (
                        <span
                            data-testid={`mock-test-shift-badge-${testId}`}
                            className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold',
                                SHIFT_BADGE_CLASSES[shiftInfo.slot]
                            )}
                        >
                            {shiftText}
                        </span>
                    )}

                    {access.reason === 'free_demo' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                            Free Demo
                        </span>
                    )}

                    {!access.unlocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            Locked
                        </span>
                    )}

                    {showInProgress ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                            In Progress
                        </span>
                    ) : bestScore !== null && bestScore !== undefined ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            Best: {bestScore}
                            {totalMarks > 0 ? `/${totalMarks}` : ''}
                        </span>
                    ) : hasCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            Attempted
                        </span>
                    ) : null}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    <button
                        type="button"
                        onClick={handleOpenDetails}
                        className="w-full min-h-[44px] py-1 text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg"
                    >
                        {testName}
                    </button>
                </h3>

                <dl className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <dt className="sr-only">Duration</dt>
                        <dd>{durationMinutes}m</dd>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <dt className="sr-only">Questions</dt>
                        <dd>{questionCount} Qs</dd>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md text-amber-800 dark:text-amber-300">
                        <Award className="w-3.5 h-3.5" aria-hidden="true" />
                        <dt className="sr-only">Total Marks</dt>
                        <dd>{totalMarks} Marks</dd>
                    </div>
                    {negativeMarks > 0 && (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                            <dt className="sr-only">Negative Marking</dt>
                            <dd>-{negativeMarks} Neg</dd>
                        </div>
                    )}
                </dl>
            </div>

            <div className="w-full sm:w-auto flex shrink-0">
                {!access.unlocked ? (
                    <button
                        type="button"
                        onClick={handlePrimaryCta}
                        className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-sm inline-flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Unlock</span>
                        <span className="sr-only"> {testName}</span>
                    </button>
                ) : inProgressAttemptId ? (
                    <button
                        type="button"
                        onClick={handlePrimaryCta}
                        className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                        <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Resume Test</span>
                        <span className="sr-only"> {testName}</span>
                    </button>
                ) : completedAttemptId ? (
                    <button
                        type="button"
                        onClick={handlePrimaryCta}
                        className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                        <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>View Result</span>
                        <span className="sr-only"> {testName}</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handlePrimaryCta}
                        className="w-full sm:w-auto min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                        <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Start Test</span>
                        <span className="sr-only"> {testName}</span>
                    </button>
                )}
            </div>
        </article>
    );
};

export const MockTestListCard = React.memo(MockTestListCardComponent);
MockTestListCard.displayName = 'MockTestListCard';
