require('dotenv').config();
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = "AIzaSyB-tEQBSS5l7ne2SjNYEC9Cpmh_2F6N38o";

const BATCH_SIZE = 15;
const MAX_QUESTIONS_PER_RUN = 90; // Exactly 6 requests (6 x 15)
const SLEEP_MS = 65000;
const MODEL_NAME = 'models/gemini-embedding-2-preview'; // Valid endpoint

// Use the local file as the source of truth
const inputPath = path.join(__dirname, 'data', 'all_questions.json');
const outputPath = path.join(__dirname, 'data', 'processed_embeddings.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getEmbeddingsBatch(texts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:batchEmbedContents?key=${GEMINI_API_KEY}`;

    const requests = texts.map(text => ({
        model: MODEL_NAME,
        content: { parts: [{ text: text }] }
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
    return data.embeddings.map(e => e.values);
}

async function runRepoBackfill() {
    console.log(`Starting Local Backfill Job. Fetching up to ${MAX_QUESTIONS_PER_RUN} un-embedded questions...`);

    if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found at ${inputPath}. Please run the fetch script first.`);
        return;
    }

    const allQuestions = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    // Load existing progress to know what to skip
    let processedData = [];
    if (fs.existsSync(outputPath)) {
        processedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        console.log(`Resuming. Found ${processedData.length} existing processed embeddings in repo.`);
    }

    const processedIds = new Set(processedData.map(p => p.id));

    // Filter out questions that have already been processed locally OR have embeddings in the raw file
    const questionsToProcess = allQuestions
        .filter(q => !processedIds.has(q.id) && !q.embedding)
        .slice(0, MAX_QUESTIONS_PER_RUN);

    if (questionsToProcess.length === 0) {
        console.log("No questions found that need embeddings.");
        return;
    }

    console.log(`Fetched ${questionsToProcess.length} questions. Processing in chunks of ${BATCH_SIZE}...`);

    for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
        const batch = questionsToProcess.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(questionsToProcess.length / BATCH_SIZE);

        console.log(`\n[${new Date().toISOString()}] Executing Batch ${batchNum} of ${totalBatches} (${batch.length} items)...`);

        const textsToEmbed = batch.map(q => {
            const optionsStr = Array.isArray(q.options) ? q.options.join(', ') : q.options || '';
            return `Subject: ${q.subject || ''}, Topic: ${q.topic || ''}. Question: ${q.question}. Options: ${optionsStr}. Answer: ${q.correct || ''}`;
        });

        try {
            // 1. Get embeddings
            const embeddings = await getEmbeddingsBatch(textsToEmbed);

            // 2. Format results to save locally
            const batchResults = batch.map((q, idx) => ({
                id: q.id,
                embedding: embeddings[idx] // Array of numbers
            }));

            processedData = processedData.concat(batchResults);

            // 3. Save to file immediately so progress is safe
            fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
            console.log(`✅ Saved ${batch.length} embeddings locally. (Total saved: ${processedData.length})`);

        } catch (e) {
             console.error(`❌ Batch ${batchNum} failed:`, e.message);
        }

        if (i + BATCH_SIZE < questionsToProcess.length) {
            console.log(`⏳ Waiting ${SLEEP_MS/1000}s to avoid TPM limits...`);
            await sleep(SLEEP_MS);
        }
    }

    console.log(`\n🎉 Local Execution Complete! Saved ${processedData.length} total records to repo.`);
}

runRepoBackfill();
