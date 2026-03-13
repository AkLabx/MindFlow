const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Update to model: 'gemini-2.0-flash-exp' which is known to support Live API
content = content.replace(
  /model: 'gemini-2.5-flash-native-audio-preview-09-2025'/,
  "model: 'gemini-2.0-flash-exp'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched model in " + targetFile);
