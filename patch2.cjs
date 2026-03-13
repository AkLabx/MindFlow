const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The original file reads: const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
// We'll update it to check process.env.Gemini_API_KEY
content = content.replace(
  /const apiKey = process\.env\.API_KEY \|\| process\.env\.GEMINI_API_KEY \|\| import\.meta\.env\.VITE_GEMINI_API_KEY;/,
  'const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCzvOWTjjCFjKXET7hv2dix5HvQdoW4Pww";'
);

// Add a console log to track received audio
content = content.replace(
  /const playAudioChunk = async \(base64Audio: string\) => \{/,
  'const playAudioChunk = async (base64Audio: string) => {\nconsole.log("RECEIVED_AUDIO_CHUNK");'
);

// We should also check what model to use. Let's start with gemini-2.0-flash-exp or similar
// content = content.replace(/model: 'gemini-2.5-flash-native-audio-preview-09-2025'/, "model: 'gemini-2.0-flash-exp'");

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched " + targetFile);
