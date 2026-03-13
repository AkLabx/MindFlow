const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  /model: 'gemini-2.0-flash-exp'/,
  "model: 'gemini-2.0-flash'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched model to gemini-2.0-flash");
