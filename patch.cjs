const fs = require('fs');

const filePath = 'src/features/quiz/components/SavedQuizzes.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The exact string block we want to replace/remove
const buttonToRemove = `<button
                            onClick={() => navigate('/quiz/config')}
                            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/40 border-b-4 border-b-indigo-300 dark:border-b-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:translate-y-1 active:border-b transition-all shadow-sm flex items-center gap-2"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create New Quiz
                        </button>`;

content = content.replace(buttonToRemove, '');

const attemptedTextToReplace = `Attempted Quizzes`;
const attemptedTextReplacement = `View Attempted quizzes`;

// Let's just do a string replace for "Attempted Quizzes"
content = content.replace(attemptedTextToReplace, attemptedTextReplacement);

const centralButtonToReplace = `Create Quiz`;
const centralButtonReplacement = `Create New Quiz`;

// We'll replace it inside the empty state block
const emptyStateBlock = `<div className="text-center py-12 bg-white dark:bg-gray-800 dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Created Quizzes</h3>
                        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-slate-400 dark:text-slate-500 mb-6">Start a new quiz to see it here!</p>
                        <button
                            onClick={() => navigate('/quiz/config')}
                            className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/40 border-b-4 border-b-indigo-300 dark:border-b-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:translate-y-1 active:border-b transition-all shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create Quiz
                        </button>
                    </div>`;

const modifiedEmptyStateBlock = emptyStateBlock.replace('Create Quiz', 'Create New Quiz');

content = content.replace(emptyStateBlock, modifiedEmptyStateBlock);

fs.writeFileSync(filePath, content, 'utf8');
