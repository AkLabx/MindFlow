import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { QuestionLightweight, QuestionFilterParams, FilterOptions } from '../types/questionBuilder.types';
import { searchQuestions } from '../api/questionBuilderApi';
import { QuestionFilterBar } from './QuestionFilterBar';
import { QuestionResultCard } from './QuestionResultCard';
import { Search, Loader2, CheckSquare, AlertCircle, RotateCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const PAGE_LIMIT = 25;

interface Props {
    filterOptions: FilterOptions;
    selectedIds: string[];
    onSelectObj: (question: QuestionLightweight, checked: boolean) => void;
    onPreview: (id: string) => void;
    onAddMultiple: (questions: QuestionLightweight[]) => void;
}

export const QuestionSearchPanel: React.FC<Props> = ({
    filterOptions, selectedIds, onSelectObj, onPreview, onAddMultiple
}) => {
    const [params, setParams] = useState<QuestionFilterParams>({ search: '' });
    const [questions, setQuestions] = useState<QuestionLightweight[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const requestSeqRef = useRef(0);

    // Left-panel specific multi-selection
    const [leftSelectedIds, setLeftSelectedIds] = useState<Set<string>>(new Set());

    // O(1) lookup set for selected question IDs
    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    // Intersection observer for infinite scroll
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px 0px',
    });

    const loadQuestions = useCallback(async (currentPage: number, currentParams: QuestionFilterParams, append: boolean = false) => {
        const seq = ++requestSeqRef.current;
        setLoading(true);
        setError(null);
        try {
            const res = await searchQuestions(currentParams, currentPage, PAGE_LIMIT);
            if (seq !== requestSeqRef.current) return;

            if (append) {
                setQuestions(prev => {
                    const existingIds = new Set(prev.map(q => q.id));
                    const newQs = res.data.filter(q => !existingIds.has(q.id));
                    return [...prev, ...newQs];
                });
            } else {
                setQuestions(res.data);
            }
            setTotal(res.total);
            setHasMore((currentPage + 1) * PAGE_LIMIT < res.total);
        } catch (err: any) {
            if (seq !== requestSeqRef.current) return;
            console.error('Failed to load questions', err);
            setError(err?.message || 'Failed to load questions. Please check your connection and try again.');
        } finally {
            if (seq === requestSeqRef.current) {
                setLoading(false);
            }
        }
    }, []);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

                if (!isInputFocused) {
                    e.preventDefault();
                    document.getElementById('question-search-input')?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Debounced search (no-op when unchanged to prevent initial double-fetch)
    useEffect(() => {
        const timer = setTimeout(() => {
            setParams(prev => ((prev.search ?? '') === searchTerm ? prev : { ...prev, search: searchTerm }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reload when params change
    useEffect(() => {
        setPage(0);
        loadQuestions(0, params, false);
    }, [params, loadQuestions]);

    // Load more when scrolling
    useEffect(() => {
        if (inView && hasMore && !loading && !error) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadQuestions(nextPage, params, true);
        }
    }, [inView, hasMore, loading, error, page, params, loadQuestions]);

    const handleToggleLeftSelect = useCallback((id: string, checked: boolean) => {
        setLeftSelectedIds(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAllVisible = useCallback(() => {
        setLeftSelectedIds(prev => {
            const newSet = new Set(prev);
            questions.forEach(q => {
                if (!selectedIdSet.has(q.id)) {
                    newSet.add(q.id);
                }
            });
            return newSet;
        });
    }, [questions, selectedIdSet]);

    const handleClearLeftSelection = useCallback(() => {
        setLeftSelectedIds(new Set());
    }, []);

    const handleAddSelected = useCallback(() => {
        const questionsToAdd = questions.filter(q => leftSelectedIds.has(q.id));
        if (questionsToAdd.length > 0) {
            onAddMultiple(questionsToAdd);
            setLeftSelectedIds(new Set());
        }
    }, [questions, leftSelectedIds, onAddMultiple]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                    <input
                        id="question-search-input"
                        type="text"
                        aria-label="Search questions by text, ID, subject, or topic"
                        placeholder="Search by text, ID (e.g. HIS1042)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex gap-1">
                        <kbd className="px-2 py-1 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400">Ctrl</kbd>
                        <kbd className="px-2 py-1 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400">F</kbd>
                    </div>
                </div>
            </div>

            <QuestionFilterBar
                options={filterOptions}
                params={params}
                onChange={setParams}
                isLoading={loading && page === 0}
            />

            <div className="flex-1 overflow-y-auto min-h-0 relative">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center px-4 sticky top-0 z-10 backdrop-blur-md bg-slate-50/90 dark:bg-slate-800/90">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSelectAllVisible}
                            className="min-h-[44px] px-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 rounded-lg"
                        >
                            <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
                            Select Visible
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Results ({total})
                        </span>
                    </div>
                    {loading && page === 0 && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-label="Loading questions" />
                    )}
                </div>

                {error && (
                    <div
                        role="alert"
                        className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 flex items-center justify-between gap-3 text-sm text-red-700 dark:text-red-300"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadQuestions(page, params, page > 0)}
                            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                        >
                            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                            Retry
                        </button>
                    </div>
                )}

                <div className="flex flex-col pb-16">
                    {questions.map((q) => (
                        <QuestionResultCard
                            key={q.id}
                            question={q}
                            isSelected={selectedIdSet.has(q.id)}
                            isLeftSelected={leftSelectedIds.has(q.id)}
                            onToggleSelect={(_id, checked) => {
                                // Direct add for the right panel check
                                onSelectObj(q, checked);
                            }}
                            onToggleLeftSelect={handleToggleLeftSelect}
                            onPreview={onPreview}
                        />
                    ))}

                    {/* Intersection Observer Target */}
                    <div ref={ref} className="h-10 flex items-center justify-center py-4">
                        {loading && page > 0 && <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />}
                    </div>

                    {!loading && !error && questions.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <p className="text-sm">No questions found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Bar for Left Panel Multi-Selection */}
            {leftSelectedIds.size > 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-indigo-600 text-white px-4 py-2 flex justify-between items-center shadow-lg animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{leftSelectedIds.size} selected</span>
                        <button
                            type="button"
                            onClick={handleClearLeftSelection}
                            className="min-h-[44px] px-3 text-xs text-indigo-100 hover:text-white transition-all active:scale-95 rounded-lg"
                        >
                            Clear
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddSelected}
                        className="min-h-[44px] bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        Add Selected
                    </button>
                </div>
            )}
        </div>
    );
};
