import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import postgres from "https://deno.land/x/postgresjs@v3.3.5/mod.js";

// Helper function to build Postgres client
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

serve(async (req) => {
  // Determine invocation type (cron/manual trigger)
  const { method } = req;

  // We expect this to run via pg_net or manual invocation
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const sql = getPgClient();
  const supabase = createClient(supabaseUrl, supabaseKey);

  let jobsProcessed = 0;

  try {
    // 1. Fetch AI Prompt Configuration
    const promptResult = await sql`
            SELECT system_prompt, output_schema, version
            FROM public.ai_prompts
            WHERE prompt_name = 'extract_v1'
            LIMIT 1;
        `;
    if (promptResult.length === 0)
      throw new Error("extract_v1 prompt not found.");
    const promptDef = promptResult[0];

    // 2. Dequeue Jobs from PGMQ
    const queueResult =
      await sql`SELECT * FROM pgmq.read('pre_phase_question_jobs', 5, 300);`;

    for (const job of queueResult) {
      const msgId = job.msg_id;
      const payload = job.message; // e.g., { "source_text": "...", "image_url": "..." }
      const startTime = performance.now();
      let inputTokens = 0,
        outputTokens = 0;
      let success = false;
      let extractedData: any = null;

      try {
        // Determine Source Content
        const sourceContent =
          payload.source_text ||
          "Image extraction not fully implemented here yet (mocking text parsing)";

        // 3. Call Gemini (Mocking the exact API shape for brevity, you use fetch to gemini API)
        // In production, you'd use Deno.env.get('GEMINI_API_KEY') and call the official API.
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

        const geminiPayload = {
          contents: [
            {
              role: "user",
              parts: [{ text: `Source Material:\n${sourceContent}` }],
            },
          ],
          systemInstruction: { parts: [{ text: promptDef.system_prompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptDef.output_schema,
          },
        };

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        const aiResponse = await res.json();

        if (!res.ok)
          throw new Error(
            `Gemini API Error: ${aiResponse.error?.message || "Unknown"}`,
          );

        inputTokens = aiResponse.usageMetadata?.promptTokenCount || 0;
        outputTokens = aiResponse.usageMetadata?.candidatesTokenCount || 0;

        const textOutput =
          aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("No candidates returned from Gemini.");

        extractedData = JSON.parse(textOutput);
        success = true;

        // 4. Validate output explicitly (Enforcing truth > completeness)
        if (
          !extractedData.question ||
          !extractedData.options ||
          !Array.isArray(extractedData.options)
        ) {
          throw new Error(
            "Invalid output format: Missing question or options array.",
          );
        }

        // 5. Insert into questions table (Status: PENDING_REVIEW automatically due to default schema)
        const aiMetadata = {
          model: "gemini-2.5-flash",
          prompt_version: `extract_v1_v${promptDef.version}`,
          generated_at: new Date().toISOString(),
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          source_type: payload.source_text ? "TEXT" : "IMAGE",
          confidence_score: 0.94, // Mock value based on spec recommendation
        };

        await sql`
                    INSERT INTO public.questions (
                        question, options, correct, examName, examYear, examDateShift, questionType, ai_metadata, status
                    ) VALUES (
                        ${extractedData.question},
                        ${extractedData.options},
                        ${extractedData.correct || null},
                        ${extractedData.examName || null},
                        ${extractedData.examYear || null},
                        ${extractedData.examDateShift || null},
                        ${extractedData.questionType || "MCQ"},
                        ${aiMetadata},
                        'PENDING_REVIEW'
                    );
                `;

        // 6. Delete Job from queue
        await sql`SELECT pgmq.delete('pre_phase_question_jobs', ${msgId});`;
      } catch (jobErr: any) {
        // If it fails, send to DLQ (Archive)
        await sql`SELECT pgmq.archive('pre_phase_question_jobs', ${msgId});`;
        success = false;
      } finally {
        // 7. Write to ai_request_logs
        const latencyMs = Math.round(performance.now() - startTime);
        await sql`
                    INSERT INTO public.ai_request_logs (
                        feature, model, prompt_version, input_tokens, output_tokens, latency_ms, status_code, error_message, enqueued_at
                    ) VALUES (
                        'extract-questions',
                        'gemini-2.5-flash',
                        ${`extract_v1_v${promptDef.version}`},
                        ${inputTokens},
                        ${outputTokens},
                        ${latencyMs},
                        ${success ? 200 : 500},
                        ${success ? null : extractedData ? "validation_failed" : "extraction_failed"},
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
