const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// I saw `gemini-2.0-flash` is listed, what if it's `gemini-2.5-flash` or `gemini-2.0-flash-exp-0205`?
// The user screenshot says "USE THIS MODEL gemini-2.5-flash-lite". Let me use it and use v1alpha.
// Let's look closely at `models/gemini-2.5-flash-lite` or `models/gemini-2.0-flash-lite`
// The screenshot: "USE THIS MODEL gemini-2.5-flash-lite , AND MAKE REQUEST OF 8..."
// But in the models list we got: `models/gemini-2.0-flash-lite` not `2.5-flash-lite`?
// Oh! In my test list I saw: models/gemini-2.0-flash-lite
// Let's use `gemini-2.0-flash-lite-preview-02-05`?
// No, let's use `gemini-2.0-flash-lite` first. If it doesn't work for bidiGenerateContent, maybe `gemini-2.0-flash` works on `v1alpha`?
// In the genai SDK, we did:
content = content.replace(
  /model: 'gemini-2.0-flash-exp'/,
  "model: 'gemini-2.0-flash'"
);

content = content.replace(
  /const sessionPromise = ai.live.connect\(\{/,
  'const sessionPromise = ai.live.connect({'
);

fs.writeFileSync(targetFile, content, 'utf8');
