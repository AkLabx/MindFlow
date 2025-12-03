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
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare request for Generative Language API (Gemini)
    // Model: gemini-2.5-flash-native-audio-preview-09-2025
    // Note: This model is preview. If it fails, we might need a fallback or verify the endpoint.
    // The endpoint often used for Gen AI keys is generativelanguage.googleapis.com

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-native-audio-preview-09-2025:generateContent?key=${GOOGLE_AI_KEY}`;

    const payload = {
      contents: [{
        parts: [{ text: text }]
      }],
      system_instruction: systemInstruction,
      generationConfig: {
        response_modalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede" // Example voice, simpler than full config.
              // Note: Native audio model might choose its own voice or require specific config.
              // We'll try without speechConfig first if this fails, or use a known one.
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
      console.error("Gemini API Error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch audio from Gemini", details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Parse the response to extract inline audio bytes
    // Expected structure: candidates[0].content.parts[0].inlineData.data (base64)
    // MimeType should be "audio/pcm" or "audio/wav" usually?
    // Docs say "audio/pcm" for input, output is "audio/pcm" (24kHz).

    const part = data.candidates?.[0]?.content?.parts?.[0];
    if (!part || !part.inlineData) {
       console.error("Unexpected Gemini response structure:", JSON.stringify(data));
       return new Response(JSON.stringify({ error: "No audio data in response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBase64 = part.inlineData.data;
    // The client expects 'audioContent' key usually if we kept the previous contract.
    // Or we can just return what we have.
    // Note: Raw PCM needs a WAV header to play in <audio> tag usually.
    // Since this is 24kHz PCM, we should wrap it.

    return new Response(JSON.stringify({
      audioContent: audioBase64,
      mimeType: part.inlineData.mimeType || 'audio/pcm',
      isRawPcm: true // Flag for client to know it might need processing
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
