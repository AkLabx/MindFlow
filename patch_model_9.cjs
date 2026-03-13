const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  /const ai = new GoogleGenAI\(\{ apiKey \}\);/,
  'const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });'
);

content = content.replace(
  /const sessionPromise = ai.live.connect\(\{ httpOptions: \{ apiVersion: "v1alpha" \},/,
  'const sessionPromise = ai.live.connect({'
);

content = content.replace(
  /model: 'models\/gemini-2.0-flash-exp'/,
  "model: 'models/gemini-2.0-flash-exp-0205'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched to v1alpha on client");
