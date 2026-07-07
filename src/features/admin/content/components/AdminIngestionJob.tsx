import React, { useState } from 'react';
import { UploadCloud, FileText, Settings, Play, Server, AlignLeft, Tags } from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { dispatchIngestionJob } from '../services/contentAdminService';
import { IngestionJobPayload, SourceType, PromptProfile, ExtractionStrategy, AIMode } from '../types';

export const AdminIngestionJob: React.FC = () => {
    const showToast = useNotificationStore(s => s.showToast);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Job Configuration State
    const [sourceType, setSourceType] = useState<SourceType>('Raw Text');
    const [promptProfile, setPromptProfile] = useState<PromptProfile>('SSC Objective');
    const [customPromptTweak, setCustomPromptTweak] = useState('');
    const [extractionStrategy, setExtractionStrategy] = useState<ExtractionStrategy>('Balanced');
    const [aiMode, setAiMode] = useState<AIMode>('Standard');

    // Metadata State
    const [examName, setExamName] = useState('');
    const [examYear, setExamYear] = useState(new Date().getFullYear().toString());
    const [shift, setShift] = useState('');
    const [language, setLanguage] = useState('English');
    const [tags, setTags] = useState('');

    // Payload State
    const [rawContent, setRawContent] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (sourceType === 'Raw Text' && !rawContent.trim()) {
            showToast({ title: 'Error', message: 'Raw content cannot be empty.', variant: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: IngestionJobPayload = {
                sourceType,
                promptProfile,
                customPromptTweak,
                extractionStrategy,
                aiMode,
                metadata: {
                    examName,
                    examYear,
                    shift,
                    language,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean)
                },
                rawContent,
                file: pdfFile || undefined
            };

            await dispatchIngestionJob(payload);
            showToast({ title: 'Job Dispatched', message: 'Ingestion job queued successfully.', variant: 'success' });
            setRawContent(''); setPdfFile(null); // Reset on success
        } catch (error: any) {
            showToast({ title: 'Dispatch Failed', message: error.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Source & Input */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Server className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ingestion Source</h2>
                    </div>

                    <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                        {['Raw Text', 'PDF', 'Structured JSON', 'URL'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSourceType(type as SourceType)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    sourceType === type
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {sourceType === 'Raw Text' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Raw Source Content (OCR or Copy-Paste)
                            </label>
                            <textarea
                                value={rawContent}
                                onChange={(e) => setRawContent(e.target.value)}
                                className="w-full h-96 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                                placeholder="Paste raw text here..."
                                required
                            />
                        </div>
                    )}

                    {sourceType === 'PDF' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Upload PDF Document
                            </label>
                            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors rounded-xl bg-slate-50 dark:bg-slate-950/50 relative">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {pdfFile ? (
                                    <>
                                        <FileText className="w-12 h-12 text-indigo-500 mb-4" />
                                        <p className="text-slate-800 dark:text-slate-200 font-medium text-lg">{pdfFile.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 mt-2">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <p className="text-indigo-600 dark:text-indigo-400 mt-4 text-sm font-medium hover:underline">Click or drag to replace</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Click or drag PDF to upload</p>
                                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Maximum file size: 50MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {sourceType !== 'Raw Text' && sourceType !== 'PDF' && (
                        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50">
                            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Upload support for {sourceType} is coming soon.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Configuration & Metadata */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Settings className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Configuration</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prompt Profile</label>
                            <select
                                value={promptProfile}
                                onChange={(e) => setPromptProfile(e.target.value as PromptProfile)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option>SSC Objective</option>
                                <option>BPSC Objective</option>
                                <option>UPSC GS</option>
                                <option>Railway NTPC</option>
                                <option>Custom</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Prompt Tweak (Optional)</label>
                            <textarea
                                value={customPromptTweak}
                                onChange={(e) => setCustomPromptTweak(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                                placeholder="e.g. 'Focus exclusively on numerical values in the options...'"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Extraction Strategy</label>
                            <select
                                value={extractionStrategy}
                                onChange={(e) => setExtractionStrategy(e.target.value as ExtractionStrategy)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option>Conservative</option>
                                <option>Balanced</option>
                                <option>Aggressive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">AI Mode</label>
                            <select
                                value={aiMode}
                                onChange={(e) => setAiMode(e.target.value as AIMode)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option>Fast</option>
                                <option>Standard</option>
                                <option>Agentic</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Tags className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Metadata Payload</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Exam Name</label>
                                <input
                                    type="text"
                                    value={examName}
                                    onChange={(e) => setExamName(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. SSC CGL"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
                                <input
                                    type="number"
                                    value={examYear}
                                    onChange={(e) => setExamYear(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Shift</label>
                                <input
                                    type="text"
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Shift 1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option>English</option>
                                    <option>Hindi</option>
                                    <option>Bilingual</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tags (Comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="History, Prelims, Important"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || (sourceType === 'Raw Text' && !rawContent) || (sourceType === 'PDF' && !pdfFile)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Dispatching Job...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Dispatch to Pipeline
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
