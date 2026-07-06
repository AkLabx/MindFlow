import { supabase } from '@/lib/supabase';
import { IngestionJobPayload } from '../types';

export const dispatchIngestionJob = async (payload: IngestionJobPayload) => {
    // 1. Create source_document entry
    const { data: sourceDoc, error: docError } = await supabase
        .from('source_documents')
        .insert({
            filename: payload.sourceType === 'Raw Text' ? 'raw_text_import' : 'unknown_file',
            source_type: payload.sourceType,
            exam_name: payload.metadata.examName,
            exam_year: payload.metadata.examYear ? parseInt(payload.metadata.examYear) : null,
            exam_shift: payload.metadata.shift,
            language: payload.metadata.language,
            tags: payload.metadata.tags,
            prompt_profile: payload.promptProfile,
            extraction_strategy: payload.extractionStrategy,
            ai_mode: payload.aiMode,
            status: 'QUEUED'
        })
        .select()
        .single();

    if (docError) throw new Error(`Failed to create source document: ${docError.message}`);

    // 2. Dispatch to pgmq pre_phase_question_jobs
    const mqPayload = {
        source_document_id: sourceDoc.id,
        content: payload.rawContent, // The actual text to parse
        exam_name: sourceDoc.exam_name,
        exam_year: sourceDoc.exam_year,
        exam_date_shift: sourceDoc.exam_shift,
        prompt_profile: sourceDoc.prompt_profile,
        custom_tweak: payload.customPromptTweak,
        source_type: sourceDoc.source_type,
        schema_version: 1
    };

    // Use our dedicated RPC for enqueueing extraction jobs
    const { error: pgmqError } = await supabase.rpc('enqueue_extraction_job', {
        p_source_document_id: sourceDoc.id,
        p_payload: mqPayload
    });

    if (pgmqError) {
         throw new Error(`Queue dispatch failed: ${pgmqError.message}`);
    }

    return sourceDoc;
};
