const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The official model for the live API as of Gemini API changes is `gemini-2.0-flash-exp` on v1alpha
content = content.replace(
  /model: 'models\/gemini-2.0-flash-exp-0205'/,
  "model: 'models/gemini-2.0-flash-exp'"
);

// We need to actually log the models list to see what's available
content = content.replace(
  /const ai = new GoogleGenAI\(\{ apiKey, httpOptions: \{ apiVersion: "v1alpha" \} \}\);/,
  'const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });\n      ai.models.list().then(m => console.log("Models:", m)).catch(e => console.log(e));'
);

fs.writeFileSync(targetFile, content, 'utf8');
