import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { ExtractedQuestion } from '../types/review';
import { updateQuestionContent } from '../services/reviewAdminService';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    question: ExtractedQuestion | null;
    onSaved: () => void;
}

export const AdminEditExtractedModal: React.FC<Props> = ({ isOpen, onClose, question, onSaved }) => {
    const showToast = useNotificationStore(s => s.showToast);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [qText, setQText] = useState('');
    const [opts, setOpts] = useState<string[]>(['', '', '', '']);
    const [correct, setCorrect] = useState('');

    useEffect(() => {
        if (question) {
            setQText(question.question || '');
            setOpts(question.options || ['', '', '', '']);
            setCorrect(question.correct || '');
        }
    }, [question]);

    if (!isOpen || !question) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateQuestionContent(question.id, {
                question: qText,
                options: opts,
                correct
            });
            showToast({ title: 'Saved', message: 'Question content updated.', variant: 'success' });
            onSaved();
            onClose();
        } catch (e: any) {
            showToast({ title: 'Error', message: e.message, variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...opts];
        newOpts[idx] = val;
        setOpts(newOpts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Extracted Question</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question Text</label>
                        <textarea
                            value={qText}
                            onChange={e => setQText(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl min-h-[100px] text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options</label>
                        <div className="space-y-2">
                            {opts.map((opt, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    value={opt}
                                    onChange={e => handleOptionChange(i, e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                                    placeholder={`Option ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correct Answer (Must match an option exactly)</label>
                        <input
                            type="text"
                            value={correct}
                            onChange={e => setCorrect(e.target.value)}
                            className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-medium text-emerald-800 dark:text-emerald-200"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
