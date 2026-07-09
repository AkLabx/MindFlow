import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

interface ProgressMatrixProps {
    metrics: EnrichmentDashboardMetrics;
    pipelineConfig: PipelineConfig;
}

export const ProgressMatrix: React.FC<ProgressMatrixProps> = ({ metrics, pipelineConfig }) => {
    const total = metrics.progress.total_items || 1;
    const tiers = metrics.progress.tiers || {};

    const generateBar = (label: string, complete: number = 0, customTotal?: number) => {
        const basis = customTotal !== undefined ? customTotal : total;
        const percent = basis > 0 ? Math.min(100, (complete / basis) * 100) : 0;
        return (
            <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-slate-500">{complete} / {basis} ({percent.toFixed(1)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    if (pipelineConfig.id === 'vocabulary') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Cognitive Completion Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">Tier 1: Lexical</h3>
                        {generateBar('Examples', tiers.examples_complete)}
                        {generateBar('Synonyms', tiers.synonyms_complete)}
                        {generateBar('Antonyms', tiers.antonyms_complete)}
                        {generateBar('Confusables', tiers.confusables_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-blue-500">Tier 2: Tutor</h3>
                        {generateBar('Explanation', tiers.explanation_complete)}
                        {generateBar('Sense', tiers.sense_complete)}
                        {generateBar('Usage', tiers.usage_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-emerald-500">Tier 3: Memory</h3>
                        {generateBar('Mnemonic', tiers.mnemonic_complete)}
                        {generateBar('Scope', tiers.scope_complete)}
                        {generateBar('Pronunciation', tiers.pronunciation_complete)}
                        {generateBar('Etymology', tiers.etymology_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-purple-500">Tier 4: Advanced</h3>
                        {generateBar('Grammar', tiers.grammar_complete)}
                        {generateBar('Register', tiers.register_complete)}
                        {generateBar('Collocations', tiers.collocations_complete)}
                    </div>
                </div>
            </div>
        );
    }

    if (pipelineConfig.id === 'question_extraction') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Extraction Progress Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">Document States</h3>
                        {generateBar('Processing', tiers.processing_docs)}
                        {generateBar('Awaiting Review', tiers.awaiting_review_docs)}
                        {generateBar('Failed', tiers.failed_docs)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-blue-500">Extraction Stats</h3>
                        {generateBar('Pages Completed', tiers.pages_completed, tiers.total_pages || 1)}
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-500 uppercase font-semibold">Total Extracted Questions</span>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{tiers.total_extracted_questions}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pipelineConfig.id === 'question_enrichment') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Pipeline Granularity Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-slate-500">Lifecycle</h3>
                        {generateBar('Pending Review', tiers.pending_review)}
                        {generateBar('Approved (Queue)', tiers.approved)}
                        {generateBar('Enriching', tiers.enriching)}
                        {generateBar('Enriched', tiers.enriched)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">Tier 1: Classification</h3>
                        {generateBar('Subject', tiers.subject_complete)}
                        {generateBar('Topic', tiers.topic_complete)}
                        {generateBar('Subtopic', tiers.subtopic_complete)}
                        {generateBar('Difficulty', tiers.difficulty_complete)}
                        {generateBar('Tags', tiers.tags_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-blue-500">Tier 2: Localization</h3>
                        {generateBar('Question (Hindi)', tiers.question_hi_complete)}
                        {generateBar('Options (Hindi)', tiers.options_hi_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-emerald-500">Tier 3: Tutor Layer</h3>
                        {generateBar('Explanation Structure', tiers.explanation_complete)}
                        {generateBar('Grounded Search Usage', tiers.grounded_search_usage)}
                        {generateBar('Agentic Validation', tiers.agentic_tutor_usage)}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
