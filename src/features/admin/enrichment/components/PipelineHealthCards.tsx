import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Layers, AlertOctagon } from 'lucide-react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface PipelineHealthCardsProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

export const PipelineHealthCards: React.FC<PipelineHealthCardsProps> = ({ metrics }) => {
    if (!metrics) return null;

    // Queue depth colors
    let queueColor = "text-emerald-600 dark:text-emerald-400";
    let queueBgColor = "bg-emerald-100 dark:bg-emerald-900/30";
    let queueBorder = "border-emerald-200 dark:border-emerald-800/50";

    if (metrics.queue_depth > 100) {
        queueColor = "text-red-600 dark:text-red-400";
        queueBgColor = "bg-red-100 dark:bg-red-900/30";
        queueBorder = "border-red-200 dark:border-red-800/50";
    } else if (metrics.queue_depth > 60) {
        queueColor = "text-orange-600 dark:text-orange-400";
        queueBgColor = "bg-orange-100 dark:bg-orange-900/30";
        queueBorder = "border-orange-200 dark:border-orange-800/50";
    } else if (metrics.queue_depth > 30) {
        queueColor = "text-yellow-600 dark:text-yellow-400";
        queueBgColor = "bg-yellow-100 dark:bg-yellow-900/30";
        queueBorder = "border-yellow-200 dark:border-yellow-800/50";
    }

    // Pipeline Hero colors
    const heroBg = metrics.pipeline_active
        ? "bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 dark:from-emerald-900/30 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800/50"
        : "bg-gradient-to-r from-red-500/10 to-red-600/5 dark:from-red-900/30 dark:to-red-800/10 border-red-200 dark:border-red-800/50";

    return (
        <div className="flex flex-col gap-6 mb-8">

            {/* Primary Hero Card: Pipeline Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl p-6 md:p-8 border ${heroBg} shadow-sm relative overflow-hidden`}
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${metrics.pipeline_active ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg' : 'bg-red-500 text-white shadow-red-500/30 shadow-lg'}`}>
                            <Activity className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight uppercase mb-1">
                                {metrics.pipeline_active ? (
                                    <><span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)]" /> PIPELINE ACTIVE</>
                                ) : (
                                    <><span className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]" /> PIPELINE PAUSED</>
                                )}
                            </h3>
                            <div className="flex flex-col gap-1 mt-3">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Pipeline Mode: <span className={`capitalize ${metrics.pipeline_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{metrics.pipeline_active ? 'Running' : 'Paused'}</span>
                                </p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Current Task: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{metrics.current_task || 'Idle'}</span>
                                </p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Last successful run: {metrics.last_success_minutes === 0 ? '< 1' : metrics.last_success_minutes}m ago
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Secondary Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Queue Depth */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border ${queueBorder} shadow-sm`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Queue Depth</p>
                            <h3 className={`text-3xl font-bold ${queueColor}`}>
                                {metrics.queue_depth.toLocaleString()}
                            </h3>
                            <p className={`text-sm mt-1 font-medium ${queueColor}`}>
                                Jobs Pending
                            </p>
                        </div>
                        <div className={`p-3 ${queueBgColor} rounded-xl ${queueColor}`}>
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

                {/* DLQ Count */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-2xl p-6 border shadow-sm ${metrics.dlq_count > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm mb-1 font-medium ${metrics.dlq_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                Dead Letter Queue
                            </p>
                            <h3 className={`text-3xl font-bold flex items-center gap-3 ${metrics.dlq_count > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
                                {metrics.dlq_count > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-red-400 animate-ping"></span>}
                                {metrics.dlq_count.toLocaleString()}
                            </h3>
                            <p className={`text-sm mt-1 font-bold tracking-tight uppercase ${metrics.dlq_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                                {metrics.dlq_count === 1 ? 'Failed Job' : 'Failed Jobs'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl ${metrics.dlq_count > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
