const fs = require('fs');
const path = './src/features/ai/chat/AIChatPage.tsx';

let content = fs.readFileSync(path, 'utf8');

// Update ChatInput props to pass activeModel and setActiveModel
content = content.replace(
    /<ChatInput\s+value=\{inputValue\}\s+onChange=\{setInputValue\}\s+onSubmit=\{handleSubmit\}\s+isLoading=\{isLoading\}\s+onStopGenerating=\{stopGenerating\}\s+\/>/,
    `<ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        onStopGenerating={stopGenerating}
                        activeModel={activeModel}
                        setActiveModel={setActiveModel}
                    />`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched AIChatPage.tsx successfully.');
