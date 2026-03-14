const fs = require('fs');

const useAIChatPath = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(useAIChatPath, 'utf8');

// The activeModel state got injected wrong
// Replace the corrupted state section

const searchFor = `    const [activePersona, setActivePersona] = useState<PersonaId>('general');
    const [
        activeModel,
        setActiveModel,
        includeAppData, setIncludeAppData] = useState(false);`;

const replacement = `    const [activePersona, setActivePersona] = useState<PersonaId>('general');
    const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');
    const quota = useQuota(activeModel);
    const [includeAppData, setIncludeAppData] = useState(false);`;

if (code.includes(searchFor)) {
    code = code.replace(searchFor, replacement);
}

// Ensure useQuota is imported
if (!code.includes("import { useQuota, MODEL_CONFIGS, ModelId }")) {
    code = `import { useQuota, MODEL_CONFIGS, ModelId } from './useQuota';\n` + code;
}

// Make sure export includes quota
const exportSearch = `    return {
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
        setActivePersona,`;

if (code.includes(exportSearch) && !code.includes("activeModel,")) {
    code = code.replace(exportSearch, exportSearch + `\n        activeModel,\n        setActiveModel,\n        quota,`);
}

fs.writeFileSync(useAIChatPath, code);
console.log('Fixed useAIChat.ts completely');
