import re

with open('src/routes/AppRoutes.tsx', 'r') as f:
    content = f.read()

# Add new lazy imports
new_imports = """const QuizResult = lazy(() => import('../features/quiz/components/QuizResult').then(m => ({ default: m.QuizResult })));
const MockQuizResult = lazy(() => import('../features/quiz/components/MockQuizResult').then(m => ({ default: m.MockQuizResult })));
const GodQuizResult = lazy(() => import('../features/quiz/components/GodQuizResult').then(m => ({ default: m.GodQuizResult })));"""

content = re.sub(
    r"const QuizResult = lazy\(\(\) => import\('\.\./features/quiz/components/QuizResult'\)\.then\(m => \(\{ default: m\.QuizResult \}\)\)\);",
    new_imports,
    content
)

# Update Result Route logic to handle multiple result pages based on state.mode
old_result_route = """                    <Route path="/result" element={
                        <QuizResult
                            score={state.score}
                            total={state.activeQuestions.length}
                            questions={state.activeQuestions}
                            answers={state.answers}
                            timeTaken={state.timeTaken}
                            bookmarks={state.bookmarks}
                            onRestart={restartQuiz}
                            onGoHome={navHome}
                        />
                    } />"""

new_result_route = """                    <Route path="/result" element={
                        state.mode === 'mock' ? (
                            <MockQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={restartQuiz}
                                onGoHome={navHome}
                            />
                        ) : state.mode === 'god' ? (
                            <GodQuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={restartQuiz}
                                onGoHome={navHome}
                            />
                        ) : (
                            <QuizResult
                                score={state.score}
                                total={state.activeQuestions.length}
                                questions={state.activeQuestions}
                                answers={state.answers}
                                timeTaken={state.timeTaken}
                                bookmarks={state.bookmarks}
                                onRestart={restartQuiz}
                                onGoHome={navHome}
                            />
                        )
                    } />"""

content = content.replace(old_result_route, new_result_route)

with open('src/routes/AppRoutes.tsx', 'w') as f:
    f.write(content)
