const fs = require('fs');
const file = 'src/features/quiz/components/SavedQuizzes.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace main title
content = content.replace(/<h1 className="text-2xl font-bold text-gray-900">Saved Quizzes<\/h1>/, '<h1 className="text-2xl font-bold text-gray-900">Created Quizzes</h1>');

// Replace empty state
content = content.replace(/<h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Quizzes<\/h3>/, '<h3 className="text-lg font-medium text-gray-900 mb-2">No Created Quizzes</h3>');

// Add Attempted Quizzes button
content = content.replace(
    /className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"\s*>\s*Create New Quiz\s*<\/button>/,
    `className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create New Quiz
                    </button>
                    <button
                        onClick={() => navigate('/quiz/attempted')}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Attempted Quizzes
                    </button>`
);

// Filter the quizzes so it only shows incomplete (paused) quizzes
content = content.replace(
    /setQuizzes\(data\.sort\(\(a, b\) => b\.createdAt - a\.createdAt\)\);/,
    `setQuizzes(data.filter(q => q.state.status !== 'result').sort((a, b) => b.createdAt - a.createdAt));`
);

// Replace empty state description since we now have "Created Quizzes"
content = content.replace(/Create a quiz to start learning!/, 'Start a new quiz to see it here!');

fs.writeFileSync(file, content);
console.log('Patch applied.');
