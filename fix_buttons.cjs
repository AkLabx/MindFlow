const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// The user requested to disable/hide the Previous button on the first card, and the Next button on the last card.

// Previous button replacement
content = content.replace(
  /<button\s+onClick=\{onPrev\}\s+disabled=\{isFirst\}\s+className=\{`px-6 py-3 rounded-xl font-bold transition-colors \$\{\s+isFirst\s+\?\s+'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'\s+:\s+'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'\s+\}`\}\s*>\s*Previous\s*<\/button>/m,
  `{isFirst ? (
          <div className="px-6 py-3 w-[120px]"></div> /* Placeholder to keep spacing */
        ) : (
          <button
            onClick={onPrev}
            className="px-6 py-3 rounded-xl font-bold transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 w-[120px]"
          >
            Previous
          </button>
        )}`
);

// Next button replacement
content = content.replace(
  /<button\s+onClick=\{handleNext\}\s+className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500\/30"\s*>\s*\{isLast \? 'Finish Set' : 'Next'\}\s*<\/button>/m,
  `{isLast ? (
          <div className="px-8 py-3 w-[120px]"></div> /* Placeholder to keep spacing */
        ) : (
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500/30 w-[120px]"
          >
            Next
          </button>
        )}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated button visibility successfully!");
