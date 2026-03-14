import { useState, useRef, useCallback, useEffect } from 'react';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
type AgentState = 'idle' | 'listening' | 'speaking';

export function useLiveAPI() {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioRecorderRef = useRef<any>(null);
    const audioPlayerRef = useRef<any>(null);

    const getApiKey = () => {
        // Fallbacks for vite and process.env
        return (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
    };

    const initializeMedia = async () => {
        const { AudioRecorder } = await import('./audio-recorder');
        const { AudioPlayer } = await import('./audio-player');

        audioPlayerRef.current = new AudioPlayer();
        await audioPlayerRef.current.init();

        audioRecorderRef.current = new AudioRecorder((base64Data: string) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                 // Send RealtimeInput
                 const realtimeInput = {
                     realtimeInput: {
                         mediaChunks: [{
                             mimeType: "audio/pcm;rate=16000",
                             data: base64Data
                         }]
                     }
                 };
                 wsRef.current.send(JSON.stringify(realtimeInput));

                 setAgentState(prev => prev === 'speaking' ? 'speaking' : 'listening');
            }
        });
    };

    const connect = useCallback(async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setErrorMsg("API key missing. Please check your environment variables.");
            setConnectionState('error');
            return;
        }

        setConnectionState('connecting');
        setErrorMsg(null);

        try {
            await initializeMedia();

            // Correct Live API URL for Multimodal Live
            const host = "generativelanguage.googleapis.com";
            // Use gemini-2.0-flash-exp which explicitly supports Multimodal Live Bidi API
            const wsUrl = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('WebSocket Connected');

                // Live API expects setup message first
                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        systemInstruction: {
                            parts: [{ text: "You are MindFlow AI, a helpful, conversational English tutor. Respond concisely and energetically. Keep answers very short." }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = async (event) => {
                try {
                    let textData = event.data;
                    if (event.data instanceof Blob) {
                        textData = await event.data.text();
                    }

                    const msg = JSON.parse(textData);

                    if (msg.serverContent) {
                        const { modelTurn, turnComplete, interrupted } = msg.serverContent;

                        if (modelTurn?.parts) {
                            setAgentState('speaking');
                            for (const part of modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    audioPlayerRef.current?.play(part.inlineData.data);
                                }
                            }
                        }

                        if (turnComplete || interrupted) {
                            setAgentState('idle');
                        }
                    } else if (msg.setupComplete) {
                        setConnectionState('connected');
                        setAgentState('idle');
                        // Start mic explicitly
                        await audioRecorderRef.current?.start();
                    } else if (msg.error) {
                         console.error("Live API Error", msg.error);
                         setErrorMsg(msg.error.message || "Unknown API Error");
                         disconnect();
                    }
                } catch (e) {
                    console.error("Error parsing message", e);
                }
            };

            ws.onerror = (err) => {
                console.error("WebSocket Error:", err);
                setErrorMsg("WebSocket connection error");
                setConnectionState('error');
            };

            ws.onclose = () => {
                console.log('WebSocket Disconnected');
                // Only change if not manually disconnected or error
                setConnectionState(prev => prev === 'connecting' || prev === 'connected' ? 'disconnected' : prev);
                setAgentState('idle');
                cleanup();
            };

        } catch (e: any) {
            console.error("Error connecting:", e);
            setErrorMsg(e.message || "Failed to initialize media");
            setConnectionState('error');
        }
    }, []);

    const disconnect = useCallback(() => {
        setConnectionState('disconnected');
        setAgentState('idle');
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        cleanup();
    }, []);

    const cleanup = () => {
        if (audioRecorderRef.current) {
            audioRecorderRef.current.stop();
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.close();
        }
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connectionState,
        agentState,
        errorMsg,
        connect,
        disconnect
    };
}
