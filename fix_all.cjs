const fs = require('fs');

const AIChatPage = 'src/features/ai/chat/AIChatPage.tsx';
let aic = fs.readFileSync(AIChatPage, 'utf8');
// Fix missing brackets from map
aic = aic.replace(/\{Object\.values\(AI_PERSONAS\)\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">\s*\{p\.name\}\s*<\/option>\s*\)\)\}/g,
`{Object.values(AI_PERSONAS).map(p => (
    <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
        {p.name}
    </option>
))}`);

aic = aic.replace(/\{Object\.values\(MODEL_CONFIGS\)\.map\(m => \(\s*<option key=\{m\.id\} value=\{m\.id\} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">\s*\{m\.displayName\}\s*<\/option>\s*\)\)\}/g,
`{Object.values(MODEL_CONFIGS).map(m => (
    <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
        {m.displayName}
    </option>
))}`);

fs.writeFileSync(AIChatPage, aic);

const useAIChat = 'src/features/ai/chat/useAIChat.ts';
let uac = fs.readFileSync(useAIChat, 'utf8');
uac = uac.replace(/setIncludeAppData\n\s*activeModel,\n\s*setActiveModel,\n\s*quota/g, `setIncludeAppData,\n        activeModel,\n        setActiveModel,\n        quota`);
uac = uac.replace(/setIncludeAppData\s*activeModel,\s*setActiveModel,\s*quota/g, `setIncludeAppData,\n        activeModel,\n        setActiveModel,\n        quota`);
fs.writeFileSync(useAIChat, uac);
