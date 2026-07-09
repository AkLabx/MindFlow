import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const calculateTutorQualityScore = (metrics: EnrichmentDashboardMetrics): number => {
    if (!metrics) return 0;

    let score = 100;
    const schemaPenalty = (metrics.telemetry.schema_failures || 0) * 0.5;
    const driftPenalty = (metrics.telemetry.prompt_drift || 0) * 1.0;
    const dlqPenalty = (metrics.hero.dlq_count || 0) * 0.1;
    const consecutiveFailuresPenalty = (metrics.telemetry.consecutive_failures || 0) * 2.0;

    score = score - schemaPenalty - driftPenalty - dlqPenalty - consecutiveFailuresPenalty;
    return Math.max(0, Math.min(100, score));
};

export const calculateCognitiveCompletion = (metrics: EnrichmentDashboardMetrics) => {
    const defaultStats = { lexical: 0, tutor: 0, memory: 0, advanced: 0, overall: 0 };
    if (!metrics || !metrics.progress.total_items) return defaultStats;
    if (metrics.pipeline !== 'vocabulary') return defaultStats; // Only valid for Vocab currently based on scoring logic

    const total = metrics.progress.total_items;
    const tiers = metrics.progress.tiers;

    const lexicalTasksComplete = (tiers.examples_complete || 0) + (tiers.synonyms_complete || 0) + (tiers.antonyms_complete || 0) + (tiers.confusables_complete || 0);
    const lexicalTarget = total * 4;
    const lexical = lexicalTarget > 0 ? (lexicalTasksComplete / lexicalTarget) * 100 : 0;

    const tutorTasksComplete = (tiers.explanation_complete || 0) + (tiers.sense_complete || 0) + (tiers.usage_complete || 0);
    const tutorTarget = total * 3;
    const tutor = tutorTarget > 0 ? (tutorTasksComplete / tutorTarget) * 100 : 0;

    const memoryTasksComplete = (tiers.scope_complete || 0) + (tiers.mnemonic_complete || 0) + (tiers.etymology_complete || 0) + (tiers.pronunciation_complete || 0);
    const memoryTarget = total * 4;
    const memory = memoryTarget > 0 ? (memoryTasksComplete / memoryTarget) * 100 : 0;

    const advancedTasksComplete = (tiers.collocations_complete || 0) + (tiers.grammar_complete || 0) + (tiers.register_complete || 0);
    const advancedTarget = total * 3;
    const advanced = advancedTarget > 0 ? (advancedTasksComplete / advancedTarget) * 100 : 0;

    const overall = (lexical + tutor + memory + advanced) / 4;

    return { lexical, tutor, memory, advanced, overall };
};
