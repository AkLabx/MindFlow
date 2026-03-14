import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Loader2, AlertCircle, Volume2, Settings2, User, PhoneOff } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLiveAPI, VoicePersonality } from './useLiveAPI';

export const AITalkPage: React.FC = () => {
    const navigate = useNavigate();
    const {
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
    } = useLiveAPI();

    // Timer logic
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (connectionState === 'connected') {
            setSecondsElapsed(0);
            timerRef.current = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setSecondsElapsed(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [connectionState]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleToggleConnection = () => {
        if (connectionState === 'connected' || connectionState === 'connecting') {
            disconnect();
        } else {
            connect();
        }
    };

    const getStatusText = () => {
        if (connectionState === 'error') return 'Connection Error';
        if (connectionState === 'connecting') return 'Connecting...';
        if (connectionState === 'connected') {
            if (agentState === 'speaking') return 'AI is speaking...';
            if (agentState === 'listening') return isMuted ? 'Muted' : 'Listening...';
            return 'Ready';
        }
        return 'Tap to Start';
    };

    // Calculate dynamic scale and opacity based on volumeLevel
    // Volume level ranges from 0.0 to ~1.0
    const ring1Scale = 1 + (volumeLevel * 0.3);
    const ring2Scale = 1 + (volumeLevel * 0.6);
    const ring3Scale = 1 + (volumeLevel * 0.9);

    // The base color changes based on who is active
    const isActiveSpeaking = agentState === 'speaking';
    const orbColorClass = isActiveSpeaking
        ? "bg-indigo-500 shadow-indigo-500/50"
        : (isMuted ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50");

    const ringColorClass = isActiveSpeaking
        ? "border-indigo-500"
        : (isMuted ? "border-red-500" : "border-emerald-500");

    const voices: VoicePersonality[] = ['Aoede', 'Puck', 'Fenrir', 'Kore'];

    return (
        <div className="min-h-[100dvh] bg-stone-900 flex flex-col items-center justify-between p-4 animate-fade-in relative overflow-hidden">

            {/* Ambient Background Glow based on state */}
            <div className={cn(
                "absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out pointer-events-none",
                isActiveSpeaking ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-stone-900 to-stone-900" :
                (connectionState === 'connected' && !isMuted) ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-stone-900 to-stone-900" :
                "bg-stone-900"
            )} />

            {/* Header */}
            <header className="w-full max-w-2xl mx-auto flex items-center justify-between mt-2 z-10">
                <button
                    onClick={() => {
                        disconnect();
                        navigate(-1);
                    }}
                    className="p-3 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {/* Voice Selector Pill */}
                {connectionState !== 'connected' && connectionState !== 'connecting' && (
                    <div className="flex bg-stone-800 rounded-full p-1 border border-stone-700 shadow-inner">
                        {voices.map(v => (
                            <button
                                key={v}
                                onClick={() => changeVoice(v)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-300",
                                    voiceName === v ? "bg-stone-600 text-white shadow-md" : "text-stone-400 hover:text-stone-300"
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                )}

                <div className="w-12" /> {/* Spacer for centering */}
            </header>

            {/* Top Status Indicator (Live Pill) */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10 w-full max-w-md px-4">
                {connectionState === 'connected' ? (
                     <div className="flex items-center gap-2 bg-stone-800/80 backdrop-blur-md border border-stone-700 px-4 py-2 rounded-full shadow-lg">
                        <span className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            isMuted ? "bg-red-500" : "bg-emerald-500"
                        )} />
                        <span className="text-sm font-medium text-white tracking-widest font-mono">LIVE | {formatTime(secondsElapsed)}</span>
                     </div>
                ) : connectionState === 'error' ? (
                    <div className="flex items-center gap-2 text-red-400 bg-red-950/50 border border-red-900/50 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium text-center shadow-lg">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{errorMsg || 'Connection failed'}</span>
                    </div>
                ) : (
                    <div className="text-stone-400 text-sm tracking-widest uppercase font-bold">
                         AI Live Conversation
                    </div>
                )}

                <div className={cn(
                    "text-lg font-medium transition-colors duration-300 h-8 mt-4",
                    connectionState === 'connected' ? (isActiveSpeaking ? "text-indigo-400 animate-pulse" : (isMuted ? "text-red-400" : "text-emerald-400")) : "text-stone-500"
                )}>
                    {getStatusText()}
                </div>
            </div>

            {/* Main Visualizer Avatar Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 my-20">
                <div className="relative flex items-center justify-center">

                    {/* Visualizer Rings */}
                    {connectionState === 'connected' && (
                        <>
                            <div
                                className={cn(
                                    "absolute w-32 h-32 rounded-full border-2 opacity-40 transition-transform duration-75 ease-out will-change-transform",
                                    ringColorClass
                                )}
                                style={{ transform: `scale(${ring1Scale})` }}
                            />
                            <div
                                className={cn(
                                    "absolute w-32 h-32 rounded-full border opacity-20 transition-transform duration-100 ease-out will-change-transform",
                                    ringColorClass
                                )}
                                style={{ transform: `scale(${ring2Scale})` }}
                            />
                            <div
                                className={cn(
                                    "absolute w-32 h-32 rounded-full border opacity-10 transition-transform duration-150 ease-out will-change-transform",
                                    ringColorClass
                                )}
                                style={{ transform: `scale(${ring3Scale})` }}
                            />
                        </>
                    )}

                    {/* Main Avatar / Connect Button */}
                    <button
                        onClick={connectionState !== 'connected' ? handleToggleConnection : undefined}
                        disabled={connectionState === 'connecting'}
                        className={cn(
                            "relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform border-4 border-stone-800",
                            connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error'
                                ? "bg-emerald-600 hover:bg-emerald-500 hover:scale-105 cursor-pointer"
                                : connectionState === 'connecting'
                                ? "bg-stone-700 scale-95 cursor-wait"
                                : `${orbColorClass} scale-100 cursor-default`
                        )}
                    >
                        {connectionState === 'connecting' ? (
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : connectionState === 'connected' ? (
                            isActiveSpeaking ? (
                                <User className="w-12 h-12 text-white opacity-90" />
                            ) : (
                                <Mic className="w-12 h-12 text-white opacity-90" />
                            )
                        ) : (
                            <Mic className="w-12 h-12 text-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md pb-12 z-10 flex flex-col items-center gap-6">
                 {connectionState === 'connected' ? (
                    <div className="flex items-center justify-center gap-8 w-full px-8 animate-fade-in-up">
                        {/* Mute Button */}
                        <button
                            onClick={toggleMute}
                            className={cn(
                                "p-5 rounded-full transition-all duration-200 ring-2 shadow-lg",
                                isMuted
                                    ? 'bg-stone-800 text-red-400 ring-red-900/50 hover:bg-stone-700'
                                    : 'bg-stone-800 text-white hover:bg-stone-700 ring-stone-700'
                            )}
                            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        {/* End Call Button */}
                        <button
                            onClick={handleToggleConnection}
                            className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:shadow-red-900/50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
                            title="End Conversation"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </div>
                 ) : (
                    <p className="text-center text-sm text-stone-500 max-w-[250px] font-medium">
                        Tap the microphone to start talking to MindFlow AI.
                    </p>
                 )}
            </div>
        </div>
    );
};
