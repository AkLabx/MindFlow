import React, { useState } from 'react';
import { QuestionLightweight } from '../types/questionBuilder.types';
import { Trash2, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import DOMPurify from "dompurify";
const renderMathText = (text: string) => DOMPurify.sanitize(text);

interface Props {
    selectedQuestions: QuestionLightweight[];
    onRemove: (id: string) => void;
    onRemoveAll: () => void;
    onAdvancedImport: (uuids: string) => Promise<void>;
    isImporting: boolean;
}

export const SelectedQuestionsPanel: React.FC<Props> = ({
    selectedQuestions,
    onRemove,
    onRemoveAll,
    onAdvancedImport,
    isImporting
}) => {
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);

    const handleImportSubmit = async () => {
        if (!importText.trim()) return;
        await onAdvancedImport(importText);
        setImportText('');
        setShowImport(false);
    };

    const truncate = (str: string, max = 80) => str.length > max ? str.substring(0, max) + '...' : str;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shadow-sm z-10 relative">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Selected Questions
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-sm font-bold">
                            {selectedQuestions.length}
                        </span>
                    </h3>
                </div>

                {selectedQuestions.length > 0 && (
                    <button
                        onClick={() => {
                            if(window.confirm('Are you sure you want to clear all selected questions?')) {
                                onRemoveAll();
                            }
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                    </button>
                )}
            </div>

            {/* Advanced Import Accordion */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                <button
                    onClick={() => setShowImport(!showImport)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        Advanced UUID Import
                    </span>
                    {showImport ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showImport && (
                    <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                            Paste comma-separated UUIDs. They will be validated, fetched, and visually merged below.
                        </div>
                        <textarea
                            rows={3}
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000..."
                            className="w-full text-xs font-mono p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={isImporting}
                        />
                        <button
                            onClick={handleImportSubmit}
                            disabled={isImporting || !importText.trim()}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                        >
                            {isImporting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                            ) : (
                                'Import & Merge'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Selected List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {selectedQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                        <p className="text-sm">No questions selected yet.<br/>Search and select questions from the left panel.</p>
                    </div>
                ) : (
                    selectedQuestions.map((q, index) => (
                        <div key={q.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3 group animate-in fade-in zoom-in-95 duration-200">

                            <div className="flex flex-col items-center justify-center font-bold text-slate-300 dark:text-slate-600 w-6">
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-xs font-mono text-slate-400 mb-1">{q.v1_id}</div>
                                <div
                                    className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: truncate(renderMathText(q.question)) }}
                                />
                            </div>

                            <button
                                onClick={() => onRemove(q.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove Question"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
