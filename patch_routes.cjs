const fs = require('fs');

const path = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add lazy import for McqsQuizHome
const mcqsImport = `const McqsQuizHome = lazy(() => import('../features/quiz/components/McqsQuizHome').then(m => ({ default: m.McqsQuizHome })));\n`;
content = content.replace(/const EnglishQuizHome = lazy/, mcqsImport + 'const EnglishQuizHome = lazy');

// 2. Add route for /mcqs in the routes list (near /dashboard)
const dashboardRouteStr = `<Route path="/dashboard" element={
                        <Dashboard
                            onStartQuiz={() => { navTo('/quiz/config'); }}
                            onEnglish={() => { navTo('/english'); }}
                            onBackToIntro={() => { navTo('/dashboard'); }}
                            onSavedQuizzes={() => { navTo('/quiz/saved'); }}
                        />
                    } />`;

// Let's replace the whole /dashboard route to match the updated DashboardProps
// And add /mcqs below it.
const dashboardRegex = /<Route path="\/dashboard" element=\{[\s\S]*?<Dashboard[\s\S]*?\/>[\s\S]*?\} \/>/;

const newRoutes = `<Route path="/dashboard" element={
                        <Dashboard
                            onEnglish={() => { navTo('/english'); }}
                            onBackToIntro={() => { navTo('/dashboard'); }}
                        />
                    } />

                    <Route path="/mcqs" element={
                        <McqsQuizHome onBack={() => { navTo('/dashboard'); }} />
                    } />`;

content = content.replace(dashboardRegex, newRoutes);

// We should also check for other instances of Dashboard usage if any
const dashboardUsage2 = `<Dashboard
                            onStartQuiz={() => { navTo('/quiz/config'); }}
                            onEnglish={() => { navTo('/english'); }}
                            onBackToIntro={() => { navTo('/dashboard'); }}
                            onSavedQuizzes={() => { navTo('/quiz/saved'); }}
                        />`;

if (content.includes('onStartQuiz={')) {
    content = content.replace(/onStartQuiz=\{[\s\S]*?\}/g, '');
}
if (content.includes('onSavedQuizzes={')) {
    content = content.replace(/onSavedQuizzes=\{[\s\S]*?\}/g, '');
}

fs.writeFileSync(path, content);
console.log('Done patching routes!');
