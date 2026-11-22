import React from 'react';
import { Edit2, Trash2, CheckSquare, Clock, Globe, EyeOff, Copy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';

interface TestCardProps {
    test: any;
    onEdit: (test: any) => void;
    onDelete: (id: string) => void;
    onTogglePublish?: (test: any) => void;
    onClone?: (test: any) => void;
    busyAction?: 'publish' | 'clone' | null;
    isDeleteDisabled?: boolean;
}

export const TestCard: React.FC<TestCardProps> = ({
    test,
    onEdit,
    onDelete,
    onTogglePublish,
    onClone,
    busyAction = null,
    isDeleteDisabled = false,
}) => {
    const isBusy = Boolean(busyAction);
    const isPublished = Boolean(test.is_published);
    const parentSeries = test.mock_series ?? test.test_series;
    const parentCategory = parentSeries?.mock_categories ?? parentSeries?.exam_categories;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group flex flex-col"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                    <CheckSquare className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex gap-2">
                    <StatusBadge status={isPublished ? 'published' : 'draft'} />
                </div>
            </div>

            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 line-clamp-1">
                {parentCategory?.name
                    ? `${parentCategory.name} · ${parentSeries?.name}`
                    : (parentSeries?.name || 'Unassigned Series')}
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{test.name}</h3>
            {test.description ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{test.description}</p>
            ) : (
                <div className="min-h-[40px] mb-4" />
            )}

            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>{test.duration_minutes} min</span>
                </div>
                <div>
                    <span className="text-slate-900 dark:text-white font-bold">{test.total_marks}</span> Marks
                </div>
                <div>
                    <span className="text-slate-900 dark:text-white font-bold">Pass: {test.passing_marks ?? 0}</span>
                </div>
                <div>
                    <span>{Number(test.negative_marks) > 0 ? `-${test.negative_marks} neg` : 'No Negative'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-1">
                    <span className="text-slate-900 dark:text-white font-bold">{test.question_ids?.length || 0}</span> Questions
                </div>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-auto">
                {onTogglePublish ? (
                    <button
                        type="button"
                        aria-label={`${isPublished ? 'Unpublish' : 'Publish'} ${test.name}`}
                        disabled={isBusy}
                        onClick={() => onTogglePublish(test)}
                        className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 ${
                            isPublished
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                        }`}
                    >
                        {busyAction === 'publish' ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : isPublished ? (
                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                            <Globe className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                ) : (
                    <div />
                )}

                <div className="flex items-center gap-1.5">
                    {onClone && (
                        <button
                            type="button"
                            aria-label={`Clone ${test.name}`}
                            title="Clone as Draft"
                            disabled={isBusy}
                            onClick={() => onClone(test)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {busyAction === 'clone' ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Copy className="w-4 h-4" aria-hidden="true" />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        aria-label={`Edit ${test.name}`}
                        onClick={() => onEdit(test)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all active:scale-95"
                    >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        aria-label={`Delete ${test.name}`}
                        disabled={isBusy || isDeleteDisabled}
                        onClick={() => onDelete(test.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>
            </footer>
        </motion.article>
    );
};
