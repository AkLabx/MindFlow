import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Award,
    BarChart2,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    Globe,
    Grid,
    HelpCircle,
    LayoutDashboard,
    RotateCcw,
    Sparkles,
    Target,
    WifiOff,
    X,
    XCircle,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { useNotification } from '@/hooks/useNotification';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { triggerHaptic } from '@/lib/haptics';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { KeyboardAwareBottomBar } from '@/components/ui/KeyboardAwareBottomBar';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { EmptyState } from '../components/EmptyState';
import {
    PreparedMockCompletedAttemptDetail,
    PreparedMockSubjectBreakdown,
    computePreparedMockScore,
    computePreparedMockSubjectBreakdown,
    fetchPreparedMockAttemptById,
    fetchPreparedMockTestQuestions,
    fetchTestDetails,
    getCachedPreparedMockAttemptByIdSnapshot,
    getCachedPreparedTestQuestionsSnapshot,
    getCachedTestDetailsSnapshot,
    readPreparedMockAttemptByIdIndexedDBCache,
    readTestDetailsIndexedDBCache,
} from '../api/mockTestsApi';
import type { Question } from '@/types/models';

type ResultViewMode = 'scorecard' | 'solutions';
type LanguageMode = 'bilingual' | 'english' | 'hindi';
type QuestionFilterMode = 'all' | 'correct' | 'incorrect' | 'unanswered';

const formatDuration = (seconds: number | null | undefined): string => {
    if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
    const whole = Math.round(seconds);
    const hrs = Math.floor(whole / 3600);
    const mins = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

const formatDate = (isoString?: string | null): string => {
    if (!isoString) return 'Recently';
    const parsed = Date.parse(isoString);
    if (Number.isNaN(parsed)) return 'Recently';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(parsed));
    } catch {
        return 'Recently';
    }
};

export const PreparedMockResultPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const setHideGlobalFooter = useLayoutStore((s) => s.setHideGlobalFooter);
    const userId = user?.id ?? '';

    useEffect(() => {
        setHideGlobalFooter(true);
        return () => setHideGlobalFooter(false);
    }, [setHideGlobalFooter]);

    // Synchronous 0ms local snapshot caches
    const [test, setTest] = useState<any>(() =>
        testId ? getCachedTestDetailsSnapshot(testId) : null
    );
    const [attempt, setAttempt] = useState<PreparedMockCompletedAttemptDetail | null>(() =>
        attemptId ? getCachedPreparedMockAttemptByIdSnapshot(attemptId) : null
    );
    const [questions, setQuestions] = useState<Question[]>(() => {
        if (!testId) return [];
        const syncTest = getCachedTestDetailsSnapshot(testId);
        return syncTest ? getCachedPreparedTestQuestionsSnapshot(testId, syncTest.question_ids) ?? [] : [];
    });

    const [loading, setLoading] = useState<boolean>(() => {
        return !test || !attempt || questions.length === 0;
    });
    const [loadError, setLoadError] = useState<string | null>(null);

    // Interactive View States
    const [viewMode, setViewMode] = useState<ResultViewMode>('scorecard');
    const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
    const [filterMode, setFilterMode] = useState<QuestionFilterMode>('all');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);

    const isMountedRef = useRef<boolean>(true);
    const seqRef = useRef<number>(0);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Hydrate attempt, test details, and questions (offline-first with background cloud sync)
    const loadResultData = useCallback(async () => {
        if (!testId || !attemptId) {
            setLoadError('Missing mock test or attempt identifier.');
            setLoading(false);
            return;
        }

        const seq = ++seqRef.current;
        setLoadError(null);

        // 1. Attempt hydration
        let resolvedAttempt = getCachedPreparedMockAttemptByIdSnapshot(attemptId);
        if (resolvedAttempt) setAttempt(resolvedAttempt);
        else {
            resolvedAttempt = await readPreparedMockAttemptByIdIndexedDBCache(attemptId);
            if (resolvedAttempt && isMountedRef.current && seqRef.current === seq) {
                setAttempt(resolvedAttempt);
            }
        }

        try {
            if (!resolvedAttempt || (typeof navigator !== 'undefined' && navigator.onLine !== false)) {
                const liveAttempt = await fetchPreparedMockAttemptById(testId, attemptId, userId);
                if (isMountedRef.current && seqRef.current === seq) {
                    resolvedAttempt = liveAttempt;
                    setAttempt(liveAttempt);
                }
            }
        } catch (err: any) {
            if (!resolvedAttempt && isMountedRef.current && seqRef.current === seq) {
                setLoadError(err?.message || 'Could not load your attempt details.');
                setLoading(false);
                return;
            }
        }

        // 2. Test metadata hydration
        let resolvedTest = getCachedTestDetailsSnapshot(testId);
        if (resolvedTest) setTest(resolvedTest);
        else {
            resolvedTest = await readTestDetailsIndexedDBCache(testId);
            if (resolvedTest && isMountedRef.current && seqRef.current === seq) {
                setTest(resolvedTest);
            }
        }

        try {
            if (!resolvedTest || (typeof navigator !== 'undefined' && navigator.onLine !== false)) {
                const liveTest = await fetchTestDetails(testId);
                if (isMountedRef.current && seqRef.current === seq) {
                    resolvedTest = liveTest;
                    setTest(liveTest);
                }
            }
        } catch (err: any) {
            if (!resolvedTest && isMountedRef.current && seqRef.current === seq) {
                setLoadError(err?.message || 'Could not load mock test details.');
                setLoading(false);
                return;
            }
        }

        // 3. Questions hydration
        if (resolvedTest && Array.isArray(resolvedTest.question_ids)) {
            const syncQuestions = getCachedPreparedTestQuestionsSnapshot(testId, resolvedTest.question_ids);
            if (syncQuestions && syncQuestions.length > 0) {
                setQuestions(syncQuestions);
            }
            try {
                const qList = await fetchPreparedMockTestQuestions(testId, resolvedTest.question_ids);
                if (isMountedRef.current && seqRef.current === seq) {
                    setQuestions(qList);
                }
            } catch (err: any) {
                if (!syncQuestions && isMountedRef.current && seqRef.current === seq) {
                    setLoadError(err?.message || 'Could not load mock test questions.');
                }
            }
        }

        if (isMountedRef.current && seqRef.current === seq) {
            setLoading(false);
        }
    }, [attemptId, testId, userId]);

    useEffect(() => {
        loadResultData();
    }, [loadResultData]);

    // Back navigation adhering to DEC-0002 / DEC-0020
    const handleBack = useCallback(() => {
        triggerHaptic();
        const state = location.state as { returnTo?: unknown; from?: unknown } | null;
        const candidate = state?.returnTo ?? state?.from;
        if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
            navigate(candidate);
            return;
        }
        if (testId) {
            navigate(ROUTES.TEST_SERIES.TEST(testId));
        } else {
            navigate(ROUTES.TEST_SERIES.ROOT);
        }
    }, [location.state, navigate, testId]);

    const handleReattempt = useCallback(() => {
        triggerHaptic();
        if (testId) {
            navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(testId));
        }
    }, [navigate, testId]);

    // Scoring & Breakdown Computations
    const userAnswers = useMemo(() => attempt?.answers ?? {}, [attempt?.answers]);

    const scoreSummary = useMemo(() => {
        if (!test || questions.length === 0) return null;
        return computePreparedMockScore({
            questions,
            answers: userAnswers,
            totalMarks: Number(test.total_marks ?? questions.length),
            negativeMarks: Number(test.negative_marks ?? 0),
            passingMarks: Number(test.passing_marks ?? 0),
        });
    }, [questions, test, userAnswers]);

    const subjectBreakdown: PreparedMockSubjectBreakdown[] = useMemo(() => {
        if (!scoreSummary || questions.length === 0) return [];
        return computePreparedMockSubjectBreakdown(
            questions,
            userAnswers,
            scoreSummary.marksPerQuestion,
            scoreSummary.negativeMarks
        );
    }, [questions, scoreSummary, userAnswers]);

    // Solution Review Filtering
    const filteredQuestions = useMemo(() => {
        if (filterMode === 'all') return questions;
        return questions.filter((q) => {
            const ans = userAnswers[q.id];
            const hasAnswered = ans && String(ans).trim() !== '';
            const isCorrect = hasAnswered && String(ans).trim() === String(q.correct ?? '').trim();

            if (filterMode === 'correct') return isCorrect;
            if (filterMode === 'incorrect') return hasAnswered && !isCorrect;
            if (filterMode === 'unanswered') return !hasAnswered;
            return true;
        });
    }, [filterMode, questions, userAnswers]);

    // Keep active question index within filtered bounds
    useEffect(() => {
        if (currentQuestionIndex >= filteredQuestions.length) {
            setCurrentQuestionIndex(Math.max(0, filteredQuestions.length - 1));
        }
    }, [currentQuestionIndex, filteredQuestions.length]);

    const activeQuestion: Question | undefined = filteredQuestions[currentQuestionIndex];

    const filterCounts = useMemo(() => {
        let correct = 0;
        let incorrect = 0;
        let unanswered = 0;
        for (const q of questions) {
            const ans = userAnswers[q.id];
            if (!ans || String(ans).trim() === '') {
                unanswered += 1;
            } else if (String(ans).trim() === String(q.correct ?? '').trim()) {
                correct += 1;
            } else {
                incorrect += 1;
            }
        }
        return { all: questions.length, correct, incorrect, unanswered };
    }, [questions, userAnswers]);

    if (loading && (!attempt || !test || questions.length === 0)) {
        return (
            <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <SynapticLoader size="lg" />
                <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                    Calculating score & preparing solution review...
                </p>
            </div>
        );
    }

    if (loadError || !test || !attempt || questions.length === 0 || !scoreSummary) {
        return (
            <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
                <EmptyState
                    title="Scorecard Unavailable"
                    description={loadError || 'Could not find attempt details for this mock test.'}
                    actionLabel="Return to Test Details"
                    onAction={handleBack}
                />
            </div>
        );
    }

    const marksPerQ = scoreSummary.marksPerQuestion;
    const negMarks = scoreSummary.negativeMarks;
    const passed = scoreSummary.passed;

    return (
        <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2.5 -ml-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors active:scale-95 touch-manipulation shrink-0"
                            aria-label="Back to test details"
                        >
                            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black truncate text-slate-900 dark:text-white">
                                {test.name || 'Mock Test'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Result & Solution Review • {formatDate(attempt.end_time || attempt.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* View Switcher Pill & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                aria-pressed={viewMode === 'scorecard'}
                                onClick={() => {
                                    triggerHaptic();
                                    setViewMode('scorecard');
                                }}
                                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation ${
                                    viewMode === 'scorecard'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Scorecard
                            </button>
                            <button
                                type="button"
                                aria-pressed={viewMode === 'solutions'}
                                onClick={() => {
                                    triggerHaptic();
                                    setViewMode('solutions');
                                }}
                                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation ${
                                    viewMode === 'solutions'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Solutions
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleReattempt}
                            className="hidden sm:inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition-colors active:scale-95 touch-manipulation"
                        >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Retake</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-28 scroll-mb-28">
                {viewMode === 'scorecard' ? (
                    <div className="space-y-6">
                        {/* Hero Scorecard Banner */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                                passed
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            }`}
                                        >
                                            {passed ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                            ) : (
                                                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                                            )}
                                            {passed ? 'Passed Cutoff' : 'Below Cutoff'}
                                        </span>
                                        {test.passing_marks && (
                                            <span className="text-xs text-slate-300">
                                                (Cutoff: {test.passing_marks} marks)
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                                            {scoreSummary.score}
                                        </span>
                                        <span className="text-lg sm:text-xl font-bold text-slate-400">
                                            / {scoreSummary.totalMarks} Marks
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs sm:text-sm text-slate-300">
                                        Marking Scheme: +{marksPerQ.toFixed(2)} for correct •{' '}
                                        {negMarks > 0 ? `-${negMarks.toFixed(2)} negative for wrong` : 'Zero negative'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:w-72">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                            Accuracy
                                        </div>
                                        <div className="mt-1 text-2xl font-black text-indigo-300">
                                            {scoreSummary.accuracy}%
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                            Time Taken
                                        </div>
                                        <div className="mt-1 text-2xl font-black text-white truncate">
                                            {formatDuration(attempt.time_taken_seconds)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3 Metric Tiles (Correct, Incorrect, Unanswered) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40 shadow-sm flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Correct
                                </span>
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                    {scoreSummary.correctCount}
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/40 shadow-sm flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                                    <XCircle className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Incorrect
                                </span>
                                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                    {scoreSummary.wrongCount}
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-2">
                                    <HelpCircle className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Skipped
                                </span>
                                <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                                    {scoreSummary.unansweredCount}
                                </span>
                            </div>
                        </div>

                        {/* Subject-Wise Performance Breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                                    <span>Subject-Wise Performance</span>
                                </h2>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {subjectBreakdown.length} Subjects
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {subjectBreakdown.map((sb) => (
                                    <div key={sb.subject} className="py-4 first:pt-0 last:pb-0 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                                                {sb.subject}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    {sb.marks} Marks
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                                                    ({sb.accuracy}%)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Accuracy Progress Bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    sb.accuracy >= 70
                                                        ? 'bg-emerald-500'
                                                        : sb.accuracy >= 40
                                                          ? 'bg-indigo-500'
                                                          : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${Math.max(0, Math.min(100, sb.accuracy))}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                                            <span>
                                                Total: <strong>{sb.totalQuestions}</strong>
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                    ✓ {sb.correctCount}
                                                </span>
                                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                                    ✗ {sb.wrongCount}
                                                </span>
                                                <span className="text-slate-500 font-medium">
                                                    ○ {sb.unansweredCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA: Go to Solution Review */}
                        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                                    Want to understand your mistakes?
                                </h3>
                                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                                    Inspect step-by-step bilingual explanations and review why options are correct or incorrect.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic();
                                    setViewMode('solutions');
                                }}
                                className="min-h-[44px] w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 touch-manipulation shrink-0 flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" aria-hidden="true" />
                                <span>Review Solutions (1-by-1)</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* View 2: 1-by-1 Solution Review */
                    <div className="space-y-4">
                        {/* Review Controls Header */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                            {/* Filter Chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {(
                                    [
                                        { id: 'all', label: `All (${filterCounts.all})` },
                                        { id: 'correct', label: `Correct (${filterCounts.correct})` },
                                        { id: 'incorrect', label: `Incorrect (${filterCounts.incorrect})` },
                                        { id: 'unanswered', label: `Skipped (${filterCounts.unanswered})` },
                                    ] as const
                                ).map((fc) => (
                                    <button
                                        key={fc.id}
                                        type="button"
                                        aria-pressed={filterMode === fc.id}
                                        onClick={() => {
                                            triggerHaptic();
                                            setFilterMode(fc.id);
                                            setCurrentQuestionIndex(0);
                                        }}
                                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation ${
                                            filterMode === fc.id
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {fc.label}
                                    </button>
                                ))}
                            </div>

                            {/* Language Switcher & Quick Palette Button */}
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                                    {(['bilingual', 'english', 'hindi'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            aria-pressed={languageMode === lang}
                                            onClick={() => {
                                                triggerHaptic();
                                                setLanguageMode(lang);
                                            }}
                                            className={`min-h-[44px] px-2.5 py-1 rounded-lg font-bold capitalize transition-all active:scale-95 touch-manipulation ${
                                                languageMode === lang
                                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic();
                                        setIsPaletteOpen(true);
                                    }}
                                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 touch-manipulation"
                                    aria-label="Open Question Palette Grid"
                                    title="Open Question Palette"
                                >
                                    <Grid className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Active Question Card */}
                        {activeQuestion ? (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                {/* Question Metadata Bar */}
                                {(() => {
                                    const selectedOption = userAnswers[activeQuestion.id];
                                    const isAnswered = Boolean(selectedOption && String(selectedOption).trim() !== '');
                                    const isCorrect = isAnswered && String(selectedOption).trim() === String(activeQuestion.correct ?? '').trim();
                                    const globalQIndex = questions.findIndex((q) => q.id === activeQuestion.id);

                                    return (
                                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                    Question {globalQIndex >= 0 ? globalQIndex + 1 : currentQuestionIndex + 1}{' '}
                                                    <span className="text-xs font-normal text-slate-500">
                                                        ({currentQuestionIndex + 1} of {filteredQuestions.length} filtered)
                                                    </span>
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {activeQuestion.subject || activeQuestion.classification?.subject || 'General'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isCorrect ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                        <span>Correct (+{marksPerQ.toFixed(2)})</span>
                                                    </span>
                                                ) : isAnswered ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                        <span>Incorrect (-{negMarks.toFixed(2)})</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                        <span>Unattempted (0)</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Question Stem (Bilingual / English / Hindi with KaTeX) */}
                                <div className="space-y-3">
                                    {(languageMode === 'bilingual' || languageMode === 'english') && (
                                        <div className="text-slate-900 dark:text-slate-100 font-medium text-base leading-relaxed selectable-text">
                                            <MarkdownRenderer content={activeQuestion.question} />
                                        </div>
                                    )}

                                    {(languageMode === 'bilingual' || languageMode === 'hindi') &&
                                        activeQuestion.question_hi && (
                                            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                                                    Hindi Translation
                                                </div>
                                                <div lang="hi">
                                                    <MarkdownRenderer content={activeQuestion.question_hi} />
                                                </div>
                                            </div>
                                        )}

                                    {/* Question Image Diagram */}
                                    {activeQuestion.question_image_url && (
                                        <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-center p-2">
                                            <img
                                                src={activeQuestion.question_image_url}
                                                alt="Question Diagram"
                                                className="max-h-72 object-contain rounded-xl"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Options List */}
                                <div className="space-y-2.5">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Options
                                    </div>
                                    {activeQuestion.options.map((opt, idx) => {
                                        const optLetter = String.fromCharCode(65 + idx); // A, B, C, D, E
                                        const isSelected = userAnswers[activeQuestion.id] === opt;
                                        const isCorrectOpt = String(opt).trim() === String(activeQuestion.correct ?? '').trim();
                                        const hindiOpt = activeQuestion.options_hi?.[idx];

                                        let optStyles = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200';
                                        let badge: React.ReactNode = null;

                                        if (isCorrectOpt) {
                                            optStyles =
                                                'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100';
                                            badge = (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                                    Correct Answer
                                                </span>
                                            );
                                        } else if (isSelected && !isCorrectOpt) {
                                            optStyles =
                                                'border-rose-300 dark:border-rose-700 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
                                            badge = (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                                                    Your Choice
                                                </span>
                                            );
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${optStyles}`}
                                            >
                                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                                    <span
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                                            isCorrectOpt
                                                                ? 'bg-emerald-600 text-white'
                                                                : isSelected
                                                                  ? 'bg-rose-600 text-white'
                                                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {optLetter}
                                                    </span>
                                                    <div className="space-y-1 min-w-0 flex-1 text-sm font-medium leading-snug">
                                                        <div>{opt}</div>
                                                        {languageMode === 'bilingual' && hindiOpt && (
                                                            <div lang="hi" className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                                                                {hindiOpt}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {badge && <div className="shrink-0">{badge}</div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Comprehensive Explanation */}
                                {activeQuestion.explanation && (
                                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                                            <span>Detailed Solution & Explanation</span>
                                        </div>

                                        {typeof activeQuestion.explanation === 'string' ? (
                                            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200 text-sm leading-relaxed selectable-text">
                                                <MarkdownRenderer content={activeQuestion.explanation} />
                                            </div>
                                        ) : typeof activeQuestion.explanation === 'object' ? (
                                            <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200 text-sm">
                                                {(activeQuestion.explanation as any).summary && (
                                                    <div>
                                                        <strong className="block text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-0.5">
                                                            Summary
                                                        </strong>
                                                        <MarkdownRenderer
                                                            content={(activeQuestion.explanation as any).summary}
                                                        />
                                                    </div>
                                                )}
                                                {(activeQuestion.explanation as any).analysis_correct && (
                                                    <div>
                                                        <strong className="block text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-0.5">
                                                            Why This is Correct
                                                        </strong>
                                                        <MarkdownRenderer
                                                            content={(activeQuestion.explanation as any).analysis_correct}
                                                        />
                                                    </div>
                                                )}
                                                {(activeQuestion.explanation as any).analysis_incorrect && (
                                                    <div>
                                                        <strong className="block text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-0.5">
                                                            Analysis of Other Options
                                                        </strong>
                                                        <MarkdownRenderer
                                                            content={(activeQuestion.explanation as any).analysis_incorrect}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Hindi Explanation if present */}
                                        {(languageMode === 'bilingual' || languageMode === 'hindi') &&
                                            (activeQuestion as any).explanation_hi && (
                                                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                                                    <strong className="block text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                                                        Hindi Explanation
                                                    </strong>
                                                    <div lang="hi">
                                                        <MarkdownRenderer content={(activeQuestion as any).explanation_hi} />
                                                    </div>
                                                </div>
                                            )}

                                        {/* Explanation Diagram */}
                                        {activeQuestion.explanation_image_url && (
                                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-center p-2">
                                                <img
                                                    src={activeQuestion.explanation_image_url}
                                                    alt="Explanation Visual"
                                                    className="max-h-72 object-contain rounded-xl"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                    No questions match the current filter ({filterMode}).
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Sticky Bottom Navigation for 1-by-1 Solution Review */}
            {viewMode === 'solutions' && filteredQuestions.length > 0 && (
                <KeyboardAwareBottomBar
                    fullWidth
                    className="z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
                >
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                        <button
                            type="button"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => {
                                triggerHaptic();
                                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                            }}
                            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                            <span>Previous</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic();
                                setIsPaletteOpen(true);
                            }}
                            aria-label="Open question palette"
                            className="min-h-[44px] text-xs font-black text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 touch-manipulation transition-all"
                        >
                            Q {currentQuestionIndex + 1} / {filteredQuestions.length}
                        </button>

                        <button
                            type="button"
                            disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                            onClick={() => {
                                triggerHaptic();
                                setCurrentQuestionIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1));
                            }}
                            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation transition-all shadow-sm"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </KeyboardAwareBottomBar>
            )}

            {/* Quick-Jump Question Palette Dialog */}
            <NativeDialog
                isOpen={isPaletteOpen}
                onClose={() => setIsPaletteOpen(false)}
                variant="drawer-right"
                ariaLabelledBy="quick-jump-palette-title"
                panelClassName="h-full w-full bg-white dark:bg-slate-900 p-5 flex flex-col"
            >
                <div className="p-4 space-y-4">
                    <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                            <h2
                                id="quick-jump-palette-title"
                                className="text-sm font-black tracking-tight text-slate-900 dark:text-white"
                            >
                                Jump to Question
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic();
                                    setIsPaletteOpen(false);
                                }}
                                aria-label="Close question palette"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                Correct
                            </span>
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                                Wrong
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                                Skipped
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[70vh] overflow-y-auto pr-1">
                        {questions.map((q, idx) => {
                            const ans = userAnswers[q.id];
                            const isAnswered = Boolean(ans && String(ans).trim() !== '');
                            const isCorrect = isAnswered && String(ans).trim() === String(q.correct ?? '').trim();

                            let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                            if (isCorrect) {
                                btnStyle = 'bg-emerald-500 text-white font-black';
                            } else if (isAnswered) {
                                btnStyle = 'bg-rose-500 text-white font-black';
                            }

                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic();
                                        setFilterMode('all');
                                        setCurrentQuestionIndex(idx);
                                        setIsPaletteOpen(false);
                                    }}
                                    className={`h-11 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation flex items-center justify-center ${btnStyle}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </NativeDialog>
        </div>
    );
};
