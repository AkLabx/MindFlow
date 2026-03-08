const fs = require('fs');
const file = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add lazy loading for AttemptedQuizzes
content = content.replace(
    /const SavedQuizzes = lazy\(\(\) => import\('\.\.\/features\/quiz\/components\/SavedQuizzes'\)\.then\(m => \(\{ default: m\.SavedQuizzes \}\)\)\);/,
    `const SavedQuizzes = lazy(() => import('../features/quiz/components/SavedQuizzes').then(m => ({ default: m.SavedQuizzes })));\nconst AttemptedQuizzes = lazy(() => import('../features/quiz/components/AttemptedQuizzes').then(m => ({ default: m.AttemptedQuizzes })));`
);

// Add the route
content = content.replace(
    /<Route path="\/quiz\/saved" element=\{<SavedQuizzes \/>\} \/>/,
    `<Route path="/quiz/saved" element={<SavedQuizzes />} />\n                    <Route path="/quiz/attempted" element={<AttemptedQuizzes />} />`
);

fs.writeFileSync(file, content);
console.log('AppRoutes patched.');
