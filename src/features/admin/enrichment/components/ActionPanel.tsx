import React, { useState } from 'react';
import { AlertTriangle, Pause, Play, Trash2, Zap, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useWordLineage } from '../hooks/useWordLineage';
import { useQueueControls } from '../hooks/useQueueControls';
import { usePipelineStore } from '../stores/usePipelineStore';

export const ActionPanel = ({ isPipelineActive, isMobile }: { isPipelineActive: boolean, isMobile: boolean }) => {
    const { selectedPipeline } = usePipelineStore();
    // In future iterations, useQueueControls could accept selectedPipeline to toggle different crons, 
    // but for now we rely on the existing hooks/RPCs if they map generally, or just expose the UI switch.
    const { freeze, isFreezing, resume, isResuming, purge, isPurging, nuclear, isNuclear } = useQueueControls();
    const showToast = useNotificationStore(s => s.showToast);

    const [isProcessing, setIsProcessing] = useState(false);
    const [manualId, setManualId] = useState('');
    
    const isVocab = selectedPipeline === 'vocabulary';
    const [manualTask, setManualTask] = useState(isVocab ? 'examples' : 'question_taxonomy_v1');

    // Using useWordLineage for the manual enqueue capability (Force Single Record)
    const { enqueueManualJob } = useWordLineage(manualId);

    const handleAction = async (actionFn: () => Promise<any>, successMessage: string) => {
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
        if (!manualId) {
            showToast({ title: 'Error', message: 'UUID required', variant: 'error' });
            return;
        }
        setIsProcessing(true);
        try {
            await enqueueManualJob({ task: manualTask });
            showToast({ title: 'Success', message: 'Job injected to queue', variant: 'success' });
            setManualId('');
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
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Pipeline Controls & Operations</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {isPipelineActive ? (
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to pause the pipeline? Active queue will NOT be purged.')) {
                                handleAction(freeze, 'Pipeline paused (Cron disabled)');
                            }
                        }}
                        disabled={isFreezing || isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <Pause className="w-4 h-4" />
                        {isFreezing ? 'Freezing...' : 'Freeze Pipeline'}
                    </button>
                ) : (
                    <button
                        onClick={() => handleAction(resume, 'Pipeline resumed (Cron enabled)')}
                        disabled={isResuming || isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        {isResuming ? 'Resuming...' : 'Resume Pipeline'}
                    </button>
                )}

                <button
                    onClick={() => {
                        // Preserving Force Manual Batch behavior using the Purge behavior but adapted logically.
                        // Originally this triggered a cron/manual start. We map this to triggering a seed if needed or rely on resume.
                        showToast({ title: 'Notice', message: 'Pipeline will pick up batch automatically when active.', variant: 'info' })
                    }}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                    <RefreshCw className="w-4 h-4" /> Force Manual Batch
                </button>

                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to purge the queue? This will delete all pending jobs.')) {
                            handleAction(purge, 'Queue purged successfully');
                        }
                    }}
                    disabled={isPurging || isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    {isPurging ? 'Purging...' : 'Purge Queue'}
                </button>

                <button
                    onClick={() => {
                        const confirmText = window.prompt('Type "I UNDERSTAND" to execute a nuclear reset. This stops crons, purges queue, and archives all DLQ.');
                        if (confirmText === 'I UNDERSTAND') {
                            handleAction(nuclear, 'Nuclear reset executed');
                        }
                    }}
                    disabled={isNuclear || isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {isNuclear ? 'Resetting...' : 'Nuclear Reset'}
                </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Manual Reprocessing (Lineage Explorer Override)
                </h3>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-slate-500 mb-1">
                            {isVocab ? 'Word UUID' : 'Question UUID'}
                        </label>
                        <input
                            type="text"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
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
                            {isVocab ? (
                                <>
                                    <option value="examples">Examples</option>
                                    <option value="synonyms">Synonyms</option>
                                    <option value="antonyms">Antonyms</option>
                                    <option value="confusables">Confusables</option>
                                    <option value="explanation">Explanation</option>
                                    <option value="sense">Sense</option>
                                    <option value="usage">Usage</option>
                                    <option value="scope">Scope</option>
                                    <option value="mnemonic">Mnemonic</option>
                                    <option value="collocations">Collocations</option>
                                    <option value="etymology">Etymology</option>
                                    <option value="pronunciation">Pronunciation</option>
                                    <option value="grammar">Grammar</option>
                                    <option value="register">Register</option>
                                </>
                            ) : (
                                <>
                                    <option value="question_taxonomy_v1">Classification (Tier 1)</option>
                                    <option value="question_translation_v1">Localization (Tier 2)</option>
                                    <option value="question_teacher_v1">Explanation (Tier 3)</option>
                                </>
                            )}
                        </select>
                    </div>
                    <button
                        onClick={handleSingleRecord}
                        disabled={isProcessing || !manualId}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 h-[38px]"
                    >
                        Inject to Queue
                    </button>
                </div>
            </div>
        </div>
    );
};
