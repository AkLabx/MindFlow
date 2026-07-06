export type SourceType = 'PDF' | 'Raw Text' | 'Structured JSON' | 'URL';
export type PromptProfile = 'SSC Objective' | 'BPSC Objective' | 'UPSC GS' | 'Railway NTPC' | 'Custom';
export type ExtractionStrategy = 'Conservative' | 'Balanced' | 'Aggressive';
export type AIMode = 'Fast' | 'Standard' | 'Agentic';

export interface IngestionJobPayload {
    sourceType: SourceType;
    promptProfile: PromptProfile;
    customPromptTweak?: string;
    extractionStrategy: ExtractionStrategy;
    aiMode: AIMode;
    metadata: {
        examName: string;
        examYear: string;
        shift: string;
        language: string;
        tags: string[];
    };
    rawContent?: string;
    fileUrl?: string;
}
