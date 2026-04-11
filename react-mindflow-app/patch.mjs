import fs from 'fs';
const file = 'src/features/quiz/components/AiExplanationButton.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const apiKey = process.env.GOOGLE_AI_KEY;',
  'const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;'
);

content = content.replace(
  'generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent',
  'generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'
);

fs.writeFileSync(file, content);
console.log('Patched API key and model name.');
