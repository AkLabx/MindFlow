require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;

// Limits & Constants
const MAX_QUESTIONS_PER_RUN = 1000;
const BATCH_SIZE = 15;
const SLEEP_MS = 65000; // 65 seconds to be safe on the 100 RPM limit
const MODEL_NAME = 'models/text-embedding-004';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in environment.");
    process.exit(1);
}
if (!GEMINI_API_KEY) {
    console.error("Missing Google Gemini API Key (GOOGLE_AI_KEY) in environment.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getEmbeddingsBatch(texts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:batchEmbedContents?key=${GEMINI_API_KEY}`;

    // Construct requests for the batch
    const requests = texts.map(text => ({
        model: MODEL_NAME,
        content: {
            parts: [{ text: text }]
        }
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.embeddings || data.embeddings.length !== texts.length) {
         throw new Error(`Unexpected response structure or missing embeddings. Response: ${JSON.stringify(data)}`);
    }

    // Return an array of vectors (arrays of numbers)
    return data.embeddings.map(e => e.values);
}

async function runBackfill() {
    console.log(`Starting Backfill Job. Limit: ${MAX_QUESTIONS_PER_RUN} items.`);

    // 1. Fetch questions that don't have an embedding yet
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, question, options, correct, subject, topic, subTopic')
        .is('embedding', null)
        .limit(MAX_QUESTIONS_PER_RUN);

    if (error) {
        console.error("Error fetching questions from Supabase:", error);
        return;
    }

    if (!questions || questions.length === 0) {
        console.log("No questions found that need embeddings. Backfill complete!");
        return;
    }

    console.log(`Found ${questions.length} questions to process in this run.`);

    let successCount = 0;
    let failCount = 0;

    // 2. Process in batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

        console.log(`\nProcessing Batch ${batchNumber} of ${totalBatches} (${batch.length} items)...`);

        try {
            // Prepare rich text for embedding: combine question, options, and metadata
            const textsToEmbed = batch.map(q => {
                const optionsStr = Array.isArray(q.options) ? q.options.join(', ') : q.options || '';
                return `Subject: ${q.subject || ''}, Topic: ${q.topic || ''}, SubTopic: ${q.subTopic || ''}. Question: ${q.question}. Options: ${optionsStr}. Correct Answer: ${q.correct || ''}`;
            });

            // Call API
            const embeddings = await getEmbeddingsBatch(textsToEmbed);

            // Update Supabase records individually or via bulk (doing it one by one in Promise.all for simplicity)
            const updatePromises = batch.map((q, index) => {
                 // pgvector expects a string representation of array: '[0.1, 0.2, ...]'
                 const embeddingVector = `[${embeddings[index].join(',')}]`;
                 return supabase
                    .from('questions')
                    .update({ embedding: embeddingVector })
                    .eq('id', q.id);
            });

            const updateResults = await Promise.all(updatePromises);

            // Check for errors in updates
            let batchFails = 0;
            updateResults.forEach((res, idx) => {
                 if (res.error) {
                     console.error(`Failed to update question ID ${batch[idx].id}:`, res.error);
                     batchFails++;
                 }
            });

            successCount += (batch.length - batchFails);
            failCount += batchFails;

            console.log(`✅ Batch ${batchNumber} complete. Successes so far: ${successCount}`);

        } catch (error) {
            console.error(`❌ Error in Batch ${batchNumber}:`, error.message);
            failCount += batch.length;
            console.log("Will try to continue to next batch after cooldown.");
        }

        // Wait between batches to respect rate limits, unless it's the very last batch
        if (i + BATCH_SIZE < questions.length) {
            console.log(`⏳ Waiting for ${SLEEP_MS / 1000} seconds to respect API rate limits...`);
            await sleep(SLEEP_MS);
        }
    }

    console.log(`\n🎉 Job Finished! Successfully updated: ${successCount}, Failed: ${failCount}`);
}

runBackfill();
