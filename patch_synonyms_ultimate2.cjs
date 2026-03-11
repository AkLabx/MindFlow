const fs = require('fs');

function replaceFile(path, replacer) {
    let code = fs.readFileSync(path, 'utf8');
    code = replacer(code);
    fs.writeFileSync(path, code);
}

replaceFile('src/features/synonyms/SynonymsConfig.tsx', (code) => {
    // A more robust regex just in case
    code = code.replace(/const parsed = rawSynonymsData as unknown as SynonymWord\[\];\s*\n\s*\/\/ Sort by importance_score descending \(Heatmap Hot first\)\s*\n\s*parsed\.sort\(\(a, b\) => b\.importance_score - a\.importance_score\);\s*\n\s*setData\(parsed\);/g,
    `const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();\n                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));\n                setData(parsed);`);
    return code;
});

replaceFile('src/features/synonyms/components/SynonymPhase1Session.tsx', (code) => {
    code = code.replace(/const parsed = rawSynonymsData as unknown as SynonymWord\[\];/g, `const parsed: SynonymWord[] = []; // Replaced by async load`);
    return code;
});

replaceFile('src/features/synonyms/components/SynonymQuizSession.tsx', (code) => {
    code = code.replace(/const parsedData = rawSynonymsData as unknown as SynonymWord\[\];/g, `const parsedData: SynonymWord[] = []; // Replaced by async load`);
    return code;
});
