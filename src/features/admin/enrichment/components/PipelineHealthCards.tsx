import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Layers, AlertOctagon, Clock } from 'lucide-react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

interface PipelineHealthCardsProps {
    metrics: EnrichmentDashboardMetrics | undefined;
}

export const PipelineHealthCards: React.FC<PipelineHealthCardsProps> = ({ metrics }) => {
    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pipeline Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Pipeline Status</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {metrics.pipeline_active ? (
                                <><span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Active</>
                            ) : (
                                <><span className="w-3 h-3 rounded-full bg-red-500" /> Paused</>
                            )}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            {/* Queue Depth */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Queue Depth</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {metrics.queue_depth.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            {/* DLQ Count */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">DLQ Count</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {metrics.dlq_count.toLocaleString()}
                        </h3>
                    </div>
                    <div className={`p-3 rounded-xl ${metrics.dlq_count > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <AlertOctagon className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            {/* Last Success */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Last Success</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {metrics.last_success_minutes}m ago
                        </h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
