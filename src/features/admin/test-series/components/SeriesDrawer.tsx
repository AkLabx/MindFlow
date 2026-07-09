import { Crown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { RightDrawer } from './RightDrawer';

interface SeriesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    series?: any;
    categories: any[];
    onSave: (payload: any) => Promise<void>;
}

export const SeriesDrawer: React.FC<SeriesDrawerProps> = ({ isOpen, onClose, series, categories, onSave }) => {
    const [formData, setFormData] = useState({
        category_id: '',
        name: '',
        slug: '',
        description: '',
        is_premium: false,
        is_published: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (series) {
            setFormData({
                category_id: series.category_id || '',
                name: series.name || '',
                slug: series.slug || '',
                description: series.description || '',
                is_premium: series.is_premium ?? false,
                is_published: series.is_published ?? false
            });
        } else {
            setFormData({ category_id: categories[0]?.id || '', name: '', slug: '', description: '', is_premium: false, is_published: false });
        }
    }, [series, isOpen, categories]);

    // Auto-generate slug
    const handleNameChange = (name: string) => {
        if (!series) { // Only auto-gen on create
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setFormData({ ...formData, name, slug });
        } else {
            setFormData({ ...formData, name });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Handled by hook toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <RightDrawer isOpen={isOpen} onClose={onClose} title={series ? "Edit Test Series" : "Create Test Series"}>
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
                <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                        <select
                            required
                            value={formData.category_id}
                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="" disabled>Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Series Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => handleNameChange(e.target.value)}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. SSC CGL 2026"
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Slug</label>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Generated automatically.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <Crown className="w-4 h-4" /> Premium Series
                                </p>
                                <p className="text-sm text-slate-500">Requires subscription?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_premium}
                                    onChange={e => setFormData({ ...formData, is_premium: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Publish Status</p>
                                <p className="text-sm text-slate-500">Visible to students?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_published}
                                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-6 pb-[env(safe-area-inset-bottom)] border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.name.trim() || !formData.category_id}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Series'}
                    </button>
                </div>
            </form>
        </RightDrawer>
    );
};
