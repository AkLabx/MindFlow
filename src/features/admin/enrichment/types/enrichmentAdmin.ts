export interface ModelDistribution {
    [key: string]: number;
}

export interface QueueIntelligenceItem {
    task: string;
    pending: number;
    running: number;
    retry_pending: number;
}

export interface EnrichmentDashboardMetrics {
    pipeline_active: boolean;
    queue_intelligence: QueueIntelligenceItem[];
    dlq_count: number;
    last_success_minutes: number;
    gemini_requests_today: number;
    edge_invocations_today: number;
    examples_complete: number;
    synonyms_complete: number;
    antonyms_complete: number;
    confusables_complete: number;
    explanation_complete: number;
    sense_complete: number;
    usage_complete: number;
    scope_complete: number;
    mnemonic_complete: number;
    collocations_complete: number;
    etymology_complete: number;
    pronunciation_complete: number;
    grammar_complete: number;
    register_complete: number;
    total_words: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
    consecutive_failures: number;
    model_distribution: ModelDistribution;
    schema_failures: number;
    prompt_drift_incidents: number;
}

export interface EnrichmentDlqJob {
    id: string;
    word_id: string;
    error_message: string;
    task: string;
    failed_at: string;
    attempt_count: number;
}

export interface WordLineageLog {
    id: string;
    created_at: string;
    model: string;
    task: string;
    session_success: boolean;
    error_type: string | null;
    latency_ms: number;
    input_tokens: number;
    output_tokens: number;
}

export interface WordLineageData {
    word_id: string;
    word: string;
    ai_metadata: Record<string, any>;
    history: WordLineageLog[];
    dlq: EnrichmentDlqJob[];
}

export interface PipelineTimelineEvent {
    time: string;
    task: string;
    model: string;
    duration: number;
    result: string;
}

export interface PromptRegistryItem {
    task: string;
    version: string;
    active: boolean;
    success_rate: number;
}
