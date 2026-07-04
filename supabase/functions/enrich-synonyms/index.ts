import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod";

// --- ZOD SCHEMAS ---

const ExamplesSchema = z.array(
  z.object({
    id: z.string().uuid(),
    eg_eng: z.array(z.string().min(1)).length(2),
    eg_hin: z.array(z.string().min(1)).length(2),
  })
);

const SynonymsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    synonyms: z.array(
      z.object({
        text: z.string().min(1),
        meaning: z.string().min(1),
        hindiMeaning: z.string().min(1),
      })
    ).length(10),
  })
);

const AntonymsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    antonyms: z.array(
      z.object({
        text: z.string().min(1),
        meaning: z.string().min(1),
        hindiMeaning: z.string().min(1),
      })
    ).length(10),
  })
);

const ConfusablesSchema = z.array(
  z.object({
    id: z.string().uuid(),
    confusable_with: z.array(
      z.object({
        text: z.string().min(1),
        meaning: z.string().min(1),
        hindiMeaning: z.string().min(1),
      })
    ).length(3),
  })
);


// --- CONFIG ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemma-4-31b"
];
const VISIBILITY_TIMEOUT = 300;

// We fetch up to 30 from queue. The Seeder guarantees they are uniform task type and appropriately sized.
const QUEUE_FETCH_LIMIT = 30;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] FUNCTION_START`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return new Response("Configuration Error", { status: 500 });
  }

  try {
    // 1. Read batch from pgmq
    const { data: queueData, error: queueError } = await supabase.rpc(
      "read_from_queue",
      { p_queue_name: 'enrichment_jobs', p_vt: VISIBILITY_TIMEOUT, p_qty: QUEUE_FETCH_LIMIT }
    );

    if (queueError) {
      console.error(`[${new Date().toISOString()}] QUEUE_READ_ERROR:`, queueError);
      return new Response(JSON.stringify({ error: queueError.message }), { status: 500 });
    }

    if (!queueData || queueData.length === 0) {
      console.log(`[${new Date().toISOString()}] QUEUE_READ_EMPTY`);
      return new Response(JSON.stringify({ message: "No jobs in queue." }), { status: 200 });
    }

    // Identify the task type from the first message (Seeder guarantees uniformity)
    const currentTask = queueData[0].message.task || "examples";
    console.log(`[${new Date().toISOString()}] BATCH_SIZE=${queueData.length} | TASK=${currentTask}`);

    // Fetch words
    const jobMap = new Map<string, number>();
    const wordIds = queueData.map((job: any) => {
      jobMap.set(job.message.id, job.msg_id);
      return job.message.id;
    });

    const { data: wordsData, error: wordsError } = await supabase
      .from("synonym")
      .select("id, word, pos")
      .in("id", wordIds);

    if (wordsError || !wordsData || wordsData.length === 0) {
      console.error(`[${new Date().toISOString()}] DATABASE_FETCH_ERROR/EMPTY`);
      for (const msgId of Array.from(jobMap.values())) {
           await supabase.rpc('delete_from_queue', { p_queue_name: 'enrichment_jobs', p_msg_id: msgId });
      }
      return new Response(JSON.stringify({ error: "Failed to fetch words or empty" }), { status: 200 });
    }

    const inputBatch = wordsData.map((w) => ({ id: w.id, word: w.word, pos: w.pos || "unknown" }));

    // --- TASK SWITCH ---
    let promptText = "";
    let activeSchema: z.ZodTypeAny;
    let geminiResponseSchema: any;

    switch (currentTask) {
      case "examples":
        activeSchema = ExamplesSchema;
        promptText = `
You are an expert English-Hindi linguist and vocabulary instructor for competitive exam aspirants.
For each word provided, generate exactly TWO distinct English example sentences and their exact Hindi translations.

CRITICAL EDUCATIONAL RULES:
1. Vocabulary Simplicity: Use simple, high-frequency English words surrounding the target word. Aim for a CEFR A2-B1 reading level. The target word should usually be the most difficult word in the sentence.
2. Context Reveals Meaning: A learner should be able to approximately infer the meaning of the target word from the sentence alone. The context must make the intended sense obvious.
3. Avoid Vocabulary Chains: Do NOT introduce additional advanced/difficult words that would require their own dictionary lookup.
4. Preserve Natural Usage: Keep sentences realistic, natural, and conversational. NEVER fall back to dictionary-definition style sentences.
5. Diversity: Do not repeat the same semantic context twice for the same word.
6. Target Word Context: The target word must be used in its primary, intended contextual meaning without being altered.

FORMAT:
Return a JSON array where 'eg_eng' and 'eg_hin' contain EXACTLY 2 strings each. 'eg_eng[0]' must precisely match 'eg_hin[0]'.

INPUT:
${JSON.stringify(inputBatch, null, 2)}
`;
        geminiResponseSchema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                eg_eng: { type: "ARRAY", items: { type: "STRING" } },
                eg_hin: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["id", "eg_eng", "eg_hin"]
            }
        };
        break;

      case "synonyms":
        activeSchema = SynonymsSchema;
        promptText = `
You are an expert bilingual lexicographer specializing in advanced English vocabulary for Indian competitive examinations (SSC, CAT, UPSC, banking).
For each vocabulary entry provided, generate EXACTLY 10 synonyms.

SYNONYMS GENERATION RULES:
1. Match the original word's Part of Speech ("pos") exactly.
2. Be suitable for advanced competitive examinations.
3. Prefer high-frequency exam vocabulary over casual vocabulary.
4. Avoid simplistic thesaurus substitutions. Avoid morphological variants of the original word.
5. Provide a precise, exam-oriented English meaning and a formal Devanagari Hindi meaning for each.

Semantic Distribution Required:
- 4 Near-perfect synonyms frequently accepted in objective exams.
- 3 Contextual or nuanced synonyms used in comprehension passages.
- 2 Higher-register or literary synonyms appearing in advanced exams.
- 1 Difficult or elite-level synonym suitable for CAT/XAT/UPSC.

INPUT:
${JSON.stringify(inputBatch, null, 2)}
`;
        geminiResponseSchema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                synonyms: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                        text: { type: "STRING" },
                        meaning: { type: "STRING" },
                        hindiMeaning: { type: "STRING" }
                    },
                    required: ["text", "meaning", "hindiMeaning"]
                  }
                }
              },
              required: ["id", "synonyms"]
            }
        };
        break;

      case "antonyms":
        activeSchema = AntonymsSchema;
        promptText = `
You are an expert bilingual lexicographer specializing in advanced English vocabulary for Indian competitive examinations.
For each vocabulary entry provided, generate EXACTLY 10 antonyms.

ANTONYMS GENERATION RULES:
1. Match the original Part of Speech exactly.
2. Prefer true semantic opposites rather than mere negations.
3. Include varying levels of opposition: direct opposite, contextual opposite, functional opposite.
4. Avoid using simple prefixes (un-, dis-, non-, in-) unless that form is genuinely standard and exam-worthy.
5. Avoid weak opposites and conversational vocabulary.
6. Provide a precise, exam-oriented English meaning and a formal Devanagari Hindi meaning for each.

INPUT:
${JSON.stringify(inputBatch, null, 2)}
`;
        geminiResponseSchema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                antonyms: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                        text: { type: "STRING" },
                        meaning: { type: "STRING" },
                        hindiMeaning: { type: "STRING" }
                    },
                    required: ["text", "meaning", "hindiMeaning"]
                  }
                }
              },
              required: ["id", "antonyms"]
            }
        };
        break;

      case "confusables":
        activeSchema = ConfusablesSchema;
        promptText = `
You are an expert bilingual lexicographer specializing in advanced English vocabulary for Indian competitive examinations.
For each vocabulary entry provided, generate EXACTLY 3 high-quality confusable words.

CONFUSABLE_WITH GENERATION RULES:
The objective is to replicate the kinds of vocabulary traps used in competitive examinations.
Priority order:
1. Spelling confusion (e.g., Affect -> Effect) (Highest Priority)
2. Pronunciation similarity / Homonyms (e.g., Principal -> Principle)
3. Semantic confusion (e.g., Historic -> Historical)

Strict Exclusions:
- Never generate random words from the same topic.
- Never generate obvious synonyms or antonyms.
- Never generate words with low confusion probability.
- Every generated word should be realistically usable in an exam question asking: "Choose the correctly spelled word" or "Select the correct usage."

INPUT:
${JSON.stringify(inputBatch, null, 2)}
`;
        geminiResponseSchema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                confusable_with: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                        text: { type: "STRING" },
                        meaning: { type: "STRING" },
                        hindiMeaning: { type: "STRING" }
                    },
                    required: ["text", "meaning", "hindiMeaning"]
                  }
                }
              },
              required: ["id", "confusable_with"]
            }
        };
        break;

      default:
        console.error(`[${new Date().toISOString()}] UNKNOWN_TASK: ${currentTask}`);
        return new Response("Unknown task type", { status: 400 });
    }

    const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: geminiResponseSchema
        }
    };

    // --- GEMINI CALL ---
    let geminiData = null;
    let successfulModel = "";

    for (const model of MODELS) {
        console.log(`[${new Date().toISOString()}] GEMINI_REQUEST_START (Model: ${model})`);
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        try {
            const geminiResponse = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (geminiResponse.ok) {
                geminiData = await geminiResponse.json();
                successfulModel = model;
                break;
            } else {
                console.error(`[${new Date().toISOString()}] GEMINI_API_ERROR (Model: ${model}):`, await geminiResponse.text());
            }
        } catch (fetchError) {
             console.error(`[${new Date().toISOString()}] GEMINI_FETCH_EXCEPTION (Model: ${model}):`, fetchError);
        }
    }

    if (!geminiData) {
        return new Response(JSON.stringify({ error: "All Gemini models failed." }), { status: 502 });
    }

    let aiResponseText = "";
    try {
        aiResponseText = geminiData.candidates[0].content.parts[0].text;
    } catch(e) {
         return new Response(JSON.stringify({ error: "Malformed Gemini structure" }), { status: 502 });
    }

    let parsedJson;
    try {
       parsedJson = JSON.parse(aiResponseText);
    } catch (e) {
       return new Response(JSON.stringify({ error: "Invalid JSON from AI" }), { status: 502 });
    }

    // --- VALIDATION ---
    const validationResult = activeSchema.safeParse(parsedJson);

    if (!validationResult.success) {
        console.error(`[${new Date().toISOString()}] ZOD_VALIDATION_FAILED for task ${currentTask}:`, validationResult.error);
        for (const wordId of wordIds) {
             await supabase.from('enrichment_dlq').insert({
                 word_id: wordId,
                 task: currentTask,
                 error_message: `Task ${currentTask} validation failed: ` + validationResult.error.message
             });
             const msgId = jobMap.get(wordId);
             if (msgId) await supabase.rpc('delete_from_queue', { p_queue_name: 'enrichment_jobs', p_msg_id: msgId });
        }
        return new Response(JSON.stringify({ error: "Zod validation failed, batch moved to DLQ." }), { status: 200 });
    }

    const enrichedResults = validationResult.data;

    // --- DB UPDATE ---
    let successCount = 0;
    for (const result of enrichedResults) {
       // Isolate the id and the rest of the dynamic fields
       const { id, ...fieldsToUpdate } = result as any;

       const { error: updateError } = await supabase
          .from("synonym")
          .update(fieldsToUpdate)
          .eq("id", id);

       if (updateError) {
           console.error(`[${new Date().toISOString()}] DATABASE_UPDATE_ERROR for ${id}:`, updateError);
           continue;
       }

       const msgId = jobMap.get(id);
       if (msgId) {
           const { error: delError } = await supabase.rpc('delete_from_queue', { p_queue_name: 'enrichment_jobs', p_msg_id: msgId });
           if (!delError) successCount++;
       }
    }

    const totalTime = Date.now() - startTime;

    // --- TELEMETRY ---
    const usageMetadata = geminiData.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    const { error: telemetryError } = await supabase.from('ai_request_logs').insert({
        feature: 'enrichment',
        provider: 'gemini',
        model: successfulModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: totalTime,
        request_type: currentTask,
        response_status: 'success'
    });

    if (telemetryError) {
        console.error(`[${new Date().toISOString()}] TELEMETRY_INSERT_ERROR:`, telemetryError);
    }

    console.log(`[${new Date().toISOString()}] BATCH_COMPLETE | Task: ${currentTask} | Processed: ${successCount}/${queueData.length} | Time: ${totalTime}ms | Model: ${successfulModel}`);

    return new Response(
      JSON.stringify({ message: "Batch processed successfully.", task: currentTask, processedCount: successCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] EDGE_FUNCTION_UNEXPECTED_ERROR:`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
