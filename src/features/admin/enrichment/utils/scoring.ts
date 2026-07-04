import { EnrichmentDashboardMetrics } from '../types/enrichmentAdmin';

export const calculateTutorQualityScore = (metrics: EnrichmentDashboardMetrics): number => {
    if (!metrics) return 0;

    // Base score is 100
    let score = 100;

    // Penalize based on recent failure volumes (Approximation)
    // 1 schema failure = -0.5%
    // 1 prompt drift = -1% (weighted heavier as it's a silent failure)
    // 1 DLQ item = -0.1%
    // 1 consecutive failure = -2%

    const schemaPenalty = (metrics.schema_failures || 0) * 0.5;
    const driftPenalty = (metrics.prompt_drift_incidents || 0) * 1.0;
    const dlqPenalty = (metrics.dlq_count || 0) * 0.1;
    const consecutiveFailuresPenalty = (metrics.consecutive_failures || 0) * 2.0;

    score = score - schemaPenalty - driftPenalty - dlqPenalty - consecutiveFailuresPenalty;

    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
};

export const calculateCognitiveCompletion = (metrics: EnrichmentDashboardMetrics) => {
    if (!metrics || !metrics.total_words) return { lexical: 0, tutor: 0, memory: 0, advanced: 0, overall: 0 };

    const total = metrics.total_words;

    // Tier 1 - Lexical Foundation
    const lexicalTasksComplete =
        metrics.examples_complete +
        metrics.synonyms_complete +
        metrics.antonyms_complete +
        metrics.confusables_complete;
    const lexicalTarget = total * 4;
    const lexical = lexicalTarget > 0 ? (lexicalTasksComplete / lexicalTarget) * 100 : 0;

    // Tier 2 - Tutor Layer
    const tutorTasksComplete =
        metrics.explanation_complete +
        metrics.sense_complete +
        metrics.usage_complete;
    const tutorTarget = total * 3;
    const tutor = tutorTarget > 0 ? (tutorTasksComplete / tutorTarget) * 100 : 0;

    // Tier 3 - Cognitive Memory Layer
    const memoryTasksComplete =
        metrics.scope_complete +
        metrics.mnemonic_complete +
        metrics.etymology_complete +
        metrics.pronunciation_complete;
    const memoryTarget = total * 4;
    const memory = memoryTarget > 0 ? (memoryTasksComplete / memoryTarget) * 100 : 0;

    // Tier 4 - Advanced Learning Layer
    const advancedTasksComplete =
        metrics.collocations_complete +
        metrics.grammar_complete +
        metrics.register_complete;
    const advancedTarget = total * 3;
    const advanced = advancedTarget > 0 ? (advancedTasksComplete / advancedTarget) * 100 : 0;

    const overall = (lexical + tutor + memory + advanced) / 4;

    return { lexical, tutor, memory, advanced, overall };
};
