import React, { useEffect, useState, useCallback } from 'react';
import { QuestionLightweight, QuestionFilterParams, FilterOptions } from '../types/questionBuilder.types';
import { searchQuestions } from '../api/questionBuilderApi';
import { QuestionFilterBar } from './QuestionFilterBar';
import { QuestionResultCard } from './QuestionResultCard';
import { Search, Loader2, CheckSquare } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

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

    // Left-panel specific multi-selection
    const [leftSelectedIds, setLeftSelectedIds] = useState<Set<string>>(new Set());

    // Intersection observer for infinite scroll
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px 0px',
    });

    const loadQuestions = async (currentPage: number, currentParams: QuestionFilterParams, append: boolean = false) => {
        setLoading(true);
        try {
            const res = await searchQuestions(currentParams, currentPage);
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
            setHasMore(res.data.length === 25);
        } catch (error) {
            console.error('Failed to load questions', error);
        } finally {
            setLoading(false);
        }
    };

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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setParams(prev => ({ ...prev, search: searchTerm }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reload when params change
    useEffect(() => {
        setPage(0);
        loadQuestions(0, params, false);
    }, [params]);

    // Load more when scrolling
    useEffect(() => {
        if (inView && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadQuestions(nextPage, params, true);
        }
    }, [inView, hasMore, loading, page, params]);

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
                if (!selectedIds.includes(q.id)) {
                    newSet.add(q.id);
                }
            });
            return newSet;
        });
    }, [questions, selectedIds]);

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        id="question-search-input"
                        type="text"
                        placeholder="Search by text, ID (e.g. HIS1042)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all"
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
                            onClick={handleSelectAllVisible}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Select Visible
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Results ({total})
                        </span>
                    </div>
                    {loading && page === 0 && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    )}
                </div>

                <div className="flex flex-col pb-16">
                    {questions.map((q) => (
                        <QuestionResultCard
                            key={q.id}
                            question={q}
                            isSelected={selectedIds.includes(q.id)}
                            isLeftSelected={leftSelectedIds.has(q.id)}
                            onToggleSelect={(id, checked) => {
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

                    {!loading && questions.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <p className="text-sm">No questions found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Bar for Left Panel Multi-Selection */}
            {leftSelectedIds.size > 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-indigo-600 text-white p-3 flex justify-between items-center shadow-lg animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{leftSelectedIds.size} selected</span>
                        <button
                            onClick={handleClearLeftSelection}
                            className="text-xs text-indigo-200 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <button
                        onClick={handleAddSelected}
                        className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors"
                    >
                        Add Selected
                    </button>
                </div>
            )}
        </div>
    );
};
