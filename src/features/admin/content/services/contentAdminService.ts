import { supabase } from '@/lib/supabase';
import { IngestionJobPayload } from '../types';

export const dispatchIngestionJob = async (payload: IngestionJobPayload) => {
    let finalStoragePath = null;
    let finalFilename = payload.sourceType === 'Raw Text' ? 'raw_text_import' : 'unknown_file';
    let mimeType = 'text/plain';
    let fileSize = payload.rawContent.length

    // 1. If PDF, upload to content_studio
    if (payload.sourceType === 'PDF' && payload.file) {
        finalFilename = payload.file.name;
        mimeType = payload.file.type;
        fileSize = payload.file.size;
        
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const uuid = crypto.randomUUID();
       const extension = payload.file.name
        .split('.')
        .pop()
        ?.toLowerCase() || 'pdf';
        const storagePath = pdfs/${year}/${month}/${uuid}.${extension}`;
        const { error: uploadError } = await supabase.storage
            .from('content_studio')
            .upload(storagePath, payload.file);

        if (uploadError) {
            throw new Error(`PDF Upload Failed: ${uploadError.message}`);
        }

        finalStoragePath = storagePath;
    }

    // 2. Create source_document entry
    const { data: sourceDoc, error: docError } = await supabase
        .from('source_documents')
        .insert({
            filename: finalFilename,
            source_type: payload.sourceType,
            storage_bucket: payload.sourceType === 'PDF' ? 'content_studio' : null,
            storage_path: finalStoragePath,
            mime_type: mimeType,
            file_size: fileSize,
            exam_name: payload.metadata.examName,
            exam_year: payload.metadata.examYear ? parseInt(payload.metadata.examYear) : null,
            exam_shift: payload.metadata.shift,
            language: payload.metadata.language,
            tags: payload.metadata.tags,
            prompt_profile: payload.promptProfile,
            extraction_strategy: payload.extractionStrategy,
            ai_mode: payload.aiMode,
            status: 'QUEUED',
            schema_version: 1
        })
       .select(`
id,
storage_bucket,
storage_path,
exam_name,
exam_year,
exam_shift,
prompt_profile,
source_type
`)
.single();
    if (docError) throw new Error(`Failed to create source document: ${docError.message}`);

    // 3. Dispatch to pgmq pre_phase_question_jobs
   const mqPayload = {

    source_document_id: sourceDoc.id,

    content: payload.rawContent,

    storage_bucket: sourceDoc.storage_bucket,

    storage_path: sourceDoc.storage_path,

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
