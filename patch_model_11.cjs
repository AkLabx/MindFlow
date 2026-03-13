const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  /model: 'models\/gemini-2.0-flash-exp'/,
  "model: 'gemini-2.0-flash'"
);

content = content.replace(
  /ai\.models\.list\(\)\.then\(m => console\.log\("Models:", m\)\)\.catch\(e => console\.log\(e\)\);/,
  ''
);

// Actually, `gemini-2.0-flash` is what is used for bidiGenerateContent usually
content = content.replace(
  /const ai = new GoogleGenAI\(\{ apiKey, httpOptions: \{ apiVersion: "v1alpha" \} \}\);/,
  'const ai = new GoogleGenAI({ apiKey });'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched to gemini-2.0-flash");
