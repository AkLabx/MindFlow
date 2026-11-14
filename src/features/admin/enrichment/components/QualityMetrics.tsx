import React from 'react';
import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';
import { calculateTutorQualityScore, calculateCognitiveCompletion } from '../utils/scoring';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export const QualityMetrics = ({ metrics }: { metrics: EnrichmentDashboardMetrics }) => {
    const qualityScore = calculateTutorQualityScore(metrics);
    const completion = calculateCognitiveCompletion(metrics);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold">Tutor Quality Score</h2>
                     <InfoTooltip text="Derived from public.ai_request_logs and DLQ" label="Tutor Quality Score" />
                </div>
                <div className="text-4xl font-bold text-indigo-500">{qualityScore.toFixed(1)}%</div>
                <div className="text-sm text-slate-500 mt-2">
                    {metrics?.telemetry?.schema_failures || 0} Eng. Failures | {metrics?.telemetry?.prompt_drift || 0} Ped. Failures
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold">Cognitive Completion</h2>
                     <InfoTooltip text="Progress across logical tiers" label="Cognitive Completion" />
                </div>
                <div className="text-4xl font-bold text-emerald-500">{(completion?.overall || 0).toFixed(1)}%</div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
                    <div>Lexical: {(completion?.lexical || 0).toFixed(1)}%</div>
                    <div>Tutor: {(completion?.tutor || 0).toFixed(1)}%</div>
                    <div>Memory: {(completion?.memory || 0).toFixed(1)}%</div>
                    <div>Advanced: {(completion?.advanced || 0).toFixed(1)}%</div>
                </div>
            </div>
        </div>
    );
};
