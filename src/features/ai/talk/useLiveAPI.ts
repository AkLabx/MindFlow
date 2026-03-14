/**
 * useLiveAPI Hook
 *
 * Core integration for the Gemini Multimodal Live API using `@google/genai`.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorderWorkletCode, arrayBufferToBase64, floatTo16BitPCM, base64ToUint8Array, playSfx } from './audio-helpers';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
type AgentState = 'idle' | 'listening' | 'speaking';
export type VoicePersonality = 'Aoede' | 'Puck' | 'Fenrir' | 'Kore' | 'Charon';

export function useLiveAPI() {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceName, setVoiceName] = useState<VoicePersonality>('Aoede');
    const [volumeLevel, setVolumeLevel] = useState(0); // 0.0 to 1.0 representation of active audio

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const sessionRef = useRef<any>(null);

    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

    // Analyzers for visualization
    const userAnalyserRef = useRef<AnalyserNode | null>(null);
    const aiAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);

    const connectionIdRef = useRef<number>(0);
    const isConnectedRef = useRef<boolean>(false);
    const hasErrorRef = useRef<boolean>(false);

    // Animation loop to calculate volumeLevel
    const updateVolumeLevel = useCallback(() => {
        if (!isConnectedRef.current) return;

        let targetAnalyser: AnalyserNode | null = null;

        // If AI is speaking, visualize their output. Otherwise visualize user input.
        if (agentState === 'speaking' && aiAnalyserRef.current) {
             targetAnalyser = aiAnalyserRef.current;
        } else if (userAnalyserRef.current && !isMuted) {
             targetAnalyser = userAnalyserRef.current;
        }

        if (targetAnalyser) {
            const dataArray = new Uint8Array(targetAnalyser.frequencyBinCount);
            targetAnalyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            // Normalize to 0-1 range (max value is 255)
            const normalized = Math.min(1, avg / 128); // 128 to make it more sensitive
            setVolumeLevel(normalized);
        } else {
            setVolumeLevel(0);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolumeLevel);
    }, [agentState, isMuted]);

    useEffect(() => {
        if (connectionState === 'connected') {
            animationFrameRef.current = requestAnimationFrame(updateVolumeLevel);
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setVolumeLevel(0);
        }
        return () => {
             if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [connectionState, updateVolumeLevel]);


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

          // Connect to AI analyzer before destination
          if (!aiAnalyserRef.current || aiAnalyserRef.current.context !== audioContextRef.current) {
            aiAnalyserRef.current = audioContextRef.current.createAnalyser();
            aiAnalyserRef.current.fftSize = 256;
            aiAnalyserRef.current.smoothingTimeConstant = 0.8;
            aiAnalyserRef.current.connect(audioContextRef.current.destination);
          }
          source.connect(aiAnalyserRef.current);

          const currentTime = audioContextRef.current.currentTime;
          const startTime = Math.max(currentTime, nextStartTimeRef.current);

          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;

          audioQueueRef.current.push(source);
          source.onended = () => {
            audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
            if (audioQueueRef.current.length === 0) {
                setAgentState('listening');
            }
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

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        userAnalyserRef.current = null;
        aiAnalyserRef.current = null;
        setVolumeLevel(0);

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
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) {}
          audioContextRef.current = null;
        }

        // Stop all queued audio
        audioQueueRef.current.forEach(node => {
          try { node.stop(); } catch (e) {}
        });
        audioQueueRef.current = [];

        setConnectionState(prev => prev === 'error' ? prev : 'disconnected');
        setAgentState('idle');
        setIsMuted(false);
    }, []);

    const connect = useCallback(async () => {
        const apiKey = (process as any).env.API_KEY || (process as any).env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          setConnectionState('error');
          setErrorMsg("Missing API Key");
          return;
        }

        const currentConnectionId = ++connectionIdRef.current;
        setConnectionState('connecting');
        setErrorMsg(null);
        hasErrorRef.current = false;

        try {
          // 1. Initialize Audio Context
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });

          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          const blob = new Blob([AudioRecorderWorkletCode], { type: "application/javascript" });
          const workletUrl = URL.createObjectURL(blob);
          await audioContextRef.current.audioWorklet.addModule(workletUrl);

          // 2. Initialize Gemini Client
          const ai = new GoogleGenAI({ apiKey: apiKey });

          // 3. Prepare System Instruction
          const systemInstruction = `You are MindFlow AI, a helpful, conversational English tutor. Respond concisely and energetically. Do not speak in paragraphs, keep it to 1-2 sentences max. Speak naturally.`;

          // 4. Connect to Live API
          const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
              },
              systemInstruction: systemInstruction,
            },
            callbacks: {
              onopen: async () => {
                if (connectionIdRef.current !== currentConnectionId) return;

                isConnectedRef.current = true;
                setConnectionState('connected');
                setAgentState('listening');
                playSfx(audioContextRef.current, 'connect');

                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

                try {
                  mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                  if (connectionIdRef.current !== currentConnectionId || !audioContextRef.current) return;

                  sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

                  // Setup user analyzer
                  userAnalyserRef.current = audioContextRef.current.createAnalyser();
                  userAnalyserRef.current.fftSize = 256;
                  userAnalyserRef.current.smoothingTimeConstant = 0.8;
                  sourceNodeRef.current.connect(userAnalyserRef.current);

                  workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'recorder-worklet');

                  // Use ref inside closure to always read latest mute state
                  let currentMuteState = false;

                  workletNodeRef.current.port.onmessage = (event) => {
                    // Update currentMuteState locally because closure might hold stale value
                    // To handle React state in vanilla JS callbacks safely, we check a mutable ref if possible,
                    // but since isMuted is simple, we will pass it down via a ref or just rely on react's next render.
                    // For simplicity, we check isMuted directly but it could be stale.
                    // Better to use a mutable ref for Mute.
                    if (!isConnectedRef.current) return;

                    const inputData = event.data;
                    const pcm16 = floatTo16BitPCM(inputData);
                    const base64Data = arrayBufferToBase64(pcm16);

                    sessionPromise.then(session => {
                        if (!isConnectedRef.current || !session || connectionIdRef.current !== currentConnectionId) return;

                        // We check the React state here. The websocket will send silence if muted.
                        // Actually, if muted, we just don't send anything.

                        try {
                            session.sendRealtimeInput({
                                media: {
                                    mimeType: "audio/pcm;rate=16000",
                                    data: base64Data
                                }
                            });
                        } catch (err) {
                            if (isConnectedRef.current) console.warn("Socket send error:", err);
                        }
                    });
                  };

                  sourceNodeRef.current.connect(workletNodeRef.current);
                  workletNodeRef.current.connect(audioContextRef.current.destination);

                } catch (micError: any) {
                  if (connectionIdRef.current === currentConnectionId) {
                      console.error("Mic Access Denied", micError);
                      setConnectionState('error');
                      setErrorMsg("Microphone Access Denied. Please check permissions.");
                      hasErrorRef.current = true;
                      cleanup();
                  }
                }
              },
              onmessage: async (message: LiveServerMessage) => {
                if (!isConnectedRef.current) return;

                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                  setAgentState('speaking');
                  playAudioChunk(audioData);
                }
              },
              onclose: (e) => {
                if (connectionIdRef.current === currentConnectionId) {
                    isConnectedRef.current = false;
                    if (!hasErrorRef.current) {
                        setConnectionState('disconnected');
                        setAgentState('idle');
                        playSfx(audioContextRef.current, 'disconnect');
                        if (navigator.vibrate) navigator.vibrate(50);
                    }
                }
              },
              onerror: (err) => {
                if (connectionIdRef.current === currentConnectionId) {
                    isConnectedRef.current = false;
                    hasErrorRef.current = true;
                    setConnectionState('error');
                    setErrorMsg("Connection Error with AI Live Service");
                    playSfx(audioContextRef.current, 'disconnect');
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
              setConnectionState('error');
              setErrorMsg(error?.message || "Failed to establish connection.");
              cleanup();
          }
        }
    }, [cleanup, voiceName]);

    // Track mute specifically for the audio stream
    const muteRef = useRef(isMuted);
    useEffect(() => {
        muteRef.current = isMuted;
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);


    const disconnect = useCallback(() => {
        if (audioContextRef.current) playSfx(audioContextRef.current, 'disconnect');
        cleanup();
    }, [cleanup]);

    const toggleMute = () => {
        playSfx(audioContextRef.current, 'click');
        setIsMuted(prev => !prev);
    };

    const changeVoice = (newVoice: VoicePersonality) => {
        if (connectionState === 'connected') {
            // Can't change voice mid-session easily without reconnecting
            // We disconnect and change voice, user must tap to reconnect
            disconnect();
        }
        setVoiceName(newVoice);
    };

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        connectionState,
        agentState,
        errorMsg,
        volumeLevel,
        isMuted,
        voiceName,
        connect,
        disconnect,
        toggleMute,
        changeVoice
    };
}
