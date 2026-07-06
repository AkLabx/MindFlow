import React from 'react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const PhaseLatencyChart = ({ metrics }: { metrics: EnrichmentDashboardMetrics }) => {
    if (!metrics.phase_latency || Object.keys(metrics.phase_latency).length === 0) {
        return null;
    }

    const tasks = Object.keys(metrics.phase_latency);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Phase Latency Breakdown</h2>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400"></div> Fetch</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500"></div> LLM</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-400"></div> Validation</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500"></div> DB Write</div>
                </div>
            </div>

            <div className="space-y-6">
                {tasks.map((task) => {
                    const data = metrics.phase_latency[task];
                    const total = data.latency_ms || 1; // Prevent div by 0

                    const fetchPct = (data.phase_fetch_ms / total) * 100;
                    const llmPct = (data.phase_gemini_ms / total) * 100;
                    const valPct = (data.phase_validation_ms / total) * 100;
                    const dbPct = (data.phase_db_write_ms / total) * 100;

                    return (
                        <div key={task}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{task}</span>
                                <span className="text-slate-500">{total.toLocaleString()} ms</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                                <div title={`Fetch: ${data.phase_fetch_ms}ms`} className="h-full bg-blue-400" style={{ width: `${fetchPct}%` }} />
                                <div title={`LLM: ${data.phase_gemini_ms}ms`} className="h-full bg-indigo-500" style={{ width: `${llmPct}%` }} />
                                <div title={`Validation: ${data.phase_validation_ms}ms`} className="h-full bg-orange-400" style={{ width: `${valPct}%` }} />
                                <div title={`DB Write: ${data.phase_db_write_ms}ms`} className="h-full bg-emerald-500" style={{ width: `${dbPct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
