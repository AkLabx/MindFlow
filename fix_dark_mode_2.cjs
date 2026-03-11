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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Background combinations
  content = content.replace(/dark:bg-gray-800 dark:bg-gray-800/g, 'dark:bg-gray-800');
  content = content.replace(/dark:bg-gray-900 dark:bg-gray-900/g, 'dark:bg-gray-900');
  content = content.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:bg-gray-[0-9]+\s+dark:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
    return match.split(/\s+/)[0];
  });

  // Text color combinations
  content = content.replace(/dark:text-white dark:text-white dark:text-slate-100/g, 'dark:text-white');
  content = content.replace(/dark:text-white dark:text-slate-100/g, 'dark:text-white');

  content = content.replace(/dark:text-gray-100 dark:text-gray-100 dark:text-slate-200/g, 'dark:text-gray-100');
  content = content.replace(/dark:text-gray-100 dark:text-slate-200/g, 'dark:text-gray-100');

  content = content.replace(/dark:text-gray-200 dark:text-gray-200 dark:text-slate-300/g, 'dark:text-gray-200');
  content = content.replace(/dark:text-gray-200 dark:text-slate-300/g, 'dark:text-gray-200');

  content = content.replace(/dark:text-gray-300 dark:text-gray-300 dark:text-slate-400/g, 'dark:text-gray-300');
  content = content.replace(/dark:text-gray-300 dark:text-slate-400/g, 'dark:text-gray-300');
  content = content.replace(/dark:text-gray-300 dark:text-gray-300/g, 'dark:text-gray-300');

  content = content.replace(/dark:text-gray-400 dark:text-gray-400 dark:text-slate-400/g, 'dark:text-gray-400');
  content = content.replace(/dark:text-gray-400 dark:text-slate-400/g, 'dark:text-gray-400');
  content = content.replace(/dark:text-gray-400 dark:text-gray-400/g, 'dark:text-gray-400');

  content = content.replace(/dark:text-gray-500 dark:text-gray-500 dark:text-slate-500/g, 'dark:text-gray-500');
  content = content.replace(/dark:text-gray-500 dark:text-slate-500/g, 'dark:text-gray-500');

  // Specific insane repetitions seen in BookmarksPage.tsx
  content = content.replace(/(dark:text-[a-z]+-[0-9]+\s*){4,}/g, function(match) {
    return match.split(/\s+/)[0];
  });

  // Border color combinations
  content = content.replace(/dark:border-gray-800 dark:border-gray-800 dark:border-slate-800/g, 'dark:border-gray-800');
  content = content.replace(/dark:border-gray-800 dark:border-slate-800/g, 'dark:border-gray-800');
  content = content.replace(/dark:border-gray-800 dark:border-gray-800/g, 'dark:border-gray-800');

  content = content.replace(/dark:border-gray-700 dark:border-gray-700 dark:border-slate-800/g, 'dark:border-gray-700');
  content = content.replace(/dark:border-gray-700 dark:border-slate-800/g, 'dark:border-gray-700');
  content = content.replace(/dark:border-gray-700 dark:border-gray-700/g, 'dark:border-gray-700');

  content = content.replace(/dark:border-gray-600 dark:border-gray-600 dark:border-slate-700/g, 'dark:border-gray-600');
  content = content.replace(/dark:border-gray-600 dark:border-slate-700/g, 'dark:border-gray-600');
  content = content.replace(/dark:border-gray-600 dark:border-gray-600/g, 'dark:border-gray-600');

  // Hover states
  content = content.replace(/dark:hover:bg-slate-[0-9]+(\/[0-9]+)? dark:hover:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
    return match.split(/\s+/)[0];
  });
  content = content.replace(/dark:hover:bg-gray-[0-9]+ dark:hover:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
    return match.split(/\s+/)[0];
  });

  // Specific catch-all for remaining double occurrences of identical dark classes within a string
  content = content.replace(/(dark:[a-z]+-[a-z]+-[0-9]+(\/[0-9]+)?)\s+\1/g, '$1');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log("Dark mode normalization 2 complete.");
