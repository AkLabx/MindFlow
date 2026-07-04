import React from 'react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const QueueIntelligence = ({ metrics }: { metrics: EnrichmentDashboardMetrics }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Queue Intelligence</h2>
                <button title="pgmq.q_enrichment_jobs" className="text-slate-400">ⓘ</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                    <thead>
                        <tr className="text-sm text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-2">Task Stage</th>
                            <th className="pb-2 text-right">Pending</th>
                            <th className="pb-2 text-right">Running (Locked)</th>
                            <th className="pb-2 text-right text-orange-500">Retry Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.queue_intelligence && metrics.queue_intelligence.length > 0 ? (
                            metrics.queue_intelligence.map((q) => (
                                <tr key={q.task} className="border-b border-slate-100 dark:border-slate-800/50">
                                    <td className="py-2 font-medium capitalize">{q.task}</td>
                                    <td className="py-2 text-right">{q.pending}</td>
                                    <td className="py-2 text-right text-indigo-500">{q.running}</td>
                                    <td className="py-2 text-right text-orange-500">{q.retry_pending}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500">Queue is empty</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
