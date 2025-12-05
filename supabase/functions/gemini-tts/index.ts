import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, languageCode = "hi-IN" } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing 'text' in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
    if (!GOOGLE_AI_KEY) {
      console.error("GOOGLE_AI_KEY is not set");
      return new Response(JSON.stringify({ error: "Server configuration error: GOOGLE_AI_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini 2.0 Flash Experimental for Audio Generation capabilities
    // This model supports 'responseModalities: ["AUDIO"]'
    // 'gemini-2.5-flash-tts' is not yet available on the public v1beta API
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_KEY}`;

    console.log(`Calling Gemini API: ${model}`);

    // System Instruction to force verbatim reading
    const systemInstruction = {
      parts: [{
        text: `You are a precise Text-to-Speech engine.
    Your ONLY task is to read the user's input exactly as written, word for word.
    1. Do NOT answer the question.
    2. Do NOT provide hints.
    3. Do NOT add conversational filler like "Here is the question."
    4. Maintain a neutral, clear, and professional reading pace.`
      }]
    };

    const payload = {
      contents: [{
        parts: [{ text: text }]
      }],
      systemInstruction: systemInstruction,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede" // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"
            }
          }
        }
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      return new Response(JSON.stringify({
        error: `Failed to fetch audio from Google (${response.status})`,
        details: errorText,
        modelUsed: model
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Parse the response to extract inline audio bytes
    const part = data.candidates?.[0]?.content?.parts?.[0];

    // Check if we got audio data
    if (!part || !part.inlineData) {
       console.error("Unexpected Gemini response structure:", JSON.stringify(data));
       return new Response(JSON.stringify({ error: "No audio data in response", fullResponse: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBase64 = part.inlineData.data;

    return new Response(JSON.stringify({
      audioContent: audioBase64,
      mimeType: part.inlineData.mimeType || 'audio/pcm',
      isRawPcm: true // Gemini Native Audio is 24kHz PCM
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
