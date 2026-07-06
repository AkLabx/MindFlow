import React, { useState, useMemo } from 'react';
import { AlertOctagon, Archive, RotateCcw, Search } from 'lucide-react';
import type { EnrichmentDlqJob } from '../types/enrichmentAdmin';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { DLQInspectorModal } from './DLQInspectorModal';

interface DLQInspectorProps {
    dlqJobs: EnrichmentDlqJob[] | undefined;
    onRetry: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    onArchiveAll: () => Promise<number>;
    isMobile: boolean;
}

export const DLQInspector: React.FC<DLQInspectorProps> = ({
    dlqJobs,
    onRetry,
    onArchive,
    onArchiveAll,
    isMobile
}) => {
    const showToast = useNotificationStore(s => s.showToast);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isArchivingAll, setIsArchivingAll] = useState(false);
    const [inspectJob, setInspectJob] = useState<EnrichmentDlqJob | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredJobs = useMemo(() => {
        if (!dlqJobs) return [];
        if (!searchTerm) return dlqJobs;
        const lowerTerm = searchTerm.toLowerCase();
        return dlqJobs.filter(job =>
            job.task.toLowerCase().includes(lowerTerm) ||
            job.error_message.toLowerCase().includes(lowerTerm) ||
            job.word_id.toLowerCase().includes(lowerTerm)
        );
    }, [dlqJobs, searchTerm]);

    if (!dlqJobs) return null;

    const handleAction = async (actionFn: () => Promise<void>, id: string, successMsg: string) => {
        setIsProcessing(id);
        try {
            await actionFn();
            showToast({ title: 'Success', message: successMsg, variant: 'success' });
        } catch (e: any) {
            showToast({ title: 'Error', message: e.message || 'Action failed', variant: 'error' });
        } finally {
            setIsProcessing(null);
            if (inspectJob && inspectJob.id === id) {
                setInspectJob(null);
            }
        }
    };

    const handleArchiveAll = async () => {
        if (!window.confirm(`Are you sure you want to archive all ${dlqJobs.length} DLQ records?`)) return;

        setIsArchivingAll(true);
        try {
            const count = await onArchiveAll();
            showToast({ title: 'Success', message: `Archived ${count} records`, variant: 'success' });
        } catch (e: any) {
             showToast({ title: 'Error', message: e.message || 'Archive failed', variant: 'error' });
        } finally {
            setIsArchivingAll(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-500" />
                    DLQ Inspector
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Filter by error, task, or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {!isMobile && dlqJobs.length > 0 && (
                        <button
                            onClick={handleArchiveAll}
                            disabled={isArchivingAll}
                            className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <Archive className="w-4 h-4" />
                            Archive All ({dlqJobs.length})
                        </button>
                    )}
                </div>
            </div>

            {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    {dlqJobs.length === 0 ? 'Dead Letter Queue is empty. Pipeline is healthy.' : 'No matching records found.'}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="p-3 font-medium rounded-tl-xl">Word ID</th>
                                <th className="p-3 font-medium">Task / Failure Type</th>
                                <th className="p-3 font-medium">Error Details</th>
                                <th className="p-3 font-medium text-center">Retry Count</th>
                                <th className="p-3 font-medium">Failed At</th>
                                {!isMobile && <th className="p-3 font-medium text-right rounded-tr-xl">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {filteredJobs.map((job) => {
                                let parsedError: any = {};
                                try {
                                    parsedError = JSON.parse(job.error_message);
                                } catch (e) {
                                    parsedError = { last_error: job.error_message };
                                }

                                return (
                                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="p-3 font-mono text-xs">{job.word_id.split('-')[0]}...</td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="w-fit px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium uppercase">
                                                {job.task}
                                            </span>
                                            {parsedError.failure_type && (
                                                <span className={`w-fit px-2 py-1 rounded text-[10px] font-medium uppercase ${
                                                    parsedError.failure_type === 'pedagogical' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {parsedError.failure_type}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1 max-w-xs">
                                            <span className="text-red-600 dark:text-red-400 truncate" title={parsedError.last_error}>
                                                {parsedError.last_error}
                                            </span>
                                            {parsedError.last_model && (
                                                <span className="text-xs text-slate-500">Model: {parsedError.last_model}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${job.attempt_count > 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                            {job.attempt_count}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-slate-500">
                                        {new Date(job.failed_at).toLocaleString()}
                                    </td>
                                    {!isMobile && (
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setInspectJob(job)}
                                                    title="Inspect Details"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-xs transition-colors"
                                                >
                                                    Inspect
                                                </button>
                                                <button
                                                    onClick={() => handleAction(() => onRetry(job.id), job.id, 'Job re-queued successfully')}
                                                    disabled={isProcessing === job.id}
                                                    title="Retry Job"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium text-xs transition-colors"
                                                >
                                                    <RotateCcw className="w-4 h-4" /> Retry
                                                </button>
                                                <button
                                                    onClick={() => handleAction(() => onArchive(job.id), job.id, 'Job archived')}
                                                    disabled={isProcessing === job.id}
                                                    title="Archive Error"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-medium text-xs transition-colors"
                                                >
                                                    <Archive className="w-4 h-4" /> Archive
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            <DLQInspectorModal
                isOpen={!!inspectJob}
                onClose={() => setInspectJob(null)}
                job={inspectJob}
            />
        </div>
    );
};
