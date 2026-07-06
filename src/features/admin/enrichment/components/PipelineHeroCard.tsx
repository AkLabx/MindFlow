import React from 'react';
import { Activity, Clock, Database, AlertCircle } from 'lucide-react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

interface PipelineHeroCardProps {
    metrics: EnrichmentDashboardMetrics;
    pipelineConfig: PipelineConfig;
}

export const PipelineHeroCard: React.FC<PipelineHeroCardProps> = ({ metrics, pipelineConfig }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative flex h-3 w-3">
                        {metrics.pipeline_active && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${metrics.pipeline_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        {metrics.pipeline_active ? 'Pipeline Active' : 'Pipeline Idle'}
                    </h2>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">
                    {pipelineConfig.label}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Currently processing tasks from <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-pink-500">{pipelineConfig.queueName}</code>
                </p>
            </div>

            <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Database className="w-4 h-4" /> Queue Depth</span>
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{metrics.queue_depth?.toLocaleString() || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-red-400" /> DLQ</span>
                    <span className="text-3xl font-bold text-red-500">{metrics.dlq_count?.toLocaleString() || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-4 h-4 text-indigo-400" /> Current Task</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 capitalize">{metrics.current_task?.replace(/_/g, ' ') || 'None'}</span>
                </div>
            </div>
        </div>
    );
};
