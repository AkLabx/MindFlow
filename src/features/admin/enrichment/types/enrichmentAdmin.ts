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

    queue_depth: number;
    current_task: string;
}

export interface EnrichmentDlqJob {
    id: string;
    word_id: string;
    error_message: string;
    task: string;
    failed_at: string;
    attempt_count: number;
}
