import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Clock, BookOpen, Edit2, Check, X, Save, Home, PlusCircle, CheckCircle, Mic } from 'lucide-react';
import { db } from '../../../lib/db';
import { SavedQuiz } from '../types';
import { useQuizContext } from '../context/QuizContext';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { motion } from 'framer-motion';

/**
 * Screen for managing saved quizzes.
 *
 * Features:
 * - Lists all quizzes stored in IndexedDB.
 * - Allows resuming a quiz from where the user left off.
 * - Supports renaming saved quizzes.
 * - Allows deleting quizzes.
 * - Sorts by creation date (newest first).
 *
 * @returns {JSX.Element} The rendered Saved Quizzes screen.
 */
export const SavedQuizzes: React.FC = () => {
    const navigate = useNavigate();
    const { loadSavedQuiz } = useQuizContext();
    const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadQuizzes();

        // Listen for sync completion to refresh data and avoid stale cache
        const handleSyncComplete = () => {
            loadQuizzes();
        };
        window.addEventListener('mindflow-sync-complete', handleSyncComplete);

        return () => {
            window.removeEventListener('mindflow-sync-complete', handleSyncComplete);
        };
    }, []);

    const loadQuizzes = async () => {
        try {
            const data = await db.getQuizzes();
            // Sort by createdAt descending (newest first)
            setQuizzes(data.filter(q => q.state.status !== 'result').sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error("Failed to load quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    /** Resumes a selected quiz session or views results if completed. */
    const handleResume = (quiz: SavedQuiz) => {
        // Hydrate the global context state with the saved session data
        loadSavedQuiz({ ...quiz.state, isPaused: false });

        // Navigate based on completion status
        if (quiz.state.status === 'result') {
            navigate('/result');
        } else {
            // Navigate to the appropriate active session view
            if (quiz.mode === 'mock') {
                navigate('/quiz/session/mock');
            } else {
                navigate('/quiz/session/learning');
            }
        }
    };

    /** Deletes a quiz from storage. */
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this quiz?')) {
            try {
                await db.deleteQuiz(id);
                setQuizzes(prev => prev.filter(q => q.id !== id));
            } catch (error) {
                console.error("Failed to delete quiz:", error);
            }
        }
    };

    /** Enters edit mode for renaming a quiz. */
    const startEditing = (quiz: SavedQuiz, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(quiz.id);
        setEditName(quiz.name);
    };

    /** Saves the new name for the quiz. */
    const saveEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && editName.trim()) {
            try {
                await db.updateQuizName(editingId, editName.trim());
                setQuizzes(prev => prev.map(q => q.id === editingId ? { ...q, name: editName.trim() } : q));
                setEditingId(null);
            } catch (error) {
                console.error("Failed to update quiz name:", error);
            }
        }
    };

    /** Cancels renaming. */
    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditName('');
    };

    /** Helper to determine if the quiz is finished. */
    const isQuizFinished = (quiz: SavedQuiz) => {
        return quiz.state.status === 'result';
    };

    /** Helper to determine if "Start" or "Resume" label should be shown. */
    const isQuizStarted = (quiz: SavedQuiz) => {
        return quiz.state.currentQuestionIndex > 0 || Object.keys(quiz.state.answers).length > 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <SynapticLoader size="lg" />
            </div>
        );
    }


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">

            {/* --- "Aurora" Atmosphere (Background) --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Grid Texture Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-multiply" />

                {/* MOBILE BACKGROUND: Lightweight Static Gradient with Hue Rotate Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white md:hidden animate-hue-slow" />

                {/* DESKTOP BACKGROUND: Heavy Animated Blobs (High Fidelity) */}
                <div className="hidden md:block">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/40 mix-blend-multiply filter blur-[120px] animate-blob" />
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto relative z-10 animate-fade-in py-4 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                {/* Header Title & Back Button */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-fit bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50"
                    >
                        <motion.div whileHover={{ x: -2, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}><Home className="w-4 h-4" /></motion.div>
                        Back to Home
                    </button>
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-sm">
                        Created Quizzes
                    </h1>
                </div>

                {/* Top Action Button */}
                <div className="flex shrink-0">
                    <button
                        onClick={() => navigate('/quiz/attempted')}
                        className="relative group overflow-hidden px-5 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-emerald-400 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                        <motion.div whileHover={{ scale: 1.2, rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}><CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></motion.div>
                        <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100">
                            View Attempted
                        </span>
                    </button>
                </div>
            </div>

                {quizzes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group p-[1px] rounded-3xl overflow-hidden max-w-lg mx-auto mt-12"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl transition-colors duration-300 z-0" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0" />

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-hover:border-indigo-300 dark:group-hover:border-indigo-500" />

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500/20" />

                        <div className="relative z-20 text-center py-16 px-6">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                                <BookOpen className="w-10 h-10 text-indigo-400 dark:text-indigo-500 drop-shadow-sm" />
                            </div>

                            <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-3 drop-shadow-sm">
                                No Created Quizzes
                            </h3>

                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm mx-auto">
                                You haven't started any quizzes yet. Create a new one to begin your learning journey!
                            </p>

                            <button
                                onClick={() => navigate('/quiz/config')}
                                className="relative group/btn overflow-hidden px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 dark:border-indigo-400 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-3 mx-auto"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />

                                <motion.div whileHover={{ scale: 1.2, rotate: 90 }} transition={{ type: "spring", stiffness: 200 }}><PlusCircle className="w-5 h-5 text-indigo-50" /></motion.div>
                                <span className="font-bold text-white tracking-wide">
                                    Create New Quiz
                                </span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-4 sm:gap-6"
                    >
                        {quizzes.map(quiz => (
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                key={quiz.id}
                                onClick={() => handleResume(quiz)}
                                className="relative group cursor-pointer p-[1px] rounded-3xl overflow-hidden"
                            >
                                {/* Glow Background Layer */}
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl transition-colors duration-300 z-0" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0" />

                                {/* Interactive Inner Shadow / Border */}
                                <div className="absolute inset-0 rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-hover:border-indigo-300 dark:group-hover:border-indigo-500" />

                                {/* Centered Subtle Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-indigo-500/50" />

                                {/* Card Content */}
                                <div className="relative z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 h-full">
                                    <div className="flex-1 w-full">
                                        {/* Name / Edit Mode */}
                                        {editingId === quiz.id ? (
                                            <div className="flex items-center gap-2 mb-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-300 dark:border-indigo-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                                    autoFocus
                                                />
                                                <button onClick={saveEdit} className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded-lg transition-colors shadow-sm">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEdit} className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-800/50 rounded-lg transition-colors shadow-sm">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mb-3">
                                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-indigo-600 group-hover:to-indigo-800 dark:group-hover:from-indigo-300 dark:group-hover:to-indigo-100 transition-all duration-300 truncate">
                                                    {quiz.name || 'Untitled Quiz'}
                                                </h3>
                                                <button
                                                    onClick={(e) => startEditing(quiz, e)}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                                    title="Edit Name"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Metadata Badges */}
                                        <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                                                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>{quiz.filters.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                                                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md backdrop-blur-sm border ${
                                                quiz.mode === 'mock'
                                                ? 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300'
                                                : 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                                            }`}>
                                                {quiz.mode === 'mock' ? 'Mock Test' : 'Learning Mode'}
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 backdrop-blur-sm">
                                                <span className="opacity-70">Progress:</span>
                                                <span className="text-indigo-600 dark:text-indigo-400">
                                                    {quiz.state.currentQuestionIndex + 1} / {quiz.questions.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-none">
                                        {!isQuizFinished(quiz) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate('/quiz/live/' + quiz.id); }}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-200/50 dark:border-amber-700/50 rounded-xl transition-colors font-bold text-sm shadow-sm backdrop-blur-sm"
                                                title="Talk to Quiz Master"
                                            >
                                                <motion.div whileHover={{ scale: 1.2, y: -2 }} transition={{ type: "spring", stiffness: 300, repeat: Infinity, repeatType: "reverse" }}><Mic className="w-4 h-4" /></motion.div>
                                                Talk
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleResume(quiz); }}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 dark:border-indigo-400/50 shadow-md hover:shadow-lg hover:shadow-indigo-500/20 rounded-xl transition-all font-bold text-sm"
                                            title={isQuizFinished(quiz) ? "View Results" : isQuizStarted(quiz) ? "Resume Quiz" : "Start Quiz"}
                                        >
                                            <motion.div whileHover={{ scale: 1.2, x: 2 }} transition={{ type: "spring", stiffness: 300 }}><Play className="w-4 h-4" /></motion.div>
                                            {isQuizFinished(quiz) ? "Results" : isQuizStarted(quiz) ? "Resume" : "Start"}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(quiz.id, e)}
                                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 rounded-xl transition-all shadow-sm hover:shadow"
                                            title="Delete Quiz"
                                        >
                                            <motion.div whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.4 }}><Trash2 className="w-5 h-5" /></motion.div>
                                        </button>
                                    </div>

                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* --- CSS Keyframes & Accessibility --- */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }

                @keyframes hue-slow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                .animate-hue-slow {
                    animation: hue-slow 20s linear infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                /* Reduce Motion */
                @media (prefers-reduced-motion: reduce) {
                    .animate-blob,
                    .animate-hue-slow {
                        animation: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
};
