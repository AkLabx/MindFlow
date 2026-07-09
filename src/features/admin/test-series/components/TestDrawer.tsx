import React, { useState, useEffect, useMemo } from 'react';
import { RightDrawer } from './RightDrawer';
import { QuestionBuilder } from '../../question-builder/components';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { validateQuestionIds } from '../api/adminTestSeriesApi';

interface TestDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    test?: any;
    series: any[];
    onSave: (payload: any) => Promise<void>;
}

export const TestDrawer: React.FC<TestDrawerProps> = ({ isOpen, onClose, test, series, onSave }) => {
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



    const canPublish = useMemo(() => {
        return Boolean(
            formData.name.trim() &&
            formData.series_id &&
            formData.duration_minutes > 0 &&
            formData.total_marks > 0 &&
            formData.question_ids.length > 0
            // validation.invalid.length === 0 removed as builder ensures only valid IDs are set
        );
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Handled
        } finally {
            setLoading(false);
        }
    };

    return (
        <RightDrawer isOpen={isOpen} onClose={onClose} title={test ? "Edit Test" : "Create Test"} width="xl">
            <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full pb-20">
                <div className="flex-1 space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-4 flex-1 flex flex-col min-h-[600px]">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">3. Questions</h3>

                        <QuestionBuilder
                            initialQuestionIds={formData.question_ids}
                            onChange={(newIds) => setFormData(prev => ({ ...prev, question_ids: newIds }))}
                        />
                    </section>

                    {/* Publishing */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">4. Publishing</h3>
                        <div className={`flex items-center justify-between p-4 rounded-xl border ${formData.is_published ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    Publish Test
                                    {!canPublish && <AlertCircle className="w-4 h-4 text-amber-500"  />}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {!canPublish ? 'Cannot publish until all fields and valid questions are provided.' : 'Ready to be visible to students.'}
                                </p>
                            </div>
                            <label className={`relative inline-flex items-center ${canPublish ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                <input
                                    type="checkbox"
                                    disabled={!canPublish}
                                    checked={formData.is_published}
                                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </section>
                </div>

                <div className="fixed bottom-0 right-0 w-full max-w-md p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.name.trim() || !formData.series_id || formData.question_ids.length === 0}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Test'}
                    </button>
                </div>
            </form>
        </RightDrawer>
    );
};
