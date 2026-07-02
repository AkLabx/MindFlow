const fs = require('fs');
const files = [
    { name: 'chat-ai/index.ts', path: 'supabase/functions/chat-ai/index.ts' },
    { name: 'tts-gateway/index.ts', path: 'supabase/functions/tts-gateway/index.ts' },
    { name: '_shared/ai/governance.ts', path: 'supabase/functions/_shared/ai/governance.ts' },
    { name: '_shared/ai/telemetry.ts', path: 'supabase/functions/_shared/ai/telemetry.ts' },
    { name: '_shared/ai/providers/gemini.ts', path: 'supabase/functions/_shared/ai/providers/gemini.ts' }
];

let allContent = '';
files.forEach(f => {
    allContent += `--- ${f.name} ---\n`;
    allContent += fs.readFileSync(f.path, 'utf8') + '\n\n';
});
fs.writeFileSync('functions_bundle.txt', allContent);
