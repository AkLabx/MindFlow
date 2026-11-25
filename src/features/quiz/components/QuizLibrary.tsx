import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle,
    Clock,
    PauseCircle,
    PlayCircle,
    Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { triggerHaptic } from '@/lib/haptics';
import {
    ContinueLearningItem,
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    fetchContinueLearningItems,
    getCachedContinueLearningSnapshot,
    readContinueLearningIndexedDBCache,
} from '@/features/mock-tests/api/mockTestsApi';
import { SavedQuizzesList } from './SavedQuizzesList';
import { AttemptedQuizzesList } from './AttemptedQuizzesList';

type QuizHistoryTab = 'paused' | 'attempted' | 'created';

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

export const QuizLibrary: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get('tab');
    const activeTab: QuizHistoryTab =
        rawTab === 'paused' ? 'paused' : rawTab === 'created' ? 'created' : 'attempted';

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [sortMethod, setSortMethod] = useState<
        'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc'
    >('date-desc');

    const [mockAttempts, setMockAttempts] = useState<ContinueLearningItem[]>(() => {
        if (!userId) return [];
        return getCachedContinueLearningSnapshot(userId, Date.now(), 25) ?? [];
    });

    const isMountedRef = useRef<boolean>(true);
    const fetchSeqRef = useRef<number>(0);

    const loadMockAttempts = useCallback(async () => {
        const seq = ++fetchSeqRef.current;
        if (!userId) {
            setMockAttempts([]);
            return;
        }

        const syncSnapshot = getCachedContinueLearningSnapshot(userId, Date.now(), 25);
        if (syncSnapshot !== null) {
            setMockAttempts(syncSnapshot);
        }

        try {
            if (syncSnapshot === null) {
                const idbItems = await readContinueLearningIndexedDBCache(userId, Date.now(), 25);
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                if (idbItems !== null) {
                    setMockAttempts(idbItems);
                }
            }

            const fresh = await fetchContinueLearningItems(userId, { limit: 25 });
            if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
            setMockAttempts(fresh);
        } catch {
            // Keep cached items silently when offline
        }
    }, [userId]);

    useEffect(() => {
        isMountedRef.current = true;
        void loadMockAttempts();

        const handleInvalidate = () => {
            void loadMockAttempts();
        };
        const handleStorage = (e: StorageEvent) => {
            if (e.key === MOCK_CACHE_VERSION_KEY) {
                void loadMockAttempts();
            }
        };

        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);
        window.addEventListener('storage', handleStorage);

        let channel: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel('mindflow-mock-cache');
                channel.onmessage = () => handleInvalidate();
            } catch {
                channel = null;
            }
        }

        return () => {
            isMountedRef.current = false;
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);
            window.removeEventListener('storage', handleStorage);
            if (channel) {
                channel.close();
            }
        };
    }, [loadMockAttempts]);

    // Prevent invalid sorting for 'created' / 'paused' tabs
    useEffect(() => {
        if (
            (activeTab === 'created' || activeTab === 'paused') &&
            (sortMethod === 'score-desc' || sortMethod === 'score-asc')
        ) {
            setSortMethod('date-desc');
        }
    }, [activeTab, sortMethod]);

    const handleTabChange = (tab: QuizHistoryTab) => {
        triggerHaptic('light');
        setSearchParams({ tab }, { replace: true });
    };

    const inProgressMocks = useMemo(
        () => mockAttempts.filter((item) => item.status === 'in_progress'),
        [mockAttempts]
    );
    const completedMocks = useMemo(
        () => mockAttempts.filter((item) => item.status === 'completed'),
        [mockAttempts]
    );

    const tabs: Array<{
        id: QuizHistoryTab;
        label: string;
        icon: React.ReactNode;
        badge?: number;
    }> = [
        {
            id: 'paused',
            label: 'In Progress',
            icon: <PauseCircle className="w-4 h-4 shrink-0" aria-hidden="true" />,
            badge: inProgressMocks.length > 0 ? inProgressMocks.length : undefined,
        },
        {
            id: 'attempted',
            label: 'Completed',
            icon: <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
            id: 'created',
            label: 'Created Custom',
            icon: <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
    ];

    return (
        <div className="flex flex-col min-h-[100dvh] w-full pb-28 scroll-mb-28 p-3 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-x-hidden">
            {/* Aurora Atmosphere Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 md:hidden animate-hue-slow" />
                <div className="hidden md:block">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/40 dark:bg-indigo-900/20 mix-blend-multiply filter blur-[120px] animate-blob" />
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/40 dark:bg-purple-900/20 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-200/40 dark:bg-slate-800/30 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto relative z-10 py-2 sm:py-4 space-y-4 sm:space-y-6 flex flex-col flex-1">
                {/* Header Title & Back Button */}
                <div className="flex flex-col gap-3 sm:gap-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    navigate(ROUTES.DASHBOARD);
                                }}
                                aria-label="Back to Dashboard"
                                className="min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer z-20 flex items-center justify-center p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight truncate">
                                Quiz History
                            </h1>
                            <InfoHintPopover
                                title="Quiz History"
                                purpose="View all your paused and completed mock tests alongside your custom practice quizzes in one unified timeline."
                                studentVisibility="In Progress shows paused mock exams and started custom quizzes. Completed shows finished mock scorecards and custom quiz results. Created Custom lists your saved custom quizzes."
                                example="Tap Resume Mock or Resume on any In Progress item to continue right where you left off."
                                align="end"
                            />
                        </div>
                    </div>

                    {/* 3-Tab Unified Navigation */}
                    <div
                        role="tablist"
                        aria-label="Quiz history sections"
                        className="flex items-center gap-1 p-1 bg-indigo-50/70 dark:bg-slate-800/70 rounded-xl border border-indigo-100/80 dark:border-slate-700/70 backdrop-blur-sm shadow-sm w-full sm:w-fit self-start overflow-x-auto no-scrollbar"
                    >
                        {tabs.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    id={`history-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isSelected}
                                    aria-controls={`history-panel-${tab.id}`}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                                        isSelected
                                            ? 'bg-white dark:bg-slate-700 shadow-sm border border-indigo-100 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-300'
                                            : 'hover:bg-white/60 dark:hover:bg-slate-700/50 font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    {tab.badge !== undefined && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content Container */}
                <div
                    id={`history-panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`history-tab-${activeTab}`}
                    className="flex-1 relative"
                >
                    <AnimatePresence mode="wait">
                        {activeTab === 'paused' ? (
                            <motion.div
                                key="paused-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="space-y-6"
                            >
                                {inProgressMocks.length > 0 && (
                                    <section aria-label="In Progress Mock Tests" className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                                                Paused Mock Tests
                                            </h2>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full">
                                                {inProgressMocks.length} Active
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {inProgressMocks.map((item) => {
                                                const remainingLabel = formatRemainingTime(item.remainingSeconds);
                                                return (
                                                    <article
                                                        key={item.attemptId}
                                                        className="bg-white/95 dark:bg-slate-800/95 rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-800/50 shadow-xs flex flex-col justify-between gap-3.5"
                                                    >
                                                        <div className="space-y-2 min-w-0">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                                                                    In Progress
                                                                </span>
                                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                                                    {item.categoryName} • {item.seriesName}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                                                                {item.testName}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                <span>
                                                                    {item.answeredCount} / {item.totalQuestions} answered
                                                                </span>
                                                                {remainingLabel && (
                                                                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                                                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                                                        {remainingLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('medium');
                                                                    navigate(ROUTES.TEST_SERIES.EXAM_RUNNER(item.testId), {
                                                                        state: {
                                                                            returnTo: `${ROUTES.QUIZ.LIBRARY}?tab=paused`,
                                                                            resumeAttemptId: item.attemptId,
                                                                        },
                                                                    });
                                                                }}
                                                                className="flex-1 min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                                            >
                                                                <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                                <span>Resume Mock</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('light');
                                                                    navigate(ROUTES.TEST_SERIES.TEST(item.testId), {
                                                                        state: { returnTo: `${ROUTES.QUIZ.LIBRARY}?tab=paused` },
                                                                    });
                                                                }}
                                                                className="min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center transition-all shrink-0"
                                                            >
                                                                Details
                                                            </button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                <SavedQuizzesList
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    sortMethod={sortMethod as any}
                                    setSortMethod={setSortMethod as any}
                                    filterMode="paused"
                                    hasExternalItems={inProgressMocks.length > 0}
                                />
                            </motion.div>
                        ) : activeTab === 'created' ? (
                            <motion.div
                                key="created-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                            >
                                <SavedQuizzesList
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    sortMethod={sortMethod as any}
                                    setSortMethod={setSortMethod as any}
                                    filterMode="all"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="attempted-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="space-y-6"
                            >
                                {completedMocks.length > 0 && (
                                    <section aria-label="Completed Mock Tests" className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                                                Completed Mock Tests
                                            </h2>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full">
                                                {completedMocks.length} Completed
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {completedMocks.map((item) => (
                                                <article
                                                    key={item.attemptId}
                                                    className="bg-white/95 dark:bg-slate-800/95 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs flex flex-col justify-between gap-3.5"
                                                >
                                                    <div className="space-y-2 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                                                                Mock Test
                                                            </span>
                                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                                                {item.categoryName} • {item.seriesName}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                                                            {item.testName}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Award className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                                                                Score:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {item.score}
                                                                    {item.totalMarks > 0 ? ` / ${item.totalMarks}` : ''}
                                                                </strong>
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <Target className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                                                Accuracy:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {formatAccuracyPct(item.accuracy)}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic('light');
                                                                navigate(
                                                                    ROUTES.TEST_SERIES.RESULT(item.testId, item.attemptId),
                                                                    {
                                                                        state: {
                                                                            returnTo: `${ROUTES.QUIZ.LIBRARY}?tab=attempted`,
                                                                        },
                                                                    }
                                                                );
                                                            }}
                                                            className="flex-1 min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                                        >
                                                            <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                            <span>View Solution</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                triggerHaptic('light');
                                                                navigate(ROUTES.TEST_SERIES.TEST(item.testId), {
                                                                    state: { returnTo: `${ROUTES.QUIZ.LIBRARY}?tab=attempted` },
                                                                });
                                                            }}
                                                            className="min-h-[44px] min-w-[44px] scroll-mb-28 active:scale-95 touch-manipulation cursor-pointer px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center transition-all shrink-0"
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <AttemptedQuizzesList
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    sortMethod={sortMethod}
                                    setSortMethod={setSortMethod}
                                    hasExternalItems={completedMocks.length > 0}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CSS Keyframes & Accessibility */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                @keyframes hue-slow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                .animate-hue-slow {
                    animation: hue-slow 20s linear infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-blob, .animate-hue-slow {
                        animation: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
};
