import React from 'react';
import { Activity, Clock, Box, Database, AlertTriangle } from 'lucide-react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

export const PipelineHeroCard = ({ metrics, pipelineConfig }: { metrics: EnrichmentDashboardMetrics, pipelineConfig: PipelineConfig }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-6 rounded-2xl border ${metrics.hero.is_active ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'} transition-colors duration-300`}>
                <div className="flex items-center gap-3 mb-2">
                    <Activity className={`w-5 h-5 ${metrics.hero.is_active ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Pipeline Status</span>
                </div>
                <div className={`text-2xl font-bold ${metrics.hero.is_active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {metrics.hero.is_active ? 'Active Running' : 'Paused / Frozen'}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Box className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Queue Depth</span>
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {metrics.hero.queue_depth.toLocaleString()}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${metrics.hero.dlq_count > 0 ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">DLQ Size</span>
                </div>
                <div className={`text-2xl font-bold ${metrics.hero.dlq_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {metrics.hero.dlq_count.toLocaleString()}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Last Success</span>
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {metrics.hero.last_success_minutes >= 0 ? `${metrics.hero.last_success_minutes}m ago` : 'N/A'}
                </div>
            </div>
        </div>
    );
};
