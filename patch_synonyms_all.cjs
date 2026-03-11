const fs = require('fs');

// Config
let configFile = 'src/features/synonyms/SynonymsConfig.tsx';
let configCode = fs.readFileSync(configFile, 'utf8');
configCode = configCode.replace(/import rawSynonymsData from '\.\.\/quiz\/data\/processed_synonyms\.json';/, '');
configCode = configCode.replace(/import \{ SynonymWord \} from '\.\.\/quiz\/types';/, `import { SynonymWord } from '../quiz/types';\nimport { quizEngine } from '../quiz/engine';`);
const loadConfigOld = /const parsed = rawSynonymsData as unknown as SynonymWord\[\];\s*\n\s*\/\/ Sort alphabetically so it starts from A as expected by the user\.\s*\n\s*parsed\.sort\(\(a, b\) => a\.word\.localeCompare\(b\.word\)\);/;
const loadConfigNew = `const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();\n                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));`;
configCode = configCode.replace(loadConfigOld, loadConfigNew);
fs.writeFileSync(configFile, configCode);

// Phase 1
let p1File = 'src/features/synonyms/components/SynonymPhase1Session.tsx';
let p1Code = fs.readFileSync(p1File, 'utf8');
p1Code = p1Code.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';/, '');
p1Code = p1Code.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);
const loadP1Old = /const parsed = rawSynonymsData as unknown as SynonymWord\[\];/;
const loadP1New = `quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsed => {\n            const active = parsed.filter(w => getStatus(w) !== 'mastered');\n            active.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));\n            setWords(active);\n            setIsLoading(false);\n        }).catch(console.error); return; // Exit early to prevent old synchronous logic`;
p1Code = p1Code.replace(loadP1Old, loadP1New);
// Comment out old sync logic
p1Code = p1Code.replace(/const active = parsed\.filter/g, '// const active = parsed.filter');
p1Code = p1Code.replace(/active\.sort/g, '// active.sort');
p1Code = p1Code.replace(/setWords\(active\);/g, '// setWords(active);');
p1Code = p1Code.replace(/setIsLoading\(false\);/g, '// setIsLoading(false);');
fs.writeFileSync(p1File, p1Code);

// Quiz Session
let qFile = 'src/features/synonyms/components/SynonymQuizSession.tsx';
let qCode = fs.readFileSync(qFile, 'utf8');
qCode = qCode.replace(/import rawSynonymsData from '\.\.\/\.\.\/quiz\/data\/processed_synonyms\.json';/, '');
qCode = qCode.replace(/import \{ SynonymWord \} from '\.\.\/\.\.\/quiz\/types';/, `import { SynonymWord } from '../../quiz/types';\nimport { quizEngine } from '../../quiz/engine';`);
const loadQOld = /const parsedData = rawSynonymsData as unknown as SynonymWord\[\];/;
const loadQNew = `quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions().then(parsedData => {\n            setAllWords(parsedData);\n            generateQuiz(parsedData);\n        }).catch(console.error); return;`;
qCode = qCode.replace(loadQOld, loadQNew);
qCode = qCode.replace(/setAllWords\(parsedData\);/g, '// setAllWords(parsedData);');
qCode = qCode.replace(/generateQuiz\(parsedData\);/g, '// generateQuiz(parsedData);');
fs.writeFileSync(qFile, qCode);
