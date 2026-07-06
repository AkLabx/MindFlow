import React from 'react';
import { X } from 'lucide-react';
import type { EnrichmentDlqJob } from '../types/enrichmentAdmin';

interface DLQInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: EnrichmentDlqJob | null;
}

export const DLQInspectorModal: React.FC<DLQInspectorModalProps> = ({ isOpen, onClose, job }) => {
    if (!isOpen || !job) return null;

    let parsedError: any = null;
    try {
        parsedError = JSON.parse(job.error_message);
    } catch (e) {
        // Fallback if not valid JSON
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">

                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Inspect Job Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Task</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{job.task}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Attempt Count</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{job.attempt_count}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Failed At</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(job.failed_at).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Word ID</p>
                            <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{job.word_id}</p>
                        </div>
                    </div>

                    {parsedError ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Structured Error Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {parsedError.failure_type && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                                        <p className="text-xs text-red-500 uppercase tracking-wider font-semibold mb-1">Failure Type</p>
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400 capitalize">{parsedError.failure_type}</p>
                                    </div>
                                )}
                                {parsedError.last_model && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Last Model</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{parsedError.last_model}</p>
                                    </div>
                                )}
                                {parsedError.last_prompt && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Prompt Version</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{parsedError.last_prompt}</p>
                                    </div>
                                )}
                            </div>

                            {parsedError.last_error && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Last Error Message</p>
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                                        {parsedError.last_error}
                                    </div>
                                </div>
                            )}

                            {Object.keys(parsedError).filter(k => !['failure_type', 'last_model', 'last_prompt', 'last_error'].includes(k)).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Additional Context</p>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                                        {JSON.stringify(
                                            Object.fromEntries(Object.entries(parsedError).filter(([k]) => !['failure_type', 'last_model', 'last_prompt', 'last_error'].includes(k))),
                                            null,
                                            2
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Raw Error Message</h3>
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                                {job.error_message}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
