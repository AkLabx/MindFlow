import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const databaseUrl = Deno.env.get('SUPABASE_DB_POOLER_URL') ?? Deno.env.get('SUPABASE_DB_URL')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_TIMEOUT_MS = 35000;

function getPgClient() {
    return postgres(databaseUrl, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
}

function getSupabaseClient() {
    return createClient(supabaseUrl, supabaseServiceKey);
}

function safeParseJSON(val: any, defaultVal: any) {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }
    return defaultVal;
}

// Fallback implementation without relying on supabase-js for the RPC
async function callSchedulerRpc(sql: postgres.Sql, p_task: string) {
    const result = await sql`SELECT public.get_execution_plan(${p_task}) AS plan`;
    if (result.length > 0 && result[0].plan) {
        return result[0].plan;
    }
    throw new Error("Scheduler returned no data for task: " + p_task);
}

async function reportExecution(sql: postgres.Sql, p_model: string, p_api_key_name: string, p_status_code: number, p_latency_ms: number, p_provider_reason: string | null, p_provider_message: string | null) {
    await sql`
        SELECT public.report_execution_result(
            ${p_model}, 
            ${p_api_key_name}, 
            ${p_status_code}, 
            ${p_latency_ms}, 
            ${p_provider_reason}, 
            ${p_provider_message}
        )
    `;
}

async function callGeminiWithScheduler(
    sql: postgres.Sql,
    taskName: string,
    systemInstruction: any,
    contents: any[],
    schema: any
) {
    const executionPlan = await callSchedulerRpc(sql, taskName);
    
    if (!executionPlan.success || !executionPlan.models || executionPlan.models.length === 0) {
        throw new Error(`Scheduler failed for ${taskName}: ` + (executionPlan.error || "No healthy models"));
    }

    const candidates = executionPlan.models;
    let lastError: Error | null = null;

    for (const candidate of candidates) {
        const model = candidate.model;
        const keyName = candidate.api_key_name;
        const apiKey = Deno.env.get(keyName);
        
        if (!apiKey) {
             console.warn(`API Key mapping not found for logical name: ${keyName}`);
             continue;
        }

        const reqStart = performance.now();
        let resStatus = 500;
        let providerReason = null;
        let providerMessage = null;

        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const geminiPayload = {
                contents: contents,
                systemInstruction: systemInstruction,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
            let res: Response;
            try {
                res = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiPayload),
                    signal: controller.signal
                });
            } catch (fetchErr: any) {
                if (fetchErr?.name === 'AbortError') {
                    resStatus = 504;
                    providerReason = 'TIMEOUT';
                    providerMessage = `Gemini API request timeout after ${GEMINI_TIMEOUT_MS}ms`;
                    throw new Error(`Model ${model} timeout after ${GEMINI_TIMEOUT_MS}ms`);
                }
                throw fetchErr;
            } finally {
                clearTimeout(timeoutId);
            }

            resStatus = res.status;

            if (res.ok) {
                const aiResponse = await res.json();
                const textOutput = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!textOutput) {
                    resStatus = 502;
                    providerMessage = "Model returned no output candidates.";
                    throw new Error(`Model ${model} returned no output`);
                }

                let parsedJson;
                try { 
                    parsedJson = JSON.parse(textOutput); 
                } catch(e) { 
                    resStatus = 502;
                    providerMessage = "Failed to parse JSON.";
                    throw new Error("Failed to parse JSON."); 
                }

                // Report Success
                await reportExecution(sql, model, keyName, resStatus, Math.round(performance.now() - reqStart), null, null);

                return {
                    success: true,
                    model,
                    data: parsedJson,
                    inputTokens: aiResponse.usageMetadata?.promptTokenCount || 0,
                    outputTokens: aiResponse.usageMetadata?.candidatesTokenCount || 0,
                    latency: Math.round(performance.now() - reqStart),
                    error: null
                };
            } else {
                const errBodyText = await res.text();
                let errBody = null;
                try {
                     errBody = JSON.parse(errBodyText);
                } catch (e) {
                     providerMessage = errBodyText;
                }
                
                if (errBody && errBody.error) {
                     providerMessage = errBody.error.message;
                     providerReason = errBody.error.status;
                }

                if (res.status === 429) {
                    console.warn(`[429] Rate limit hit on ${keyName} for model ${model}. Reason: ${providerReason}`);
                }
                throw new Error(`Model ${model} Error: ${providerMessage || 'Unknown'}`);
            }
        } catch (err: any) {
            console.error(`Fallback triggered from ${model}. Error: ${err.message}`);
            lastError = err;
            
            // Report Failure
            await reportExecution(sql, model, keyName, resStatus, Math.round(performance.now() - reqStart), providerReason, providerMessage);
            
            continue; // Try next model from the scheduler
        }
    }
    
    return { success: false, model: null, data: null, inputTokens: 0, outputTokens: 0, latency: 0, error: lastError || new Error(`MODEL_FAILURE: All scheduled models failed for ${taskName}.`) };
}

// ---------------------------------------------------------------------------
// 1. Pluggable Document Parsers
// ---------------------------------------------------------------------------

interface DocumentParser {
    initialize(): Promise<void>;
    getMetadata(): any;
    getPageCount(): number;
    /** Returns the formatted payload to be sent to Gemini for a given batch. */
    extractBatch(startPage: number, endPage: number): Promise<any[]>;
    dispose(): Promise<void>;
}

class PDFParser implements DocumentParser {
    private fileData: ArrayBuffer;
    private pdfDoc: PDFDocument | null = null;
    private pageCount: number = 0;

    constructor(fileData: ArrayBuffer) {
        this.fileData = fileData;
    }

    async initialize(): Promise<void> {
        this.pdfDoc = await PDFDocument.load(this.fileData, { ignoreEncryption: true });
        this.pageCount = this.pdfDoc.getPageCount();
    }

    getMetadata(): any {
        return { type: 'PDF', pageCount: this.pageCount };
    }

    getPageCount(): number {
        return this.pageCount;
    }

    async extractBatch(startPage: number, endPage: number): Promise<any[]> {
        if (!this.pdfDoc) throw new Error("PDFParser not initialized");
        
        const batchPdf = await PDFDocument.create();
        
        const pageIndices = [];
        for (let i = startPage - 1; i < Math.min(endPage, this.pageCount); i++) {
            pageIndices.push(i);
        }
        
        if (pageIndices.length === 0) return [];

        const copiedPages = await batchPdf.copyPages(this.pdfDoc, pageIndices);
        copiedPages.forEach((page) => batchPdf.addPage(page));

        const batchPdfBytes = await batchPdf.save();
        
        const base64Pdf = encodeBase64(batchPdfBytes);

        return [{ 
            role: "user", 
            parts: [
                { text: `Extract questions from this document.` },
                { inlineData: { mimeType: "application/pdf", data: base64Pdf } }
            ] 
        }];
    }

    async dispose(): Promise<void> {
        this.pdfDoc = null;
    }
}

class RawTextParser implements DocumentParser {
    private content: string;
    private lines: string[];
    private pages: string[] = [];
    private LINES_PER_PAGE = 50;

    constructor(content: string) {
        this.content = content;
        this.lines = this.content.split('\n');
    }

    async initialize(): Promise<void> {
        for (let i = 0; i < this.lines.length; i += this.LINES_PER_PAGE) {
            this.pages.push(this.lines.slice(i, i + this.LINES_PER_PAGE).join('\n'));
        }
        if (this.pages.length === 0 && this.content.trim()) {
             this.pages.push(this.content);
        }
    }

    getMetadata(): any {
        return { type: 'RawText', pageCount: this.pages.length };
    }

    getPageCount(): number {
        return this.pages.length;
    }

    async extractBatch(startPage: number, endPage: number): Promise<any[]> {
        const batchContent = [];
        for (let i = startPage - 1; i < Math.min(endPage, this.pages.length); i++) {
            batchContent.push(this.pages[i]);
        }
        
        const combined = batchContent.join('\n\n');

        return [{ role: "user", parts: [{ text: `Source Material:\n${combined}` }] }];
    }

    async dispose(): Promise<void> {
        this.pages = [];
    }
}

// ---------------------------------------------------------------------------
// Worker Implementation
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
    if (req.method !== 'POST') return new Response("Method Not Allowed", { status: 405 });

    const sql = getPgClient();
    const supabase = getSupabaseClient();
    
    try {
        const promptResult = await sql`SELECT system_prompt, output_schema, version FROM public.ai_prompts WHERE task = 'question_extract_v1' AND active = true LIMIT 1`;
        if (promptResult.length === 0) throw new Error("question_extract_v1 prompt missing");
        const promptDef = promptResult[0];

        // Fetch task configuration (budget) from execution plan for consistency, but we still need some base config early
        const executionPlanInitial = await callSchedulerRpc(sql, 'question_extract_v1');
        const taskConfig = { batch_size: executionPlanInitial.batch_size || 3, is_enabled: executionPlanInitial.success };
        
        if (!taskConfig.is_enabled) {
            return new Response(JSON.stringify({ message: "Task disabled or no models" }), { headers: { 'Content-Type': 'application/json' } });
        }

        const WORKER_BUDGET_MS = 180 * 1000; 
        const MAX_BATCHES_PER_INVOCATION = 4;
        
        const queueResult = await sql`SELECT * FROM pgmq.read('pre_phase_question_jobs', 300, 1);`;
        if (queueResult.length === 0) return new Response(JSON.stringify({ message: "No jobs" }), { headers: { 'Content-Type': 'application/json' } });

        const job = queueResult[0];
        const msgId = job.msg_id;
        const payload = job.message; 
        const sourceDocumentId = payload.source_document_id;
        
        if (!sourceDocumentId) {
             await sql`SELECT pgmq.delete('pre_phase_question_jobs', ${Number(msgId)}::bigint);`;
             return new Response(JSON.stringify({ error: "No source_document_id" }), { status: 400 });
        }

        const workerStartTime = performance.now();
        let batchesProcessedThisRun = 0;
        let totalQuestionsExtractedThisRun = 0;

        const docResult = await sql`SELECT * FROM public.source_documents WHERE id = ${sourceDocumentId}`;
        if (docResult.length === 0) {
            await sql`SELECT pgmq.delete('pre_phase_question_jobs', ${Number(msgId)}::bigint);`;
            return new Response(JSON.stringify({ error: "Document not found" }), { status: 404 });
        }
        
        const doc = docResult[0];
        let progress = safeParseJSON(doc.extraction_progress, {});
        
        if (!progress.phase || progress.phase === 'QUEUED') {
            progress = {
                phase: "PROCESSING",
                total_pages: doc.page_count || 0,
                pages_per_batch: taskConfig.batch_size || 3,
                total_batches: 0,
                current_batch: payload.resume_from_batch || 1,
                processed_batches: 0,
                pages_completed: 0,
                total_questions_extracted: 0,
                last_completed_batch: 0,
                failed_batch: null,
                retries: 0,
                worker_runs: 0,
                last_runtime_ms: 0,
                average_pages_per_second: 0
            };
        }

        progress.worker_runs = (progress.worker_runs || 0) + 1;
        progress.phase = "PROCESSING";
        await sql`UPDATE public.source_documents SET status = 'PROCESSING', extraction_progress = ${sql.json(progress)}, processed_at = COALESCE(processed_at, NOW()) WHERE id = ${sourceDocumentId}`;

        let parser: DocumentParser;
        if (doc.source_type === "PDF" && doc.storage_bucket && doc.storage_path) {
            const { data: fileData, error: downloadError } = await supabase.storage.from(doc.storage_bucket).download(doc.storage_path);
            if (downloadError || !fileData) throw new Error(`Download failed: ${downloadError?.message}`);
            parser = new PDFParser(await fileData.arrayBuffer());
        } else {
            const content = payload.content || doc.error_message || "";
            parser = new RawTextParser(content);
        }

        await parser.initialize();
        
        if (progress.total_pages === 0) {
            progress.total_pages = parser.getPageCount();
            progress.total_batches = Math.ceil(progress.total_pages / progress.pages_per_batch);
            await sql`UPDATE public.source_documents SET page_count = ${progress.total_pages}, extraction_progress = ${sql.json(progress)} WHERE id = ${sourceDocumentId}`;
        }

        let finalError = null;
        let finalModel = null;
        while (progress.current_batch <= progress.total_batches) {
            if (performance.now() - workerStartTime > WORKER_BUDGET_MS) {
                console.log(`Worker Budget Time exhausted (${WORKER_BUDGET_MS}ms). Re-queuing...`);
                break;
            }
            if (batchesProcessedThisRun >= MAX_BATCHES_PER_INVOCATION) {
                console.log(`Worker Budget Batches exhausted (${MAX_BATCHES_PER_INVOCATION}). Re-queuing...`);
                break;
            }

            const batchStartTime = performance.now();
            const startPage = ((progress.current_batch - 1) * progress.pages_per_batch) + 1;
            const endPage = Math.min(progress.current_batch * progress.pages_per_batch, progress.total_pages);
            
            console.log(`Extracting batch ${progress.current_batch}/${progress.total_batches} (Pages ${startPage}-${endPage})`);
            
            try {
                const geminiContents = await parser.extractBatch(startPage, endPage);
                if (geminiContents.length === 0) {
                    progress.current_batch++;
                    continue; 
                }

                const executionResult = await callGeminiWithScheduler(
                    sql,
                    'question_extract_v1',
                    { parts: [{ text: promptDef.system_prompt + "\n" + (doc.custom_tweak || "") }] },
                    geminiContents,
                    { type: "ARRAY", items: promptDef.output_schema }
                );

                if (!executionResult.success) {
                    throw new Error(`Models failed: ${executionResult.error?.message}`);
                }
                
                finalModel = executionResult.model;
                const questionsArray = Array.isArray(executionResult.data) ? executionResult.data : [executionResult.data];
                let batchQuestionsAdded = 0;

                await sql.begin(async (tx) => {
                    for (const q of questionsArray) {
                        if (!q.question || q.question.trim() === '') continue; 
                        if (!q.options || !Array.isArray(q.options) || q.options.length < 3) continue; 
                        
                        const aiMetadata = {
                            extraction: {
                                model: executionResult.model,
                                prompt_version: `question_extract_v1_v${promptDef.version}`,
                                generated_at: new Date().toISOString(),
                                input_tokens: executionResult.inputTokens,
                                output_tokens: executionResult.outputTokens,
                                source_type: doc.source_type,
                                batch: progress.current_batch
                            },
                            confidence_score: 0.95
                        };
        
                        const finalExamName = q.examName || doc.exam_name || null;
                        const finalExamYear = q.examYear || doc.exam_year || null;
                        const finalExamDateShift = q.examDateShift || doc.exam_shift || null;
        
                        await tx`
                            INSERT INTO public.questions (
                                question, options, correct, "examName", "examYear", "examDateShift", "questionType", ai_metadata, status, tags, explanation, source_document_id
                            ) VALUES (
                                ${q.question}, ${q.options}, ${q.correct || null}, ${finalExamName}, ${finalExamYear}, ${finalExamDateShift}, 
                                ${q.questionType || 'MCQ'}, ${sql.json(aiMetadata)}, 'PENDING_REVIEW', ARRAY[]::text[], '{}'::jsonb, ${sourceDocumentId}
                            );
                        `;
                        batchQuestionsAdded++;
                    }
                });

                progress.processed_batches++;
                progress.last_completed_batch = progress.current_batch;
                progress.pages_completed += (endPage - startPage + 1);
                progress.total_questions_extracted += batchQuestionsAdded;
                progress.current_batch++;
                
                totalQuestionsExtractedThisRun += batchQuestionsAdded;
                batchesProcessedThisRun++;

                const batchLatency = performance.now() - batchStartTime;
                
                await sql`
                    INSERT INTO public.ai_request_logs (feature, model, prompt_version, input_tokens, output_tokens, latency_ms, status_code, message) 
                    VALUES ('extract-questions', ${executionResult.model}, ${`question_extract_v1_v${promptDef.version}`}, ${executionResult.inputTokens}, ${executionResult.outputTokens}, ${Math.round(batchLatency)}, 200, ${sql.json({ batch: progress.last_completed_batch, pages: endPage - startPage + 1, questions_extracted: batchQuestionsAdded })});
                `;

                await sql`UPDATE public.source_documents SET extraction_progress = ${sql.json(progress)} WHERE id = ${sourceDocumentId}`;

            } catch (batchErr: any) {
                console.error(`Batch ${progress.current_batch} failed:`, batchErr.message);
                finalError = batchErr;
                progress.failed_batch = progress.current_batch;
                progress.phase = "FAILED";
                await sql`UPDATE public.source_documents SET status = 'FAILED', failed_at = NOW(), error_message = ${batchErr.message}, extraction_progress = ${sql.json(progress)} WHERE id = ${sourceDocumentId}`;
                
                await sql`
                    INSERT INTO public.ai_request_logs (feature, model, prompt_version, latency_ms, status_code, error_message, message) 
                    VALUES ('extract-questions', 'unknown', ${`question_extract_v1_v${promptDef.version}`}, ${Math.round(performance.now() - batchStartTime)}, 500, ${batchErr.message}, ${sql.json({ batch: progress.current_batch })});
                `;
                
                break; 
            }
        }

        await parser.dispose();
        
        const workerTotalTime = performance.now() - workerStartTime;
        progress.last_runtime_ms = Math.round(workerTotalTime);
        if (workerTotalTime > 0 && progress.pages_completed > 0) {
             progress.average_pages_per_second = Number(((progress.pages_completed / progress.last_runtime_ms) * 1000).toFixed(2));
        }

        await sql`SELECT pgmq.delete('pre_phase_question_jobs', ${Number(msgId)}::bigint);`;

        if (!finalError) {
            if (progress.current_batch > progress.total_batches) {
                progress.phase = "COMPLETED";
                await sql`UPDATE public.source_documents SET status = 'AWAITING_REVIEW', completed_at = NOW(), last_worker = 'extract-questions', last_model = ${finalModel}, extraction_progress = ${sql.json(progress)} WHERE id = ${sourceDocumentId}`;
            } else {
                progress.phase = "QUEUED";
                await sql`UPDATE public.source_documents SET extraction_progress = ${sql.json(progress)} WHERE id = ${sourceDocumentId}`;
                
                const newPayload = { source_document_id: sourceDocumentId, resume_from_batch: progress.current_batch };
                await sql`SELECT pgmq.send('pre_phase_question_jobs', ${sql.json(newPayload)}::jsonb);`;
            }
        }

        return new Response(JSON.stringify({ success: true, processed_batches: batchesProcessedThisRun, questions_extracted: totalQuestionsExtractedThisRun }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error("Worker Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    } finally {
        await sql.end();
    }
});
