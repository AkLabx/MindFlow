import React, { useEffect, useState } from 'react';
import { QuestionLightweight, QuestionFilterParams, FilterOptions } from '../types/questionBuilder.types';
import { searchQuestions } from '../api/questionBuilderApi';
import { QuestionFilterBar } from './QuestionFilterBar';
import { QuestionResultCard } from './QuestionResultCard';
import { Search, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

interface Props {
    filterOptions: FilterOptions;
    selectedIds: string[];
    onToggleSelect: (id: string, checked: boolean) => void;
    onSelectObj: (question: QuestionLightweight, checked: boolean) => void;
    onPreview: (id: string) => void;
}

export const QuestionSearchPanel: React.FC<Props> = ({
    filterOptions, selectedIds, onToggleSelect, onSelectObj, onPreview
}) => {
    const [params, setParams] = useState<QuestionFilterParams>({ search: '' });
    const [questions, setQuestions] = useState<QuestionLightweight[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by text, ID (e.g. HIS1042)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <QuestionFilterBar
                options={filterOptions}
                params={params}
                onChange={setParams}
                isLoading={loading && page === 0}
            />

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center px-4 sticky top-0 z-10">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Results ({total})
                    </span>
                    {loading && page === 0 && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    )}
                </div>

                <div className="flex flex-col">
                    {questions.map((q) => (
                        <QuestionResultCard
                            key={q.id}
                            question={q}
                            isSelected={selectedIds.includes(q.id)}
                            onToggleSelect={(id, checked) => onSelectObj(q, checked)}
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
        </div>
    );
};
