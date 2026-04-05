const fs = require('fs');

let worker = fs.readFileSync('src/workers/filterWorker.ts', 'utf8');
worker = worker.replace('return selected.includes(value);', 'return (selected as string[]).includes(value);');
fs.writeFileSync('src/workers/filterWorker.ts', worker, 'utf8');
