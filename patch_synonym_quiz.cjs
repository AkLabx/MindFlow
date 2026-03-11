const fs = require('fs');

let file = 'src/features/synonyms/components/SynonymQuizSession.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove static json import
code = code.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';\s*\n/g, '');

// Import engine
code = code.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);

const loadBlock = `        const parsedData = rawSynonymsData as unknown as SynonymWord[];
        setAllWords(parsedData);
        generateQuiz(parsedData);`;

const newLoadBlock = `        quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsedData => {
            setAllWords(parsedData);
            generateQuiz(parsedData);
        }).catch(err => {
            console.error("Failed to load Phase 2 quiz words", err);
        });`;

code = code.replace(loadBlock, newLoadBlock);

fs.writeFileSync(file, code);
