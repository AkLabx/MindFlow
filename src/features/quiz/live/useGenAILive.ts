import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { SavedQuiz } from '../types';
import { AudioRecorderWorkletCode, arrayBufferToBase64, floatTo16BitPCM, base64ToUint8Array } from '../../ai/talk/audio-helpers';

interface UseGenAILiveOptions {
    quiz: SavedQuiz;
    voice: 'Fenrir' | 'Kore';
    onStateChange?: (state: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected') => void;
    onError?: (error: Error) => void;
}

export const useGenAILive = ({ quiz, voice, onStateChange, onError }: UseGenAILiveOptions) => {
    const [isMuted, setIsMuted] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const sessionRef = useRef<any>(null);

    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

    const connectionIdRef = useRef<number>(0);
    const isConnectedRef = useRef<boolean>(false);
    const hasErrorRef = useRef<boolean>(false);

    const initMic = useCallback(async () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (!mediaStreamRef.current) {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        if (!sourceNodeRef.current || sourceNodeRef.current.context !== audioContextRef.current) {
             sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        }
    }, []);

    const playAudioChunk = async (base64Audio: string) => {
        if (!audioContextRef.current || !isConnectedRef.current) return;

        try {
          const audioBytes = base64ToUint8Array(base64Audio);
          const pcmData = new Int16Array(audioBytes.buffer);
          const floatData = new Float32Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768.0;
          }

          const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
          audioBuffer.copyToChannel(floatData, 0);

          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;

          source.connect(audioContextRef.current.destination);

          const currentTime = audioContextRef.current.currentTime;
          const startTime = Math.max(currentTime, nextStartTimeRef.current);

          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;

          audioQueueRef.current.push(source);
          source.onended = () => {
            audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
          };

        } catch (e) {
          console.error("Error playing audio chunk", e);
        }
    };

    const cleanup = useCallback(() => {
        connectionIdRef.current++;
        isConnectedRef.current = false;
        hasErrorRef.current = false;
        nextStartTimeRef.current = 0;

        if (sessionRef.current) {
          try {
            sessionRef.current.close();
          } catch (e) {}
          sessionRef.current = null;
        }

        if (workletNodeRef.current) {
            try {
                workletNodeRef.current.port.postMessage("stop");
                workletNodeRef.current.disconnect();
            } catch (e) {}
            workletNodeRef.current = null;
        }

        if (sourceNodeRef.current) {
          try { sourceNodeRef.current.disconnect(); } catch (e) {}
          sourceNodeRef.current = null;
        }

        if (audioContextRef.current) {
          try { audioContextRef.current.suspend(); } catch (e) {}
        }

        audioQueueRef.current.forEach(node => {
          try { node.stop(); } catch (e) {}
        });
        audioQueueRef.current = [];

        onStateChange?.('disconnected');
        setIsMuted(false);
    }, [onStateChange]);


    const connect = useCallback(async () => {
        const apiKey = (process as any).env.API_KEY || (process as any).env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          onStateChange?.('error');
          onError?.(new Error("Missing API Key"));
          return;
        }

        const currentConnectionId = ++connectionIdRef.current;
        onStateChange?.('connecting');
        hasErrorRef.current = false;

        try {
          await initMic();
          if (!audioContextRef.current) throw new Error("Audio Context not initialized");

          const blob = new Blob([AudioRecorderWorkletCode], { type: "application/javascript" });
          const workletUrl = URL.createObjectURL(blob);
          await audioContextRef.current.audioWorklet.addModule(workletUrl);

          const ai = new GoogleGenAI({ apiKey: apiKey });

          const systemInstruction = `You are a lively Quiz Master running an interactive audio quiz game.
          The user has created a quiz named "${quiz.name || 'Untitled Quiz'}" about ${quiz.filters.subject}.
          It consists of ${quiz.questions.length} questions.
          Keep your responses short, friendly, and energetic. Guide the user through the quiz enthusiastically.`;

          const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
              },
              systemInstruction: systemInstruction,
            },
            callbacks: {
              onopen: async () => {
                if (connectionIdRef.current !== currentConnectionId) return;

                isConnectedRef.current = true;
                onStateChange?.('connected');

                try {
                  if (!audioContextRef.current || !mediaStreamRef.current || !sourceNodeRef.current) return;

                  workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'recorder-worklet');

                  workletNodeRef.current.port.onmessage = (event) => {
                    if (isMuted || !isConnectedRef.current) return;

                    const inputData = event.data;
                    const pcm16 = floatTo16BitPCM(inputData);
                    const base64Data = arrayBufferToBase64(pcm16);

                    sessionPromise.then(session => {
                        if (!isConnectedRef.current || !session || connectionIdRef.current !== currentConnectionId) return;

                        try {
                            session.sendRealtimeInput({
                                media: {
                                    mimeType: "audio/pcm;rate=16000",
                                    data: base64Data
                                }
                            } as any);
                        } catch (err) {
                            if (isConnectedRef.current) console.warn("Socket send error:", err);
                        }
                    });
                  };

                  sourceNodeRef.current.connect(workletNodeRef.current);
                  workletNodeRef.current.connect(audioContextRef.current.destination);

                } catch (micError: any) {
                  if (connectionIdRef.current === currentConnectionId) {
                      onStateChange?.('error');
                      onError?.(new Error("Microphone Access Denied. Please check permissions."));
                      hasErrorRef.current = true;
                      cleanup();
                  }
                }
              },
              onmessage: async (message: LiveServerMessage) => {
                if (!isConnectedRef.current) return;

                const parts = message.serverContent?.modelTurn?.parts;
                if (parts) {
                    for (const part of parts) {
                        if (part.inlineData?.data) {
                            playAudioChunk(part.inlineData.data);
                        }
                    }
                }
              },
              onclose: (e) => {
                if (connectionIdRef.current === currentConnectionId) {
                    isConnectedRef.current = false;
                    if (!hasErrorRef.current) {
                        onStateChange?.('disconnected');
                    }
                }
              },
              onerror: (err) => {
                if (connectionIdRef.current === currentConnectionId) {
                    isConnectedRef.current = false;
                    hasErrorRef.current = true;
                    onStateChange?.('error');
                    onError?.(new Error("Connection Error with AI Live Service"));
                }
              }
            }
          });

          const session = await sessionPromise;

          if (connectionIdRef.current !== currentConnectionId) {
            session.close();
            return;
          }

          sessionRef.current = session;

        } catch (error: any) {
          if (connectionIdRef.current === currentConnectionId) {
              onStateChange?.('error');
              onError?.(new Error(error?.message || "Failed to establish connection."));
              cleanup();
          }
        }
    }, [cleanup, quiz, voice, initMic, onStateChange, onError, isMuted]);

    const muteRef = useRef(isMuted);
    useEffect(() => {
        muteRef.current = isMuted;
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);

    const handleDisconnect = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // Full Unmount Cleanup
    useEffect(() => {
        return () => {
            cleanup();
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                try { audioContextRef.current.close(); } catch (e) {}
            }
        };
    }, [cleanup]);

    return {
        connect,
        disconnect: handleDisconnect,
        isMuted,
        toggleMute
    };
};
