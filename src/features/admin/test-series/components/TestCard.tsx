import React from 'react';
import { Edit2, Trash2, CheckSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';

interface TestCardProps {
    test: any;
    onEdit: (test: any) => void;
    onDelete: (id: string) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onEdit, onDelete }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group flex flex-col"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                    <CheckSquare className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                    <StatusBadge status={test.is_published ? 'published' : 'draft'} />
                </div>
            </div>

            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 line-clamp-1">
                {test.test_series?.name || 'Unassigned Series'}
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{test.name}</h3>
            {test.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{test.description}</p>
            )}
            {!test.description && <div className="min-h-[40px] mb-4" />}

            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{test.duration_minutes} min</span>
                </div>
                <div>
                    <span className="text-slate-900 dark:text-white font-bold">{test.total_marks}</span> Marks
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-1">
                    <span className="text-slate-900 dark:text-white font-bold">{test.question_ids?.length || 0}</span> Questions
                </div>
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(test)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(test.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};
