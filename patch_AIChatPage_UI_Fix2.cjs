const fs = require('fs');

const AIChatPagePath = 'src/features/ai/chat/AIChatPage.tsx';
let code = fs.readFileSync(AIChatPagePath, 'utf8');

// The regex replacement above failed because of subtle formatting differences. Let's do a direct replacement.
const oldHeader = `<div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <select
                                value={activePersona}
                                onChange={(e) => setActivePersona(e.target.value as any)}
                                className="bg-transparent font-semibold text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 text-base"
                            >
                                {Object.values(AI_PERSONAS).map(p => (
                                    <option key={p.id} value={p.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>`;

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

code = code.replace(oldHeader, newHeaderFlex);

fs.writeFileSync(AIChatPagePath, code);
console.log('Patched AIChatPage.tsx with direct string replacement.');
