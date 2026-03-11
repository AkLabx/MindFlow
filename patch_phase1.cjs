const fs = require('fs');

let file = 'src/features/synonyms/components/SynonymPhase1Session.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove static json import
code = code.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';\s*\n/g, '');

// Import engine
code = code.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);

// Find the data load in Phase1
const loadBlock = `        const parsed = rawSynonymsData as unknown as SynonymWord[];
        // Only load New / Familiar words (skip mastered)
        const active = parsed.filter(w => {
            const status = getStatus(w);
            return status !== 'mastered';
        });
        active.sort((a, b) => b.importance_score - a.importance_score);
        setWords(active);
        setIsLoading(false);`;

const newLoadBlock = `        quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsed => {
            // Only load New / Familiar words (skip mastered)
            const active = parsed.filter(w => {
                const status = getStatus(w);
                return status !== 'mastered';
            });
            active.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
            setWords(active);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load Phase 1 words", err);
            setIsLoading(false);
        });`;

code = code.replace(loadBlock, newLoadBlock);

fs.writeFileSync(file, code);
