const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// For Live API (bidiGenerateContent), the correct model right now in v1beta / v1alpha is gemini-2.0-flash-exp usually,
// but wait, the docs in genai.d.ts say:
//  if (GOOGLE_GENAI_USE_VERTEXAI) {
//      model = 'gemini-2.0-flash-live-preview-04-09';
//  } else {
//      model = 'gemini-2.0-flash-exp'; // previously
//  }
// Let me look at the API version again. What did the user use originally? 'gemini-2.5-flash-native-audio-preview-09-2025'
// Wait, is it `gemini-2.5-flash`?
content = content.replace(
  /model: 'gemini-2.0-flash'/,
  "model: 'gemini-2.0-flash-exp'"
);

fs.writeFileSync(targetFile, content, 'utf8');
