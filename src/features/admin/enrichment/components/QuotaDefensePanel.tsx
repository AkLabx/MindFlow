import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface QuotaDefensePanelProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

export const QuotaDefensePanel: React.FC<QuotaDefensePanelProps> = ({ metrics }) => {
    if (!metrics) return null;

    // Assumed daily quota limits for visualization context
    const GEMINI_DAILY_LIMIT = 1500;
    const EDGE_DAILY_LIMIT = 1000;

    const geminiPercentage = Math.min((metrics.gemini_requests_today / GEMINI_DAILY_LIMIT) * 100, 100);
    const edgePercentage = Math.min((metrics.edge_invocations_today / EDGE_DAILY_LIMIT) * 100, 100);

    // Prepare Model Distribution data
    const totalModelInvocations = Object.values(metrics.model_distribution).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Quota Defense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Limits */}
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Gemini Requests</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {metrics.gemini_requests_today.toLocaleString()} <span className="text-slate-500 font-normal">/ {GEMINI_DAILY_LIMIT.toLocaleString()}</span>
                            </p>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${geminiPercentage > 80 ? 'bg-red-500' : geminiPercentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                style={{ width: `${geminiPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">{geminiPercentage.toFixed(1)}%</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Edge Invocations</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {metrics.edge_invocations_today.toLocaleString()} <span className="text-slate-500 font-normal">/ {EDGE_DAILY_LIMIT.toLocaleString()}</span>
                            </p>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${edgePercentage > 80 ? 'bg-red-500' : edgePercentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                style={{ width: `${edgePercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">{edgePercentage.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Right Column: Model Distribution & Est Completion */}
                <div className="flex flex-col justify-between gap-6">
                    <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Model Distribution</p>
                        <div className="flex flex-col gap-3">
                            {Object.entries(metrics.model_distribution).map(([model, count]) => {
                                const percentage = totalModelInvocations > 0 ? (count / totalModelInvocations) * 100 : 0;

                                // Color logic based on model name
                                let barColor = "bg-blue-500";
                                if (model.includes('flash-lite')) barColor = "bg-emerald-500";
                                else if (model.includes('2.5-flash')) barColor = "bg-amber-500";
                                else if (model.includes('gemma')) barColor = "bg-purple-500";

                                return (
                                    <div key={model}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-600 dark:text-slate-400 font-mono truncate mr-2">{model}</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {Object.keys(metrics.model_distribution).length === 0 && (
                                <div className="flex flex-col gap-3">
                                    {['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemma-4-31b'].map(model => (
                                        <div key={model}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-slate-600 dark:text-slate-400 font-mono truncate mr-2">{model}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">0%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 bg-slate-200 dark:bg-slate-700`}
                                                    style={{ width: `0%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Estimated Completion - Keeping it here as contextual metadata */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Estimated Completion</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {metrics.estimated_completion_days === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                            ) : (
                                <>{metrics.estimated_completion_days} <span className="text-lg font-medium text-slate-500">Days</span></>
                            )}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
