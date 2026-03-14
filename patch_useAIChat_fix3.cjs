const fs = require('fs');

const useAIChatPath = 'src/features/ai/chat/useAIChat.ts';
let code = fs.readFileSync(useAIChatPath, 'utf8');

// The activeModel state got injected wrong
// Find the states
code = code.replace("const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');", "");
code = code.replace("const quota = useQuota(activeModel);", "");
code = code.replace("activeModel,\n        setActiveModel,", "");

const searchFor = "const [activePersona, setActivePersona] = useState<string>('general');";
const replacement = `const [activePersona, setActivePersona] = useState<string>('general');
    const [activeModel, setActiveModel] = useState<ModelId>('gemini-2.5-flash');
    const quota = useQuota(activeModel);`;

if (code.includes(searchFor)) {
    code = code.replace(searchFor, replacement);
}

// Fix exports
const exportSearch = "includeAppData,";
const exportReplace = `activeModel,
        setActiveModel,
        includeAppData,`;

if (code.includes(exportSearch)) {
    code = code.replace(exportSearch, exportReplace);
}

// Fix type error in streamGenerateContent (it thought activeModel was a boolean from somewhere, it should be a string)
code = code.replace("activeModel.startsWith('gemini')", "String(activeModel).startsWith('gemini')");

fs.writeFileSync(useAIChatPath, code);
console.log('Fixed useAIChat.ts');
