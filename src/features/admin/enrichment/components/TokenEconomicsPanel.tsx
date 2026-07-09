import React from 'react';
import { DollarSign, Cpu, Zap, Activity } from 'lucide-react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const TokenEconomicsPanel = ({ metrics }: { metrics: EnrichmentDashboardMetrics }) => {
    // Estimations based on Gemini 1.5 Flash pricing (~$0.075 / 1M input, ~$0.30 / 1M output)
    const INPUT_COST_PER_MILLION = 0.075;
    const OUTPUT_COST_PER_MILLION = 0.30;

    const reqs = metrics.telemetry.requests_today || 0;
    const totalInTokens = (metrics.telemetry.avg_input_tokens || 0) * reqs;
    const totalOutTokens = (metrics.telemetry.avg_output_tokens || 0) * reqs;

    const estimatedCost =
        (totalInTokens / 1_000_000 * INPUT_COST_PER_MILLION) +
        (totalOutTokens / 1_000_000 * OUTPUT_COST_PER_MILLION);

    const formatTokens = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Token Economics & Utilization</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Daily Requests</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {reqs.toLocaleString()}
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                        <Cpu className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Input Tokens</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {formatTokens(totalInTokens)}
                    </div>
                    <div className="text-xs text-indigo-500/70 mt-1">Avg {Math.round(metrics.telemetry.avg_input_tokens).toLocaleString()}/req</div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Output Tokens</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {formatTokens(totalOutTokens)}
                    </div>
                    <div className="text-xs text-emerald-500/70 mt-1">Avg {Math.round(metrics.telemetry.avg_output_tokens).toLocaleString()}/req</div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Est. Daily Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        ${estimatedCost.toFixed(3)}
                    </div>
                </div>
            </div>

            {/* Model Distribution */}
            {Object.keys(metrics.models.distribution).length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Model Distribution</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(metrics.models.distribution).map(([model, count]) => {
                            const pct = ((count / reqs) * 100).toFixed(1);
                            return (
                                <div key={model} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                                    <span className="font-mono text-slate-600 dark:text-slate-400">{model}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
