import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.4";

const databaseUrl = Deno.env.get('SUPABASE_DB_POOLER_URL') ?? Deno.env.get('SUPABASE_DB_URL')!;
const GEMINI_TIMEOUT_MS = 25000;

// --- PIPELINE VERSIONING ---
const PIPELINE_VERSION = "2.2.0";
const WORKER_VERSION = "enrich-questions-v22";
// ---------------------------

function getPgClient() {
    return postgres(databaseUrl, {
        prepare: false,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10
    });
}

function normalizeProviderError(statusCode: number, errorBody: any): { type: string, retryAfter: number } {
    if (statusCode === 429) {
        const msg = errorBody?.error?.message || "";
        
        // 1. Check for specific temporary rate limits (RPM)
        if (msg.includes("generate_content_free_tier_requests") || msg.includes("Please retry in")) {
            const match = msg.match(/retry in ([\d\.]+)s/);
            const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 60;
            return { type: "RPM_EXHAUSTED", retryAfter };
        }
        
        // 2. Check for daily limits (RPD)
        if (msg.includes("Daily") && msg.includes("quota")) {
            return { type: "RPD_EXHAUSTED", retryAfter: 86400 };
        }
        
        // 3. Check for generic billing issues masquerading as 429s
        if (msg.includes("check your plan and billing details")) {
            return { type: "BILLING_ERROR", retryAfter: 86400 };
        }
        
        return { type: "RPM_EXHAUSTED", retryAfter: 60 };
    }
    
    if (statusCode >= 500) {
        return { type: "SERVER_ERROR", retryAfter: 60 };
    }
    
    return { type: "CLIENT_ERROR", retryAfter: 0 };
}

async function callSchedulerRpc(sql: postgres.Sql, p_task: string) {
    const result = await sql`SELECT public.get_execution_plan(${p_task}) AS plan`;
    if (result.length > 0 && result[0].plan) {
        return result[0].plan;
    }
    throw new Error("Scheduler returned no data for task: " + p_task);
}

async function reportExecution(sql: postgres.Sql, p_model: string, p_api_key_name: string, p_status_code: number, p_latency_ms: number, p_error_class: string | null, p_provider_message: string | null, p_retry_after: number = 60) {
    await sql`
        SELECT public.report_execution_result(
            ${p_model}, 
            ${p_api_key_name}, 
            ${p_status_code}, 
            ${p_latency_ms}, 
            ${p_error_class}, 
            ${p_provider_message},
            ${p_retry_after}
        )
    `;
}

async function callGeminiWithScheduler(
    sql: postgres.Sql,
    taskName: string,
    systemInstruction: string,
    payload: any,
    schema: any,
    enableSearchGrounding: boolean = false
) {
    const executionPlan = await callSchedulerRpc(sql, taskName);
    
    if (!executionPlan.success || !executionPlan.models || executionPlan.models.length === 0) {
        throw new Error(`MODEL_FAILURE: Scheduler failed for ${taskName}: ` + (executionPlan.error || "No healthy models"));
    }

    const candidates = executionPlan.models;
    let lastError: Error | null = null;

    for (const candidate of candidates) {
        const model = candidate.model;
        const keyName = candidate.api_key_name;
        const apiKey = Deno.env.get(keyName);
        
        if (!apiKey) continue;

        const reqStart = performance.now();
        let resStatus = 500;
        let providerMessage = null;
        let errorClass = "SERVER_ERROR";
        let retryAfter = 60;

        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const tools = enableSearchGrounding ? [{ googleSearch: {} }] : undefined;
            const generationConfig: any = { responseMimeType: schema ? "application/json" : "text/plain", responseSchema: schema || undefined };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
            let res: Response;
            try {
                res = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        tools,
                        generationConfig
                    }),
                    signal: controller.signal
                });
            } catch (fetchErr: any) {
                if (fetchErr?.name === 'AbortError') {
                    resStatus = 504;
                    errorClass = 'TIMEOUT';
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

                if (!textOutput) { resStatus = 502; throw new Error(`Model ${model} returned no output`); }

                let parsedData: any;
                if (schema) { try { parsedData = JSON.parse(textOutput); } catch (e) { resStatus = 502; throw e; } } else { parsedData = textOutput; }

                await reportExecution(sql, model, keyName, resStatus, Math.round(performance.now() - reqStart), null, null, 0);

                return {
                    model, data: parsedData,
                    inputTokens: aiResponse.usageMetadata?.promptTokenCount || 0,
                    outputTokens: aiResponse.usageMetadata?.candidatesTokenCount || 0,
                    rawResponse: textOutput, scheduler_version: "v1.0"
                };
            } else {
                const errBodyText = await res.text();
                let errBody = null;
                try { errBody = JSON.parse(errBodyText); } catch (e) {}

                if (errBody && errBody.error) { providerMessage = errBody.error.message; } else { providerMessage = errBodyText; }

                const classification = normalizeProviderError(resStatus, errBody);
                errorClass = classification.type;
                retryAfter = classification.retryAfter;

                throw new Error(`Model ${model} Error: ${providerMessage || 'Unknown'}`);
            }
        } catch (err: any) {
            lastError = err;
            await reportExecution(sql, model, keyName, resStatus, Math.round(performance.now() - reqStart), errorClass, providerMessage, retryAfter);
            continue; 
        }
    }
    
    throw new Error(`MODEL_FAILURE: All scheduled models failed for ${taskName}. Last Error: ${lastError?.message}`);
}

Deno.serve(async (req: Request) => {
    if (req.method !== 'POST') return new Response("Method Not Allowed", { status: 405 });

    const sql = getPgClient();
    let jobsProcessed = 0;
    const workerStartTime = performance.now();
    const WORKER_BUDGET_MS = 90 * 1000; 

    try {
        const prompts = await sql`SELECT task, system_prompt, output_schema, version FROM public.ai_prompts WHERE task IN ('question_translation_v1', 'question_teacher_v1', 'question_research_v1') AND active = true;`;
        const getPrompt = (name: string) => prompts.find((p: any) => p.task === name);
        const translationPrompt = getPrompt('question_translation_v1');
        const teacherPrompt = getPrompt('question_teacher_v1');
        const researchPrompt = getPrompt('question_research_v1');

        if (!translationPrompt || !teacherPrompt || !researchPrompt) throw new Error("PROMPT_FAILURE: Prompts missing.");

        const admissionCheck = await callSchedulerRpc(sql, 'question_translation_v1');
        if (!admissionCheck.success || !admissionCheck.models || admissionCheck.models.length === 0) {
            return new Response(JSON.stringify({ success: true, processed: 0, reason: "Admission Control: No capacity" }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        const maxRetries = admissionCheck.max_attempts || 20;
        const queueResult = await sql`SELECT * FROM pgmq.read('question_ai_jobs', 15, 1);`;
        
        for (const job of queueResult) {
            if (performance.now() - workerStartTime > WORKER_BUDGET_MS) break;

            const msgId = job.msg_id;
            const payload = job.message; 
            const startTime = performance.now();
            let totalInputTokens = 0, totalOutputTokens = 0;
            let dlqCategory = null, success = false, finalModel = '', errorMsg = '';
            
            const readCt = job.read_ct || 1;
            if (readCt > maxRetries) {
                 await sql.begin(async (tx) => {
                     if (payload.question_id) await tx`UPDATE public.questions SET status = 'FAILED' WHERE id=${payload.question_id}`;
                     await tx`SELECT pgmq.archive('question_ai_jobs', ${Number(msgId)}::bigint);`;
                 });
                 continue;
            }

            try {
                const qRes = await sql`SELECT * FROM public.questions WHERE id = ${payload.question_id} AND status IN ('APPROVED', 'ENRICHMENT_PENDING', 'ENRICHING') FOR UPDATE`;
                if (qRes.length === 0) { dlqCategory = "INVALID_STATE"; throw new Error("Question not found."); }
                const question = qRes[0];
                
                await sql`UPDATE public.questions SET status = 'ENRICHING' WHERE id = ${question.id}`;

                const currentProgress = typeof question.enrichment_progress === 'object' ? question.enrichment_progress : {};
                const sourcePayload = { question: question.question, options: question.options, correct: question.correct };

                if (!currentProgress?.translation) {
                    const res = await callGeminiWithScheduler(sql, 'question_translation_v1', translationPrompt.system_prompt, { question: question.question, options: question.options }, translationPrompt.output_schema);
                    if (!res.data.options_hi || res.data.options_hi.length !== question.options.length) { dlqCategory = 'OPTION_TRANSLATION_MISMATCH'; throw new Error("Options count mismatch"); }

                    const aiMetaAddition = { pipeline_version: PIPELINE_VERSION, worker_version: WORKER_VERSION, translation: { model: res.model, prompt_version: `question_translation_v1_v${translationPrompt.version}`, generated_at: new Date().toISOString(), input_tokens: res.inputTokens, output_tokens: res.outputTokens }, scheduler_version: res.scheduler_version };
                    
                    await sql`UPDATE public.questions SET question_hi=${res.data.question_hi ?? null}, options_hi=${res.data.options_hi ?? []}, enrichment_progress = COALESCE(enrichment_progress, '{}'::jsonb) || '{"translation": true}'::jsonb, ai_metadata = COALESCE(ai_metadata, '{}'::jsonb) || ${sql.json(aiMetaAddition)}::jsonb WHERE id=${question.id}`;
                    totalInputTokens += res.inputTokens; totalOutputTokens += res.outputTokens;
                }

                if (!currentProgress?.explanation) {
                    const researchRes = await callGeminiWithScheduler(sql, 'question_research_v1', researchPrompt.system_prompt, sourcePayload, null, true);
                    totalInputTokens += researchRes.inputTokens; totalOutputTokens += researchRes.outputTokens;

                    const formatterSystemPrompt = teacherPrompt.system_prompt + "\n\nCRITICAL INSTRUCTION: DO NOT perform any additional research. Only convert the provided research notes into the required Explanation JSON schema exactly.";
                    const res = await callGeminiWithScheduler(sql, 'question_teacher_v1', formatterSystemPrompt, { ...sourcePayload, researchNotes: researchRes.data }, teacherPrompt.output_schema, false);
                    finalModel = res.model;

                    if (!res.data.summary || !res.data.analysis_correct || !res.data.analysis_incorrect || !res.data.conclusion || !res.data.fact) { dlqCategory = 'EXPLANATION_STRUCTURE_FAILURE'; throw new Error("Missing explanation sections."); }
                    if (question.correct !== null && !res.data.summary.includes(question.correct)) { dlqCategory = 'ANSWER_CONTRADICTION'; throw new Error("Explanation contradicts correct answer."); }

                    const aiMetaAddition = { teacher: { model: res.model, prompt_version: `question_teacher_v1_v${teacherPrompt.version}_two_stage`, generated_at: new Date().toISOString(), input_tokens: res.inputTokens, output_tokens: res.outputTokens, research_model: researchRes.model, research_prompt_version: `question_research_v1_v${researchPrompt.version}` }, scheduler_version: res.scheduler_version };
                    
                    await sql`UPDATE public.questions SET explanation=${sql.json(res.data)}, enrichment_progress = COALESCE(enrichment_progress, '{}'::jsonb) || '{"explanation": true}'::jsonb, ai_metadata = COALESCE(ai_metadata, '{}'::jsonb) || ${sql.json(aiMetaAddition)}::jsonb WHERE id=${question.id}`;
                    totalInputTokens += res.inputTokens; totalOutputTokens += res.outputTokens;
                }

                await sql.begin(async (tx) => { await tx`SELECT pgmq.delete('question_ai_jobs', ${Number(msgId)}::bigint);`; });
                success = true;

            } catch (jobErr: any) {
                success = false; errorMsg = jobErr.message; dlqCategory = dlqCategory || 'MODEL_FAILURE';
                const isInfrastructureError = errorMsg.includes('MODEL_FAILURE') || errorMsg.includes('fetch') || errorMsg.includes('timeout') || errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('Scheduler failed');
                
                if (isInfrastructureError && dlqCategory !== 'INVALID_STATE') {
                    const backoffSeconds = Math.min(Math.pow(2, readCt - 1) * 60, 21600); 
                    const retryMeta = { enrichment_retries: readCt, last_retry_reason: `${dlqCategory}: ${errorMsg}`, last_retry_at: new Date().toISOString() };
                    if (payload.question_id) await sql`UPDATE public.questions SET ai_metadata = COALESCE(ai_metadata, '{}'::jsonb) || ${sql.json(retryMeta)}::jsonb WHERE id=${payload.question_id}`;
                    await sql`SELECT pgmq.set_vt('question_ai_jobs', ${Number(msgId)}::bigint, ${backoffSeconds})`;
                    break; 
                } else {
                    await sql.begin(async (tx) => {
                        if (payload.question_id) await tx`UPDATE public.questions SET status = 'FAILED' WHERE id=${payload.question_id}`;
                        await tx`SELECT pgmq.archive('question_ai_jobs', ${Number(msgId)}::bigint);`;
                    });
                }
            } finally {
                if (success || dlqCategory) {
                    await sql`INSERT INTO public.ai_request_logs (feature, model, prompt_version, input_tokens, output_tokens, latency_ms, status_code, error_message) VALUES ('enrich-questions', ${finalModel || 'cascade_fallback_chain'}, 'cascade_v1', ${totalInputTokens}, ${totalOutputTokens}, ${Math.round(performance.now() - startTime)}, ${success ? 200 : 500}, ${success ? null : (dlqCategory + ': ' + errorMsg)});`;
                }
                if (success) jobsProcessed++;
            }
        }
        return new Response(JSON.stringify({ success: true, processed: jobsProcessed }), { headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    } finally {
        await sql.end();
    }
});
