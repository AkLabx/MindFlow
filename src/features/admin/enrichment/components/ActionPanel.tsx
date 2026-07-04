import React from 'react';
import { useQueueControls } from '../hooks/useQueueControls';
import { AlertTriangle, Pause, Play, Trash2 } from 'lucide-react';

export const ActionPanel = ({ isPipelineActive }: { isPipelineActive: boolean }) => {
    const { freeze, isFreezing, resume, isResuming, purge, isPurging, nuclear, isNuclear } = useQueueControls();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
            <h2 className="text-lg font-bold mb-4">Pipeline Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isPipelineActive ? (
                    <button
                        onClick={() => freeze()}
                        disabled={isFreezing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-colors font-medium"
                    >
                        <Pause className="w-4 h-4" />
                        {isFreezing ? 'Freezing...' : 'Freeze Pipeline'}
                    </button>
                ) : (
                    <button
                        onClick={() => resume()}
                        disabled={isResuming}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors font-medium"
                    >
                        <Play className="w-4 h-4" />
                        {isResuming ? 'Resuming...' : 'Resume Pipeline'}
                    </button>
                )}

                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to purge the queue? This will delete all pending jobs.')) {
                            purge();
                        }
                    }}
                    disabled={isPurging}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    {isPurging ? 'Purging...' : 'Purge Queue'}
                </button>

                <button
                    onClick={() => {
                        const confirmText = prompt('Type "I UNDERSTAND" to execute a nuclear reset. This stops crons, purges queue, and archives all DLQ.');
                        if (confirmText === 'I UNDERSTAND') {
                            nuclear();
                        }
                    }}
                    disabled={isNuclear}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors font-medium col-span-1 md:col-span-2"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {isNuclear ? 'Resetting...' : 'Nuclear Reset'}
                </button>
            </div>
        </div>
    );
};
