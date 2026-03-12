import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { SavedQuiz } from '../types';

interface UseGenAILiveOptions {
    quiz: SavedQuiz;
    voice: 'Fenrir' | 'Kore';
    onStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected') => void;
    onError?: (error: Error) => void;
}

export const useGenAILive = ({ quiz, voice, onStateChange, onError }: UseGenAILiveOptions) => {
    const [isMuted, setIsMuted] = useState(false);
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);

    const connect = useCallback(async () => {
        try {
            onStateChange?.('connecting');
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("Missing VITE_GEMINI_API_KEY environment variable. Please check your .env file.");
            }

            const ai = new GoogleGenAI({ apiKey });

            // Initialize Audio Context immediately for correct user gesture bindings
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = audioContext;
            nextStartTimeRef.current = 0;

            // Generate the prompt from the quiz
            const questionsJson = JSON.stringify(quiz.questions.map((q, i) => ({
                id: i + 1,
                question: q.question,
                options: q.options,
                answer: q.correct,
                explanation: q.explanation.summary || q.explanation.analysis_correct || "No explanation available"
            })));

            const systemInstruction = `You are a lively, encouraging, and highly intelligent Quiz Master running a live audio quiz game.
Your persona is enthusiastic and supportive.
You are testing the user on the following quiz titled "${quiz.name}".
Here is the strict list of questions, options, correct answers, and explanations:
${questionsJson}

INSTRUCTIONS:
1. When the user first says hello or asks to start, enthusiastically welcome them to the "${quiz.name}" quiz and ask Question 1.
2. Read the question clearly, followed by the options if necessary.
3. Wait for the user to answer.
4. When the user answers, tell them if they are right or wrong immediately.
5. Provide a brief, interesting explanation based on the 'explanation' field.
6. Move smoothly to the next question.
7. Keep the conversation flowing naturally. If they ask a clarifying question, answer it quickly but bring them back to the quiz.
8. Once all questions are answered, congratulate them and summarize their performance.`;

            const session = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                },
                callbacks: {
                    onopen: () => console.log("Live AI Session Opened"),
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData && part.inlineData.data) {
                                    handleIncomingAudio(part.inlineData.data, audioContext);
                                }
                            }
                        }
                    },
                    onclose: (e) => {
                        console.log("Live AI Session Closed", e);
                        handleDisconnect();
                    },
                    onerror: (err) => {
                        console.error("Live AI Session Error", err);
                        handleDisconnect();
                    }
                }
            });

            sessionRef.current = session;

            // Setup audio input (Microphone)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                }
            });
            mediaStreamRef.current = stream;

            // We need a custom AudioWorklet to capture raw PCM audio chunks.
            // Since we can't easily load external files in a generic way, we create a blob URL inline.
            const workletCode = `
                class PCMProcessor extends AudioWorkletProcessor {
                    process(inputs) {
                        const inputChannel = inputs[0][0];
                        if (inputChannel) {
                            // Convert float32 to int16
                            const pcm16 = new Int16Array(inputChannel.length);
                            for (let i = 0; i < inputChannel.length; i++) {
                                pcm16[i] = Math.max(-1, Math.min(1, inputChannel[i])) * 32767;
                            }
                            this.port.postMessage(pcm16.buffer);
                        }
                        return true;
                    }
                }
                registerProcessor('pcm-processor', PCMProcessor);
            `;
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);

            // To process mic at exactly 16000, we create a separate context just for input
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            await inputAudioContext.audioWorklet.addModule(workletUrl);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(inputAudioContext, 'pcm-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
                if (!sessionRef.current || isMuted) return;

                // Convert ArrayBuffer to Base64
                const buffer = event.data;
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = btoa(binary);

                // Send to Gemini
                try {
                    sessionRef.current.sendRealtimeInput([{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }]);
                } catch (e) {
                    console.error("Error sending audio chunk", e);
                }
            };

            source.connect(workletNode);
            // Worklet node is NOT connected to destination to avoid feedback loop

            // Messages are now handled entirely by the onmessage callback.

            onStateChange?.('connected');

        } catch (error: any) {
            console.error("Connection failed:", error);
            onError?.(error);
            onStateChange?.('error');
            handleDisconnect();
        }
    }, [quiz, voice, isMuted, onStateChange, onError]);

    const handleIncomingAudio = useCallback((base64Data: string, audioContext: AudioContext) => {
        try {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const pcmData = new Int16Array(bytes.buffer);
            const floatData = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 32768.0;
            }

            const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
            audioBuffer.copyToChannel(floatData, 0);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Queueing logic to prevent overlapping audio
            const currentTime = audioContext.currentTime;
            if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
            }
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
        } catch (e) {
            console.error("Error decoding audio", e);
        }
    }, []);

    const handleDisconnect = useCallback(() => {
        if (sessionRef.current) {
            // Close connection if sdk supports a close method, or just discard
            sessionRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        onStateChange?.('disconnected');
    }, [onStateChange]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return {
        connect,
        disconnect: handleDisconnect,
        isMuted,
        toggleMute
    };
};
