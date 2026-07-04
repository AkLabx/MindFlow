import React from 'react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const TokenEconomicsPanel = ({ metrics }: { metrics: EnrichmentDashboardMetrics }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Quota Defense</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Gemini Requests Today</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {metrics.gemini_requests_today.toLocaleString()} / 1,500 (Free Tier)
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${metrics.gemini_requests_today > 1200 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (metrics.gemini_requests_today / 1500) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Edge Invocations</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {metrics.edge_invocations_today.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-6 mb-4 uppercase tracking-wider">Model Distribution</h3>
                <div className="space-y-3">
                    {Object.entries(metrics.model_distribution || {}).map(([model, count]) => {
                        const percent = ((count / (metrics.gemini_requests_today || 1)) * 100).toFixed(1);
                        return (
                            <div key={model}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{model}</span>
                                    <span className="text-slate-500">{percent}% ({count})</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Runtime & Economics</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Input Tokens</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            {metrics.avg_input_tokens?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Output Tokens</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            {metrics.avg_output_tokens?.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cost Estimate</div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            $ {((metrics.avg_input_tokens * metrics.gemini_requests_today * 0.000000075) + (metrics.avg_output_tokens * metrics.gemini_requests_today * 0.0000003)).toFixed(4)}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Consecutive Failures</div>
                        <div className={`text-xl font-bold ${metrics.consecutive_failures > 5 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                            {metrics.consecutive_failures || 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
