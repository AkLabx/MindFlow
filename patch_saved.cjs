const fs = require('fs');
const file = 'src/features/quiz/components/SavedQuizzes.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<button\s*onClick=\{\(\) => navigate\('\/quiz\/config'\)\}\s*className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"\s*>\s*Create New Quiz\s*<\/button>\s*<button\s*onClick=\{\(\) => navigate\('\/quiz\/attempted'\)\}\s*className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"\s*>\s*Attempted Quizzes\s*<\/button>/, `<div className="flex gap-4">\n                        <button\n                            onClick={() => navigate('/quiz/config')}\n                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"\n                        >\n                            Create New Quiz\n                        </button>\n                        <button\n                            onClick={() => navigate('/quiz/attempted')}\n                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"\n                        >\n                            Attempted Quizzes\n                        </button>\n                    </div>`);

fs.writeFileSync(file, content);
console.log('SavedQuizzes layout patched.');
