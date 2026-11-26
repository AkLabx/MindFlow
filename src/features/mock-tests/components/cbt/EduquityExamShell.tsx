import React, { useMemo } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eraser,
    Flag,
    LayoutGrid,
    PauseCircle,
    RotateCcw,
    Send,
    ShieldCheck,
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

const getEduquityTileClasses = (
    status: PreparedMockPaletteStatus,
    isCurrent: boolean
): string => {
    const activeRing = isCurrent
        ? 'ring-2 ring-teal-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-sm'
        : '';

    switch (status) {
        case 'answered':
            return `bg-emerald-600 text-white border-emerald-700 ${activeRing}`;
        case 'answered_and_marked':
            return `relative bg-blue-600 text-white border-emerald-400 ring-1 ring-emerald-400 ${activeRing}`;
        case 'marked_for_review':
            return `bg-blue-600 text-white border-blue-700 ${activeRing}`;
        case 'not_answered':
            return `bg-rose-600 text-white border-rose-700 ${activeRing}`;
        default:
            return `bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 ${activeRing}`;
    }
};

export const EduquityExamShell: React.FC<ExamRunnerSkinProps> = ({
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
    sections,
    languageMode,
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
    const isUrgentTime = attemptState.remainingSeconds <= 300;
    const totalAnsweredCount = paletteCounts.answered + paletteCounts.answeredAndMarked;
    const totalMarks = Number(test.total_marks ?? questions.length);
    const negativeMarks = Math.abs(Number(test.negative_marks ?? 0));
    const marksPerQuestion =
        questions.length > 0 && totalMarks > 0
            ? Number((totalMarks / questions.length).toFixed(2))
            : 1;
    const isLastQuestion = currentIndex === questions.length - 1;
    const zoomPct = Math.round(zoomScale * 100);

    const activeSection = useMemo(
        () => sections.find((sec) => sec.indices.includes(currentIndex)) ?? sections[0] ?? null,
        [sections, currentIndex]
    );

    const renderLeftPalette = (headingId?: string) => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="min-w-0">
                    <h2
                        id={headingId}
                        className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase"
                    >
                        Question Navigator
                    </h2>
                    <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300 truncate">
                        {totalAnsweredCount} / {questions.length} Attempted
                    </p>
                </div>
                {headingId && (
                    <button
                        type="button"
                        onClick={() => setIsPaletteDrawerOpen(false)}
                        aria-label="Close Question Navigator"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 py-3 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700 shrink-0" />
                    <span>Answered ({paletteCounts.answered})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded bg-blue-600 border border-blue-700 shrink-0" />
                    <span>Marked for Review ({paletteCounts.markedForReview})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="relative w-3 h-3 rounded bg-blue-600 border border-emerald-400 ring-1 ring-emerald-400 shrink-0">
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                    <span>Answered &amp; Marked ({paletteCounts.answeredAndMarked})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded bg-rose-600 border border-rose-700 shrink-0" />
                    <span>Not Answered ({paletteCounts.notAnswered})</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0" />
                    <span>Not Visited ({paletteCounts.notVisited})</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 py-2.5" role="group" aria-label="Filter question palette">
                {(
                    [
                        { id: 'all', label: 'All' },
                        { id: 'unanswered', label: 'Pending' },
                        { id: 'marked', label: 'Flagged' },
                    ] as const
                ).map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        aria-pressed={paletteFilter === chip.id}
                        onClick={() => setPaletteFilter(chip.id)}
                        className={`flex-1 min-h-[44px] px-2 rounded-lg text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                            paletteFilter === chip.id
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 py-1">
                {filteredPaletteItems.length === 0 ? (
                    <div className="text-center py-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500">
                        No questions match this filter.
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
                                    className={`min-h-[44px] min-w-[44px] scroll-mb-32 rounded-lg border text-xs font-black inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer ${getEduquityTileClasses(
                                        status,
                                        isCurrent
                                    )}`}
                                >
                                    {index + 1}
                                    {status === 'answered_and_marked' && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white dark:border-slate-900"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div
            data-testid="cbt-skin-eduquity"
            className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-clip"
        >
            {/* Modern Eduquity Header */}
            <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-teal-200/80 dark:border-teal-900/60 pt-[env(safe-area-inset-top,0px)]">
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
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Pause</span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                    {test.name}
                                </h1>
                                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 shrink-0">
                                    Eduquity Pattern
                                </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate inline-flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
                                <span>
                                    Verified Session • {studentName}
                                    {studentId ? ` (${studentId})` : ''}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div
                            role="timer"
                            aria-label="Time remaining"
                            data-testid="cbt-countdown-timer"
                            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 rounded-xl border font-mono font-black text-xs sm:text-sm inline-flex items-center gap-1.5 ${
                                isUrgentTime
                                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 animate-pulse'
                                    : 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
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
                            className="lg:hidden min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSubmitDialogOpen(true)}
                            disabled={isSubmitting}
                            data-testid="open-submit-dialog-btn"
                            className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-60"
                        >
                            <Send className="w-4 h-4 shrink-0 hidden sm:inline" aria-hidden="true" />
                            <span>Finish</span>
                        </button>
                    </div>
                </div>
            </header>

            {isOfflineMode && (
                <div
                    role="status"
                    className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2"
                >
                    <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Offline mode active — answers saving locally.</span>
                </div>
            )}

            {/* Split Workspace: LEFT-DOCKED Palette + RIGHT Question Canvas */}
            <div className="flex-1 flex w-full max-w-[1440px] mx-auto">
                {/* Left Docked Palette on Desktop */}
                <aside
                    aria-label="Question Palette"
                    className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 pb-28 sticky top-16 h-[calc(100dvh-4rem)]"
                >
                    {renderLeftPalette()}
                </aside>

                <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 pt-4 pb-32 scroll-mb-32 space-y-4">
                    {/* Prominent Eduquity Section + Accessibility Zoom Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 sm:px-4">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
                            {sections.map((sec) => {
                                const active = activeSection?.id === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => onJumpToIndex(sec.startIndex)}
                                        className={`min-h-[44px] px-3 rounded-xl text-xs font-black whitespace-nowrap inline-flex items-center gap-1.5 border transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0 ${
                                            active
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <span>{sec.name}</span>
                                        <span className="text-[10px] opacity-85">
                                            ({sec.answeredCount + sec.answeredAndMarkedCount}/{sec.totalCount})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className="flex items-center gap-1.5 shrink-0"
                            role="group"
                            aria-label="Accessibility display controls"
                        >
                            {hasHindiContent && (
                                <select
                                    aria-label="Display language"
                                    value={languageMode}
                                    onChange={(e) =>
                                        setLanguageMode(e.target.value as 'bilingual' | 'en' | 'hi')
                                    }
                                    className="min-h-[44px] px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                                >
                                    <option value="bilingual">EN + HI</option>
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                </select>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                                aria-label="Zoom out question text"
                                data-testid="eduquity-zoom-out-btn"
                                className="min-h-[44px] min-w-[44px] px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs inline-flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">A-</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale(1)}
                                aria-label="Reset text zoom to 100%"
                                data-testid="eduquity-zoom-reset-btn"
                                className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs inline-flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                                <span>{zoomPct}%</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                                aria-label="Zoom in question text"
                                data-testid="eduquity-zoom-in-btn"
                                className="min-h-[44px] min-w-[44px] px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs inline-flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                            >
                                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">A+</span>
                            </button>
                        </div>
                    </div>

                    {/* Question Stage Card */}
                    <article
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5"
                        style={{ fontSize: `${zoomScale}rem` }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-black">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    +{marksPerQuestion} / {negativeMarks > 0 ? `-${negativeMarks}` : '0'}
                                </span>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {getPaletteStatusBadgeLabel(activePaletteStatus)}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {(languageMode !== 'hi' || !activeQuestion.question_hi) && (
                                <div className="text-slate-900 dark:text-white leading-relaxed font-semibold">
                                    <MarkdownRenderer content={formatQuestionText(activeQuestion.question)} />
                                </div>
                            )}

                            {languageMode !== 'en' && activeQuestion.question_hi && (
                                <div className="text-slate-800 dark:text-slate-100 leading-relaxed font-hindi border-l-4 border-teal-500 pl-4">
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
                                        className={`w-full min-h-[54px] scroll-mb-32 text-left p-3.5 sm:p-4 rounded-xl border-2 flex items-start gap-3 transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            isSelected
                                                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-950 dark:text-teal-100'
                                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-800 dark:text-slate-100'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`mt-0.5 w-7 h-7 rounded-lg text-xs font-black inline-flex items-center justify-center shrink-0 ${
                                                isSelected
                                                    ? 'bg-teal-600 text-white'
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
            </div>

            {/* Viewport-Fixed Eduquity Bottom Action Bar */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 px-3 sm:px-6 shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.12)]">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            aria-label="Previous question"
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Prev</span>
                        </button>

                        <button
                            type="button"
                            aria-pressed={isCurrentMarked}
                            onClick={onToggleMarkForReview}
                            data-testid="cbt-mark-review-btn"
                            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer ${
                                isCurrentMarked
                                    ? 'bg-amber-500 border-amber-600 text-slate-950'
                                    : 'bg-blue-600 hover:bg-blue-500 border-blue-700 text-white'
                            }`}
                        >
                            <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isCurrentMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClearResponse}
                            disabled={!selectedAnswer}
                            data-testid="cbt-clear-response-btn"
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40"
                        >
                            <Eraser className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Clear</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onSaveAndNext}
                        data-testid="cbt-save-next-btn"
                        className="min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer shadow-sm shrink-0"
                    >
                        <span>{isLastQuestion ? 'Review & Finish' : 'Save & Next'}</span>
                        {!isLastQuestion && <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </button>
                </div>
            </footer>

            {/* Left Mobile Drawer matching Left-Docked Palette */}
            <NativeDialog
                isOpen={isPaletteDrawerOpen}
                onClose={() => setIsPaletteDrawerOpen(false)}
                variant="drawer-left"
                ariaLabelledBy="eduquity-mobile-palette-title"
                dataTestId="cbt-palette-drawer"
                panelClassName="h-full w-full bg-white dark:bg-slate-900 p-4 flex flex-col"
            >
                {renderLeftPalette('eduquity-mobile-palette-title')}
            </NativeDialog>

            {/* Exit Dialog */}
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
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                        <PauseCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="cbt-exit-dialog-title" className="text-lg font-black text-slate-900 dark:text-white">
                            Pause &amp; Exit Assessment?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {totalAnsweredCount} answered responses and {formatCountdown(attemptState.remainingSeconds)} remaining time are saved.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsExitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Continue
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmPauseAndExit}
                        data-testid="cbt-confirm-exit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 text-white font-black text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Save &amp; Exit
                    </button>
                </div>
            </NativeDialog>

            {/* Submit Dialog */}
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
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                        {paletteCounts.notAnswered + paletteCounts.notVisited > 0 ? (
                            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                        )}
                    </div>
                    <div>
                        <h2 id="cbt-submit-dialog-title" className="text-lg font-black text-slate-900 dark:text-white">
                            Submit Eduquity Assessment?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Confirm submission to compute your official scorecard.
                        </p>
                    </div>
                </div>
                <dl className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-3">
                        <dd className="text-lg font-black text-teal-700 dark:text-teal-300">{totalAnsweredCount}</dd>
                        <dt className="text-[11px] font-bold uppercase text-teal-700/80">Answered</dt>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3">
                        <dd className="text-lg font-black text-amber-700 dark:text-amber-300">
                            {paletteCounts.markedForReview + paletteCounts.answeredAndMarked}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase text-amber-700/80">Flagged</dt>
                    </div>
                </dl>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsSubmitDialogOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm active:scale-95 touch-manipulation cursor-pointer"
                    >
                        Back to Exam
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onConfirmSubmit(false)}
                        data-testid="cbt-confirm-submit-btn"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm active:scale-95 touch-manipulation cursor-pointer disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                </div>
            </NativeDialog>
        </div>
    );
};
