import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { ThemeConfig, useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const ThemeConfigPanel: React.FC = () => {
    const { config, updateConfig, startPreview, isLoading } = useAppConfigStore();
    const showToast = useNotificationStore(state => state.showToast);

    const [theme, setTheme] = useState<ThemeConfig>(config.theme);

    const handleSave = async () => {
        try {
            await updateConfig('theme', theme);
            showToast({ title: 'Saved', message: 'Theme config updated remotely', variant: 'success' });
        } catch (e) {
            showToast({ title: 'Error', message: 'Failed to update config', variant: 'error' });
        }
    };

    const handlePreview = () => {
        startPreview({ theme });
    };

    const handleReset = () => {
        setTheme({
            mode: 'system',
            primaryColor: '#4f46e5',
            fontFamily: 'sans'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Theme Configuration</h3>
                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">Reset to defaults</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                    <label htmlFor="theme-color-mode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color Mode (Default)</label>
                    <select
                        id="theme-color-mode"
                        value={theme.mode}
                        onChange={e => setTheme({ ...theme, mode: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="system">System Preference</option>
                        <option value="light">Force Light Mode</option>
                        <option value="dark">Force Dark Mode</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="theme-typography" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typography</label>
                    <select
                        id="theme-typography"
                        value={theme.fontFamily}
                        onChange={e => setTheme({ ...theme, fontFamily: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="sans">System Default (Inter)</option>
                        <option value="poppins">Modern (Poppins)</option>
                        <option value="serif">Elegant (Serif)</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Accent Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={theme.primaryColor}
                            onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                            type="text"
                            value={theme.primaryColor}
                            onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                            placeholder="#4f46e5"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={handlePreview}
                    className="px-6 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                    <Play className="w-4 h-4" /> Live Preview
                </button>
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Publish Config
                </button>
            </div>
        </div>
    );
};
