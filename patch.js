const fs = require('fs');

const filePath = 'src/features/quiz/components/SavedQuizzes.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the top inline "Create New Quiz" button.
content = content.replace(
    /<\s*button\s*onClick=\{\(\) => navigate\('\/quiz\/config'\)\}\s*className="px-4 py-2\.5 bg-indigo-50[^>]+>\s*<PlusCircle className="w-5 h-5" \/>\s*Create New Quiz\s*<\/button>/g,
    ''
);

// 2. Rename "Attempted Quizzes" button to "View Attempted quizzes"
content = content.replace(
    /<CheckCircle className="w-5 h-5" \/>\s*Attempted Quizzes/g,
    '<CheckCircle className="w-5 h-5" />\n                            View Attempted quizzes'
);

// 3. Rename central "Create Quiz" button to "Create New Quiz"
// Note: We'll target the central empty state button which still has `navigate('/quiz/config')` and `Create Quiz` text
content = content.replace(
    /<\s*button\s*onClick=\{\(\) => navigate\('\/quiz\/config'\)\}\s*className="px-6 py-3 bg-indigo-50[^>]+>\s*<PlusCircle className="w-5 h-5" \/>\s*Create Quiz\s*<\/button>/g,
    `<button
                            onClick={() => navigate('/quiz/config')}
                            className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/40 border-b-4 border-b-indigo-300 dark:border-b-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:translate-y-1 active:border-b transition-all shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create New Quiz
                        </button>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("File updated successfully.");
