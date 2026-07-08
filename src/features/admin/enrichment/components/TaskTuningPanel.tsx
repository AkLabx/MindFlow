import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Power, PowerOff } from 'lucide-react';
import { getAiTaskConfig, updateAiTaskConfig } from '../services/enrichmentAdminService';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { AiTaskConfig } from '../types/enrichmentAdmin';
import { usePipelineStore } from '../stores/usePipelineStore';

export const TaskTuningPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const showToast = useNotificationStore(s => s.showToast);
    const { selectedPipeline } = usePipelineStore();
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AiTaskConfig>>({});

    const { data: configs, isLoading } = useQuery({
        queryKey: ['ai_task_config'],
        queryFn: getAiTaskConfig,
    });

    const updateMutation = useMutation({
        mutationFn: ({ task, updates }: { task: string, updates: Partial<AiTaskConfig> }) => updateAiTaskConfig(task, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai_task_config'] });
            showToast({ title: 'Success', message: 'Task configuration updated', variant: 'success' });
            setEditingTask(null);
        },
        onError: (error: any) => {
            showToast({ title: 'Error', message: error.message || 'Failed to update task config', variant: 'error' });
        }
    });

    const handleEditClick = (config: AiTaskConfig) => {
        setEditingTask(config.task);
        setEditForm({
            batch_size: config.batch_size,
            priority: config.priority,
            is_enabled: config.is_enabled
        });
    };

    const handleSave = (task: string) => {
        updateMutation.mutate({ task, updates: editForm });
    };

    const handleToggleEnabled = (config: AiTaskConfig) => {
        updateMutation.mutate({ task: config.task, updates: { is_enabled: !config.is_enabled } });
    };

    if (isLoading) return <div className="p-6">Loading task configs...</div>;

    // Filter tasks based on active pipeline
    const filteredConfigs = configs?.filter(config => {
        if (selectedPipeline === 'question_enrichment') {
            return config.task.startsWith('question_');
        } else {
            return !config.task.startsWith('question_') && config.task !== 'ask_ai_tutor' && config.task !== 'chat';
        }
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    Task Tuning Panel
                </h2>
                <button title="Configure ai_task_config parameters" className="text-slate-400">ⓘ</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-3 font-medium rounded-tl-xl">Task</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Batch Size</th>
                            <th className="p-3 font-medium">Priority</th>
                            <th className="p-3 font-medium">Model Chain</th>
                            <th className="p-3 font-medium text-right rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {filteredConfigs?.map((config) => (
                            <tr key={config.task} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="p-3 font-medium">{config.task}</td>
                                <td className="p-3">
                                    <button
                                        onClick={() => handleToggleEnabled(config)}
                                        disabled={updateMutation.isPending && updateMutation.variables?.task === config.task}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            config.is_enabled
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'
                                        }`}
                                    >
                                        {config.is_enabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                                        {config.is_enabled ? 'Active' : 'Paused'}
                                    </button>
                                </td>
                                <td className="p-3">
                                    {editingTask === config.task ? (
                                        <input
                                            type="number"
                                            value={editForm.batch_size}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, batch_size: parseInt(e.target.value) }))}
                                            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm"
                                        />
                                    ) : (
                                        config.batch_size
                                    )}
                                </td>
                                <td className="p-3">
                                    {editingTask === config.task ? (
                                        <input
                                            type="number"
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm"
                                        />
                                    ) : (
                                        config.priority
                                    )}
                                </td>
                                <td className="p-3 text-xs text-slate-500">
                                    {config.model_chain.join(' → ')}
                                </td>
                                <td className="p-3 text-right">
                                    {editingTask === config.task ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(config.task)}
                                                disabled={updateMutation.isPending}
                                                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                            >
                                                <Save className="w-3 h-3" /> Save
                                            </button>
                                            <button
                                                onClick={() => setEditingTask(null)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditClick(config)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredConfigs?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-slate-500">No task configurations found for this pipeline.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
