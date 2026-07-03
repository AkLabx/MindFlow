import React from 'react';
import { motion } from 'framer-motion';

interface DomainStatsRowProps {
    mastered: number;
    reviewQueue: number;
    remaining: number;
}

export const DomainStatsRow: React.FC<DomainStatsRowProps> = ({ mastered, reviewQueue, remaining }) => {
    const stats = [
        { label: 'Mastered', value: mastered, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { label: 'Review Queue', value: reviewQueue, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        { label: 'Remaining', value: remaining, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' }
    ];

    return (
        <div className="flex w-full gap-2 mt-3">
            {stats.map((stat, i) => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label}
                    className={`flex-1 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center ${stat.bg}`}
                >
                    <span className={`text-lg sm:text-xl font-black leading-none mb-1 ${stat.color}`}>
                        {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {stat.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};
