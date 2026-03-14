import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLiveAPI } from './useLiveAPI';

export const AITalkPage: React.FC = () => {
    const navigate = useNavigate();
    const { connectionState, agentState, errorMsg, connect, disconnect } = useLiveAPI();

    // Visualizer dummy state
    const [audioLevel, setAudioLevel] = useState(0);

    // Dummy audio level simulator for visualizer when active
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (connectionState === 'connected' && agentState !== 'idle') {
            interval = setInterval(() => {
                setAudioLevel(Math.random() * 100);
            }, 100);
        } else {
            setAudioLevel(0);
        }
        return () => clearInterval(interval);
    }, [connectionState, agentState]);

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
            if (agentState === 'listening') return 'Listening...';
            return 'Ready to talk';
        }
        return 'Tap to Start';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-between p-4 animate-fade-in relative">
            {/* Header */}
            <header className="w-full max-w-2xl mx-auto flex items-center gap-4 mt-2">
                <button
                    onClick={() => {
                        disconnect();
                        navigate(-1);
                    }}
                    className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors z-10"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center pr-8">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Conversation</h1>
                </div>
            </header>

            {/* Main Content - Visualizer and Mic */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative">

                {/* Status Indicator */}
                <div className="absolute top-10 flex flex-col items-center gap-2">
                    {connectionState === 'error' && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">{errorMsg || 'Connection failed'}</span>
                        </div>
                    )}
                    <div className={cn(
                        "text-lg font-medium transition-colors duration-300",
                        connectionState === 'connected' ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {getStatusText()}
                    </div>
                </div>

                {/* Central Microphone / Visualizer Button */}
                <div className="relative flex items-center justify-center">
                    {/* Visualizer Rings */}
                    {connectionState === 'connected' && (
                        <>
                            <div
                                className={cn(
                                    "absolute w-40 h-40 rounded-full border-2 border-emerald-500/30 transition-all duration-100 ease-out",
                                    agentState === 'speaking' ? "border-indigo-500/50" : ""
                                )}
                                style={{ transform: `scale(${1 + audioLevel / 200})` }}
                            />
                            <div
                                className={cn(
                                    "absolute w-48 h-48 rounded-full border border-emerald-500/20 transition-all duration-100 ease-out delay-75",
                                    agentState === 'speaking' ? "border-indigo-500/30" : ""
                                )}
                                style={{ transform: `scale(${1 + audioLevel / 150})` }}
                            />
                        </>
                    )}

                    {/* Main Button */}
                    <button
                        onClick={handleToggleConnection}
                        disabled={connectionState === 'connecting'}
                        className={cn(
                            "relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform",
                            connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error'
                                ? "bg-emerald-500 hover:bg-emerald-600 hover:scale-105"
                                : connectionState === 'connecting'
                                ? "bg-emerald-400 scale-95 cursor-not-allowed"
                                : agentState === 'speaking'
                                ? "bg-indigo-500 shadow-indigo-500/50 scale-105"
                                : "bg-red-500 hover:bg-red-600 shadow-red-500/50"
                        )}
                    >
                        {connectionState === 'connecting' ? (
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : connectionState === 'connected' ? (
                            agentState === 'speaking' ? (
                                <Volume2 className="w-12 h-12 text-white animate-pulse" />
                            ) : (
                                <MicOff className="w-12 h-12 text-white" />
                            )
                        ) : (
                            <Mic className="w-12 h-12 text-white" />
                        )}
                    </button>
                </div>

                {/* Helper text */}
                <p className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">
                    {connectionState === 'connected'
                        ? "Tap the red button to end the conversation."
                        : "Tap the microphone to start talking to MindFlow AI."}
                </p>
            </div>
        </div>
    );
};
