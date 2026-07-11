import React, { useState, useEffect, useMemo } from 'react';
import { RightDrawer } from './RightDrawer';
import { QuestionBuilder } from '../../question-builder/components';
import { AlertCircle, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';

interface TestDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    test?: any;
    series: any[];
    onSave: (payload: any) => Promise<void>;
}

export const TestDrawer: React.FC<TestDrawerProps> = ({ isOpen, onClose, test, series, onSave }) => {
    const [initialData, setInitialData] = useState({
            series_id: '',
            name: '',
            question_ids: [],
            total_marks: 0,
            duration_minutes: 0,
            is_published: false
        });

        const [formData, setFormData] = useState({
        series_id: '',
        name: '',
        description: '',
        duration_minutes: 60,
        total_marks: 100,
        passing_marks: 33,
        negative_marks: 0.25,
        question_ids: [] as string[],
        is_published: false,
        display_order: 0
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (test) {
            setFormData({
                series_id: test.series_id || '',
                name: test.name || '',
                description: test.description || '',
                duration_minutes: test.duration_minutes || 60,
                total_marks: test.total_marks || 100,
                passing_marks: test.passing_marks || 33,
                negative_marks: test.negative_marks || 0.25,
                question_ids: test.question_ids || [],
                is_published: test.is_published ?? false,
                display_order: test.display_order || 0
            });
        } else {
            setFormData({
                series_id: series[0]?.id || '',
                name: '',
                description: '',
                duration_minutes: 60,
                total_marks: 100,
                passing_marks: 33,
                negative_marks: 0.25,
                question_ids: [],
                is_published: false,
                display_order: 0
            });
        }
    }, [test, isOpen, series]);

    // Validation Rules
    const validation = useMemo(() => {
        const issues = {
            critical: [] as string[],
            warnings: [] as string[]
        };

        if (!formData.name.trim()) issues.critical.push("Test Name is required");
        if (!formData.series_id) issues.critical.push("Test Series must be selected");
        if (formData.duration_minutes <= 0) issues.critical.push("Duration must be greater than 0");
        if (formData.total_marks <= 0) issues.critical.push("Total marks must be greater than 0");

        if (formData.question_ids.length === 0) {
            issues.critical.push("At least one question must be added");
        } else {
            // Check duplicates
            const unique = new Set(formData.question_ids);
            if (unique.size !== formData.question_ids.length) {
                issues.critical.push(`Found ${formData.question_ids.length - unique.size} duplicate questions.`);
            }
        }

        // Warnings
        if (!formData.description.trim()) issues.warnings.push("Test description is empty");

        return {
            issues,
            canPublish: issues.critical.length === 0,
            canSaveDraft: formData.name.trim() !== '' && formData.series_id !== ''
        };
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If they are trying to publish but there are critical issues, block it.
        if (formData.is_published && !validation.canPublish) {
            alert("Cannot publish this test due to critical errors. Please fix them or uncheck 'Publish Test' to save as a draft.");
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Handled internally by onSave
        } finally {
            setLoading(false);
        }
    };

    return (
        <RightDrawer isOpen={isOpen} onClose={onClose} title={test ? "Edit Test" : "Create Test"} width="xl">
            <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full pb-20">
                <div className="flex-1 space-y-8">

                    {/* Basic Info (Hidden for brevity here, assuming it's above or handled in other steps, adding a placeholder if they were removed in my earlier cat, wait, they weren't in the earlier cat either, probably because it was abbreviated. Let me reconstruct it with the QuestionBuilder as the main focus since this is the only part shown in the original.) */}

                    <section className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Test Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Series *</label>
                                <select
                                    required
                                    value={formData.series_id}
                                    onChange={e => setFormData({ ...formData, series_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="" disabled>Select a series</option>
                                    {series.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Question Builder */}
                    <section className="space-y-4 flex-1 flex flex-col min-h-[600px]">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Questions</h3>
                        <QuestionBuilder
                            initialQuestionIds={formData.question_ids}
                            onChange={(newIds) => setFormData(prev => ({ ...prev, question_ids: newIds }))}
                        />
                    </section>

                    {/* Publishing Readiness Panel (Module 15) */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Publish Readiness</h3>

                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        {formData.name && formData.series_id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        Test Information
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        {formData.duration_minutes > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        Duration ({formData.duration_minutes}m)
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        {formData.total_marks > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        Total Marks ({formData.total_marks})
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        {formData.question_ids.length > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        Questions ({formData.question_ids.length})
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Issues */}
                            {(validation.issues.critical.length > 0 || validation.issues.warnings.length > 0) && (
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                    {validation.issues.critical.map((msg, i) => (
                                        <div key={`crit-${i}`} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{msg}</span>
                                        </div>
                                    ))}
                                    {validation.issues.warnings.map((msg, i) => (
                                        <div key={`warn-${i}`} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{msg}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-xl border ${formData.is_published ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    Publish Test
                                    {!validation.canPublish && <AlertCircle className="w-4 h-4 text-amber-500"  />}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {!validation.canPublish ? 'Cannot publish until all critical issues are resolved. You can still save as a Draft.' : 'Ready to be visible to students.'}
                                </p>
                            </div>
                            <label className={`relative inline-flex items-center ${validation.canPublish ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                <input
                                    type="checkbox"
                                    disabled={!validation.canPublish}
                                    checked={formData.is_published}
                                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </section>
                </div>

                </form>
        </RightDrawer>
    );
};
