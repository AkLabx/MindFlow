const fs = require('fs');

const useAIChatPath = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(useAIChatPath, 'utf8');

// The activeModel state got injected wrong again - let's forcefully fix it
const regex = /const \[activePersona, setActivePersona\] = useState<PersonaId>\('general'\);\s*const \[\s*activeModel,\s*setActiveModel,\s*includeAppData, setIncludeAppData\] = useState\(false\);/gm;

code = code.replace(regex, `const [activePersona, setActivePersona] = useState<PersonaId>('general');
    const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');
    const quota = useQuota(activeModel);
    const [includeAppData, setIncludeAppData] = useState(false);`);

const regex2 = /const \[activeModel, setActiveModel\] = useState<ModelId>\('gemini-2.5-flash'\);\s*const quota = useQuota\(activeModel\);\s*const \[includeAppData, setIncludeAppData\] = useState\(false\);/gm;

// Only one instance should exist
let matches = [...code.matchAll(regex2)];
if(matches.length > 1) {
    code = code.replace(regex2, (match, offset) => {
        if(offset !== matches[0].index) return ""; // remove duplicates
        return match;
    });
}

// Ensure export matches
const exportBlockRegex = /return \{\s*messages,\s*conversations,\s*currentConversationId,\s*isLoading,\s*sendMessage,\s*startNewConversation,\s*loadConversation,\s*deleteConversation,\s*stopGenerating,\s*activePersona,\s*setActivePersona,\s*includeAppData,\s*setIncludeAppData\s*\};/g;

code = code.replace(exportBlockRegex, `return {
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

fs.writeFileSync(useAIChatPath, code);

// Fix AIChatPage
const AIChatPagePath = 'src/features/ai/chat/AIChatPage.tsx';
let aiCode = fs.readFileSync(AIChatPagePath, 'utf8');

// Find the destructuring block and clean it up
const destructureBlockRegex = /const \{\s*messages,\s*conversations,\s*currentConversationId,\s*isLoading,\s*sendMessage,\s*startNewConversation,\s*loadConversation,\s*deleteConversation,\s*stopGenerating,\s*activePersona,\s*setActivePersona,\s*activeModel,\s*setActiveModel,\s*includeAppData,\s*setIncludeAppData,\s*activeModel,\s*setActiveModel,\s*quota\s*\} = useAIChat\(\);/gm;

aiCode = aiCode.replace(/const \{\s*messages,[\s\S]*?\} = useAIChat\(\);/m, `const {
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


fs.writeFileSync(AIChatPagePath, aiCode);

console.log('Fixed syntax errors');
