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

// Define the normalization mappings
// For instance: `dark:bg-slate-900` should be removed if next to `dark:bg-gray-800`.
// A better approach is to simply replace multi-dark classes with a single clean one.

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // BACKGROUNDS
  // Fix multiple gray/slate backgrounds
  content = content.replace(/dark:bg-gray-[0-9]+\s+dark:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
    const parts = match.split(/\s+/);
    return parts[0]; // Keep the first one (usually gray)
  });

  content = content.replace(/dark:bg-gray-[0-9]+\s+dark:bg-gray-[0-9]+/g, function(match) {
      const parts = match.split(/\s+/);
      return parts[0]; // Keep first
  });

  // TEXT
  content = content.replace(/dark:text-white\s+dark:text-white\s+dark:text-slate-[0-9]+/g, 'dark:text-white');
  content = content.replace(/dark:text-white\s+dark:text-slate-[0-9]+/g, 'dark:text-white');
  content = content.replace(/dark:text-gray-100\s+dark:text-gray-100\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-100');
  content = content.replace(/dark:text-gray-100\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-100');
  content = content.replace(/dark:text-gray-200\s+dark:text-gray-200\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-200');
  content = content.replace(/dark:text-gray-200\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-200');
  content = content.replace(/dark:text-gray-300\s+dark:text-gray-300\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-300');
  content = content.replace(/dark:text-gray-300\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-300');
  content = content.replace(/dark:text-gray-400\s+dark:text-gray-400\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-400');
  content = content.replace(/dark:text-gray-400\s+dark:text-slate-[0-9]+/g, 'dark:text-gray-400');

  // BORDERS
  content = content.replace(/dark:border-gray-700\s+dark:border-gray-700\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-700');
  content = content.replace(/dark:border-gray-700\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-700');
  content = content.replace(/dark:border-gray-800\s+dark:border-gray-800\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-800');
  content = content.replace(/dark:border-gray-800\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-800');
  content = content.replace(/dark:border-gray-600\s+dark:border-gray-600\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-600');
  content = content.replace(/dark:border-gray-600\s+dark:border-slate-[0-9]+/g, 'dark:border-gray-600');

  // HOVERS
  content = content.replace(/dark:hover:bg-gray-800\s+dark:hover:bg-slate-[0-9]+/g, 'dark:hover:bg-gray-800');
  content = content.replace(/dark:hover:bg-gray-[0-9]+\s+dark:hover:bg-gray-[0-9]+/g, function(match) {
      const parts = match.split(/\s+/);
      return parts[0];
  });
  content = content.replace(/dark:hover:bg-slate-[0-9]+\s+dark:hover:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
      const parts = match.split(/\s+/);
      return parts[0];
  });

  // Specifically address some known bad duplicates that the above might miss
  content = content.replace(/dark:text-slate-500 dark:text-slate-400 dark:text-slate-500/g, 'dark:text-slate-500');
  content = content.replace(/dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500/g, 'dark:text-slate-500');
  content = content.replace(/dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500/g, 'dark:text-slate-500');
  content = content.replace(/dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-slate-400 dark:text-slate-500/g, 'dark:text-gray-400');

  // A generic fallback for multiple identical classes (e.g., `dark:text-gray-400 dark:text-gray-400`)
  // that we might have missed
  const words = content.split(/(\s+)/);
  const uniqueWords = [];
  const classRegex = /^dark:[a-zA-Z0-9:-]+$/;
  let inTag = false;

  // We don't want to blindly unique every word in the file, only within className strings.
  // Instead of a complex regex, we'll write back the specific regex replaces.

  fs.writeFileSync(file, content, 'utf8');
}

console.log("Dark mode normalization complete.");
