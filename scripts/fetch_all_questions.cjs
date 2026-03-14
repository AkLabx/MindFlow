const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://sjcfagpjstbfxuiwhlps.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2ZhZ3Bqc3RiZnh1aXdobHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQ5OTUsImV4cCI6MjA3NjUyMDk5NX0.8p6tIdBum2uhi0mRYENtF81WryaVlZFCwukwAAwJwJA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll() {
    let allData = [];
    let from = 0;
    const limit = 1000;

    console.log("Fetching all questions from Supabase...");

    while (true) {
        const { data, error } = await supabase
            .from('questions')
            .select('id, question, options, correct, subject, topic, subTopic')
            .range(from, from + limit - 1);

        if (error) {
            console.error("Error fetching data:", error);
            break;
        }

        if (!data || data.length === 0) {
            break;
        }

        allData = allData.concat(data);
        console.log(`Fetched ${data.length} rows (Total: ${allData.length})`);

        if (data.length < limit) {
            break;
        }
        from += limit;
    }

    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const outputPath = path.join(dir, 'all_questions.json');
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    console.log(`Saved ${allData.length} questions to ${outputPath}`);
}

fetchAll();
