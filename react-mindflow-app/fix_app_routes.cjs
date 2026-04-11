const fs = require('fs');
let content = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');

// Import GodModeSession
content = content.replace(
  `import { MockSession } from '../features/quiz/mock/MockSession';`,
  `import { MockSession } from '../features/quiz/mock/MockSession';\nimport { GodModeSession } from '../features/quiz/mock/GodModeSession';`
);

// Add GodMode route next to mock route
const mockRoute = `{/* Mock Mode: Timed exam simulation */}
                <Route path="/quiz/session/mock" element={
                    <MockSession
                        questions={state.activeQuestions}
                        initialTime={state.quizTimeRemaining}
                        onPause={(timeLeft) => {
                            syncGlobalTimer(timeLeft);
                            pauseQuiz();
                            setTimeout(() => navTo('/quiz/saved'), 100);
                        }}
                        onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}
                    />
                } />`;

const godRoute = `${mockRoute}

                {/* God Mode: Stricter timed blueprint simulation */}
                <Route path="/quiz/session/god" element={
                    <GodModeSession
                        questions={state.activeQuestions}
                        initialTime={state.quizTimeRemaining}
                        onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}
                    />
                } />`;

content = content.replace(mockRoute, godRoute);

fs.writeFileSync('src/routes/AppRoutes.tsx', content);
