import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface QuotaDefensePanelProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

export const QuotaDefensePanel: React.FC<QuotaDefensePanelProps> = ({ metrics }) => {
    if (!metrics) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Quota Defense</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-sm text-slate-500 mb-1">Gemini Requests (Today)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.gemini_requests_today.toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Edge Invocations (Today)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.edge_invocations_today.toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Model Distribution</p>
                    <div className="flex flex-col gap-1 mt-1">
                        {Object.entries(metrics.model_distribution).map(([model, count]) => (
                            <div key={model} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{model}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Est. Completion</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.estimated_completion_days} Days
                    </p>
                </div>
            </div>
        </div>
    );
};
