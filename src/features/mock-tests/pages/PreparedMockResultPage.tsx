import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    BarChart2,
    Bookmark,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Grid,
    HelpCircle,
    MinusCircle,
    RotateCcw,
    Sparkles,
    Target,
    Trophy,
    X,
    XCircle,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBookmarkStore } from '@/features/quiz/stores/useBookmarkStore';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { syncService } from '@/lib/syncService';
import { triggerHaptic } from '@/lib/haptics';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { QuizExplanation } from '@/features/quiz/components/QuizExplanation';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { KeyboardAwareBottomBar } from '@/components/ui/KeyboardAwareBottomBar';
import { SwipeableTabViewport, type SwipeableTabItem } from '@/components/ui/SwipeableTabViewport';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { EmptyState } from '../components/EmptyState';
import { TestLeaderboardCard } from '../components/TestLeaderboardCard';
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

type ResultTabId = 'analysis' | 'solutions' | 'leaderboard';
type LanguageMode = 'bilingual' | 'english' | 'hindi';
type QuestionFilterMode = 'all' | 'incorrect' | 'unanswered' | 'saved' | 'correct';

const RESULT_TABS: SwipeableTabItem[] = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'leaderboard', label: 'Leaderboard' },
];

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
    const setHideGlobalFooter = useLayoutStore((s) => s.setHideGlobalFooter);
    const showToast = useNotificationStore((s) => s.showToast);
    const bookmarks = useBookmarkStore((s) => s.bookmarks);
    const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
    const loadBookmarks = useBookmarkStore((s) => s.loadBookmarks);
    const userId = user?.id ?? '';

    useEffect(() => {
        setHideGlobalFooter(true);
        return () => setHideGlobalFooter(false);
    }, [setHideGlobalFooter]);

    // Hydrate saved question IDs from IndexedDB and cloud bookmarks
    useEffect(() => {
        let cancelled = false;
        const hydrateBookmarks = async () => {
            const idSet = new Set<string>();
            try {
                const localBookmarks = (await db.getAllBookmarks?.()) ?? [];
                for (const b of localBookmarks) {
                    if (b?.id) idSet.add(b.id);
                    if (b?.v1_id) idSet.add(b.v1_id);
                }
            } catch {
                // Ignore IndexedDB unavailability
            }

            if (
                userId &&
                (typeof navigator === 'undefined' || navigator.onLine !== false) &&
                typeof (supabase as { from?: unknown })?.from === 'function'
            ) {
                try {
                    const { data: remoteRows } = await supabase
                        .from('user_bookmarks')
                        .select('question_id')
                        .eq('user_id', userId);
                    if (Array.isArray(remoteRows)) {
                        for (const row of remoteRows) {
                            if (row?.question_id) idSet.add(String(row.question_id));
                        }
                    }
                } catch {
                    // Offline or mocked environment
                }
            }

            if (!cancelled && idSet.size > 0) {
                const merged = new Set<string>([...useBookmarkStore.getState().bookmarks, ...idSet]);
                loadBookmarks(Array.from(merged));
            }
        };

        hydrateBookmarks();
        window.addEventListener('mindflow-sync-complete', hydrateBookmarks);
        return () => {
            cancelled = true;
            window.removeEventListener('mindflow-sync-complete', hydrateBookmarks);
        };
    }, [loadBookmarks, userId]);

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
    const [viewMode, setViewMode] = useState<ResultTabId>('analysis');
    const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
    const [filterMode, setFilterMode] = useState<QuestionFilterMode>('all');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);

    const isMountedRef = useRef<boolean>(true);
    const seqRef = useRef<number>(0);
    const solutionsContainerRef = useRef<HTMLDivElement>(null);

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
        if (!testId) return;
        const resolvedSeriesId = String(
            test?.series_id ?? test?.mock_series?.id ?? test?.test_series?.id ?? ''
        ).trim();
        navigate(ROUTES.TEST_SERIES.TEST(testId), {
            state: {
                returnTo: resolvedSeriesId
                    ? ROUTES.TEST_SERIES.SERIES(resolvedSeriesId)
                    : ROUTES.TEST_SERIES.ROOT,
            },
        });
    }, [navigate, test, testId]);

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
            scoreSummary.negativeMarks,
            attempt?.time_spent_by_question ?? null
        );
    }, [attempt?.time_spent_by_question, questions, scoreSummary, userAnswers]);

    const savedIdSet = useMemo(() => new Set(bookmarks), [bookmarks]);
    const isQuestionSaved = useCallback(
        (q: Question | undefined | null): boolean =>
            Boolean(q && (savedIdSet.has(q.id) || (q.v1_id && savedIdSet.has(q.v1_id)))),
        [savedIdSet]
    );

    const handleToggleSaveQuestion = useCallback(
        (q: Question) => {
            const wasSaved = isQuestionSaved(q);
            triggerHaptic('light');
            toggleBookmark(q);
            if (
                wasSaved &&
                userId &&
                (typeof navigator === 'undefined' || navigator.onLine !== false) &&
                typeof syncService?.removeBookmark === 'function'
            ) {
                syncService.removeBookmark(userId, q.id, q.v1_id).catch(() => {});
            }
            showToast({
                title: wasSaved ? 'Removed from Saved' : 'Question Saved',
                message: wasSaved
                    ? 'Removed from your Saved Questions list.'
                    : 'Added to Saved Questions for quick revision.',
                variant: 'success',
                duration: 2200,
            });
        },
        [isQuestionSaved, showToast, toggleBookmark, userId]
    );

    // Solution Review Filtering
    const filteredQuestions = useMemo(() => {
        if (filterMode === 'all') return questions;
        return questions.filter((q) => {
            if (filterMode === 'saved') return isQuestionSaved(q);
            const ans = userAnswers[q.id];
            const hasAnswered = ans && String(ans).trim() !== '';
            const isCorrect = hasAnswered && String(ans).trim() === String(q.correct ?? '').trim();

            if (filterMode === 'correct') return isCorrect;
            if (filterMode === 'incorrect') return hasAnswered && !isCorrect;
            if (filterMode === 'unanswered') return !hasAnswered;
            return true;
        });
    }, [filterMode, isQuestionSaved, questions, userAnswers]);

    // Keep active question index within filtered bounds
    useEffect(() => {
        if (currentQuestionIndex >= filteredQuestions.length) {
            setCurrentQuestionIndex(Math.max(0, filteredQuestions.length - 1));
        }
    }, [currentQuestionIndex, filteredQuestions.length]);

    const activeQuestion: Question | undefined = filteredQuestions[currentQuestionIndex];

    // Tag horizontally scrollable KaTeX display formulas so SwipeableTabViewport yields to math pan
    useEffect(() => {
        if (viewMode !== 'solutions' || !solutionsContainerRef.current) return;
        const nodes = solutionsContainerRef.current.querySelectorAll('.katex-display');
        nodes.forEach((node) => {
            node.setAttribute('data-h-rail', 'true');
            node.classList.add('touch-pan-x');
        });
    }, [viewMode, activeQuestion?.id, languageMode]);

    const filterCounts = useMemo(() => {
        let correct = 0;
        let incorrect = 0;
        let unanswered = 0;
        let saved = 0;
        for (const q of questions) {
            if (isQuestionSaved(q)) saved += 1;
            const ans = userAnswers[q.id];
            if (!ans || String(ans).trim() === '') {
                unanswered += 1;
            } else if (String(ans).trim() === String(q.correct ?? '').trim()) {
                correct += 1;
            } else {
                incorrect += 1;
            }
        }
        return { all: questions.length, correct, incorrect, unanswered, saved };
    }, [isQuestionSaved, questions, userAnswers]);

    const handleSelectTab = (tabId: ResultTabId, btnEl?: HTMLButtonElement) => {
        triggerHaptic('light');
        setViewMode(tabId);
        if (btnEl && typeof btnEl.scrollIntoView === 'function') {
            btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    if (loading && (!attempt || !test || questions.length === 0)) {
        return (
            <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <SynapticLoader size="lg" />
                <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                    Calculating score &amp; preparing solution review...
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

    const renderAnalysisTab = () => (
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
                            {test.passing_marks ? (
                                <span className="text-xs text-slate-300">
                                    (Cutoff: {test.passing_marks} marks)
                                </span>
                            ) : null}
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

                    <div className="grid grid-cols-2 gap-3 sm:w-72">
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

            {/* Negative-Marking & Pace Breakdown Card */}
            <div
                data-testid="analysis-negative-marking-card"
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MinusCircle className="w-5 h-5 text-rose-500" aria-hidden="true" />
                        <span>Score &amp; Negative-Marking Breakdown</span>
                    </h2>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {negMarks > 0
                            ? `-${negMarks.toFixed(2)} per wrong answer`
                            : 'Zero negative marking'}
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Gross Positive
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">
                            +{scoreSummary.positiveMarks.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                            {scoreSummary.correctCount} × +{marksPerQ.toFixed(2)}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                            Negative Penalty
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300">
                            {scoreSummary.negativeDeduction > 0
                                ? `-${scoreSummary.negativeDeduction.toFixed(2)}`
                                : '0.00'}
                        </div>
                        <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                            {negMarks > 0
                                ? `${scoreSummary.wrongCount} × -${negMarks.toFixed(2)}`
                                : `${scoreSummary.wrongCount} wrong • No penalty`}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                            Net Score
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-300">
                            {scoreSummary.score}
                        </div>
                        <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80">
                            out of {scoreSummary.totalMarks} marks
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Avg Pace / Q</span>
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                            {attempt.time_taken_seconds != null && scoreSummary.attemptedCount > 0
                                ? formatDuration(
                                      attempt.time_taken_seconds / scoreSummary.attemptedCount
                                  )
                                : formatDuration(
                                      attempt.time_taken_seconds != null && scoreSummary.totalQuestions > 0
                                          ? attempt.time_taken_seconds / scoreSummary.totalQuestions
                                          : null
                                  )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {scoreSummary.attemptedCount}/{scoreSummary.totalQuestions} attempted
                        </div>
                    </div>
                </div>

                {/* Question Outcome Distribution Bar */}
                {scoreSummary.totalQuestions > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <div
                            role="img"
                            aria-label={`Question distribution: ${scoreSummary.correctCount} correct, ${scoreSummary.wrongCount} incorrect, ${scoreSummary.unansweredCount} unattempted`}
                            className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex"
                        >
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{
                                    width: `${(scoreSummary.correctCount / scoreSummary.totalQuestions) * 100}%`,
                                }}
                            />
                            <div
                                className="h-full bg-rose-500 transition-all duration-500"
                                style={{
                                    width: `${(scoreSummary.wrongCount / scoreSummary.totalQuestions) * 100}%`,
                                }}
                            />
                            <div
                                className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-500"
                                style={{
                                    width: `${(scoreSummary.unansweredCount / scoreSummary.totalQuestions) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>
                                Attempt Rate:{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                    {Math.round(
                                        (scoreSummary.attemptedCount / scoreSummary.totalQuestions) * 100
                                    )}
                                    %
                                </strong>
                            </span>
                            <span>
                                Saved for Revision:{' '}
                                <strong className="text-amber-600 dark:text-amber-400">
                                    {filterCounts.saved}
                                </strong>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Subject-Wise Performance Breakdown (Time Spent vs Accuracy & Negative Marking) */}
            <div
                data-testid="analysis-subject-breakdown"
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                        <span>Subject-Wise Performance</span>
                    </h2>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {subjectBreakdown.length} Sections • Time vs Accuracy
                    </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjectBreakdown.map((sb) => (
                        <div key={sb.subject} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {sb.subject}
                                </span>
                                <div className="flex items-center gap-2 text-right">
                                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                        {sb.marks} / {sb.maxMarks} Marks
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {sb.accuracy}% acc
                                    </span>
                                </div>
                            </div>

                            {/* Accuracy Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    <span>Accuracy</span>
                                    <span>{sb.accuracy}%</span>
                                </div>
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
                            </div>

                            {/* Time Spent Bar (when per-question timing is available) */}
                            {sb.timeSpentSeconds !== null && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-sky-500" aria-hidden="true" />
                                            <span>Time Spent: {formatDuration(sb.timeSpentSeconds)}</span>
                                        </span>
                                        <span>
                                            {sb.timeSharePercent !== null ? `${sb.timeSharePercent}% share` : ''}
                                            {sb.avgSecondsPerQuestion !== null
                                                ? ` • Avg ${sb.avgSecondsPerQuestion}s/Q`
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                            style={{
                                                width: `${Math.max(
                                                    0,
                                                    Math.min(100, sb.timeSharePercent ?? 0)
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>
                                        Total: <strong>{sb.totalQuestions}</strong>
                                    </span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        +{sb.positiveMarks.toFixed(2)}
                                    </span>
                                    {negMarks > 0 && (
                                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                            -{sb.negativeDeduction.toFixed(2)} neg
                                        </span>
                                    )}
                                    {sb.timeSpentSeconds === null && (
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                            • Time: —
                                        </span>
                                    )}
                                </div>
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

            {/* Quick Jump CTAs to Solutions & Leaderboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                            Want to understand your mistakes?
                        </h3>
                        <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                            Inspect step-by-step bilingual explanations 1-by-1.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            setViewMode('solutions');
                        }}
                        className="min-h-[44px] w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        <span>Review Solutions</span>
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                            Check where you stand
                        </h3>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            Compare your score &amp; accuracy against the Top 50 aspirants.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            setViewMode('leaderboard');
                        }}
                        className="min-h-[44px] w-full px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Trophy className="w-4 h-4" aria-hidden="true" />
                        <span>View Leaderboard</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSolutionsTab = () => (
        <div ref={solutionsContainerRef} className="space-y-4">
            {/* Review Controls Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                {/* Filter Chips */}
                <div
                    data-h-rail="true"
                    className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain max-w-full"
                >
                    {(
                        [
                            { id: 'all', label: `All (${filterCounts.all})` },
                            { id: 'incorrect', label: `Incorrect (${filterCounts.incorrect})` },
                            { id: 'unanswered', label: `Unattempted (${filterCounts.unanswered})` },
                            { id: 'saved', label: `Saved (${filterCounts.saved})` },
                            { id: 'correct', label: `Correct (${filterCounts.correct})` },
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
                            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
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
                                className={`min-h-[44px] px-2.5 py-1 rounded-lg font-bold capitalize transition-all active:scale-95 touch-manipulation cursor-pointer ${
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
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 touch-manipulation cursor-pointer"
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
                        const isCorrect =
                            isAnswered &&
                            String(selectedOption).trim() === String(activeQuestion.correct ?? '').trim();
                        const globalQIndex = questions.findIndex((q) => q.id === activeQuestion.id);
                        const isSaved = isQuestionSaved(activeQuestion);
                        const qTimeSecs = attempt.time_spent_by_question?.[activeQuestion.id];

                        return (
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                        Question {globalQIndex >= 0 ? globalQIndex + 1 : currentQuestionIndex + 1}{' '}
                                        <span className="text-xs font-normal text-slate-500">
                                            ({currentQuestionIndex + 1} of {filteredQuestions.length} filtered)
                                        </span>
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {activeQuestion.subject || activeQuestion.classification?.subject || 'General'}
                                    </span>
                                    {typeof qTimeSecs === 'number' && Number.isFinite(qTimeSecs) && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60">
                                            <Clock className="w-3 h-3" aria-hidden="true" />
                                            <span>{formatDuration(qTimeSecs)}</span>
                                        </span>
                                    )}
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

                                    <button
                                        type="button"
                                        data-testid="solution-bookmark-toggle"
                                        aria-pressed={isSaved}
                                        aria-label={isSaved ? 'Remove from Saved Questions' : 'Save Question'}
                                        onClick={() => handleToggleSaveQuestion(activeQuestion)}
                                        className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                            isSaved
                                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-sm'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <Bookmark
                                            className={`w-4 h-4 shrink-0 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`}
                                            aria-hidden="true"
                                        />
                                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                                    </button>
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
                            const optLetter = String.fromCharCode(65 + idx);
                            const isSelected = userAnswers[activeQuestion.id] === opt;
                            const isCorrectOpt =
                                String(opt).trim() === String(activeQuestion.correct ?? '').trim();
                            const hindiOpt = activeQuestion.options_hi?.[idx];

                            let optStyles =
                                'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200';
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
                                                <div
                                                    lang="hi"
                                                    className="text-xs text-slate-600 dark:text-slate-400 font-normal"
                                                >
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
                    {(activeQuestion.explanation || (activeQuestion as any).explanation_hi) && (
                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                <Sparkles className="w-4 h-4" aria-hidden="true" />
                                <span>Detailed Solution &amp; Explanation</span>
                            </div>

                            {activeQuestion.explanation && (
                                <QuizExplanation
                                    explanation={activeQuestion.explanation}
                                    languageMode={languageMode}
                                    questionId={activeQuestion.id}
                                    imageUrl={activeQuestion.explanation_image_url}
                                />
                            )}

                            {/* Legacy standalone Hindi Explanation fallback if present */}
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
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                    <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
                        {filterMode === 'saved'
                            ? 'No saved questions in this mock test yet. Tap Save on any question to revise it later.'
                            : filterMode === 'unanswered'
                              ? 'Great! You attempted every question in this mock test.'
                              : filterMode === 'incorrect'
                                ? 'Awesome! Zero incorrect answers in this mock test.'
                                : `No questions match the current filter (${filterMode}).`}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            setFilterMode('all');
                            setCurrentQuestionIndex(0);
                        }}
                        className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 touch-manipulation transition-all cursor-pointer"
                    >
                        Show All Questions ({filterCounts.all})
                    </button>
                </div>
            )}
        </div>
    );

    const renderLeaderboardTab = () => (
        <div className="space-y-4">
            <TestLeaderboardCard
                tests={[test]}
                fixedTestId={test.id}
                limit={50}
                refreshKey={attempt.id}
            />
        </div>
    );

    return (
        <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip">
            {/* Top Navigation Bar + Single-Row 3-Tab Header */}
            <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)]">
                <div className="max-w-4xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 -ml-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors active:scale-95 touch-manipulation shrink-0 cursor-pointer"
                            aria-label="Back to test details"
                        >
                            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black truncate text-slate-900 dark:text-white">
                                {test.name || 'Mock Test'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Result Hub • {formatDate(attempt.end_time || attempt.created_at)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleReattempt}
                        data-testid="result-retake-btn"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition-colors active:scale-95 touch-manipulation shrink-0 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Retake</span>
                    </button>
                </div>

                {/* Single-row 3-tab role="tablist" with WCAG 1.4.1 bottom border indicator */}
                <div className="max-w-4xl mx-auto px-4">
                    <div
                        role="tablist"
                        aria-label="Result sections"
                        className="flex items-center gap-1 sm:gap-3 border-t border-slate-100 dark:border-slate-800/80"
                    >
                        {RESULT_TABS.map((tab) => {
                            const isSelected = viewMode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    id={`result-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isSelected}
                                    aria-controls={`result-panel-${tab.id}`}
                                    onClick={(e) =>
                                        handleSelectTab(tab.id as ResultTabId, e.currentTarget)
                                    }
                                    className={`flex-1 sm:flex-none min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold whitespace-nowrap border-b-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                        isSelected
                                            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content Area wrapped in SwipeableTabViewport */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-28 scroll-mb-28">
                <SwipeableTabViewport
                    tabs={RESULT_TABS}
                    activeTabId={viewMode}
                    onTabChange={(tabId) => setViewMode(tabId as ResultTabId)}
                    ariaLabel="Mock Test Result Panels"
                    tabIdPrefix="result-tab"
                    panelIdPrefix="result-panel"
                    renderPanel={(tabId) => {
                        if (tabId === 'analysis') return renderAnalysisTab();
                        if (tabId === 'solutions') return renderSolutionsTab();
                        return renderLeaderboardTab();
                    }}
                />
            </main>

            {/* Sticky Bottom Navigation strictly for 1-by-1 Solution Review */}
            {viewMode === 'solutions' && filteredQuestions.length > 0 && (
                <KeyboardAwareBottomBar
                    hasGlobalFooter={false}
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
                            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation transition-all cursor-pointer"
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
                            className="min-h-[44px] text-xs font-black text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 touch-manipulation transition-all cursor-pointer"
                        >
                            Q {currentQuestionIndex + 1} / {filteredQuestions.length}
                        </button>

                        <button
                            type="button"
                            disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                            onClick={() => {
                                triggerHaptic();
                                setCurrentQuestionIndex((prev) =>
                                    Math.min(filteredQuestions.length - 1, prev + 1)
                                );
                            }}
                            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation transition-all shadow-sm cursor-pointer"
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
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
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
                                Unattempted
                            </span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                Saved
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[70vh] overflow-y-auto pr-1">
                        {questions.map((q, idx) => {
                            const ans = userAnswers[q.id];
                            const isAnswered = Boolean(ans && String(ans).trim() !== '');
                            const isCorrect =
                                isAnswered &&
                                String(ans).trim() === String(q.correct ?? '').trim();
                            const qSaved = isQuestionSaved(q);

                            let btnStyle =
                                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
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
                                    className={`relative h-11 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation flex items-center justify-center cursor-pointer ${btnStyle}`}
                                >
                                    <span>{idx + 1}</span>
                                    {qSaved && (
                                        <span
                                            aria-label="Saved"
                                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </NativeDialog>
        </div>
    );
};
