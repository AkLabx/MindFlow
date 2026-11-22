import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}) => {
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
            {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {actionLabel && onAction && (
                        <button
                            type="button"
                            onClick={onAction}
                            className="min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 touch-manipulation cursor-pointer"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            type="button"
                            onClick={onSecondaryAction}
                            className="min-h-[44px] min-w-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold py-3 px-7 rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            ) : null}
        </motion.div>
    );
};
