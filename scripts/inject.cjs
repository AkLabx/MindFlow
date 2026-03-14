const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://sjcfagpjstbfxuiwhlps.supabase.co";
// Important: I need your Service Role Key to bypass RLS!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Cannot bypass RLS.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const inputPath = path.join(__dirname, 'data', 'processed_embeddings.json');
const embeddings = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

async function inject() {
    let success = 0;
    console.log(`Injecting ${embeddings.length} embeddings using Service Role Key...`);

    // Process in batches of 10 to avoid overwhelming the database connection
    for (let i = 0; i < embeddings.length; i += 10) {
        const batch = embeddings.slice(i, i + 10);

        const promises = batch.map(async (record) => {
            if (!record.id || !record.embedding) return;
            const vectorStr = `[${record.embedding.join(',')}]`;
            const { error } = await supabase.from('questions').update({ embedding: vectorStr }).eq('id', record.id);
            if (error) {
                console.error(`Error updating ID ${record.id}:`, error);
            } else {
                success++;
            }
        });

        await Promise.all(promises);
        console.log(`Processed batch ${Math.floor(i/10) + 1}/${Math.ceil(embeddings.length/10)}. Total Success: ${success}`);
    }
    console.log(`Injection Complete. Successfully injected ${success}/${embeddings.length} records.`);
}

inject();
