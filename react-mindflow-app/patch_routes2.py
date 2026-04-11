import re

with open('src/routes/AppRoutes.tsx', 'r') as f:
    content = f.read()

old_result_route = """                    <Route path="/result" element={
                        <QuizResult
                            score={state.score}
                            total={state.activeQuestions.length}
                            questions={state.activeQuestions}
                            answers={state.answers}
                            timeTaken={state.timeTaken}
                            bookmarks={state.bookmarks}
                            onRestart={() => { restartQuiz(); navTo('/quiz/config'); }}
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
                                onRestart={() => { restartQuiz(); navTo('/quiz/config'); }}
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
                                onRestart={() => { restartQuiz(); navTo('/quiz/config'); }}
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
                                onRestart={() => { restartQuiz(); navTo('/quiz/config'); }}
                                onGoHome={navHome}
                            />
                        )
                    } />"""

content = content.replace(old_result_route, new_result_route)

with open('src/routes/AppRoutes.tsx', 'w') as f:
    f.write(content)
