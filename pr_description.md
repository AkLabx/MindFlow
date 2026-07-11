🔒 [Security Fix: Fix Unsanitized HTML to Text Issue]

🎯 What:
The `QuizQuestionDisplay.tsx` component was taking untrusted HTML (`question.question_hi`) and assigning it to the `innerHTML` of a temporary DOM element to extract plain text for the TTS engine.

⚠️ Risk:
Direct assignment of user-supplied or untrusted strings to `innerHTML`, even on an unattached DOM element, can trigger side effects (e.g. fetching external assets like `<img>` tags or potentially executing scripts depending on the context). This opens up an Cross-Site Scripting (XSS) vulnerability.

🛡️ Solution:
Created a new secure `stripHtml` utility function that relies on the native `DOMParser` to parse the HTML and extract `textContent`. This approach safely removes formatting tags without executing scripts or fetching resources. We refactored `QuizQuestionDisplay.tsx` to use this new utility instead of direct `innerHTML` assignments. We also added dedicated unit tests to ensure text is parsed correctly and safely under different scenarios.
💡 **What:**
Optimized the `markMastered` function in `useSynonymProgress.ts` to perform all `familiar` interactions updates concurrently using `Promise.all()`. Also added logic to deduplicate target words by ID before submitting the updates.

🎯 **Why:**
Previously, `markMastered` would loop through all `synonyms` and `clusterWords` arrays and independently `await` the `updateInteraction` for each word one-by-one. Since these updates represent independent interaction states, they do not need to be sequential. Batching them significantly reduces overall wait time since it mitigates cumulative async/DB wait time.

📊 **Measured Improvement:**
Using a mock benchmarking script that simulates a 10ms IndexedDB write latency, the baseline sequential approach for a `markMastered` update involving 5 synonyms and 6 cluster words took **122.31 ms**. The optimized concurrent implementation took **20.94 ms**, resulting in an **82.88%** performance improvement!
