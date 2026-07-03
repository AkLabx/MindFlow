import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface TelemetryPanelProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ metrics }) => {
    if (!metrics) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Telemetry</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-sm text-slate-500 mb-1">Avg Runtime (Examples)</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.avg_runtime_examples.toFixed(0)} ms
                    </p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Avg Runtime (Synonyms)</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.avg_runtime_synonyms.toFixed(0)} ms
                    </p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Avg Tokens / Request</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.avg_tokens_per_request.toFixed(0)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 mb-1">Consecutive Failures</p>
                    <p className={`text-xl font-bold ${metrics.consecutive_failures > 5 ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                        {metrics.consecutive_failures}
                    </p>
                </div>
            </div>
        </div>
    );
};
