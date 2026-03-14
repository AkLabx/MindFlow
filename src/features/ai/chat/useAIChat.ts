import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfileStats } from '../../auth/hooks/useProfileStats';
import { v4 as uuidv4 } from 'uuid';
import {
    AIChatConversation,
    AIChatMessage,
    getChatConversations,
    getChatMessages,
    saveChatConversation,
    saveChatMessage,
    deleteChatConversation as dbDeleteConversation
} from '../../../lib/db';

export const AI_PERSONAS = {
    general: {
        id: 'general',
        name: 'General Learning',
        icon: 'Brain',
        prompt: `You are MindFlow AI, a helpful, encouraging, and highly knowledgeable educational assistant.
Your goal is to help the user learn, practice vocabulary, understand complex topics, and prepare for exams.
- Keep answers concise but informative.
- Use markdown formatting for readability (bolding, lists, code blocks, tables if necessary).
- Always maintain a supportive and motivating tone.`
    },
    grammar: {
        id: 'grammar',
        name: 'Grammar & Writing',
        icon: 'PenTool',
        prompt: `You are MindFlow AI, an expert English grammar and writing coach.
Your goal is to review the user's text, correct grammatical mistakes, explain WHY the correction was made, and suggest style improvements.
- Be precise and strict about grammar.
- Suggest vocabulary enhancements where appropriate.
- Use markdown to highlight changes.`
    },
    interview: {
        id: 'interview',
        name: 'Interview Prep',
        icon: 'UserCheck',
        prompt: `You are MindFlow AI, a tough but fair Interviewer for competitive exams (like UPSC, SSC, or corporate jobs).
Your goal is to conduct mock interviews, ask challenging follow-up questions, and provide critical feedback.
- Ask one question at a time.
- Critically evaluate the user's response before moving to the next question.
- Point out weak areas in their argument or knowledge.`
    },
    vocab: {
        id: 'vocab',
        name: 'Vocabulary Builder',
        icon: 'BookOpen',
        prompt: `You are MindFlow AI, a master linguist and vocabulary coach.
Your goal is to help the user expand their English vocabulary, master synonyms, idioms, and one-word substitutions.
- Provide etymology, usage examples, and related words.
- Give a quick mini-quiz if asked.
- Be highly engaging and focus on practical usage.`
    }
};

type PersonaId = keyof typeof AI_PERSONAS;


export const useAIChat = () => {
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [activePersona, setActivePersona] = useState<PersonaId>('general');
    const [includeAppData, setIncludeAppData] = useState(false);
    const { stats } = useProfileStats();
    const [conversations, setConversations] = useState<AIChatConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // To handle abortion of streams
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load initial data
    useEffect(() => {
        loadConversations();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const loadConversations = async () => {
        try {
            const history = await getChatConversations();
            setConversations(history);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        }
    };

    const loadConversation = async (id: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        try {
            const msgs = await getChatMessages(id);
            setMessages(msgs);
            setCurrentConversationId(id);
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const startNewConversation = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setCurrentConversationId(null);
        setMessages([]);
    };

    const stopGenerating = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };


    const generateTitle = async (convId: string, firstMessage: string) => {
        // @ts-ignore
        const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) return;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        }
    };

    const deleteConversation = async (id: string) => {
        try {
            await dbDeleteConversation(id);
            if (currentConversationId === id) {
                startNewConversation();
            }
            await loadConversations();
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const sendMessage = useCallback(async (content: string, imageBase64?: string) => {
        if (!content.trim() && !imageBase64) return;

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        let activeConvId = currentConversationId;
        const now = new Date().toISOString();

        // 1. Create a new conversation if one doesn't exist
        let isNewConv = false;
        if (!activeConvId) {
            activeConvId = uuidv4();
            isNewConv = true;
            const newConv: AIChatConversation = {
                id: activeConvId,
                title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
                created_at: now,
                updated_at: now
            };
            await saveChatConversation(newConv);
            setCurrentConversationId(activeConvId);
            setConversations(prev => [newConv, ...prev]);
        } else {
            // Update timestamp of existing conversation
            const existingConv = conversations.find(c => c.id === activeConvId);
            if (existingConv) {
                const updatedConv = { ...existingConv, updated_at: now };
                await saveChatConversation(updatedConv);
                setConversations(prev => prev.map(c => c.id === activeConvId ? updatedConv : c).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
            }
        }

        // 2. Add User Message
        const userMessage: AIChatMessage = {
            id: uuidv4(),
            conversation_id: activeConvId,
            role: 'user',
            content: imageBase64 ? `[Image attached]\n\n${content}` : content,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        await saveChatMessage(userMessage);

        if (isNewConv) {
            // Fire and forget auto-titling in background
            generateTitle(activeConvId, content);
        }

        // 3. Prepare AI request (Streaming)
        setIsLoading(true);

        // @ts-ignore
        const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            const errorMsg: AIChatMessage = {
                id: uuidv4(),
                conversation_id: activeConvId,
                role: 'assistant',
                content: "Error: Missing API Key. Please check your environment variables.",
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
            setIsLoading(false);
            return;
        }

        const aiMessageId = uuidv4();
        // Insert empty AI message to be streamed into
        const emptyAiMessage: AIChatMessage = {
            id: aiMessageId,
            conversation_id: activeConvId,
            role: 'assistant',
            content: "",
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, emptyAiMessage]);

        try {
            // Format history for Gemini (Exclude the empty one we just pushed)
            const historyToSent = messages.map(m => ({
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
            historyToSent.push({
                role: 'user',
                parts: userParts
            });

            let finalSystemPrompt = AI_PERSONAS[activePersona].prompt;

            if (includeAppData && stats) {
                const contextStr = `\n\nUSER PROFILE CONTEXT:\nThe user has completed ${stats.quizzesCompleted} quizzes.\nTotal Correct: ${stats.correctAnswers}\nAverage Score: ${Math.round(stats.averageScore)}%\nWeak Topics: ${stats.weakTopics.join(', ')}\nUse this context to personalize your advice and point out areas of improvement if relevant.`;
                finalSystemPrompt += contextStr;
            }

            const requestBody = {
                systemInstruction: {
                    parts: [{ text: finalSystemPrompt }]
                },
                contents: historyToSent,
                generationConfig: {
                    temperature: 0.7,
                }
            };

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: abortControllerRef.current.signal
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || "Failed to fetch response");
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // SSE format parsing
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]' || dataStr === '') continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                fullText += text;
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMessageId ? { ...m, content: fullText } : m
                                ));
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete chunks
                        }
                    }
                }
            }

            // Once streaming is completely done, save the finalized message to DB
            const finalAiMessage = { ...emptyAiMessage, content: fullText };
            await saveChatMessage(finalAiMessage);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('AI Request aborted');
                return;
            }
            console.error("AI Error:", error);

            setMessages(prev => prev.map(m =>
                m.id === aiMessageId ? { ...m, content: `**Error:** ${error.message || "An unexpected error occurred."}` } : m
            ));

            // Save the error state to DB so it doesn't get lost
            const errorAiMessage = { ...emptyAiMessage, content: `**Error:** ${error.message || "An unexpected error occurred."}` };
            await saveChatMessage(errorAiMessage);

        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }

    }, [messages, currentConversationId, conversations]);

    return {
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
        setIncludeAppData
    };
};
