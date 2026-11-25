import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eraser,
    Flag,
    Languages,
    LayoutGrid,
    PanelRightClose,
    PanelRightOpen,
    PauseCircle,
    Send,
    UserCheck,
    WifiOff,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { formatOptionText, formatQuestionText } from '@/features/quiz/utils/questionFormatter';
import { triggerHaptic } from '@/lib/haptics';
import type { PreparedMockPaletteStatus } from '../../api/mockTestsApi';
import { getPaletteStatusBadgeLabel, type ExamRunnerSkinProps } from './types';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const getTcsTileClasses = (
    status: PreparedMockPaletteStatus,
    isCurrent: boolean
): string => {
    const ring = isCurrent
        ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md'
        : '';

    switch (status) {
        case 'answered':
            return `bg-emerald-600 text-white border-emerald-700 rounded-t-2xl rounded-b-md ${ring}`;
        case 'not_answered':
            return `bg-rose-600 text-white border-rose-700 rounded-t-md rounded-b-2xl ${ring}`;
        case 'marked_for_review':
            return `bg-purple-600 text-white border-purple-700 rounded-full ${ring}`;
        case 'answered_and_marked':
            return `relative bg-purple-600 text-white border-emerald-400 rounded-full ${ring}`;
        default:
            return `bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md ${ring}`;
    }
};

export const TcsIonExamShell: React.FC<ExamRunnerSkinProps> = ({
    test,
    questions,
    attemptState,
    currentIndex,
    activeQuestion,
    selectedAnswer,
    isCurrentMarked,
    activePaletteStatus,
    paletteCounts,
    paletteFilter,
    setPaletteFilter,
    sections,
    languageMode,
    onCycleLanguage,
    setLanguageMode,
    hasHindiContent,
    zoomScale,
    setZoomScale,
    studentName,
    studentId,
    isOfflineMode,
    isSubmitting,
    isPaletteDrawerOpen,
    setIsPaletteDrawerOpen,
    isExitDialogOpen,
    setIsExitDialogOpen,
    isSubmitDialogOpen,
    setIsSubmitDialogOpen,
    formatCountdown,
    onSelectOption,
    onToggleMarkForReview,
    onClearResponse,
    onSaveAndNext,
    onPrevious,
    onJumpToIndex,
    onConfirmPauseAndExit,
    onConfirmSubmit,
}) => {
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

    const isUrgentTime = attemptState.remainingSeconds <= 300;
    const totalAnsweredCount = paletteCounts.answered + paletteCounts.answeredAndMarked;
    const totalMarks = Number(test.total_marks ?? questions.length);
    const negativeMarks = Math.abs(Number(test.negative_marks ?? 0));
    const marksPerQuestion =
        questions.length > 0 && totalMarks > 0
            ? Number((totalMarks / questions.length).toFixed(2))
            : 1;
    const isLastQuestion = currentIndex === questions.length - 1;

    const activeSection = useMemo(
        () =>
            sections.find((sec) => sec.indices.includes(currentIndex)) ??
            sections[0] ??
            null,
        [sections, currentIndex]
    );

    const paletteIndicesToShow = useMemo(() => {
        const baseIndices =
            activeSection && sections.length > 1
                ? activeSection.indices
                : questions.map((_, idx) => idx);

        return baseIndices.filter((idx) => {
            const q = questions[idx];
            if (!q) return false;
            const st =
                attemptState.answers[q.id] !== undefined
                    ? attemptState.markedForReview.includes(q.id)
                        ? 'answered_and_marked'
                        : 'answered'
                    : attemptState.markedForReview.includes(q.id)
                      ? 'marked_for_review'
                      : attemptState.visitedQuestionIds.includes(q.id)
                        ? 'not_answered'
                        : 'not_visited';

            if (paletteFilter === 'unanswered') {
                return st === 'not_answered' || st === 'not_visited';
            }
            if (paletteFilter === 'marked') {
                return st === 'marked_for_review' || st === 'answered_and_marked';
            }
            return true;
        });
    }, [activeSection, sections.length, questions, attemptState, paletteFilter]);

    const getStatusForQuestionId = (qId: string): PreparedMockPaletteStatus => {
        const hasAns = attemptState.answers[qId] !== undefined;
        const isMarked = attemptState.markedForReview.includes(qId);
        if (hasAns && isMarked) return 'answered_and_marked';
        if (hasAns) return 'answered';
        if (isMarked) return 'marked_for_review';
        if (attemptState.visitedQuestionIds.includes(qId)) return 'not_answered';
        return 'not_visited';
    };

    const renderTcsPaletteContent = (headingId?: string) => (
        <div className="flex flex-col h-full bg-sky-50/50 dark:bg-slate-900">
            {/* Candidate Identity Strip */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] text-white flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <p
                            id={headingId}
                            className="text-xs font-black text-slate-900 dark:text-white truncate"
                        >
                            {studentName}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-[#1e3a5f] dark:text-sky-300 truncate">
                            {studentId ? `ID: ${studentId}` : 'TCS iON Candidate'}
                        </p>
                    </div>
                </div>
                {headingId && (
                    <button
                        type="button"
                        onClick={() => setIsPaletteDrawerOpen(false)}
                        aria-label="Close Question Palette"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Classic TCS iON 5-Symbol Legend */}
            <div className="grid grid-cols-2 gap-2 py-3 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <span
                        aria-hidden="true"
                        className="w-6 h-6 rounded-t-xl rounded-b-sm bg-emerald-600 text-white text-[10px] font-black inline-flex items-center justify-center shrink-0"
                    >
                        {paletteCounts.answered}
                    </span>
                    <span className="leading-tight">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <span
                        aria-hidden="true"
                        className="w-6 h-6 rounded-t-sm rounded-b-xl bg-rose-600 text-white text-[10px] font-black inline-flex items-center justify-center shrink-0"
                    >
                        {paletteCounts.notAnswered}
                    </span>
                    <span className="leading-tight">Not Answered</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <span
                        aria-hidden="true"
                        className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-[10px] font-black inline-flex items-center justify-center shrink-0"
                    >
                        {paletteCounts.notVisited}
                    </span>
                    <span className="leading-tight">Not Visited</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <span
                        aria-hidden="true"
                        className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-black inline-flex items-center justify-center shrink-0"
                    >
                        {paletteCounts.markedForReview}
                    </span>
                    <span className="leading-tight">Marked Review</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 pt-0.5">
                    <span
                        aria-hidden="true"
                        className="relative w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-black inline-flex items-center justify-center shrink-0"
                    >
                        {paletteCounts.answeredAndMarked}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border border-white flex items-center justify-center">
                            <Check className="w-2 h-2 text-slate-950" strokeWidth={3} />
                        </span>
                    </span>
                    <span className="leading-tight">
                        Answered &amp; Marked for Review (Evaluated)
                    </span>
                </div>
            </div>

            {/* Section Header + Filter */}
            <div className="pt-3 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-black uppercase tracking-wide text-[#1e3a5f] dark:text-sky-300 truncate">
                        {activeSection ? activeSection.name : 'Question Palette'}
                    </h2>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        {totalAnsweredCount}/{questions.length}
                    </span>
                </div>

                <div className="flex items-center gap-1.5" role="group" aria-label="Filter question palette">
                    {(
                        [
                            { id: 'all', label: 'All' },
                            { id: 'unanswered', label: 'Unans' },
                            { id: 'marked', label: 'Marked' },
                        ] as const
                    ).map((chip) => {
                        const active = paletteFilter === chip.id;
                        return (
                            <button
                                key={chip.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setPaletteFilter(chip.id)}
                                className={`flex-1 min-h-[44px] px-2 rounded-lg text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                    active
                                        ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Question Number Tiles */}
            <div className="flex-1 overflow-y-auto pr-1 py-1">
                {paletteIndicesToShow.length === 0 ? (
                    <div className="text-center py-6 px-3 rounded-xl bg-white dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500">
                        No questions match this filter.
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {paletteIndicesToShow.map((idx) => {
                            const q = questions[idx];
                            const status = getStatusForQuestionId(q.id);
                            const isCurrent = idx === currentIndex;
                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => onJumpToIndex(idx)}
                                    aria-label={`Question ${idx + 1}, ${getPaletteStatusBadgeLabel(status)}${
                                        isCurrent ? ', current question' : ''
                                    }`}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className={`min-h-[44px] min-w-[44px] scroll-mb-32 border text-xs font-black inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer ${getTcsTileClasses(
                                        status,
                                        isCurrent
                                    )}`}
                                >
                                    {idx + 1}
                                    {status === 'answered_and_marked' && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-white flex items-center justify-center"
                                        >
                                            <Check className="w-2.5 h-2.5 text-slate-950" strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        setIsPaletteDrawerOpen(false);
                        setIsSubmitDialogOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4b] text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Submit Exam</span>
                </button>
            </div>
        </div>
    );

    return (
        <div
            data-testid="cbt-skin-tcs-ion"
            className="min-h-[100dvh] w-full flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-clip"
        >
            {/* Classic TCS iON Navy Header */}
            <header className="sticky top-0 z-30 w-full bg-[#1e3a5f] text-white border-b border-[#142942] pt-[env(safe-area-inset-top,0px)] shadow-sm">
                <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsExitDialogOpen(true);
                            }}
                            aria-label="Pause and exit mock test"
                            data-testid="cbt-pause-exit-btn"
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Pause</span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-white truncate">
                                    {test.name}
                                </h1>
                                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-sky-500/25 border border-sky-300/30 text-[10px] font-black uppercase tracking-wider text-sky-100 shrink-0">
                                    TCS iON Pattern
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-sky-100/80 truncate">
                                {studentName}
                                {studentId ? ` • ID ${studentId}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div
                            role="timer"
                            aria-label="Time remaining"
                            data-testid="cbt-countdown-timer"
                            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 rounded-lg border font-mono font-black text-xs sm:text-sm inline-flex items-center gap-1.5 ${
                                isUrgentTime
                                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                                    : 'bg-slate-900/50 border-white/20 text-sky-100'
                            }`}
                        >
                            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{formatCountdown(attemptState.remainingSeconds)}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsPaletteDrawerOpen(true)}
                            aria-label="Open Question Palette"
                            data-testid="open-palette-drawer-btn"
                            className="lg:hidden min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSubmitDialogOpen(true)}
                            disabled={isSubmitting}
                            data-testid="open-submit-dialog-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                        >
                            <span>Submit</span>
                        </button>
                    </div>
                </div>

                {/* Section Tabs Bar */}
                <div className="bg-[#eef3f8] dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2">
                        <div
                            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 flex-1"
                            role="tablist"
                            aria-label="Exam Sections"
                        >
                            {sections.map((sec) => {
                                const isActiveSec = activeSection?.id === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActiveSec}
                                        onClick={() => {
                                            const firstUnvisitedOrFirst =
                                                sec.indices.find(
                                                    (idx) => attemptState.answers[questions[idx]?.id] === undefined
                                                ) ?? sec.startIndex;
                                            onJumpToIndex(firstUnvisitedOrFirst);
                                        }}
                                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                                            isActiveSec
                                                ? 'bg-[#2c5e9e] text-white border-[#1e3a5f] shadow-sm'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-[#2c5e9e]'
                                        }`}
                                    >
                                        <span>{sec.name}</span>
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                                isActiveSec
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            {sec.answeredCount + sec.answeredAndMarkedCount}/{sec.totalCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsRightPanelCollapsed((c) => !c)}
                                aria-label={isRightPanelCollapsed ? 'Expand question palette' : 'Collapse question palette'}
                                data-testid="tcs-toggle-palette-btn"
                                className="hidden lg:inline-flex min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 items-center justify-center gap-1.5 text-xs font-bold active:scale-95 touch-manipulation cursor-pointer"
                            >
                                {isRightPanelCollapsed ? (
                                    <PanelRightOpen className="w-4 h-4" aria-hidden="true" />
                                ) : (
                                    <PanelRightClose className="w-4 h-4" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isOfflineMode && (
                <div
                    role="status"
                    className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2"
                >
                    <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Offline mode active — responses saved locally.</span>
                </div>
            )}

            {/* Main Split Container */}
            <div className="flex-1 flex w-full max-w-[1440px] mx-auto">
                <main className="flex-1 min-w-0 px-3 sm:px-6 pt-4 pb-32 scroll-mb-32">
                    {/* Question Meta & View Language Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-[#1e3a5f] dark:text-sky-300">
                                Question No. {currentIndex + 1} of {questions.length}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                +{marksPerQuestion}
                            </span>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                / {negativeMarks > 0 ? `-${negativeMarks}` : '0'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {getPaletteStatusBadgeLabel(activePaletteStatus)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {hasHindiContent && (
                                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                                    {(['en', 'hi', 'bilingual'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            aria-pressed={languageMode === mode}
                                            onClick={() => setLanguageMode(mode)}
                                            className={`min-h-[44px] px-2.5 text-xs font-bold transition-colors cursor-pointer touch-manipulation ${
                                                languageMode === mode
                                                    ? 'bg-[#1e3a5f] text-white'
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {mode === 'en' ? 'EN' : mode === 'hi' ? 'हिन्दी' : 'EN+हिं'}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!hasHindiContent && (
                                <button
                                    type="button"
                                    onClick={onCycleLanguage}
                                    aria-label="Language toggle"
                                    className="min-h-[44px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                                >
                                    <Languages className="w-4 h-4" aria-hidden="true" />
                                    <span>EN</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.max(0.9, Number((z - 0.1).toFixed(2))))}
                                aria-label="Decrease question text size"
                                className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomOut className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                                aria-label="Increase question text size"
                                className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomIn className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Question Stem & Options */}
                    <article
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5"
                        style={{ fontSize: `${zoomScale}rem` }}
                    >
                        <div className="space-y-4">
                            {(languageMode !== 'hi' || !activeQuestion.question_hi) && (
                                <div className="text-slate-900 dark:text-white leading-relaxed font-semibold">
                                    <MarkdownRenderer content={formatQuestionText(activeQuestion.question)} />
                                </div>
                            )}

                            {languageMode !== 'en' && activeQuestion.question_hi && (
                                <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-hindi border-l-4 border-[#2c5e9e] pl-4">
                                    <MarkdownRenderer content={formatQuestionText(activeQuestion.question_hi)} />
                                </div>
                            )}

                            {activeQuestion.question_image_url && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">
                                    <img
                                        src={activeQuestion.question_image_url}
                                        alt={`Diagram for Question ${currentIndex + 1}`}
                                        loading="lazy"
                                        className="max-h-72 w-auto mx-auto rounded-lg object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div
                            role="radiogroup"
                            aria-label={`Options for Question ${currentIndex + 1}`}
                            className="space-y-2.5"
                        >
                            {activeQuestion.options.map((option, idx) => {
                                const isSelected = selectedAnswer === option;
                                const optionHi = activeQuestion.options_hi?.[idx];
                                const showEnglishOption = languageMode !== 'hi' || !optionHi;
                                const showHindiOption =
                                    languageMode !== 'en' &&
                                    Boolean(optionHi) &&
                                    optionHi!.trim().toLowerCase() !== option.trim().toLowerCase();
                                const letter = OPTION_LETTERS[idx] ?? String(idx + 1);

                                return (
                                    <button
                                        key={`${activeQuestion.id}-opt-${idx}`}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => onSelectOption(option)}
                                        className={`w-full min-h-[52px] scroll-mb-32 text-left p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            isSelected
                                                ? 'bg-sky-50 dark:bg-sky-950/40 border-[#1e3a5f] text-slate-900 dark:text-white'
                                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-[#2c5e9e] text-slate-800 dark:text-slate-100'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`mt-0.5 w-6 h-6 rounded-full text-xs font-black inline-flex items-center justify-center shrink-0 ${
                                                isSelected
                                                    ? 'bg-[#1e3a5f] text-white'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {letter}
                                        </span>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            {showEnglishOption && (
                                                <div className="leading-snug font-medium">
                                                    <MarkdownRenderer content={formatOptionText(option)} className="!text-current" />
                                                </div>
                                            )}
                                            {showHindiOption && optionHi && (
                                                <div className="font-hindi text-[0.95em] opacity-85 leading-snug">
                                                    <MarkdownRenderer content={formatOptionText(optionHi)} className="!text-current" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </article>
                </main>

                {/* Collapsible Right TCS iON Question Palette */}
                {!isRightPanelCollapsed && (
                    <aside
                        aria-label="Question Palette"
                        className="hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0 border-l border-slate-200 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-900 p-4 pb-28 sticky top-[7.5rem] h-[calc(100dvh-7.5rem)]"
                    >
                        {renderTcsPaletteContent()}
                    </aside>
                )}
            </div>

            {/* Viewport-Fixed TCS iON Bottom Action Strip */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 px-3 sm:px-6 shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.12)]">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            aria-label="Previous question"
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <button
                            type="button"
                            aria-pressed={isCurrentMarked}
                            onClick={onToggleMarkForReview}
                            data-testid="cbt-mark-review-btn"
                            className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-4 py-2 rounded-lg border font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                isCurrentMarked
                                    ? 'bg-purple-600 border-purple-700 text-white'
                                    : 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                            }`}
                        >
                            <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isCurrentMarked ? 'Marked' : 'Mark Review'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClearResponse}
                            disabled={!selectedAnswer}
                            data-testid="cbt-clear-response-btn"
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40"
                        >
                            <Eraser className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden xs:inline sm:inline">Clear Response</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onSaveAndNext}
                        data-testid="cbt-save-next-btn"
                        className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#162d4b] text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0 shadow-sm"
                    >
                        <span>{isLastQuestion ? 'Review & Submit' : 'Save & Next'}</span>
                        {!isLastQuestion && <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </button>
                </div>
            </footer>

            {/* Mobile Right Drawer */}
            <NativeDialog
                isOpen={isPaletteDrawerOpen}
                onClose={() => setIsPaletteDrawerOpen(false)}
                variant="drawer-right"
                ariaLabelledBy="tcs-mobile-palette-title"
                dataTestId="cbt-palette-drawer"
                panelClassName="h-full w-full bg-sky-50/50 dark:bg-slate-900 p-4 flex flex-col"
            >
                {renderTcsPaletteContent('tcs-mobile-palette-title')}
            </NativeDialog>

            {/* Pause & Exit Dialog */}
            <NativeDialog
                isOpen={isExitDialogOpen}
                onClose={() => setIsExitDialogOpen(false)}
                role="alertdialog"
                ariaLabelledBy="cbt-exit-dialog-title"
                dataTestId="cbt-exit-dialog"
                className="max-w-md"
                panelClassName="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#1e3a5f] dark:text-sky-300 flex items-center justify-center shrink-0">
                        <PauseCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="cbt-exit-dialog-title" className="text-lg font-black text-slate-900 dark:text-white">
                            Pause &amp; Exit SSC CGL Exam?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {totalAnsweredCount} responses and {formatCountdown(attemptState.remainingSeconds)} remaining are saved locally.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsExitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Continue Test
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmPauseAndExit}
                        data-testid="cbt-confirm-exit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white font-black text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Save &amp; Exit
                    </button>
                </div>
            </NativeDialog>

            {/* TCS iON Section Summary Submit Dialog */}
            <NativeDialog
                isOpen={isSubmitDialogOpen}
                onClose={() => !isSubmitting && setIsSubmitDialogOpen(false)}
                role="alertdialog"
                dismissible={!isSubmitting}
                ariaLabelledBy="cbt-submit-dialog-title"
                dataTestId="cbt-submit-dialog"
                className="max-w-lg"
                panelClassName="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        {paletteCounts.notAnswered + paletteCounts.notVisited > 0 ? (
                            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        )}
                    </div>
                    <div>
                        <h2 id="cbt-submit-dialog-title" className="text-lg font-black text-slate-900 dark:text-white">
                            Exam Summary (TCS iON)
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                            Review your section-wise question counts before final submission.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black">
                            <tr>
                                <th className="px-3 py-2">Section</th>
                                <th className="px-2 py-2 text-center">Qs</th>
                                <th className="px-2 py-2 text-center text-emerald-700 dark:text-emerald-400">Ans</th>
                                <th className="px-2 py-2 text-center text-rose-700 dark:text-rose-400">Unans</th>
                                <th className="px-2 py-2 text-center text-purple-700 dark:text-purple-400">Marked</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {sections.map((sec) => (
                                <tr key={sec.id}>
                                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                                        {sec.name}
                                    </td>
                                    <td className="px-2 py-2 text-center font-semibold">{sec.totalCount}</td>
                                    <td className="px-2 py-2 text-center font-black text-emerald-700 dark:text-emerald-400">
                                        {sec.answeredCount + sec.answeredAndMarkedCount}
                                    </td>
                                    <td className="px-2 py-2 text-center font-black text-rose-700 dark:text-rose-400">
                                        {sec.notAnsweredCount + sec.notVisitedCount}
                                    </td>
                                    <td className="px-2 py-2 text-center font-bold text-purple-700 dark:text-purple-400">
                                        {sec.markedCount + sec.answeredAndMarkedCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsSubmitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        No, Return to Exam
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onConfirmSubmit(false)}
                        data-testid="cbt-confirm-submit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm active:scale-95 touch-manipulation cursor-pointer disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Yes, Submit Exam'}
                    </button>
                </div>
            </NativeDialog>
        </div>
    );
};
