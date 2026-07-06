export type PipelineType = 'vocabulary' | 'question_enrichment';

export interface MatrixTier {
    key: string;
    label: string;
    description?: string;
}

export interface PipelineConfig {
    id: PipelineType;
    label: string;
    queueName: string;
    dlqSource: 'enrichment_dlq' | 'pgmq_archive';
    metricsProvider: 'rpc' | 'adapter';
    completionTiers: MatrixTier[];
    supportedWidgets: string[];
}

export const PIPELINE_REGISTRY: Record<PipelineType, PipelineConfig> = {
    vocabulary: {
        id: 'vocabulary',
        label: 'Vocabulary Tutor',
        queueName: 'enrichment_jobs', // assuming this or handled by rpc
        dlqSource: 'enrichment_dlq',
        metricsProvider: 'rpc',
        completionTiers: [
            { key: 'examples', label: 'Examples' },
            { key: 'synonyms', label: 'Synonyms' },
            { key: 'antonyms', label: 'Antonyms' },
            { key: 'confusables', label: 'Confusables' },
            { key: 'explanation', label: 'Explanation' },
            { key: 'sense', label: 'Sense' },
            { key: 'usage', label: 'Usage' },
            { key: 'scope', label: 'Scope' },
            { key: 'mnemonic', label: 'Mnemonic' },
            { key: 'collocations', label: 'Collocations' },
            { key: 'etymology', label: 'Etymology' },
            { key: 'pronunciation', label: 'Pronunciation' },
            { key: 'grammar', label: 'Grammar' },
            { key: 'register', label: 'Register' }
        ],
        supportedWidgets: ['HeroCard', 'ActionPanel', 'QualityMetrics', 'QueueIntelligence', 'PhaseLatency', 'ProgressMatrix', 'TokenEconomics', 'TaskTuning', 'DLQInspector']
    },
    question_enrichment: {
        id: 'question_enrichment',
        label: 'Question Enrichment',
        queueName: 'question_ai_jobs',
        dlqSource: 'pgmq_archive',
        metricsProvider: 'adapter',
        completionTiers: [
            { key: 'classification', label: 'Tier 1 - Classification' },
            { key: 'translation', label: 'Tier 2 - Localization' },
            { key: 'explanation', label: 'Tier 3 - Tutor Layer' }
        ],
        supportedWidgets: ['HeroCard', 'ActionPanel', 'QualityMetrics', 'QueueIntelligence', 'ProgressMatrix', 'TokenEconomics', 'TaskTuning', 'DLQInspector']
    }
};
