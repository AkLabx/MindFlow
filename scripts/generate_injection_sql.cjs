const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'data', 'processed_embeddings.json');
const outputPath = path.join(__dirname, 'data', 'inject_embeddings.sql');

if (!fs.existsSync(inputPath)) {
    console.error("No processed embeddings found.");
    process.exit(1);
}

const embeddings = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Loaded ${embeddings.length} embeddings.`);

// We must construct the SQL statements carefully.
// pgvector expects a string formatted like '[1.23, 4.56, ...]'
let sql = '';
for (const record of embeddings) {
    if (!record.id || !record.embedding) continue;
    const vectorString = `[${record.embedding.join(',')}]`;
    sql += `UPDATE public.questions SET embedding = '${vectorString}'::extensions.vector(3072) WHERE id = '${record.id}';\n`;
}

fs.writeFileSync(outputPath, sql);
console.log(`Generated SQL injection script at ${outputPath} with ${embeddings.length} updates.`);
