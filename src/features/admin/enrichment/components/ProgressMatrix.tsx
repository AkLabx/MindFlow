import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

interface ProgressMatrixProps {
    metrics: EnrichmentDashboardMetrics;
    pipelineConfig: PipelineConfig;
}

export const ProgressMatrix: React.FC<ProgressMatrixProps> = ({ metrics, pipelineConfig }) => {
    const total = metrics.total_words || 1;

    // A helper to map the generic keys from pipelineConfig back to the metric values
    // Since we temporarily adapted the adapter to output examples_complete for Tier 1, etc.,
    // we map them here. When the backend is fully unified, this logic will just access metrics[tier.key].
    const getMetricValue = (key: string): number => {
        if (pipelineConfig.id === 'question_enrichment') {
            if (key === 'classification') return metrics.examples_complete || 0;
            if (key === 'translation') return metrics.synonyms_complete || 0;
            if (key === 'explanation') return metrics.antonyms_complete || 0;
        }
        return (metrics as any)[`${key}_complete`] || 0;
    };

    const generateBar = (label: string, complete: number) => {
        const percent = Math.min(100, (complete / total) * 100);
        return (
            <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-slate-500">{complete} / {total} ({percent.toFixed(1)}%)</span>
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
        // Render the original 4-tier matrix for Vocabulary
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Cognitive Completion Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">Tier 1: Lexical</h3>
                        {generateBar('Examples', metrics.examples_complete)}
                        {generateBar('Synonyms', metrics.synonyms_complete)}
                        {generateBar('Antonyms', metrics.antonyms_complete)}
                        {generateBar('Confusables', metrics.confusables_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-blue-500">Tier 2: Tutor</h3>
                        {generateBar('Explanation', metrics.explanation_complete)}
                        {generateBar('Sense', metrics.sense_complete)}
                        {generateBar('Usage', metrics.usage_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-emerald-500">Tier 3: Memory</h3>
                        {generateBar('Mnemonic', metrics.mnemonic_complete)}
                        {generateBar('Scope', metrics.scope_complete)}
                        {generateBar('Pronunciation', metrics.pronunciation_complete)}
                        {generateBar('Etymology', metrics.etymology_complete)}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-purple-500">Tier 4: Advanced</h3>
                        {generateBar('Grammar', metrics.grammar_complete)}
                        {generateBar('Register', metrics.register_complete)}
                        {generateBar('Collocations', metrics.collocations_complete)}
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic rendering for other pipelines (Question Enrichment)
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Cognitive Completion Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {pipelineConfig.completionTiers.map((tier) => (
                     <div key={tier.key}>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">{tier.label}</h3>
                        {generateBar('Complete', getMetricValue(tier.key))}
                     </div>
                ))}
            </div>
        </div>
    );
};
