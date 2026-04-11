import re

file_path = "src/features/ai/chat/useAIChat.ts"
with open(file_path, "r") as f:
    content = f.read()

old_code = """        const titleModel = 'gemini-3.1-flash-lite-preview';

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${titleModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: `Generate a short 3-5 word title for a conversation that starts with: "${firstMessage}". Do not use quotes in the response.` }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 20 }
                    })
                }
            );
            if (response.ok) {
                const data = await response.json();
                let title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                title = title.replace(/^["']|["']$/g, ''); // remove surrounding quotes

                if (title) {
                    setConversations(prev => {
                        const updated = prev.map(c => c.id === convId ? { ...c, title } : c);
                        const convToSave = updated.find(c => c.id === convId);
                        if (convToSave) saveChatConversation(convToSave);
                        return updated;
                    });
                }
            }
        } catch (e) {
            console.error("Auto-title failed", e);
        }"""

new_code = """        const modelsToTry = [
            'gemini-3.1-flash-lite-preview',
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash'
        ];

        try {
            let response;
            for (const model of modelsToTry) {
                try {
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ role: 'user', parts: [{ text: `Generate a short 3-5 word title for a conversation that starts with: "${firstMessage}". Do not use quotes in the response.` }] }],
                                generationConfig: { temperature: 0.3, maxOutputTokens: 20 }
                            })
                        }
                    );
                    if (response.ok) {
                        break;
                    }
                } catch(e) {
                     console.warn(`Model ${model} failed for title generation:`, e);
                }
            }

            if (response && response.ok) {
                const data = await response.json();
                let title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                title = title.replace(/^["']|["']$/g, ''); // remove surrounding quotes

                if (title) {
                    setConversations(prev => {
                        const updated = prev.map(c => c.id === convId ? { ...c, title } : c);
                        const convToSave = updated.find(c => c.id === convId);
                        if (convToSave) saveChatConversation(convToSave);
                        return updated;
                    });
                }
            }
        } catch (e) {
            console.error("Auto-title failed", e);
        }"""

content = content.replace(old_code, new_code)

with open(file_path, "w") as f:
    f.write(content)
