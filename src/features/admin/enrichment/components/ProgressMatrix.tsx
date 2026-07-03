import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface ProgressMatrixProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

const ProgressBar = ({ current, total, label }: { current: number, total: number, label: string }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-slate-500">
                    {current.toLocaleString()} / {total.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export const ProgressMatrix: React.FC<ProgressMatrixProps> = ({ metrics }) => {
    if (!metrics) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Progress Matrix (Synonyms)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <ProgressBar current={metrics.examples_complete} total={metrics.examples_total} label="Examples" />
                    <ProgressBar current={metrics.synonyms_complete} total={metrics.synonyms_total} label="Synonyms" />
                </div>
                <div>
                    <ProgressBar current={metrics.antonyms_complete} total={metrics.antonyms_total} label="Antonyms" />
                    <ProgressBar current={metrics.confusables_complete} total={metrics.confusables_total} label="Confusables" />
                </div>
            </div>
        </div>
    );
};
