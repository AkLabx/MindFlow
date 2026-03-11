const fs = require('fs');

const path = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(path, 'utf8');

// The route /synonyms/session is defined multiple times and points `onExit` to `navHome`.
// We need to point it to `() => navTo('/synonyms/config')`.

// The user might have multiple identical routes for /synonyms/session and others like /synonyms/config.
// Looking at the AppRoutes earlier:
// <Route path="/synonyms/session" element={
//      <SynonymFlashcardSession
//         data={state.activeSynonyms || []}
//         currentIndex={state.currentQuestionIndex}
//         onNext={nextQuestion}
//         onPrev={prevQuestion}
//         onExit={navHome}
// ...

content = content.replace(/onExit=\{navHome\}\s+onFinish=\{() => navTo\('\/flashcards\/summary'\)\}\s+filters=\{state\.filters \|\| \{\} as any\}\s+onJump=\{jumpToQuestion\}\s+\/>\s+\}\s+\/>/g,
  `onExit={() => navTo('/synonyms/config')}
                        onFinish={() => navTo('/flashcards/summary')}
                        filters={state.filters || {} as any}
                        onJump={jumpToQuestion}
                    />
                } />`
);

// We'll just do a more direct replace to handle any instances of SynonymFlashcardSession's onExit:
content = content.replace(
  /<SynonymFlashcardSession([\s\S]*?)onExit=\{navHome\}/g,
  '<SynonymFlashcardSession$1onExit={() => navTo(\'/synonyms/config\')}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated AppRoutes.tsx successfully!");
