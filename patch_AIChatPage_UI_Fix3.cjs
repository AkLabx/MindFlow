const fs = require('fs');

const AIChatPagePath = 'src/features/ai/chat/AIChatPage.tsx';
let code = fs.readFileSync(AIChatPagePath, 'utf8');

// Ensure quota is destructured in AIChatPage
const destructureSearch = `        setActivePersona,
        includeAppData,
        setIncludeAppData`;

if (code.includes(destructureSearch)) {
    code = code.replace(destructureSearch, destructureSearch + `,\n        activeModel,\n        setActiveModel,\n        quota`);
}

// Ensure remaining uses is displayed in Model Switcher
const modelSwitcherSearch = `<select
                                value={activeModel}
                                onChange={(e) => setActiveModel(e.target.value as any)}
                                className="hidden sm:block bg-transparent font-medium text-sm text-indigo-600 dark:text-indigo-400 border-0 outline-none focus:ring-0 p-0"
                            >
                                {Object.values(MODEL_CONFIGS).map(m => (
                                    <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {m.displayName}
                                    </option>
                                ))}
                            </select>`;

const modelSwitcherReplace = `<div className="hidden sm:flex items-center gap-1">
                                <select
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value as any)}
                                    className="bg-transparent font-medium text-sm text-indigo-600 dark:text-indigo-400 border-0 outline-none focus:ring-0 p-0"
                                >
                                    {Object.values(MODEL_CONFIGS).map(m => (
                                        <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                            {m.displayName}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {quota?.getRemainingUses()} left
                                </span>
                            </div>`;

if (code.includes(modelSwitcherSearch)) {
    code = code.replace(modelSwitcherSearch, modelSwitcherReplace);
}

fs.writeFileSync(AIChatPagePath, code);
console.log('Patched AIChatPage.tsx completely.');
