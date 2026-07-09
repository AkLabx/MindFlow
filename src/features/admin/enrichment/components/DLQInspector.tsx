import React, { useState } from 'react';
import { ShieldAlert, Archive, AlertCircle, RotateCcw } from 'lucide-react';
import type { EnrichmentDlqJob } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';
import { DLQInspectorModal } from './DLQInspectorModal';

// Mock CheckCircle2
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

interface DLQInspectorProps {
    dlqJobs: EnrichmentDlqJob[];
    onRetry: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    onArchiveAll: () => Promise<number | undefined>;
    isMobile: boolean;
    pipelineConfig: PipelineConfig;
}

export const DLQInspector: React.FC<DLQInspectorProps> = ({ dlqJobs, onRetry, onArchive, onArchiveAll, isMobile, pipelineConfig }) => {
    const [selectedJob, setSelectedJob] = useState<EnrichmentDlqJob | null>(null);
    const [isArchiveAllConfirm, setIsArchiveAllConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleArchiveAll = async () => {
        setIsProcessing(true);
        try {
            await onArchiveAll();
        } finally {
            setIsProcessing(false);
            setIsArchiveAllConfirm(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Dead Letter Queue (DLQ)</h2>
                        <p className="text-xs text-slate-500">Pipeline: {pipelineConfig.label}</p>
                    </div>
                </div>

                {dlqJobs.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {dlqJobs.length} Failed
                        </div>
                        {isArchiveAllConfirm ? (
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-red-500 font-medium">Are you sure?</span>
                                <button onClick={handleArchiveAll} disabled={isProcessing} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50">Confirm Archive All</button>
                                <button onClick={() => setIsArchiveAllConfirm(false)} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                             </div>
                        ) : (
                            <button onClick={() => setIsArchiveAllConfirm(true)} className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors">
                                <Archive className="w-3.5 h-3.5" /> Archive All
                            </button>
                        )}
                    </div>
                )}
            </div>

            {dlqJobs.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-700 dark:text-slate-200 font-medium mb-1">Queue is Healthy</h3>
                    <p className="text-sm text-slate-500">No failed jobs in the DLQ.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 font-medium">Pipeline</th>
                                <th className="px-6 py-3 font-medium">Task / Error</th>
                                <th className="px-6 py-3 font-medium">Time / Attempts</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {dlqJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                            {pipelineConfig.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-w-md">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{job.task.replace(/_/g, ' ')}</span>
                                                <span className="text-xs text-slate-400 font-mono">ID: {job.word_id.split('-')[0]}</span>
                                            </div>
                                            <p className="text-xs text-red-500 truncate" title={job.error_message}>{job.error_message}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-600 dark:text-slate-400">{new Date(job.failed_at).toLocaleTimeString()}</span>
                                            <span className="text-xs text-amber-500 font-medium">{job.attempt_count} attempts</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSelectedJob(job)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Inspect & Edit"><AlertCircle className="w-4 h-4" /></button>
                                            <button onClick={() => onRetry(job.id)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="Retry Job"><RotateCcw className="w-4 h-4" /></button>
                                            <button onClick={() => onArchive(job.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Archive Job"><Archive className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedJob && (
                <DLQInspectorModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onRetry={async () => { await onRetry(selectedJob.id); setSelectedJob(null); }}
                    onArchive={async () => { await onArchive(selectedJob.id); setSelectedJob(null); }}
                />
            )}
        </div>
    );
};
