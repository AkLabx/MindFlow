export interface ModelDistribution {
    [key: string]: number;
}

export interface EnrichmentDashboardMetrics {
    pipeline_active: boolean;
    queue_depth: number;
    current_task: string;
    dlq_count: number;
    last_success_minutes: number;
    gemini_requests_today: number;
    edge_invocations_today: number;
    estimated_completion_days: number;
    examples_complete: number;
    examples_total: number;
    synonyms_complete: number;
    synonyms_total: number;
    antonyms_complete: number;
    antonyms_total: number;
    confusables_complete: number;
    confusables_total: number;
    avg_runtime_examples: number;
    avg_runtime_synonyms: number;
    avg_tokens_per_request: number;
    consecutive_failures: number;
    model_distribution: ModelDistribution;
}

export interface EnrichmentDlqJob {
    id: string;
    word_id: string;
    error_message: string;
    task: string;
    failed_at: string;
    attempt_count: number;
}
