const fs = require('fs');
const filePath = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix textGradient which wasn't replaced properly in the template string
content = content.replace(/\$\{textGradient\}/g, "from-slate-700 to-slate-900 dark:from-white dark:to-slate-300"); // Just fallback to default, or we can handle it specifically.
content = content.replace(/className=\{`text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2`\}/g, 'className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2"');

// Specifically fix gradients for each card if we want to retain the colors.
// Card 1
content = content.replace(/Card card-1[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100"); });
// Card 2
content = content.replace(/Card card-2[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100"); });
// Card 3
content = content.replace(/Card card-3[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100"); });
// Card 4
content = content.replace(/Card card-4[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100"); });
// Card 5
content = content.replace(/Card card-5[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100"); });
// Card 6
content = content.replace(/Card card-6[\s\S]*?<h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 mb-1 sm:mb-2">/, function(match) { return match.replace("from-slate-700 to-slate-900 dark:from-white dark:to-slate-300", "from-violet-600 to-violet-900 dark:from-violet-300 dark:to-violet-100"); });

// Fix TS Variants error
content = content.replace(/transition: \{ type: 'spring', stiffness: 300, damping: 24 \}/g, "transition: { type: 'spring' as const, stiffness: 300, damping: 24 }");

fs.writeFileSync(filePath, content);
