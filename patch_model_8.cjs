const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  /model: 'models\/gemini-2.0-flash-exp-0205'/,
  "model: 'models/gemini-2.0-flash-exp'"
);

content = content.replace(
  /const sessionPromise = ai.live.connect\(\{/,
  'const sessionPromise = ai.live.connect({ httpOptions: { apiVersion: "v1alpha" },'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched to v1alpha");
