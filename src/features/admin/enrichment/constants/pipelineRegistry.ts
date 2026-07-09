export type PipelineType = 'vocabulary' | 'question_extraction' | 'question_enrichment';

export interface MatrixTier {
    key: string;
    label: string;
    description?: string;
}

export interface PipelineConfig {
    id: PipelineType;
    label: string;
    supportedWidgets: string[];
}

export const PIPELINE_REGISTRY: Record<PipelineType, PipelineConfig> = {
    vocabulary: {
        id: 'vocabulary',
        label: 'Vocabulary Tutor',
        supportedWidgets: ['HeroCard', 'ActionPanel', 'QualityMetrics', 'QueueIntelligence', 'PhaseLatency', 'ProgressMatrix', 'TokenEconomics', 'TaskTuning', 'DLQInspector']
    },
    question_extraction: {
        id: 'question_extraction',
        label: 'Question Extraction',
        supportedWidgets: ['HeroCard', 'ActionPanel', 'QueueIntelligence', 'ProgressMatrix', 'TokenEconomics', 'TaskTuning', 'DLQInspector']
    },
    question_enrichment: {
        id: 'question_enrichment',
        label: 'Question Enrichment',
        supportedWidgets: ['HeroCard', 'ActionPanel', 'QueueIntelligence', 'ProgressMatrix', 'TokenEconomics', 'TaskTuning', 'DLQInspector']
    }
};
