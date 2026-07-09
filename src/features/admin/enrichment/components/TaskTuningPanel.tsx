import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAiTaskConfig, updateAiTaskConfig } from '../services/enrichmentAdminService';

export const TaskTuningPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: configs, isLoading } = useQuery({
        queryKey: ['aiTaskConfig'],
        queryFn: getAiTaskConfig
    });

    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const updateMutation = useMutation({
        mutationFn: (updates: any) => updateAiTaskConfig(updates.task, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiTaskConfig'] });
            setEditingTask(null);
        }
    });

    const handleEdit = (config: any) => {
        setEditingTask(config.task);
        setEditForm(config);
    };

    const handleSave = () => {
        updateMutation.mutate(editForm);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading config...</div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" /> Platform Configuration
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 font-medium rounded-tl-lg">Task</th>
                            <th className="px-4 py-3 font-medium">Batch Size</th>
                            <th className="px-4 py-3 font-medium">Priority</th>
                            <th className="px-4 py-3 font-medium">Max Attempts</th>
                            <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {configs?.map((config: any) => (
                            <tr key={config.task} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{config.task}</td>
                                <td className="px-4 py-3">
                                    {editingTask === config.task ? (
                                        <input type="number" value={editForm.batch_size} onChange={e => setEditForm({...editForm, batch_size: parseInt(e.target.value)})} className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-transparent" />
                                    ) : config.batch_size}
                                </td>
                                <td className="px-4 py-3">
                                    {editingTask === config.task ? (
                                        <input type="number" value={editForm.priority} onChange={e => setEditForm({...editForm, priority: parseInt(e.target.value)})} className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-transparent" />
                                    ) : config.priority}
                                </td>
                                <td className="px-4 py-3">
                                    {editingTask === config.task ? (
                                        <input type="number" value={editForm.max_attempts} onChange={e => setEditForm({...editForm, max_attempts: parseInt(e.target.value)})} className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-transparent" />
                                    ) : config.max_attempts}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {editingTask === config.task ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={handleSave} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" disabled={updateMutation.isPending}><Save className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingTask(null)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded text-xs font-bold">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEdit(config)} className="text-indigo-600 hover:text-indigo-700 font-medium text-xs">Edit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
