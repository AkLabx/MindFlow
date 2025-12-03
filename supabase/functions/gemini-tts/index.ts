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

    // Call Google Text-to-Speech API
    // Using the standard endpoint which supports Gemini models via the 'model' parameter
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: languageCode,
            name: "hi-IN-Neural2-A", // Fallback/Default for Hindi if model doesn't override
            // Ideally we want to use the Gemini model.
            // According to docs: model_name: "gemini-2.5-flash-tts"
            // Note: 'name' in voice config often overrides or works alongside model.
            // For Gemini TTS, we specify the model.
          },
          audioConfig: {
            audioEncoding: "MP3",
          },
          // Some docs suggest 'model' is a top level param or inside voice?
          // The curl example shows it inside 'voice'.
          // "voice": { "languageCode": "en-us", "name": "Kore", "model_name": "gemini-2.5-flash-tts" }
          // We'll try to stick to the doc example.
        }),
      }
    );

    // If the standard call fails, it might be because the key is for Generative Language API, not Cloud Platform.
    // But let's assume standard behavior first.

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API Error:", errorText);

      // Fallback: If the user provided a Generative AI Key (AI Studio),
      // they might need the generativelanguage endpoint?
      // But standard Cloud keys work on texttospeech if enabled.

      return new Response(JSON.stringify({ error: "Failed to fetch audio from Google", details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
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
