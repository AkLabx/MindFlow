const fs = require('fs');
const content = fs.readFileSync('src/features/quiz/components/QuizNavigationPanel.tsx', 'utf8');

if (content.includes('group.title') && content.includes('group.count') && content.includes('group.items.map')) {
    console.log('UI checks out ok');
} else {
    console.log('UI failed checks');
}
