import React, { useState, useEffect, useMemo } from 'react';
import { RightDrawer } from './RightDrawer';
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
    const [rawQuestions, setRawQuestions] = useState('');
    const [validation, setValidation] = useState<{valid: string[], invalid: string[], checking: boolean}>({ valid: [], invalid: [], checking: false });
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
            setRawQuestions((test.question_ids || []).join(',\n'));
            setValidation({ valid: test.question_ids || [], invalid: [], checking: false });
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
            setRawQuestions('');
            setValidation({ valid: [], invalid: [], checking: false });
        }
    }, [test, isOpen, series]);

    // Validation Effect
    useEffect(() => {
        const checkIds = async () => {
            const inputStr = rawQuestions.trim();
            if (!inputStr) {
                setValidation({ valid: [], invalid: [], checking: false });
                setFormData(prev => ({ ...prev, question_ids: [] }));
                return;
            }

            setValidation(prev => ({ ...prev, checking: true }));

            // Extract UUIDs from text (allows comma, space, or newline separation)
            const matches = inputStr.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig) || [];

            try {
                const { valid, invalid } = await validateQuestionIds(matches);
                setValidation({ valid, invalid, checking: false });
                setFormData(prev => ({ ...prev, question_ids: valid }));
            } catch (e) {
                setValidation(prev => ({ ...prev, checking: false }));
            }
        };

        const timer = setTimeout(checkIds, 500);
        return () => clearTimeout(timer);
    }, [rawQuestions]);

    const canPublish = useMemo(() => {
        return Boolean(
            formData.name.trim() &&
            formData.series_id &&
            formData.duration_minutes > 0 &&
            formData.total_marks > 0 &&
            formData.question_ids.length > 0 &&
            validation.invalid.length === 0
        );
    }, [formData, validation]);

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
        <RightDrawer isOpen={isOpen} onClose={onClose} title={test ? "Edit Test" : "Create Test"}>
            <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full pb-20">
                <div className="flex-1 space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">1. Basic Info</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Series *</label>
                            <select
                                required
                                value={formData.series_id}
                                onChange={e => setFormData({ ...formData, series_id: e.target.value })}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="" disabled>Select a series</option>
                                {series.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Test Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Mock Test 1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (mins) *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={formData.duration_minutes}
                                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={e => setFormData({ ...formData, display_order: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Scoring */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">2. Scoring</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Marks</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.total_marks}
                                    onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passing</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.passing_marks}
                                    onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Negative</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.negative_marks}
                                    onChange={e => setFormData({ ...formData, negative_marks: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Questions */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">3. Questions</h3>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                            Paste UUIDs here (comma separated or newlines). System automatically removes duplicates.
                        </div>

                        <textarea
                            rows={6}
                            value={rawQuestions}
                            onChange={e => setRawQuestions(e.target.value)}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000..."
                        />

                        {/* Validation Status */}
                        {rawQuestions.trim() && (
                            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                                {validation.checking ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
                                        Validating...
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="font-bold">{validation.valid.length}</span> Valid Questions
                                        </div>
                                        {validation.invalid.length > 0 && (
                                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                <XCircle className="w-4 h-4" />
                                                <span className="font-bold">{validation.invalid.length}</span> Invalid/Missing UUIDs
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
