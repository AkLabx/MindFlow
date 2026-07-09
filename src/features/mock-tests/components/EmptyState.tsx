import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, actionLabel, onAction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm"
        >
            {icon && (
                <div className="w-20 h-20 mb-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    {icon}
                </div>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
};
