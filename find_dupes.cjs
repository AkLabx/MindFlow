const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const files = getFiles('./src');
const dupePatterns = [
  /dark:bg-gray-800\s+dark:bg-slate-900/g,
  /dark:bg-gray-900\s+dark:bg-slate-800\/50/g,
  /dark:text-white\s+dark:text-slate-100/g,
  /dark:text-gray-400\s+dark:text-slate-400/g,
  /dark:text-gray-400\s+dark:text-slate-500/g,
  /dark:border-gray-700\s+dark:border-slate-800/g,
  /dark:bg-gray-[0-9]+\s+dark:bg-gray-[0-9]+/g,
  /dark:text-[a-z]+-[0-9]+\s+dark:text-[a-z]+-[0-9]+/g
];

let filesWithIssues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let hasIssue = false;
  for (const pattern of dupePatterns) {
    if (pattern.test(content)) {
      hasIssue = true;
      break;
    }
  }
  if (hasIssue) {
    filesWithIssues.push(file);
  }
}

console.log("Files with duplicated/conflicting dark mode classes:");
console.log(filesWithIssues.join('\n'));
