export interface ExtractedQuestion {
    id: string;
    question: string;
    options: string[];
    correct: string;
    examName?: string;
    examYear?: number;
    examDateShift?: string;
    source_document_id?: string;
    status: string;
    ai_metadata?: {
        extraction?: {
            model: string;
            prompt_version: string;
            generated_at: string;
        };
        confidence_score?: number;
        source_hash?: string;
    };
    source_documents?: {
        filename: string;
        source_type: string;
    };
}
