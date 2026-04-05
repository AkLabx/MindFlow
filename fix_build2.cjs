const fs = require('fs');

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/const isSelected = current\.includes\(option\);/g, 'const isSelected = (current as string[]).includes(option);');
    content = content.replace(/\[key\]: isSelected \? current\.filter\(i => i !== option\) : \[\.\.\.current, option\]/g, '[key]: isSelected ? current.filter(i => i !== option) : [...current, option as any]');
    fs.writeFileSync(path, content, 'utf8');
}

fixFile('src/features/quiz/components/QuizConfig.tsx');
fixFile('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx');

let worker = fs.readFileSync('src/workers/filterWorker.ts', 'utf8');
worker = worker.replace('return activeSet.has(typedValue);', 'return activeSet.has(typedValue as any);');
fs.writeFileSync('src/workers/filterWorker.ts', worker, 'utf8');
