import React, { useState, useEffect } from 'react';
import { RightDrawer } from './RightDrawer';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';

interface CategoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: any;
    onSave: (payload: any) => Promise<void>;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ isOpen, onClose, category, onSave }) => {
    const [initialData, setInitialData] = useState({
        name: '',
        description: '',
        display_order: 0,
        is_active: true
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        display_order: 0,
        is_active: true
    });

    const [loading, setLoading] = useState(false);

    // Calculate if dirty by comparing current formData with initialData
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

    useEffect(() => {
        const data = category ? {
            name: category.name || '',
            description: category.description || '',
            display_order: category.display_order || 0,
            is_active: category.is_active ?? true
        } : {
            name: '',
            description: '',
            display_order: 0,
            is_active: true
        };

        setInitialData(data);
        setFormData(data);
    }, [category, isOpen]);

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
                form="category-form"
                disabled={loading || !formData.name.trim()}
                className="min-h-[44px] px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all active:scale-95 touch-manipulation scroll-mb-28 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Category'}
            </button>
        </div>
    );

    return (
        <RightDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={category ? "Edit Category" : "Create Category"}
            isDirty={isDirty}
            footer={drawerFooter}
        >
            <form id="category-form" onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                            <InfoHintPopover
                                title="Category Name"
                                purpose="The primary exam umbrella name shown on category cards."
                                studentVisibility="Displayed as the card title on the student Mock Tests Hub."
                                example="BPSC, SSC, UPSC Prelims"
                                align="start"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. SSC"
                        />
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
                        <div className="flex items-center gap-1 mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Order</label>
                            <InfoHintPopover
                                title="Display Order"
                                purpose="Controls the sort priority of this category in student and admin lists."
                                studentVisibility="Lower numbers appear first on the Mock Tests Hub."
                                example="Use 1 for your flagship exam (e.g., BPSC), 2 for SSC, etc."
                                align="start"
                            />
                        </div>
                        <input
                            type="number"
                            value={formData.display_order}
                            onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                            className="w-full min-h-[44px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Lower numbers appear first.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="font-medium text-slate-900 dark:text-white">Active Status</p>
                                <InfoHintPopover
                                    title="Active Status (is_active)"
                                    purpose="Master visibility switch for this category and every Test Series and Mock Test under it."
                                    studentVisibility="If OFF, students cannot see this category or any of its tests."
                                    example="Keep OFF while preparing a new exam category; turn ON when ready."
                                    align="start"
                                />
                            </div>
                            <p className="text-sm text-slate-500">Visible to students?</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </form>
        </RightDrawer>
    );
};
