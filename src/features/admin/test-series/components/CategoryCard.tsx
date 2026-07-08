import React from 'react';
import { Edit2, Trash2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';

interface CategoryCardProps {
    category: any;
    onEdit: (category: any) => void;
    onDelete: (id: string) => void;
    seriesCount: number;
    testsCount: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete, seriesCount, testsCount }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group flex flex-col"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                    <StatusBadge status={category.is_active ? 'active' : 'hidden'} />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{category.name}</h3>
            {category.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{category.description}</p>
            )}
            {!category.description && <div className="min-h-[40px] mb-4" />}

            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div>
                    <span className="text-slate-900 dark:text-white font-bold">{seriesCount}</span> Series
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                    <span className="text-slate-900 dark:text-white font-bold">{testsCount}</span> Tests
                </div>
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(category)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(category.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};
