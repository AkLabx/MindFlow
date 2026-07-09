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
    pipeline: string;
    hero: {
        is_active: boolean;
        queue_depth: number;
        dlq_count: number;
        last_success_minutes: number;
    };
    queues: {
        intelligence: QueueIntelligenceItem[];
    };
    progress: {
        total_items: number;
        tiers: any; // Dynamic depending on pipeline
    };
    telemetry: {
        requests_today: number;
        edge_invocations_today: number;
        avg_input_tokens: number;
        avg_output_tokens: number;
        schema_failures: number;
        prompt_drift: number;
        consecutive_failures: number;
    };
    models: {
        distribution: ModelDistribution;
        phase_latency: { [key: string]: { phase_fetch_ms: number; phase_gemini_ms: number; phase_validation_ms: number; phase_db_write_ms: number; latency_ms: number; } };
        success_rate: { [key: string]: number };
    };
}

export interface EnrichmentDlqJob {
    id: string;
    word_id: string; // Used for questions/documents as well
    error_message: string;
    task: string;
    failed_at: string;
    attempt_count: number;
}

export interface AiTaskConfig {
    task: string;
    batch_size: number;
    priority: number;
    visibility_timeout: number;
    max_attempts: number;
    cooldown_seconds: number;
    is_enabled: boolean;
    model_chain: string[];
}
