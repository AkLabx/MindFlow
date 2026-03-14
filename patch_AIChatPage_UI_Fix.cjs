const fs = require('fs');

const AIChatPagePath = 'src/features/ai/chat/AIChatPage.tsx';
let code = fs.readFileSync(AIChatPagePath, 'utf8');

// 1. Add modelSwitcher UI
if (!code.includes("import { MODEL_CONFIGS } from './useQuota';")) {
    code = code.replace("import { useAIChat, AI_PERSONAS } from './useAIChat';", "import { useAIChat, AI_PERSONAS } from './useAIChat';\nimport { MODEL_CONFIGS } from './useQuota';");
}

if (!code.includes("activeModel,")) {
    code = code.replace("activePersona,", "activePersona,\n        activeModel,\n        setActiveModel,");
}

const personaDropdownStart = `<select
                                value={activePersona}`;
const headerFlexDiv = `<div className="flex flex-1 items-center justify-between">`;

if (code.includes(headerFlexDiv) && !code.includes("MODEL_CONFIGS[activeModel]?.displayName")) {
    const newHeaderFlex = `
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <select
                                value={activePersona}
                                onChange={(e) => setActivePersona(e.target.value as any)}
                                className="bg-transparent font-semibold text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 text-base min-w-[120px]"
                            >
                                {Object.values(AI_PERSONAS).map(p => (
                                    <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2 hidden sm:block"></div>

                            <select
                                value={activeModel}
                                onChange={(e) => setActiveModel(e.target.value as any)}
                                className="hidden sm:block bg-transparent font-medium text-sm text-indigo-600 dark:text-indigo-400 border-0 outline-none focus:ring-0 p-0"
                            >
                                {Object.values(MODEL_CONFIGS).map(m => (
                                    <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {m.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
`;
    // Replace existing persona logic with the new combined one
    code = code.replace(/<div className="flex items-center gap-2">\s*<Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" \/>\s*<select\s*value=\{activePersona\}\s*onChange=\{\(e\) => setActivePersona\(e\.target\.value as any\)\}\s*className="bg-transparent font-semibold text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 text-base"\s*>\s*\{Object\.values\(AI_PERSONAS\)\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">\s*\{p\.name\}\s*<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/g, newHeaderFlex);
}

fs.writeFileSync(AIChatPagePath, code);
console.log('Patched AIChatPage.tsx with Model Switcher UI.');
