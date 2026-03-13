const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Set it back to exactly what it was!
content = content.replace(
  /model: 'gemini-2.0-flash'/,
  "model: 'gemini-2.5-flash-native-audio-preview-09-2025'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched back to gemini-2.5-flash-native-audio-preview-09-2025");
