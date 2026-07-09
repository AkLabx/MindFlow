import React from 'react';
import { Layers } from 'lucide-react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

interface QueueIntelligenceProps {
    metrics: EnrichmentDashboardMetrics;
    pipelineConfig: PipelineConfig;
}

export const QueueIntelligence: React.FC<QueueIntelligenceProps> = ({ metrics, pipelineConfig }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Queue Intelligence</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 font-medium rounded-tl-lg">Pipeline</th>
                            <th className="px-4 py-3 font-medium">Task</th>
                            <th className="px-4 py-3 font-medium">Pending</th>
                            <th className="px-4 py-3 font-medium">Running</th>
                            <th className="px-4 py-3 font-medium rounded-tr-lg">Retry Pending</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {metrics.queues.intelligence?.map((q, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                                    {pipelineConfig.label}
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium capitalize">
                                    {q.task.replace(/_/g, ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${q.pending > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                                        <span className={q.pending > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                                            {q.pending.toLocaleString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${q.running > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className={q.running > 0 ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                                            {q.running.toLocaleString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${q.retry_pending > 0 ? 'bg-red-400' : 'bg-slate-300'}`} />
                                        <span className={q.retry_pending > 0 ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                            {q.retry_pending.toLocaleString()}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!metrics.queues.intelligence || metrics.queues.intelligence.length === 0) && (
                    <div className="py-8 text-center text-slate-500 text-sm">
                        No queue intelligence data available for {pipelineConfig.label}.
                    </div>
                )}
            </div>
        </div>
    );
};
