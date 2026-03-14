const fs = require('fs');

function fixAIChatPage() {
    const path = 'src/features/ai/chat/AIChatPage.tsx';
    let data = fs.readFileSync(path, 'utf8');

    // Fix TS1381 errors around `&rbrace;`
    data = data.replace(/<span className="text-\[10px\] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1\.5 py-0\.5 rounded-full whitespace-nowrap">\s*\{quota\?\.getRemainingUses\(\)\} left\s*<\/span>/g, `<span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {quota?.getRemainingUses()} left
                                </span>`);

    data = data.replace(/\{Object\.values\(MODEL_CONFIGS\)\.map\(m => \(\s*<option key=\{m\.id\} value=\{m\.id\} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">\s*\{m\.displayName\}\s*<\/option>\s*\)\)\}/g, `{Object.values(MODEL_CONFIGS).map((m: any) => (
                                    <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {m.displayName}
                                    </option>
                                ))}`);

    data = data.replace(/\{Object\.values\(AI_PERSONAS\)\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">\s*\{p\.name\}\s*<\/option>\s*\)\)\}/g, `{Object.values(AI_PERSONAS).map((p: any) => (
                                    <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {p.name}
                                    </option>
                                ))}`);


    fs.writeFileSync(path, data);
}

function fixChatInput() {
    const path = 'src/features/ai/chat/ChatInput.tsx';
    let data = fs.readFileSync(path, 'utf8');

    // Fix broken TSX
    data = data.replace(/\{isRecording \? \(\s*<Loader2 className="h-5 w-5 text-red-500 animate-spin" \/>\s*\) : \(\s*<Mic className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" \/>\s*\)/g, `{isRecording ? (
                                    <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                                ) : (
                                    <Mic className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                                )}`);
    fs.writeFileSync(path, data);
}

function fixUseAIChat() {
    const path = 'src/features/ai/chat/useAIChat.ts';
    let data = fs.readFileSync(path, 'utf8');

    // Fix comma issues in object destructuring
    data = data.replace(/setIncludeAppData\s*activeModel,\s*setActiveModel,\s*quota/g, `setIncludeAppData,\n        activeModel,\n        setActiveModel,\n        quota`);
    fs.writeFileSync(path, data);
}

try {
  fixAIChatPage();
  fixChatInput();
  fixUseAIChat();
  console.log('Fixed syntax errors');
} catch (e) {
  console.error(e);
}
