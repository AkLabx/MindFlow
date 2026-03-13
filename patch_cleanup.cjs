const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Remove the debug logging we added
content = content.replace(
  /console\.log\("RECEIVED_AUDIO_CHUNK"\);\n/,
  ''
);

// Optional: keep the `process.env.Gemini_API_KEY` we added, just clean it up slightly
content = content.replace(
  /\|\| import\.meta\.env\.VITE_GEMINI_API_KEY \|\| "AIzaSyCzvOWTjjCFjKXET7hv2dix5HvQdoW4Pww";/,
  '|| import.meta.env.VITE_GEMINI_API_KEY;'
);

// And we can leave `gemini-2.5-flash-native-audio-preview-09-2025` as it is (it successfully worked).

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Cleanup done.");
