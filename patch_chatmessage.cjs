const fs = require('fs');

let content = fs.readFileSync('src/features/ai/chat/ChatMessage.tsx', 'utf-8');

// Add isGenerating prop
content = content.replace(
    'interface ChatMessageProps {',
    'interface ChatMessageProps {\n    isGenerating?: boolean;'
);

content = content.replace(
    'export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {',
    'export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isGenerating }) => {'
);

// We need to add a flashing dot for the typewriter effect
// When isGenerating is true, the message content needs to be rendered with an appended pulsing dot.
// ReactMarkdown parses the raw text. We can append ' ●' to message.content just before rendering.
// Wait, if it ends in markdown (like code block), adding ` ●` inside might break it slightly but generally acceptable.

// Since ReactMarkdown handles codeblocks well, let's append a span with class animate-pulse at the end if we can,
// or just a literal character for simplicity.
const reactMarkdownReplace = `
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
`;
const reactMarkdownWithCursor = `
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
`;

content = content.replace(
    '{message.content}',
    '{message.content + (isGenerating ? " ●" : "")}'
);

fs.writeFileSync('src/features/ai/chat/ChatMessage.tsx', content);
