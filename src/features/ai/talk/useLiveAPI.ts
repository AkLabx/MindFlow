import { useState, useEffect } from 'react';
import { useLiveSession } from '../../ai/live/useLiveSession';

export type VoicePersonality = 'Aoede' | 'Puck' | 'Fenrir' | 'Kore' | 'Charon';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export function useLiveAPI() {
    const { status, error, audioVolume, agentState, connect, disconnect, sendMessage } = useLiveSession();

    const connectionState = status === 'disconnected' ? (error ? 'error' : 'idle') : status;
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(error);

    useEffect(() => {
        setErrorMsg(error);
    }, [error]);

    const connectToGemini = async (sysPrompt?: string, voice: VoicePersonality = 'Aoede') => {
        await connect();
        if (sysPrompt) {
            sendMessage(sysPrompt);
        }
    };

    const disconnectFromGemini = () => {
        disconnect();
    };

    const sendTextMessage = (text: string) => {
        setTranscript(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
        sendMessage(text);
    };

    return {
        connectionState: connectionState as 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected',
        agentState: agentState === 'thinking' ? 'listening' : agentState,
        errorMsg,
        volume: audioVolume,
        transcript,
        connect: connectToGemini,
        disconnect: disconnectFromGemini,
        connectToGemini,
        disconnectFromGemini,
        sendTextMessage,
        isMicMuted: false,
        toggleMic: () => {},
        userAnalyser: null as any,
        aiAnalyser: null as any,
        isMuted: false,
        voiceName: 'Aoede',
        currentSubtitle: '',
        toggleMute: () => {},
        changeVoice: (v: any) => {}
    };
}
