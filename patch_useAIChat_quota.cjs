const fs = require('fs');

const useAIChatPath = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(useAIChatPath, 'utf8');

// 1. Import useQuota and MODEL_CONFIGS
if (!code.includes("import { useQuota, MODEL_CONFIGS }")) {
    code = code.replace("import { AIChatMessage, AIChatConversation, getChatConversations, getChatMessages, saveChatConversation, saveChatMessage, deleteChatConversation } from '../../../lib/db';", "import { AIChatMessage, AIChatConversation, getChatConversations, getChatMessages, saveChatConversation, saveChatMessage, deleteChatConversation } from '../../../lib/db';\nimport { useQuota, MODEL_CONFIGS, ModelId } from './useQuota';");
}

// 2. Add activeModel to state
if (!code.includes("const [activeModel, setActiveModel]")) {
    code = code.replace("const [activePersona, setActivePersona] = useState<string>('general');", "const [activePersona, setActivePersona] = useState<string>('general');\n    const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');\n    const quota = useQuota(activeModel);");
}

// 3. Update AI request endpoint to use the active model ID dynamically, defaulting to 2.5-flash if literal unknown
const endpointTarget = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`;
if (code.includes(endpointTarget)) {
    code = code.replace(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/${activeModel.startsWith('gemini') ? activeModel : 'gemini-2.5-flash'}:streamGenerateContent"
    );
}

// 4. Implement Pre-flight Quota Check inside sendMessage
const sendMessageStart = "const sendMessage = useCallback(async (content: string, imageBase64?: string) => {";
if (code.includes(sendMessageStart) && !code.includes("const quotaCheck = quota.checkCanRequest();")) {
    const quotaCheckLogic = `
        const quotaCheck = quota.checkCanRequest();
        if (!quotaCheck.allowed) {
            setMessages(prev => [...prev, {
                id: uuidv4(),
                conversation_id: activeConvId || uuidv4(),
                role: 'assistant',
                content: \`**Quota Alert:** \${quotaCheck.reason}\`,
                created_at: new Date().toISOString()
            }]);
            return;
        }
        quota.trackRequest();
`;
    code = code.replace(
        "// Cancel previous request if any",
        quotaCheckLogic + "\n        // Cancel previous request if any"
    );
}

// 5. Export new states
if (!code.includes("activeModel,")) {
    code = code.replace("includeAppData,", "activeModel,\n        setActiveModel,\n        includeAppData,");
}

fs.writeFileSync(useAIChatPath, code);
console.log('Patched useAIChat.ts with quota checking and activeModel.');
