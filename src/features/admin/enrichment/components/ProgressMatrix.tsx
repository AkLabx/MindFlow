import React from 'react';
import type { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { PipelineConfig } from '../constants/pipelineRegistry';

interface ProgressMatrixProps {
    metrics: EnrichmentDashboardMetrics;
    pipelineConfig: PipelineConfig;
}

export const ProgressMatrix: React.FC<ProgressMatrixProps> = ({ metrics, pipelineConfig }) => {
    const isVocab = pipelineConfig.id === 'vocabulary';
    const total = isVocab ? (metrics.total_words || 1) : (metrics.total_questions || 1);

    const generateBar = (label: string, complete: number = 0) => {
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

    if (isVocab) {
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

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Pipeline Granularity Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-indigo-500">Tier 1: Classification</h3>
                    {generateBar('Subject', metrics.q_subject_complete)}
                    {generateBar('Topic', metrics.q_topic_complete)}
                    {generateBar('Subtopic', metrics.q_subtopic_complete)}
                    {generateBar('Difficulty', metrics.q_difficulty_complete)}
                    {generateBar('Tags', metrics.q_tags_complete)}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-blue-500">Tier 2: Localization</h3>
                    {generateBar('Question (Hindi)', metrics.q_question_hi_complete)}
                    {generateBar('Options (Hindi)', metrics.q_options_hi_complete)}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider text-emerald-500">Tier 3: Tutor Layer</h3>
                    {generateBar('Explanation Structure', metrics.q_explanation_complete)}
                    {generateBar('Grounded Search Usage', metrics.q_grounded_search_usage)}
                    {generateBar('Agentic Validation', metrics.q_agentic_tutor_usage)}
                </div>
            </div>
        </div>
    );
};
