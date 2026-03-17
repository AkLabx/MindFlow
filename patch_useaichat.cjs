const fs = require('fs');
const file = 'src/features/ai/chat/useAIChat.ts';
let content = fs.readFileSync(file, 'utf8');

// Imports update
content = content.replace(
    "import {",
    "import { ProcessedDocument } from './utils/fileProcessing';\nimport {"
);

// sendMessage signature update
content = content.replace(
    "const sendMessage = useCallback(async (content: string, imageBase64?: string, audioData?: { data: string, mimeType: string }, customHistory?: AIChatMessage[]) => {",
    "const sendMessage = useCallback(async (content: string, imageBase64?: string, audioData?: { data: string, mimeType: string }, documents?: ProcessedDocument[], customHistory?: AIChatMessage[]) => {"
);

// Generate title update
content = content.replace(
    "generateTitle(activeConvId, content);",
    "generateTitle(activeConvId, content || 'Document Chat');"
);

// User message object creation update
content = content.replace(
    "            content,\n            ...(imageBase64 && { image: imageBase64 }),\n            created_at: new Date().toISOString()\n        };",
    "            content,\n            ...(imageBase64 && { image: imageBase64 }),\n            ...(documents && documents.length > 0 && { documents }),\n            created_at: new Date().toISOString()\n        };"
);

// Payload format logic update
const originalPayloadFormat = `            // Format history for Gemini (Exclude the empty one we just pushed)
            const baseMessages = customHistory || messages;
            const historyToSent = baseMessages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            // Add the new user message
            const userParts: any[] = [{ text: content }];
            if (imageBase64) {
                const base64Data = imageBase64.split(',')[1];
                const mimeType = imageBase64.split(';')[0].split(':')[1];
                userParts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                });
            }
            if (audioData) {
                userParts.push({
                    inlineData: {
                        mimeType: audioData.mimeType,
                        data: audioData.data
                    }
                });
            }`;

const newPayloadFormat = `            // Format history for Gemini (Exclude the empty one we just pushed)
            const baseMessages = customHistory || messages;
            const historyToSent = baseMessages.map(m => {
                const parts: any[] = [{ text: m.content || "Attached media" }];

                // Reconstruct history with historical documents
                if (m.documents && m.documents.length > 0) {
                    m.documents.forEach(doc => {
                        if (doc.isText) {
                            parts.push({ text: \`\\n[Document Content: \${doc.name}]\\n\${doc.data}\\n\` });
                        } else if (doc.mimeType === 'application/pdf') {
                            parts.push({
                                inlineData: {
                                    mimeType: doc.mimeType,
                                    data: doc.data
                                }
                            });
                        }
                    });
                }

                return {
                    role: m.role === 'user' ? 'user' : 'model',
                    parts
                };
            });

            // Add the new user message
            const userParts: any[] = [{ text: content || "Can you analyze this file?" }];

            // Handle current documents
            if (documents && documents.length > 0) {
                documents.forEach(doc => {
                    if (doc.isText) {
                        userParts.push({ text: \`\\n[Document Content: \${doc.name}]\\n\${doc.data}\\n\` });
                    } else if (doc.mimeType === 'application/pdf') {
                        userParts.push({
                            inlineData: {
                                mimeType: doc.mimeType,
                                data: doc.data
                            }
                        });
                    }
                });
            }

            if (imageBase64) {
                const base64Data = imageBase64.split(',')[1];
                const mimeType = imageBase64.split(';')[0].split(':')[1];
                userParts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                });
            }
            if (audioData) {
                userParts.push({
                    inlineData: {
                        mimeType: audioData.mimeType,
                        data: audioData.data
                    }
                });
            }`;

content = content.replace(originalPayloadFormat, newPayloadFormat);

// Update Edit Message call
content = content.replace(
    "await sendMessage(newContent, originalMessage.image, undefined, preservedMessages);",
    "await sendMessage(newContent, originalMessage.image, undefined, originalMessage.documents, preservedMessages);"
);

fs.writeFileSync(file, content);
console.log("Patched useAIChat.ts successfully!");
