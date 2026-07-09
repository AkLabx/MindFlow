import React, { useState } from 'react';
import { Play, Pause, Trash2, ShieldAlert } from 'lucide-react';
import {
    emergencyFreezePipeline,
    resumePipeline,
    emergencyPurgeQueue
} from '../services/enrichmentAdminService';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const ActionPanel = ({ isPipelineActive, isMobile }: { isPipelineActive: boolean, isMobile: boolean }) => {
    const { selectedPipeline } = usePipelineStore();
    const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const showToast = useNotificationStore(state => state.showToast);

    const handleTogglePipeline = async () => {
        setIsProcessing(true);
        try {
            if (isPipelineActive) {
                await emergencyFreezePipeline(selectedPipeline);
                showToast({ variant: 'success', message: `${selectedPipeline} pipeline frozen successfully.` });
            } else {
                await resumePipeline(selectedPipeline);
                showToast({ variant: 'success', message: `${selectedPipeline} pipeline resumed successfully.` });
            }
        } catch (error: any) {
            showToast({ variant: 'error', message: `Failed to toggle pipeline: ${error.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePurgeQueue = async () => {
        setIsProcessing(true);
        try {
            await emergencyPurgeQueue(selectedPipeline);
            showToast({ variant: 'success', message: `Queue purged for ${selectedPipeline}.` });
        } catch (error: any) {
            showToast({ variant: 'error', message: `Failed to purge queue: ${error.message}` });
        } finally {
            setIsProcessing(false);
            setIsConfirmingPurge(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" /> Administrative Operations
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleTogglePipeline}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        isPipelineActive
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400'
                    } disabled:opacity-50`}
                >
                    {isPipelineActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPipelineActive ? 'Freeze Pipeline' : 'Resume Pipeline'}
                </button>

                <div className="flex-1 relative">
                    {isConfirmingPurge ? (
                        <div className="absolute inset-0 flex items-center justify-between px-4 bg-red-100 dark:bg-red-900/50 rounded-xl">
                            <span className="text-sm font-bold text-red-700 dark:text-red-400">Confirm Purge?</span>
                            <div className="flex gap-2">
                                <button onClick={handlePurgeQueue} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Yes</button>
                                <button onClick={() => setIsConfirmingPurge(false)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium">No</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsConfirmingPurge(true)}
                            disabled={isProcessing}
                            className="w-full h-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            <Trash2 className="w-5 h-5" />
                            Purge Queue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
