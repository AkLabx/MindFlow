import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function reportExecution(supabaseAdmin: any, model: string, apiKeyName: string, statusCode: number, latencyMs: number, providerReason: string = '', providerMessage: string = '') {
  try {
    const errorClassification = statusCode === 429 ?
      (providerMessage.toLowerCase().includes('quota') || providerReason.toLowerCase().includes('resource_exhausted') ? 'RPD_EXHAUSTED' : 'RPM_EXHAUSTED') :
      (statusCode >= 500 ? 'SERVER_ERROR' : (statusCode >= 400 ? 'CLIENT_ERROR' : ''));

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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

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
    let recentNewsContext = "No major recent news found.";

    const keys = [
        'GEMINI_API_KEY_v1',
        'GEMINI_API_KEY_FALLBACK_v1',
        'enrich-ques-api_v1',
        'enrich-ques-api-fallback_v1'
    ];
    let groundingApiKey = null;
    for(const key of keys) {
        const val = Deno.env.get(key);
        if(val) {
            groundingApiKey = val;
            break;
        }
    }

    if (groundingApiKey) {
        try {
            const groundingModel = Deno.env.get('GROUNDING_MODEL') || 'gemini-2.5-flash';
            const groundingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${groundingModel}:generateContent?key=${groundingApiKey}`;
            const groundingPrompt = `Provide a very short summary (2-3 sentences) of the most recent news related to this topic if applicable: "${questionText}". Today is ${new Date().toISOString().split('T')[0]}. If no significant news exists, say exactly "No major recent news found."`;

            const groundingResponse = await fetch(groundingUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: groundingPrompt }] }],
                    tools: [{ googleSearch: {} }]
                })
            });

            if (groundingResponse.ok) {
                const groundingData = await groundingResponse.json();
                if (groundingData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    recentNewsContext = groundingData.candidates[0].content.parts[0].text.trim();
                }
            } else {
                console.warn(`Stage 1 Grounding Failed with status: ${groundingResponse.status}`);
            }
        } catch (e) {
            console.error("Stage 1 Grounding Exception:", e);
        }
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

    let promptInstruction = `
You are an expert, highly reliable educational tutor. Analyze this multiple-choice question and provide a detailed explanation.
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
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.model}:generateContent?key=${apiKey}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptInstruction }] }]
                })
            });

            const latency = Date.now() - startTime;
            const status = response.status;

            let responseJson: any = null;
            let responseText = '';

            try {
                responseText = await response.text();
                responseJson = JSON.parse(responseText);
            } catch (e) {}

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
            if (cleanJsonStr.startsWith('\`\`\`json')) {
                cleanJsonStr = cleanJsonStr.substring(7);
            } else if (cleanJsonStr.startsWith('\`\`\`')) {
                cleanJsonStr = cleanJsonStr.substring(3);
            }
            if (cleanJsonStr.endsWith('\`\`\`')) {
                cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
            }

            finalResult = JSON.parse(cleanJsonStr.trim());

            // --- CACHE THE RESULT ---
            // Before returning, asynchronously update the database to store this so future requests hit the cache
            // We use no await here or fire and forget if possible, or await it.
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
            await reportExecution(supabaseAdmin, modelConfig.model, modelConfig.api_key_name, 500, latency, 'EXCEPTION', e.message);
            lastError = e;
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
