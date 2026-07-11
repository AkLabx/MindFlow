🔒 [Security Fix: Fix Unsanitized HTML to Text Issue]

🎯 What:
The `QuizQuestionDisplay.tsx` component was taking untrusted HTML (`question.question_hi`) and assigning it to the `innerHTML` of a temporary DOM element to extract plain text for the TTS engine.

⚠️ Risk:
Direct assignment of user-supplied or untrusted strings to `innerHTML`, even on an unattached DOM element, can trigger side effects (e.g. fetching external assets like `<img>` tags or potentially executing scripts depending on the context). This opens up an Cross-Site Scripting (XSS) vulnerability.

🛡️ Solution:
Created a new secure `stripHtml` utility function that relies on the native `DOMParser` to parse the HTML and extract `textContent`. This approach safely removes formatting tags without executing scripts or fetching resources. We refactored `QuizQuestionDisplay.tsx` to use this new utility instead of direct `innerHTML` assignments. We also added dedicated unit tests to ensure text is parsed correctly and safely under different scenarios.
