import { Crown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { RightDrawer } from './RightDrawer';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';

interface SeriesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    series?: any;
    categories: any[];
    onSave: (payload: any) => Promise<void>;
}

export const SeriesDrawer: React.FC<SeriesDrawerProps> = ({ isOpen, onClose, series, categories, onSave }) => {
    const [initialData, setInitialData] = useState<{
        category_id: string;
        name: string;
        slug: string;
        description: string;
        series_type: 'MOCK' | 'PYQ';
        is_premium: boolean;
        is_published: boolean;
    }>({
        category_id: '',
        name: '',
        slug: '',
        description: '',
        series_type: 'MOCK',
        is_premium: false,
        is_published: false
    });

    const [formData, setFormData] = useState<{
        category_id: string;
        name: string;
        slug: string;
        description: string;
        series_type: 'MOCK' | 'PYQ';
        is_premium: boolean;
        is_published: boolean;
    }>({
        category_id: '',
        name: '',
        slug: '',
        description: '',
        series_type: 'MOCK',
        is_premium: false,
        is_published: false
    });
    const [loading, setLoading] = useState(false);

    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

    useEffect(() => {
        const data: {
            category_id: string;
            name: string;
            slug: string;
            description: string;
            series_type: 'MOCK' | 'PYQ';
            is_premium: boolean;
            is_published: boolean;
        } = series ? {
            category_id: series.category_id || '',
            name: series.name || '',
            slug: series.slug || '',
            description: series.description || '',
            series_type: series?.series_type === 'PYQ' ? 'PYQ' : 'MOCK',
            is_premium: series.is_premium ?? false,
            is_published: series.is_published ?? false
        } : {
            category_id: categories[0]?.id || '',
            name: '',
            slug: '',
            description: '',
            series_type: 'MOCK',
            is_premium: false,
            is_published: false
        };

        setInitialData(data);
        setFormData(data);
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

    const drawerFooter = (requestClose: () => void) => (
        <div className="flex justify-end gap-3">
            <button
                type="button"
                onClick={requestClose}
                className="min-h-[44px] px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 touch-manipulation scroll-mb-28"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="series-form"
                disabled={loading || !formData.name.trim() || !formData.category_id}
                className="min-h-[44px] px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all active:scale-95 touch-manipulation scroll-mb-28 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Series'}
            </button>
        </div>
    );

    return (
        <RightDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={series ? "Edit Test Series" : "Create Test Series"}
            isDirty={isDirty}
            footer={drawerFooter}
        >
            <form id="series-form" onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                            <InfoHintPopover
                                title="Parent Exam Category"
                                purpose="Assigns this Test Series under an Exam Category."
                                studentVisibility="Students browse this series inside the chosen Category page."
                                example="Select BPSC for '70th BPSC Prelims Full Mocks'."
                                align="start"
                            />
                        </div>
                        <select
                            required
                            value={formData.category_id}
                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="" disabled>Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Series Name *</label>
                            <InfoHintPopover
                                title="Series Name"
                                purpose="Title of the test collection shown on series cards and breadcrumbs."
                                studentVisibility="Appears in the Mock Tests Hub and Test Series listing."
                                example="BPSC 70th Prelims Mock Series"
                                align="start"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => handleNameChange(e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. SSC CGL 2026"
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1 mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL Slug</label>
                            <InfoHintPopover
                                title="URL Slug"
                                purpose="Unique URL-safe identifier for this series (lowercase letters, numbers, and hyphens)."
                                example="ssc-cgl-2026"
                                align="start"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full min-h-[44px] rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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

                    <div>
                        <div className="flex items-center gap-1 mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Series Type *</label>
                            <InfoHintPopover
                                title="Series Type (MOCK vs PYQ)"
                                purpose="Classifies whether this series holds newly authored Expert Curated Mocks or Previous Year Papers (PYQ)."
                                studentVisibility="Determines whether the series appears under Expert Mock Series or Previous Year Papers in the student Mock Hub."
                                example="Choose Previous Year Paper (PYQ) for official past-year BPSC or SSC papers."
                                align="start"
                            />
                        </div>
                        <div
                            role="group"
                            aria-label="Series Type"
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                        >
                            {(
                                [
                                    { value: 'MOCK', label: 'Expert Curated Mock' },
                                    { value: 'PYQ', label: 'Previous Year Paper (PYQ)' },
                                ] as const
                            ).map(opt => {
                                const isSelected = formData.series_type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setFormData({ ...formData, series_type: opt.value })}
                                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 touch-manipulation scroll-mb-28 text-center ${
                                            isSelected
                                                ? opt.value === 'PYQ'
                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                                                    : 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                        <Crown className="w-4 h-4" /> Premium Series
                                    </p>
                                    <InfoHintPopover
                                        title="Free vs PRO (is_premium)"
                                        purpose="Marks whether this series is Free for everyone or requires a PRO/Premium tier."
                                        studentVisibility="Displays a Free or PRO badge on the series card."
                                        align="start"
                                    />
                                </div>
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
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-slate-900 dark:text-white">Publish Status</p>
                                    <InfoHintPopover
                                        title="Series Publish Status (is_published)"
                                        purpose="Controls whether this Test Series and its published tests are visible to students."
                                        studentVisibility="If OFF (Draft), even Published mock tests inside this series remain hidden from students."
                                        example="Turn ON after adding at least one published mock test."
                                        align="start"
                                    />
                                </div>
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
            </form>
        </RightDrawer>
    );
};
