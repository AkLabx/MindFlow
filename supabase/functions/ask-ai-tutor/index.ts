import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateContentHash(questionText: string, options: string[], correctAnswer: string): Promise<string> {
    const dataString = `${questionText}|${options.join(',')}|${correctAnswer}`;
    const messageBuffer = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
    return encodeHex(hashBuffer);
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const body = await req.json();
    const { questionId, locale = 'en', promptVersion = 'v1', modelVersion = 'gemini-2.5-flash-lite', questionText, options, correctAnswer } = body;

    if (!questionId || !questionText || !options || !correctAnswer) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const contentHash = await generateContentHash(questionText, options, correctAnswer);

    // 1. Check Cache
    const { data: cachedExplanation, error: cacheError } = await supabaseClient
      .from('ai_explanations_cache')
      .select('explanation_data')
      .eq('question_id', questionId)
      .eq('locale', locale)
      .eq('prompt_version', promptVersion)
      .eq('model_version', modelVersion)
      .eq('content_hash', contentHash)
      .in('status', ['active', 'trusted', 'moderated', 'overridden'])
      .maybeSingle();

    if (cacheError) {
        console.error("Cache check error:", cacheError);
    }

    if (cachedExplanation && cachedExplanation.explanation_data) {
        return new Response(JSON.stringify({
            source: 'cache',
            data: cachedExplanation.explanation_data
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // 2. Cache Miss - Generate via Gemini API
    const geminiApiKey = Deno.env.get('GOOGLE_AI_KEY');
    if (!geminiApiKey) {
        throw new Error("Backend AI Key not configured.");
    }

    const todayDate = new Date().toISOString().split('T')[0];
    let promptInstruction = `
You are a knowledgeable and helpful tutor. Analyze this multiple-choice question and provide a detailed explanation.
You must use the Google Search tool to find recent news about the topic (Today's date is ${todayDate}).
Output must be strictly valid JSON.

Question: "${questionText}"
Options: ${JSON.stringify(options)}
Correct Answer: "${correctAnswer}"

JSON Schema:
{
  "correct_answer": "The exact correct answer text",
  "reasoning": "Detailed explanation of why the answer is correct and why others are wrong. Use markdown for formatting (bullet points, bold, math equations if any).",
  "exam_facts": ["PYQ Fact 1 based on SSC CGL/UPSC/NDA/CDS etc.", "Fact 2", "Fact 3", "Fact 4", "Fact 5", "Fact 6"],
  "recent_news": "A short summary of recent news related to the topic. Use the Google Search tool to find this.",
  "interesting_facts": ["Fact 1", "Fact 2"],
  "fun_fact": "A short fun fact related to the topic"
}`;

    if (locale !== 'en') {
        promptInstruction += `\n\nIMPORTANT: Please provide the final JSON values entirely in ${locale} language.`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptInstruction }] }],
            tools: [{ googleSearch: {} }]
        })
    });

    if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        console.error("Gemini API Error:", errBody);
        throw new Error(`Provider generation failed: ${geminiResponse.status}`);
    }

    const rawResult = await geminiResponse.json();
    let text = rawResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("Empty or malformed response from provider");
    }

    // Clean up markdown markers if present
    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    let parsedData;
    try {
        parsedData = JSON.parse(text);

        // Basic validation hook
        if (!parsedData.correct_answer || !parsedData.reasoning) {
             throw new Error("Missing critical JSON keys");
        }
    } catch (parseError) {
        console.error("Parser error on raw text:", text);
        throw new Error("AI returned invalid JSON structure. Not saving.");
    }

    // 3. Save to Permanent Cache
    // Note: We use the service_role key to bypass RLS for inserting into the cache
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseAdmin
        .from('ai_explanations_cache')
        .upsert({
            question_id: questionId,
            locale: locale,
            prompt_version: promptVersion,
            model_version: modelVersion,
            content_hash: contentHash,
            raw_response: rawResult,
            explanation_data: parsedData,
            status: 'trusted',
            generated_by_user_id: user.id
        }, { onConflict: 'question_id, locale, prompt_version, model_version, content_hash' });

    if (insertError) {
        console.error("Error saving cache to Postgres:", insertError);
        // We still return the parsed data to the user even if caching fails
    }

    return new Response(JSON.stringify({
        source: 'generated',
        data: parsedData
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
