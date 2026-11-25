import React from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eraser,
    Flag,
    Languages,
    LayoutGrid,
    PauseCircle,
    Send,
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

const getPaletteButtonClasses = (
    status: PreparedMockPaletteStatus,
    isCurrent: boolean
): string => {
    const ring = isCurrent
        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
        : '';

    switch (status) {
        case 'answered':
            return `bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 ${ring}`;
        case 'answered_and_marked':
            return `bg-indigo-600 text-white border-purple-400 ring-1 ring-purple-400 ${ring}`;
        case 'marked_for_review':
            return `bg-purple-600 text-white border-purple-600 hover:bg-purple-500 ${ring}`;
        case 'not_answered':
            return `bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:border-rose-400 ${ring}`;
        default:
            return `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 ${ring}`;
    }
};

export const BpscDefaultExamShell: React.FC<ExamRunnerSkinProps> = ({
    test,
    questions,
    attemptState,
    currentIndex,
    activeQuestion,
    selectedAnswer,
    isCurrentMarked,
    activePaletteStatus,
    paletteCounts,
    filteredPaletteItems,
    paletteFilter,
    setPaletteFilter,
    languageMode,
    onCycleLanguage,
    hasHindiContent,
    zoomScale,
    setZoomScale,
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
    const isUrgentTime = attemptState.remainingSeconds <= 300;
    const totalAnsweredCount = paletteCounts.answered + paletteCounts.answeredAndMarked;
    const totalMarks = Number(test.total_marks ?? questions.length);
    const negativeMarks = Math.abs(Number(test.negative_marks ?? 0));
    const marksPerQuestion =
        questions.length > 0 && totalMarks > 0
            ? Number((totalMarks / questions.length).toFixed(2))
            : 1;
    const isLastQuestion = currentIndex === questions.length - 1;

    const renderPaletteBody = (headingId?: string) => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2
                        id={headingId}
                        className="text-base font-black text-slate-900 dark:text-white tracking-tight"
                    >
                        Question Palette
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {totalAnsweredCount} of {questions.length} answered
                    </p>
                </div>
                {headingId && (
                    <button
                        type="button"
                        onClick={() => setIsPaletteDrawerOpen(false)}
                        aria-label="Close Question Palette"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* 5-State Legend */}
            <div className="grid grid-cols-2 gap-2 py-3 text-[11px] font-bold">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" />
                    <span>Answered ({paletteCounts.answered})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-900 border border-rose-400 shrink-0" />
                    <span>Not Answered ({paletteCounts.notAnswered})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-purple-600 shrink-0" />
                    <span>Marked ({paletteCounts.markedForReview})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-sm bg-indigo-600 ring-1 ring-purple-400 shrink-0" />
                    <span>Ans &amp; Marked ({paletteCounts.answeredAndMarked})</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <span>Not Visited ({paletteCounts.notVisited})</span>
                </div>
            </div>

            {/* Palette Filter Chips */}
            <div className="flex items-center gap-2 pb-3" role="group" aria-label="Filter question palette">
                {(
                    [
                        { id: 'all', label: 'All' },
                        { id: 'unanswered', label: 'Unanswered' },
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
                            className={`flex-1 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                active
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                            }`}
                        >
                            {chip.label}
                        </button>
                    );
                })}
            </div>

            {/* Scrollable Question Grid */}
            <div className="flex-1 overflow-y-auto pr-1 py-1">
                {filteredPaletteItems.length === 0 ? (
                    <div className="text-center py-8 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            No questions match this filter.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {filteredPaletteItems.map(({ question, index, status }) => {
                            const isCurrent = index === currentIndex;
                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => onJumpToIndex(index)}
                                    aria-label={`Question ${index + 1}, ${getPaletteStatusBadgeLabel(status)}${
                                        isCurrent ? ', current question' : ''
                                    }`}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className={`min-h-[44px] min-w-[44px] scroll-mb-32 rounded-xl border text-xs font-black inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer ${getPaletteButtonClasses(
                                        status,
                                        isCurrent
                                    )}`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sidebar Submit Action */}
            <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        setIsPaletteDrawerOpen(false);
                        setIsSubmitDialogOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Submit Test</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-clip">
            {/* Sticky Immersive CBT Header */}
            <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)]">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsExitDialogOpen(true);
                            }}
                            aria-label="Pause and exit mock test"
                            data-testid="cbt-pause-exit-btn"
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Pause</span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate leading-tight">
                                {test.name}
                            </h1>
                            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                Q {currentIndex + 1} / {questions.length} • {totalAnsweredCount} Answered
                                {studentId ? ` • ${studentId}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        <div
                            role="timer"
                            aria-label="Time remaining"
                            data-testid="cbt-countdown-timer"
                            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 rounded-xl border font-mono font-black text-xs sm:text-sm inline-flex items-center gap-1.5 ${
                                isUrgentTime
                                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 animate-pulse'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
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
                            className="lg:hidden min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only">Palette</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSubmitDialogOpen(true)}
                            disabled={isSubmitting}
                            data-testid="open-submit-dialog-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                        >
                            <Send className="w-4 h-4 shrink-0 hidden sm:inline" aria-hidden="true" />
                            <span>Submit</span>
                        </button>
                    </div>
                </div>
            </header>

            {isOfflineMode && (
                <div
                    role="status"
                    className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/70 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2"
                >
                    <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Offline mode active — answers &amp; timer continue saving locally.</span>
                </div>
            )}

            {/* Split Workspace: Question Stage + Desktop Sidebar */}
            <div className="flex-1 flex w-full max-w-7xl mx-auto">
                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-32 scroll-mb-32">
                    {/* Question Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            {activeQuestion.subject && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                    {activeQuestion.subject}
                                </span>
                            )}
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                                +{marksPerQuestion} / {negativeMarks > 0 ? `-${negativeMarks}` : '0'}
                            </span>
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    activePaletteStatus === 'answered'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : activePaletteStatus === 'answered_and_marked'
                                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                          : activePaletteStatus === 'marked_for_review'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {getPaletteStatusBadgeLabel(activePaletteStatus)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {hasHindiContent && (
                                <button
                                    type="button"
                                    onClick={onCycleLanguage}
                                    aria-label={`Switch display language (current: ${languageMode})`}
                                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                                >
                                    <Languages className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>
                                        {languageMode === 'bilingual'
                                            ? 'EN + हिं'
                                            : languageMode === 'en'
                                              ? 'English'
                                              : 'हिन्दी'}
                                    </span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.max(0.9, Number((z - 0.1).toFixed(2))))}
                                aria-label="Decrease question text size"
                                className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomOut className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                                aria-label="Increase question text size"
                                className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomIn className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Question Card */}
                    <article
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6"
                        style={{ fontSize: `${zoomScale}rem` }}
                    >
                        {(activeQuestion.examName || activeQuestion.examYear) && (
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                Source: {activeQuestion.examName || 'Mock Bank'}
                                {activeQuestion.examYear ? ` • ${activeQuestion.examYear}` : ''}
                                {activeQuestion.examDateShift ? ` • ${activeQuestion.examDateShift}` : ''}
                            </p>
                        )}

                        <div className="space-y-4">
                            {(languageMode !== 'hi' || !activeQuestion.question_hi) && (
                                <div className="text-slate-900 dark:text-white leading-relaxed font-semibold">
                                    <MarkdownRenderer
                                        content={formatQuestionText(activeQuestion.question)}
                                    />
                                </div>
                            )}

                            {languageMode !== 'en' && activeQuestion.question_hi && (
                                <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-hindi border-l-4 border-indigo-200 dark:border-indigo-800 pl-4">
                                    <MarkdownRenderer
                                        content={formatQuestionText(activeQuestion.question_hi)}
                                    />
                                </div>
                            )}

                            {activeQuestion.question_image_url && (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">
                                    <img
                                        src={activeQuestion.question_image_url}
                                        alt={`Diagram for Question ${currentIndex + 1}`}
                                        loading="lazy"
                                        className="max-h-72 w-auto mx-auto rounded-xl object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Options Radio Group */}
                        <div
                            role="radiogroup"
                            aria-label={`Options for Question ${currentIndex + 1}`}
                            className="space-y-3"
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
                                        className={`w-full min-h-[56px] scroll-mb-32 text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 dark:text-indigo-100'
                                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 text-slate-800 dark:text-slate-100'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`mt-0.5 w-7 h-7 rounded-lg text-xs font-black inline-flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {letter}
                                        </span>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            {showEnglishOption && (
                                                <div className="leading-snug font-medium">
                                                    <MarkdownRenderer
                                                        content={formatOptionText(option)}
                                                        className="!text-current"
                                                    />
                                                </div>
                                            )}
                                            {showHindiOption && optionHi && (
                                                <div className="font-hindi text-[0.95em] opacity-85 leading-snug">
                                                    <MarkdownRenderer
                                                        content={formatOptionText(optionHi)}
                                                        className="!text-current"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </article>
                </main>

                {/* Persistent Desktop Question Palette Sidebar */}
                <aside
                    aria-label="Question Palette"
                    className="hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 pb-28 sticky top-16 h-[calc(100dvh-4rem)]"
                >
                    {renderPaletteBody()}
                </aside>
            </div>

            {/* Viewport-Fixed Bottom CBT Action Bar */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 px-3 sm:px-6 shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.12)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            aria-label="Previous question"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Prev</span>
                        </button>

                        <button
                            type="button"
                            aria-pressed={isCurrentMarked}
                            onClick={onToggleMarkForReview}
                            aria-label={isCurrentMarked ? 'Unmark review' : 'Mark for Review'}
                            data-testid="cbt-mark-review-btn"
                            className={`min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl border font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                isCurrentMarked
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400'
                            }`}
                        >
                            <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden xs:inline sm:inline">
                                {isCurrentMarked ? 'Marked' : 'Mark'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={onClearResponse}
                            disabled={!selectedAnswer}
                            aria-label="Clear selected response"
                            data-testid="cbt-clear-response-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:border-rose-400 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Eraser className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Clear</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onSaveAndNext}
                        data-testid="cbt-save-next-btn"
                        className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm shrink-0"
                    >
                        <span>{isLastQuestion ? 'Review & Submit' : 'Save & Next'}</span>
                        {!isLastQuestion && <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </button>
                </div>
            </footer>

            {/* Mobile Slide-Over Question Palette Drawer (Top-Layer NativeDialog) */}
            <NativeDialog
                isOpen={isPaletteDrawerOpen}
                onClose={() => setIsPaletteDrawerOpen(false)}
                variant="drawer-right"
                ariaLabelledBy="mobile-palette-drawer-title"
                dataTestId="cbt-palette-drawer"
                panelClassName="h-full w-full bg-white dark:bg-slate-900 p-5 flex flex-col"
            >
                {renderPaletteBody('mobile-palette-drawer-title')}
            </NativeDialog>

            {/* Pause & Exit Confirmation Dialog */}
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
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <PauseCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                        <h2
                            id="cbt-exit-dialog-title"
                            className="text-lg font-black text-slate-900 dark:text-white"
                        >
                            Pause &amp; Exit Mock Test?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Your {totalAnsweredCount} answered responses and{' '}
                            {formatCountdown(attemptState.remainingSeconds)} remaining time are
                            saved safely so you can resume anytime.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsExitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Continue Test
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmPauseAndExit}
                        data-testid="cbt-confirm-exit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                    >
                        Save &amp; Exit
                    </button>
                </div>
            </NativeDialog>

            {/* Submit Test Confirmation Dialog */}
            <NativeDialog
                isOpen={isSubmitDialogOpen}
                onClose={() => !isSubmitting && setIsSubmitDialogOpen(false)}
                role="alertdialog"
                dismissible={!isSubmitting}
                ariaLabelledBy="cbt-submit-dialog-title"
                dataTestId="cbt-submit-dialog"
                className="max-w-md"
                panelClassName="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            paletteCounts.notAnswered + paletteCounts.notVisited > 0
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                    >
                        {paletteCounts.notAnswered + paletteCounts.notVisited > 0 ? (
                            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                        )}
                    </div>
                    <div>
                        <h2
                            id="cbt-submit-dialog-title"
                            className="text-lg font-black text-slate-900 dark:text-white"
                        >
                            Submit Mock Test?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Once submitted, this attempt will be scored and locked in your attempt
                            history.
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 p-3">
                        <dd className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {totalAnsweredCount}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-emerald-700/80 dark:text-emerald-400">
                            Answered
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 p-3">
                        <dd className="text-lg font-black text-rose-700 dark:text-rose-300">
                            {paletteCounts.notAnswered}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-rose-700/80 dark:text-rose-400">
                            Not Answered
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/50 p-3">
                        <dd className="text-lg font-black text-purple-700 dark:text-purple-300">
                            {paletteCounts.markedForReview + paletteCounts.answeredAndMarked}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-purple-700/80 dark:text-purple-400">
                            Marked Review
                        </dt>
                    </div>
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                        <dd className="text-lg font-black text-slate-800 dark:text-slate-100">
                            {paletteCounts.notVisited}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            Not Visited
                        </dt>
                    </div>
                </dl>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsSubmitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                        Return to Test
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onConfirmSubmit(false)}
                        data-testid="cbt-confirm-submit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                </div>
            </NativeDialog>
        </div>
    );
};
