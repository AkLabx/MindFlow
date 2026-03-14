const fs = require('fs');

const AIChatPagePath = 'src/features/ai/chat/AIChatPage.tsx';
let aiCode = fs.readFileSync(AIChatPagePath, 'utf8');

// 1. Add model switcher to header
if (!aiCode.includes("import { MODEL_CONFIGS }")) {
  aiCode = aiCode.replace(
    "import { useAIChat, AI_PERSONAS } from './useAIChat';",
    "import { useAIChat, AI_PERSONAS } from './useAIChat';\nimport { MODEL_CONFIGS } from './useQuota';"
  );
}

const destructureBlockRegex = /const \{\s*messages,[\s\S]*?\} = useAIChat\(\);/m;
if (!aiCode.includes("activeModel,")) {
  aiCode = aiCode.replace(destructureBlockRegex, `const {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        stopGenerating,
        activePersona,
        setActivePersona,
        includeAppData,
        setIncludeAppData,
        activeModel,
        setActiveModel,
        quota
    } = useAIChat();`);
}

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

const newHeader = `<div className="flex items-center gap-2">
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

                            <div className="hidden sm:flex items-center gap-1">
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
                            </div>
                        </div>`;

aiCode = aiCode.replace(oldHeader, newHeader);
fs.writeFileSync(AIChatPagePath, aiCode);
console.log('Reapplied AI Chat Page Header');


const UseAIChatPath = 'src/features/ai/chat/useAIChat.ts';
let useCode = fs.readFileSync(UseAIChatPath, 'utf8');

if (!useCode.includes("import { useQuota")) {
  useCode = useCode.replace(
    "import { \n    AIChatConversation",
    "import { useQuota, MODEL_CONFIGS, ModelId } from './useQuota';\nimport { \n    AIChatConversation"
  );
}

const personaRegex = /const \[activePersona, setActivePersona\] = useState<PersonaId>\('general'\);/g;
if (!useCode.includes("const [activeModel")) {
  useCode = useCode.replace(personaRegex, `const [activePersona, setActivePersona] = useState<PersonaId>('general');
    const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');
    const quota = useQuota(activeModel);`);
}

const urlRegex = /`https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/gemini-2.5-flash:streamGenerateContent\?key=\$\{apiKey\}&alt=sse`/g;
useCode = useCode.replace(urlRegex, "`https://generativelanguage.googleapis.com/v1beta/models/${String(activeModel).startsWith('gemini') ? activeModel : 'gemini-2.5-flash'}:streamGenerateContent?key=${apiKey}&alt=sse`");

const reqCheckLoc = "if (abortControllerRef.current) {";
if (useCode.includes(reqCheckLoc) && !useCode.includes("const quotaCheck = quota.checkCanRequest()")) {
  const qcBlock = `        const quotaCheck = quota.checkCanRequest();
        if (!quotaCheck.allowed) {
            setMessages(prev => [...prev, {
                id: uuidv4(),
                conversation_id: currentConversationId || uuidv4(),
                role: 'assistant',
                content: \`**Quota Alert:** \${quotaCheck.reason}\`,
                created_at: new Date().toISOString()
            }]);
            return;
        }
        quota.trackRequest();

        `;
  useCode = useCode.replace(reqCheckLoc, qcBlock + reqCheckLoc);
}

const returnBlock = /return \{\s*messages,[\s\S]*?setIncludeAppData\s*\};/m;
if (!useCode.includes("activeModel,")) {
  useCode = useCode.replace(returnBlock, `return {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        stopGenerating,
        activePersona,
        setActivePersona,
        includeAppData,
        setIncludeAppData,
        activeModel,
        setActiveModel,
        quota
    };`);
}

fs.writeFileSync(UseAIChatPath, useCode);
console.log('Reapplied useAIChat.ts quota integration');
