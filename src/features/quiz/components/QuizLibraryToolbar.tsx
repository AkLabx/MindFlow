import React from 'react';
import { LayoutGrid, List, Target } from 'lucide-react';

export interface QuizLibraryToolbarProps {
    count: number;
    label: string;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    sortMethod: string;
    setSortMethod: (method: any) => void;
    showScoreSort?: boolean;
    selectedExamId?: string;
    onSelectExamId?: (examId: string) => void;
    availableExams?: Array<{ id: string; shortCode: string; displayName: string }>;
    examCounts?: Record<string, number>;
}

export const QuizLibraryToolbar: React.FC<QuizLibraryToolbarProps> = ({
    count,
    label,
    viewMode,
    setViewMode,
    sortMethod,
    setSortMethod,
    showScoreSort = false,
    selectedExamId = 'all',
    onSelectExamId,
    availableExams = [],
    examCounts,
}) => {
    return (
        <div className="flex flex-col gap-2.5 p-2 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/50 dark:border-slate-700/50 backdrop-blur-sm z-20 shadow-sm mb-4">
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-base">{label}:</span>
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                        {count}
                    </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <select
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value as any)}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                    >
                        <option value="date-desc">Date (Newest)</option>
                        <option value="date-asc">Date (Oldest)</option>
                        {showScoreSort && (
                            <>
                                <option value="score-desc">Score (High-Low)</option>
                                <option value="score-asc">Score (Low-High)</option>
                            </>
                        )}
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </select>
                    <div className="hidden sm:flex items-center p-1 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Target Exam Filter Pill Bar */}
            {availableExams.length > 0 && onSelectExamId && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-indigo-100/60 dark:border-slate-700/60 w-full">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-500" />
                        Exam:
                    </span>
                    <button
                        type="button"
                        onClick={() => onSelectExamId('all')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            selectedExamId === 'all'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                        }`}
                    >
                        <span>All</span>
                        {examCounts && examCounts.all !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedExamId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                {examCounts.all}
                            </span>
                        )}
                    </button>
                    {availableExams.map((exam) => {
                        const isSelected = selectedExamId === exam.id;
                        const examCount = examCounts?.[exam.id] ?? 0;
                        return (
                            <button
                                key={exam.id}
                                type="button"
                                onClick={() => onSelectExamId(exam.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                    isSelected
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                                }`}
                            >
                                <span>{exam.shortCode || exam.displayName}</span>
                                {examCount > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}>
                                        {examCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
