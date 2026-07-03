import React, { useState } from 'react';
import { Play, Pause, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface ActionPanelProps {
    isPipelineActive: boolean;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    onEmergencyStop: () => Promise<void>;
    onForceManualBatch: () => Promise<void>;
    onForceSingleRecord: (wordId: string, task: string) => Promise<void>;
    isMobile: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
    isPipelineActive,
    onPause,
    onResume,
    onEmergencyStop,
    onForceManualBatch,
    onForceSingleRecord,
    isMobile
}) => {
    const showToast = useNotificationStore(s => s.showToast);

    const [isProcessing, setIsProcessing] = useState(false);
    const [manualWordId, setManualWordId] = useState('');
    const [manualTask, setManualTask] = useState('examples');

    const handleAction = async (actionFn: () => Promise<void>, successMessage: string) => {
        setIsProcessing(true);
        try {
            await actionFn();
            showToast({ title: 'Success', message: successMessage, variant: 'success' });
        } catch (e: any) {
            showToast({ title: 'Error', message: e.message || 'Action failed', variant: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSingleRecord = async () => {
        if (!manualWordId) {
            showToast({ title: 'Error', message: 'UUID required', variant: 'error' });
            return;
        }
        setIsProcessing(true);
        try {
            await onForceSingleRecord(manualWordId, manualTask);
            showToast({ title: 'Success', message: 'Job injected to queue', variant: 'success' });
            setManualWordId('');
        } catch (e: any) {
            showToast({ title: 'Error', message: e.message || 'Injection failed', variant: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isMobile) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-900/50 mb-8">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Operational actions (Start, Stop, Injection) are disabled on mobile devices. Please use a desktop to manage the pipeline.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Action Panel</h2>

            <div className="flex flex-wrap gap-4 mb-8">
                {isPipelineActive ? (
                    <button
                        onClick={() => {
                            if(window.confirm('Are you sure you want to pause the pipeline? Active queue will NOT be purged.')) {
                                handleAction(onPause, 'Pipeline paused (Cron disabled)');
                            }
                        }}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        <Pause className="w-4 h-4" /> Pause Pipeline
                    </button>
                ) : (
                    <button
                        onClick={() => handleAction(onResume, 'Pipeline resumed (Cron enabled)')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" /> Resume Pipeline
                    </button>
                )}

                <button
                    onClick={() => handleAction(onForceManualBatch, 'Manual batch queued')}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw className="w-4 h-4" /> Force Manual Batch
                </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Manual Reprocessing
                </h3>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-slate-500 mb-1">Word UUID</label>
                        <input
                            type="text"
                            value={manualWordId}
                            onChange={(e) => setManualWordId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-xs text-slate-500 mb-1">Task Type</label>
                        <select
                            value={manualTask}
                            onChange={(e) => setManualTask(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="examples">Examples</option>
                            <option value="synonyms">Synonyms</option>
                            <option value="antonyms">Antonyms</option>
                            <option value="confusables">Confusables</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSingleRecord}
                        disabled={isProcessing || !manualWordId}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 h-[38px]"
                    >
                        Inject to Queue
                    </button>
                </div>
            </div>
        </div>
    );
};
