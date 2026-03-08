const fs = require('fs');
const file = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<h3 className="text-lg font-bold text-gray-900 mb-1">My Quizzes<\/h3>/g, '<h3 className="text-lg font-bold text-gray-900 mb-1">Created Quizzes</h3>');
content = content.replace(/Card 2 - Saved Quizzes/g, 'Card 2 - Created Quizzes');

fs.writeFileSync(file, content);
console.log('Dashboard patched.');
