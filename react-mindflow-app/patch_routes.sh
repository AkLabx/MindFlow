# Remove the existing static import that is causing the conflict, then add the route and our component at the bottom or top properly.
sed -i '/import { QuizResult }/d' src/routes/AppRoutes.tsx

# Find where lazy imports end, and add our static import there
sed -i 's|import { AdminNotifications }|import { QuizResult } from "../features/quiz/components/QuizResult";\nimport { AdminNotifications }|' src/routes/AppRoutes.tsx

# Add the route
sed -i '/<Route path="\/quiz\/active" element={<ActiveQuizLayout \/>} \/>/a \
        <Route path="/test-result" element={ \
            <QuizResult \
                score={40} \
                total={50} \
                questions={Array.from({length: 50}).map((_, i) => ({ \
                    id: `q${i}`, \
                    text: `Test Question ${i}`, \
                    type: "multiple_choice" as const, \
                    options: ["A", "B", "C", "D"], \
                    correct: "A", \
                    explanation: "Reason", \
                    classification: { \
                        subject: i < 20 ? "Quantitative Aptitude" : (i < 40 ? "Reasoning" : "English"), \
                        topic: "General", \
                        difficulty: "medium" \
                    } \
                }))} \
                answers={Array.from({length: 45}).reduce((acc: any, _, i) => { \
                    acc[`q${i}`] = i < 40 ? "A" : "B"; \
                    return acc; \
                }, {})} \
                timeTaken={Array.from({length: 50}).reduce((acc: any, _, i) => { \
                    acc[`q${i}`] = i < 45 ? 15 : 0; \
                    return acc; \
                }, {})} \
                bookmarks={["q1", "q5"]} \
                onRestart={() => {}} \
                onGoHome={() => {}} \
            /> \
        } />' src/routes/AppRoutes.tsx
