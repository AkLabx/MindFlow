import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/db';
import { SavedQuiz } from '../types';
import { Mic, MicOff, Volume2, PhoneOff, Settings, X, Loader2, AlertCircle } from 'lucide-react';
import { useGenAILive } from './useGenAILive';

export const LiveQuizRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [voice, setVoice] = useState<'Fenrir' | 'Kore'>('Fenrir');
    const [showSettings, setShowSettings] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) return;
            try {
                const quizzes = await db.getQuizzes();
                const foundQuiz = quizzes.find(q => q.id === id);
                if (foundQuiz) {
                    setQuiz(foundQuiz);
                } else {
                    console.error("Quiz not found");
                    navigate('/quiz/saved');
                }
            } catch (error) {
                console.error("Failed to load quiz:", error);
                navigate('/quiz/saved');
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [id, navigate]);

    const { connect, disconnect, isMuted, toggleMute } = useGenAILive({
        quiz: quiz!,
        voice,
        onStateChange: (newState) => {
            setState(newState);
            if (newState === 'connected') setErrorMsg(null);
        },
        onError: (err) => {
            setErrorMsg(err.message || 'An error occurred connecting to the AI.');
        }
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const handleConnect = async () => {
        if (!quiz) return;
        setErrorMsg(null);
        await connect();
    };

    const handleDisconnect = () => {
        disconnect();
        setState('disconnected');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
            </div>
        );
    }

    if (!quiz) return null;

    const isConnected = state === 'connected';
    const isConnecting = state === 'connecting';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden relative border border-gray-100 dark:border-slate-800">

                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Quiz Master</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{quiz.name || 'Untitled Quiz'}</p>
                </div>

                {/* Main Visual Area */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[300px] relative">

                    {errorMsg && (
                        <div className="absolute top-4 left-4 right-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200 dark:border-red-800/50">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {/* Voice Pulsing Orb */}
                    <div className="relative flex items-center justify-center mb-8">
                        {isConnected && (
                            <>
                                <div className="absolute w-32 h-32 bg-indigo-500/20 rounded-full animate-ping"></div>
                                <div className="absolute w-40 h-40 bg-indigo-500/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                            </>
                        )}
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${isConnected ? 'bg-indigo-600 shadow-lg shadow-indigo-500/50' : 'bg-gray-200 dark:bg-slate-700'}`}>
                            <Volume2 className={`w-10 h-10 ${isConnected ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                        </div>
                    </div>

                    {/* Status Text */}
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {isConnecting ? 'Connecting to AI...' :
                         isConnected ? 'Listening...' : 'Ready to start'}
                    </p>

                    {isConnected && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                            Say "Hello" to start the quiz.
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/50 flex justify-center gap-6">

                    {!isConnected ? (
                        <>
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                                {isConnecting ? 'Connecting...' : 'Connect to Quiz Master'}
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-4 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-slate-600"
                            >
                                <Settings className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-colors shadow-lg ${isMuted ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-slate-600'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={handleDisconnect}
                                className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg shadow-red-500/30"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Settings Overlay */}
                {showSettings && !isConnected && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-20 flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Quiz Master Voice</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setVoice('Fenrir')}
                                    className={`p-4 rounded-xl border-2 transition-all ${voice === 'Fenrir' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}
                                >
                                    <div className="font-bold mb-1">Fenrir</div>
                                    <div className="text-xs opacity-80">Male Voice</div>
                                </button>
                                <button
                                    onClick={() => setVoice('Kore')}
                                    className={`p-4 rounded-xl border-2 transition-all ${voice === 'Kore' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}
                                >
                                    <div className="font-bold mb-1">Kore</div>
                                    <div className="text-xs opacity-80">Female Voice</div>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <button onClick={() => navigate('/quiz/saved')} className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors">
                                Back to Saved Quizzes
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
