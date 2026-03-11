const fs = require('fs');

function replaceFile(path, replacer) {
    let code = fs.readFileSync(path, 'utf8');
    code = replacer(code);
    fs.writeFileSync(path, code);
}

// Config
replaceFile('src/features/synonyms/SynonymsConfig.tsx', (code) => {
    code = code.replace(/import rawSynonymsData from '\.\.\/quiz\/data\/processed_synonyms\.json';/, '');

    // Only import engine if it doesn't exist
    if (!code.includes('quizEngine')) {
      code = code.replace(/import \{ SynonymWord \} from '\.\.\/quiz\/types';/, `import { SynonymWord } from '../quiz/types';\nimport { quizEngine } from '../quiz/engine';`);
    }

    const oldLoad = `                // In a real scenario, this might be a fetch or complex parse
                const parsed = rawSynonymsData as unknown as SynonymWord[];

                // Sort alphabetically so it starts from A as expected by the user.
                parsed.sort((a, b) => a.word.localeCompare(b.word));

                setData(parsed);`;
    const newLoad = `                const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();
                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
                setData(parsed);`;
    return code.replace(oldLoad, newLoad);
});

// Phase 1
replaceFile('src/features/synonyms/components/SynonymPhase1Session.tsx', (code) => {
    code = code.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';/, '');
    if (!code.includes('quizEngine')) {
      code = code.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);
    }

    const oldLoad = /const parsed = rawSynonymsData as unknown as SynonymWord\[\];\s*\n\s*\/\/ Only load New \/ Familiar words \(skip mastered\)\s*\n\s*const active = parsed\.filter\(w => \{\s*\n\s*const status = getStatus\(w\);\s*\n\s*return status !== 'mastered';\s*\n\s*\}\);\s*\n\s*active\.sort\(\(a, b\) => b\.importance_score - a\.importance_score\);\s*\n\s*setWords\(active\);\s*\n\s*setIsLoading\(false\);/;

    const newLoad = `quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsed => {
            const active = parsed.filter(w => getStatus(w) !== 'mastered');
            active.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
            setWords(active);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load Phase 1 words", err);
            setIsLoading(false);
        });`;

    return code.replace(oldLoad, newLoad);
});

// Quiz Session
replaceFile('src/features/synonyms/components/SynonymQuizSession.tsx', (code) => {
    code = code.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';/, '');
    if (!code.includes('quizEngine')) {
      code = code.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);
    }

    const oldLoad = /const parsedData = rawSynonymsData as unknown as SynonymWord\[\];\s*\n\s*setAllWords\(parsedData\);\s*\n\s*generateQuiz\(parsedData\);/;

    const newLoad = `quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsedData => {
            setAllWords(parsedData);
            generateQuiz(parsedData);
        }).catch(console.error);`;

    return code.replace(oldLoad, newLoad);
});
