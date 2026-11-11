import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    UploadCloud, FileText, Settings, Play, Server, Tags,
    RefreshCw, Zap, CheckCircle2, AlertCircle, Clock, ArrowRight, RotateCcw
} from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { 
    dispatchIngestionJob, 
    fetchRecentSourceDocuments, 
    triggerExtractionWorker, 
    retrySourceDocument,
    SourceDocumentRecord 
} from '../services/contentAdminService';
import { IngestionJobPayload, SourceType, PromptProfile, ExtractionStrategy, AIMode } from '../types';

interface AdminIngestionJobProps {
    onNavigateToReview?: () => void;
}

export const AdminIngestionJob: React.FC<AdminIngestionJobProps> = ({ onNavigateToReview }) => {
    const showToast = useNotificationStore(s => s.showToast);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);

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

    // Live Ingestion History & Monitor Query
    const { 
        data: recentDocuments, 
        isLoading: isLoadingDocs, 
        refetch: refetchDocs, 
        isFetching: isFetchingDocs 
    } = useQuery<SourceDocumentRecord[]>({
        queryKey: ['recent_source_documents'],
        queryFn: () => fetchRecentSourceDocuments(15),
        refetchInterval: (query) => {
            const data = query.state.data;
            const hasActive = data?.some(d => d.status === 'QUEUED' || d.status === 'PROCESSING');
            return hasActive ? 4000 : 20000;
        }
    });

    const handleTriggerWorker = async () => {
        setIsTriggering(true);
        try {
            await triggerExtractionWorker();
            showToast({ title: 'Worker Triggered', message: 'extract-questions worker dispatched to queue.', variant: 'success' });
            setTimeout(() => refetchDocs(), 1200);
        } catch (err: any) {
            showToast({ title: 'Trigger Failed', message: err.message, variant: 'error' });
        } finally {
            setIsTriggering(false);
        }
    };

    const handleRetry = async (id: string) => {
        setRetryingId(id);
        try {
            await retrySourceDocument(id);
            showToast({ title: 'Document Re-queued', message: 'Job reset to QUEUED and worker dispatched.', variant: 'success' });
            refetchDocs();
        } catch (err: any) {
            showToast({ title: 'Retry Failed', message: err.message, variant: 'error' });
        } finally {
            setRetryingId(null);
        }
    };

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
            showToast({ title: 'Job Dispatched', message: 'Ingestion job queued in pgmq successfully.', variant: 'success' });
            setRawContent(''); 
            setPdfFile(null);
            
            // Trigger worker and refresh list immediately
            triggerExtractionWorker().catch(() => {});
            setTimeout(() => refetchDocs(), 1000);
        } catch (error: any) {
            showToast({ title: 'Dispatch Failed', message: error.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string, errorMsg?: string | null) => {
        switch (status) {
            case 'QUEUED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Queued in PGMQ
                    </span>
                );
            case 'PROCESSING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Extracting Pages
                    </span>
                );
            case 'AWAITING_REVIEW':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Awaiting Review
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                        Completed
                    </span>
                );
            case 'FAILED':
                return (
                    <span 
                        title={errorMsg || 'Worker execution failed'} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-help"
                    >
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-10">
            {/* Form Section */}
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

            {/* Bottom Section: Real-time Ingestion Batches & Activity Monitor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Ingestion Pipeline Activity & Recent Batches</span>
                            {recentDocuments?.some(d => d.status === 'QUEUED' || d.status === 'PROCESSING') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Active Pipeline
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Live status of documents queued in PGMQ, extraction batches, and questions awaiting faculty review.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => refetchDocs()}
                            disabled={isFetchingDocs}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDocs ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleTriggerWorker}
                            disabled={isTriggering}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                        >
                            <Zap className={`w-3.5 h-3.5 ${isTriggering ? 'animate-bounce' : 'fill-current'}`} />
                            {isTriggering ? 'Running...' : 'Run Worker Now'}
                        </button>
                    </div>
                </div>

                {/* Table or Empty State */}
                {isLoadingDocs ? (
                    <div className="py-12 flex justify-center items-center gap-2 text-sm text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        Loading ingestion pipeline activity...
                    </div>
                ) : !recentDocuments || recentDocuments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents ingested yet</p>
                        <p className="text-xs text-slate-500 mt-1">Upload a PDF or paste raw questions above to start the pipeline.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Document / Source</th>
                                    <th className="py-3 px-4">Exam Context</th>
                                    <th className="py-3 px-4">Pipeline Status</th>
                                    <th className="py-3 px-4">Progress & Yield</th>
                                    <th className="py-3 px-4">Ingested At</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {recentDocuments.map((doc) => {
                                    const progress = doc.extraction_progress;
                                    const questionsExtracted = progress?.total_questions_extracted ?? 0;
                                    const totalPages = doc.page_count ?? progress?.total_pages ?? 1;
                                    const pagesCompleted = progress?.pages_completed ?? 0;

                                    return (
                                        <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 max-w-xs">
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.filename}>
                                                            {doc.filename === 'raw_text_import' ? 'Raw Text Ingestion' : doc.filename}
                                                        </p>
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            {doc.source_type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">
                                                    {doc.exam_name || 'Standard Ingestion'}
                                                </div>
                                                <div className="text-slate-400">
                                                    {doc.exam_year ? `Year ${doc.exam_year}` : 'Unspecified year'}
                                                    {doc.exam_shift ? ` • ${doc.exam_shift}` : ''}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(doc.status, doc.error_message)}
                                            </td>

                                            <td className="py-3.5 px-4 text-xs">
                                                {doc.status === 'FAILED' ? (
                                                    <span className="text-red-500 font-mono truncate max-w-xs block" title={doc.error_message || ''}>
                                                        {doc.error_message || 'Batch execution failure'}
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                                            {questionsExtracted} Questions Extracted
                                                        </div>
                                                        <div className="text-slate-400 text-[11px]">
                                                            {pagesCompleted} of {totalPages} pages processed
                                                            {progress?.last_runtime_ms ? ` (${(progress.last_runtime_ms / 1000).toFixed(1)}s)` : ''}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 opacity-60" />
                                                    {new Date(doc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {new Date(doc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                {doc.status === 'AWAITING_REVIEW' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateToReview?.()}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
                                                    >
                                                        Review Queue
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {doc.status === 'QUEUED' && (
                                                    <button
                                                        type="button"
                                                        onClick={handleTriggerWorker}
                                                        disabled={isTriggering}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 transition-colors"
                                                    >
                                                        <Zap className="w-3 h-3 fill-current" />
                                                        Run Now
                                                    </button>
                                                )}

                                                {doc.status === 'FAILED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetry(doc.id)}
                                                        disabled={retryingId === doc.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 transition-colors"
                                                    >
                                                        <RotateCcw className={`w-3 h-3 ${retryingId === doc.id ? 'animate-spin' : ''}`} />
                                                        Retry
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default AdminIngestionJob;
