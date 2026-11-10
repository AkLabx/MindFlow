import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GROUNDING_TIMEOUT_MS = 12000;
const GENERATION_TIMEOUT_MS = 25000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function reportExecution(supabaseAdmin: any, model: string, apiKeyName: string, statusCode: number, latencyMs: number, errorClassification: string | null = null, providerMessage: string | null = null) {
  try {
    await supabaseAdmin.rpc('report_execution_result', {
      p_model: model,
      p_api_key_name: apiKeyName,
      p_status_code: statusCode,
      p_latency_ms: latencyMs,
      p_error_classification: errorClassification,
      p_provider_message: providerMessage
    });
  } catch (error) {
    console.error('Failed to report execution result:', error);
  }
}

async function getExecutionPlan(supabaseAdmin: any, taskName: string) {
  const { data, error } = await supabaseAdmin.rpc('get_execution_plan', { p_task: taskName });
  if (error) throw error;
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized (No header)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized (Invalid Token)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const { questionId, locale = 'en' } = await req.json();

    // Fetch the question including the ask_ai_explanation cache column
    const { data: dbQuestion, error: qError } = await supabaseAdmin
      .from('questions')
      .select('question, options, correct, ask_ai_explanation')
      .eq('id', questionId)
      .single();

    if (qError || !dbQuestion) {
      return new Response(JSON.stringify({ error: 'Question not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    // --- CACHE CHECK ---
    // If the database already has the AI explanation saved, return it immediately!
    if (dbQuestion.ask_ai_explanation) {
      return new Response(JSON.stringify(dbQuestion.ask_ai_explanation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const questionText = dbQuestion.question;
    const options = dbQuestion.options;
    const correctAnswer = dbQuestion.correct;

    // --- STAGE 1: GROUNDING LAYER ---
    let recentNewsContext = "No recent news available.";

    const groundingApiKey = Deno.env.get('GROUNDING_API_KEY');
    const groundingModel = Deno.env.get('GROUNDING_MODEL');

    if (groundingApiKey && groundingModel) {
      const groundingController = new AbortController();
      const groundingTimer = setTimeout(() => groundingController.abort(), GROUNDING_TIMEOUT_MS);
      try {
        const maskedKey = groundingApiKey.substring(0, 4) + "..." + groundingApiKey.substring(groundingApiKey.length - 4);
        const groundingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${groundingModel}:generateContent?key=${groundingApiKey}`;
        const groundingPrompt = `Provide a very short summary (2-3 sentences) of the most recent news related to this topic if applicable: "${questionText}". Today is ${new Date().toISOString().split('T')[0]}. If no significant news exists, say exactly "No recent news available."`;

        const startTimeGrounding = Date.now();
        const groundingResponse = await fetch(groundingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: groundingPrompt }] }],
            tools: [{ googleSearch: {} }]
          }),
          signal: groundingController.signal
        });
        const latencyGrounding = Date.now() - startTimeGrounding;

        let groundingData = null;
        let responseText = '';
        try {
          responseText = await groundingResponse.text();
          groundingData = JSON.parse(responseText);
        } catch (_e) {
          // Ignore parse errors, handle in status checks
        }

        console.log(`[STAGE 1] Execution Details:\n- GROUNDING_MODEL: ${groundingModel}\n- GROUNDING_API_KEY: ${maskedKey}\n- HTTP Status: ${groundingResponse.status}\n- Latency: ${latencyGrounding}ms\n- Token Usage: ${JSON.stringify(groundingData?.usageMetadata || 'N/A')}`);

        if (groundingResponse.ok && groundingData) {
          if (groundingData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            recentNewsContext = groundingData.candidates[0].content.parts[0].text.trim();
            console.log(`[STAGE 1] Success. Extracted context.`);
          } else {
            console.warn(`[STAGE 1] Grounding succeeded but returned empty candidate/invalid JSON. Using fallback.`);
          }
        } else {
          console.warn(`[STAGE 1] Grounding Failed! Status: ${groundingResponse.status}`);
        }
      } catch (e: any) {
        console.error("[STAGE 1] Grounding Exception during network fetch:", e?.message || e);
      } finally {
        clearTimeout(groundingTimer);
      }
    } else {
      console.warn("[STAGE 1] GROUNDING_API_KEY or GROUNDING_MODEL is not set in secrets. Bypassing Grounding layer entirely.");
    }

    // --- STAGE 2: GENERATION LAYER ---
    let executionPlan;
    try {
      executionPlan = await getExecutionPlan(supabaseAdmin, 'ask_ai_tutor');
      if (!executionPlan || !executionPlan.models || executionPlan.models.length === 0) {
        throw new Error("No healthy models available for Ask AI Tutor");
      }
    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const promptInstruction = `
You are an expert, highly reliable educational tutor. Analyze this multiple-choice question and provide a detailed explanation (locale: ${locale}).
You MUST preserve educational correctness over creativity.
CRITICAL HALLUCINATION RULES:
- NEVER fabricate exam facts or PYQ references.
- DO NOT invent recent news. Use the provided context.
- If you cannot verify facts for an array, return an empty array []. Safe emptiness is always preferred over fabricated confidence.
- Output ONLY strictly valid, parseable JSON. Do NOT output markdown code fences or conversational text outside the JSON object.

Question: "${questionText}"
Options: ${JSON.stringify(options)}
Correct Answer: "${correctAnswer}"

Context regarding recent news for this topic (Date: ${todayDate}):
${recentNewsContext}

JSON Schema (Version v1):
{
  "correct_answer": "The exact correct answer text",
  "reasoning": "Detailed explanation of why the answer is correct and why others are wrong. Use markdown for formatting (bullet points, bold, math equations if any).",
  "exam_facts": ["PYQ Fact 1 based on SSC CGL/UPSC/NDA/CDS etc.", "Fact 2", "Fact 3", "Fact 4", "Fact 5", "Fact 6"],
  "recent_news": "A short summary of recent news related to the topic, based strictly on the provided context.",
  "interesting_facts": ["Fact 1", "Fact 2"],
  "fun_fact": "A short fun fact related to the topic"
}`;

    let lastError = null;
    let finalResult = null;

    for (const modelConfig of executionPlan.models) {
      const apiKey = Deno.env.get(modelConfig.api_key_name);
      if (!apiKey) continue;

      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.model}:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptInstruction }] }]
          }),
          signal: controller.signal
        });

        const latency = Date.now() - startTime;
        const status = response.status;

        let responseJson: any = null;
        let responseText = '';

        try {
          responseText = await response.text();
          responseJson = JSON.parse(responseText);
        } catch (_e) {}

        if (!response.ok) {
          const errorMsg = responseJson?.error?.message || responseText || 'Unknown error';
          const errorStatus = responseJson?.error?.status || 'UNKNOWN';
          await reportExecution(supabaseAdmin, modelConfig.model, modelConfig.api_key_name, status, latency, errorStatus, errorMsg);
          lastError = new Error(`API Error ${status}: ${errorMsg}`);
          continue;
        }

        await reportExecution(supabaseAdmin, modelConfig.model, modelConfig.api_key_name, 200, latency);

        const rawOutput = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawOutput) {
          throw new Error("Invalid response format from Gemini");
        }

        let cleanJsonStr = rawOutput.trim();
        if (cleanJsonStr.startsWith('```json')) {
          cleanJsonStr = cleanJsonStr.substring(7);
        } else if (cleanJsonStr.startsWith('```')) {
          cleanJsonStr = cleanJsonStr.substring(3);
        }
        if (cleanJsonStr.endsWith('```')) {
          cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
        }

        finalResult = JSON.parse(cleanJsonStr.trim());

        try {
          await supabaseAdmin
            .from('questions')
            .update({ ask_ai_explanation: finalResult, ask_ai_generated_at: new Date().toISOString() })
            .eq('id', questionId);
        } catch (e) {
          console.error("Failed to cache AI Tutor response:", e);
        }

        break;

      } catch (e: any) {
        const latency = Date.now() - startTime;
        const isTimeout = e?.name === 'AbortError';
        await reportExecution(
          supabaseAdmin,
          modelConfig.model,
          modelConfig.api_key_name,
          isTimeout ? 504 : 500,
          latency,
          isTimeout ? 'TIMEOUT' : 'EXCEPTION',
          isTimeout ? `Gemini request timed out after ${GENERATION_TIMEOUT_MS}ms` : e.message
        );
        lastError = isTimeout ? new Error(`Model ${modelConfig.model} timeout`) : e;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!finalResult) {
      return new Response(JSON.stringify({ success: false, error: lastError?.message || 'All models failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
