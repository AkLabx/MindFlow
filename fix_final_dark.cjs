const fs = require('fs');
const files = [
  'src/features/quiz/components/BookmarksPage.tsx',
  'src/features/quiz/components/LandingPage.tsx',
  'src/features/quiz/components/QuizNavigationPanel.tsx',
  'src/features/tools/ToolsHome.tsx',
  'src/features/tools/bilingual-pdf-maker/BilingualPdfMaker.tsx',
  'src/features/tools/flashcard-maker/FlashcardMaker.tsx',
  'src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace remaining text duplicates specifically seen above
  content = content.replace(/dark:text-gray-400\s+dark:text-slate-500/g, 'dark:text-gray-400');
  content = content.replace(/dark:text-gray-300\s+dark:text-slate-500/g, 'dark:text-gray-300');
  content = content.replace(/dark:bg-slate-900\s+dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:bg-slate-[0-9]+\s+dark:bg-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
      return match.split(/\s+/)[0];
  });
  content = content.replace(/dark:bg-gray-[0-9]+\s+dark:bg-gray-[0-9]+(\/[0-9]+)?/g, function(match) {
      return match.split(/\s+/)[0];
  });
  content = content.replace(/dark:border-slate-[0-9]+\s+dark:border-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
      return match.split(/\s+/)[0];
  });
  content = content.replace(/dark:text-slate-[0-9]+\s+dark:text-slate-[0-9]+(\/[0-9]+)?/g, function(match) {
      return match.split(/\s+/)[0];
  });
  // One final catch-all for consecutive identical dark classes
  let previous;
  do {
      previous = content;
      content = content.replace(/(dark:[a-z]+-(gray|slate|white)-[0-9]+(\/[0-9]+)?)\s+\1/g, '$1');
  } while (content !== previous);

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Final dark mode sweep complete.");
