import React from 'react';
import { motion } from 'framer-motion';

export interface QuickActionItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass: string; // e.g., 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
}

interface QuickActionsGridProps {
    actions: QuickActionItem[];
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
    return (
        <div className="grid grid-cols-2 gap-2 mt-4">
            {actions.map((action, i) => (
                <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${action.colorClass}`}>
                        {action.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {action.label}
                    </span>
                </motion.button>
            ))}
        </div>
    );
};
