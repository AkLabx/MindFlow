import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import postgres from "https://deno.land/x/postgresjs@v3.3.5/mod.js";

function getPgClient() {
  const databaseUrl = Deno.env.get("SUPABASE_DB_URL")!;
  return postgres(databaseUrl, {
    prepare: false,
    max: 5,
    idle_timeout: 30,
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

async function callGemini(
  model: string,
  systemInstruction: string,
  payload: any,
  schema: any,
) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

  const res = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });

  const aiResponse = await res.json();
  if (!res.ok)
    throw new Error(`Gemini Error: ${aiResponse.error?.message || "Unknown"}`);

  const textOutput = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error("No output from Gemini");

  return {
    data: JSON.parse(textOutput),
    inputTokens: aiResponse.usageMetadata?.promptTokenCount || 0,
    outputTokens: aiResponse.usageMetadata?.candidatesTokenCount || 0,
  };
}

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  const sql = getPgClient();
  let jobsProcessed = 0;

  try {
    // Fetch Prompts
    const prompts = await sql`
            SELECT prompt_name, system_prompt, output_schema, version
            FROM public.ai_prompts
            WHERE prompt_name IN ('taxonomy_v1', 'translation_v1', 'teacher_v1');
        `;

    const getPrompt = (name: string) =>
      prompts.find((p: any) => p.prompt_name === name);
    const taxonomyPrompt = getPrompt("taxonomy_v1");
    const translationPrompt = getPrompt("translation_v1");
    const teacherPrompt = getPrompt("teacher_v1");

    // Dequeue
    const queueResult =
      await sql`SELECT * FROM pgmq.read('question_ai_jobs', 5, 300);`;

    for (const job of queueResult) {
      const msgId = job.msg_id;
      const payload = job.message; // { question_id, requires_agentic }
      const startTime = performance.now();
      let totalInputTokens = 0,
        totalOutputTokens = 0;
      let dlqCategory = null;
      let success = false;

      try {
        // Fetch Source Question (Ensure it is APPROVED or ENRICHMENT_PENDING)
        const qRes =
          await sql`SELECT * FROM public.questions WHERE id = ${payload.question_id} AND status IN ('APPROVED', 'ENRICHMENT_PENDING')`;
        if (qRes.length === 0)
          throw new Error("Question not found or not approved.");
        const question = qRes[0];

        let progress = question.enrichment_progress || {
          classification: false,
          translation: false,
          explanation: false,
        };
        let aiMeta = question.ai_metadata || {};
        const sourcePayload = {
          question: question.question,
          options: question.options,
          correct: question.correct,
        };

        // --- TIER 1: Classification ---
        if (!progress.classification) {
          const res = await callGemini(
            "gemini-2.5-flash",
            taxonomyPrompt.system_prompt,
            sourcePayload,
            taxonomyPrompt.output_schema,
          );

          if (res.data.subject) {
            await sql`UPDATE public.questions SET subject=${res.data.subject}, topic=${res.data.topic}, "subTopic"=${res.data.subTopic}, tags=${res.data.tags}, difficulty=${res.data.difficulty} WHERE id=${question.id}`;
          }
          progress.classification = true;
          totalInputTokens += res.inputTokens;
          totalOutputTokens += res.outputTokens;
        }

        // --- TIER 2: Localization ---
        if (!progress.translation) {
          const res = await callGemini(
            "gemini-2.5-flash",
            translationPrompt.system_prompt,
            { question: question.question, options: question.options },
            translationPrompt.output_schema,
          );

          await sql`UPDATE public.questions SET question_hi=${res.data.question_hi}, options_hi=${res.data.options_hi} WHERE id=${question.id}`;
          progress.translation = true;
          totalInputTokens += res.inputTokens;
          totalOutputTokens += res.outputTokens;
        }

        // --- TIER 3: Tutor Layer ---
        if (!progress.explanation) {
          // Agentic override check
          const model = payload.requires_agentic
            ? "gemini-2.5-pro"
            : "gemini-2.5-flash";

          const res = await callGemini(
            model,
            teacherPrompt.system_prompt,
            sourcePayload,
            teacherPrompt.output_schema,
          );

          // CONTRADICTION GUARD
          // We check if the AI directly states the correct answer is different from source.
          // This is a naive check; real implementation requires semantic similarity or an LLM judge,
          // but we simulate the DLQ routing here based on the strict instruction.
          if (
            !res.data.summary.includes(question.correct) &&
            question.correct !== null
          ) {
            dlqCategory = "ANSWER_CONTRADICTION";
            throw new Error("Explanation contradicts correct answer key.");
          }

          await sql`UPDATE public.questions SET explanation=${JSON.stringify(res.data)} WHERE id=${question.id}`;
          progress.explanation = true;
          totalInputTokens += res.inputTokens;
          totalOutputTokens += res.outputTokens;
        }

        // Mark Enriched
        await sql`UPDATE public.questions SET status = 'ENRICHED', enrichment_progress = ${JSON.stringify(progress)}, ai_metadata = ${JSON.stringify(aiMeta)} WHERE id=${question.id}`;

        // Delete Job
        await sql`SELECT pgmq.delete('question_ai_jobs', ${msgId});`;
        success = true;
      } catch (jobErr: any) {
        // DLQ Logic
        dlqCategory = dlqCategory || "ENRICHMENT_FAILED";
        await sql`SELECT pgmq.archive('question_ai_jobs', ${msgId});`;
        success = false;
      } finally {
        // Write Telemetry
        const latencyMs = Math.round(performance.now() - startTime);
        await sql`
                    INSERT INTO public.ai_request_logs (
                        feature, model, prompt_version, input_tokens, output_tokens, latency_ms, status_code, error_message, enqueued_at
                    ) VALUES (
                        'enrich-questions',
                        ${payload.requires_agentic ? "gemini-2.5-pro" : "gemini-2.5-flash"},
                        'cascade_v1',
                        ${totalInputTokens},
                        ${totalOutputTokens},
                        ${latencyMs},
                        ${success ? 200 : 500},
                        ${dlqCategory},
                        now()
                    );
                `;
        jobsProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: jobsProcessed }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  } finally {
    await sql.end();
  }
});
