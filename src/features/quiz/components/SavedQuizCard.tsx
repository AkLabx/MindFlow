import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Clock, BookOpen, Edit2, Check, X, Mic, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { SavedQuiz } from '../types';

interface SavedQuizCardProps {
    quiz: SavedQuiz;
    index: number;
    onResume: (quiz: SavedQuiz) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onEditName: (id: string, newName: string) => void;
}

export const SavedQuizCard: React.FC<SavedQuizCardProps> = ({ quiz, index, onResume, onDelete, onEditName }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(quiz.name);

    // Swipe gestures
    const controls = useAnimation();
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const isQuizFinished = quiz.state.status === 'result';
    const isQuizStarted = quiz.state.currentQuestionIndex > 0 || Object.keys(quiz.state.answers).length > 0;

    const progressPercent = quiz.questions.length > 0
        ? (Object.keys(quiz.state.answers).length / quiz.questions.length) * 100
        : 0;

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditName(quiz.name);
    };

    const saveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editName.trim()) {
            onEditName(quiz.id, editName.trim());
            setIsEditing(false);
        }
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditName(quiz.name);
    };

    const handleCardClick = () => {
        if (!isEditing) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(15);
        onResume(quiz);
    };

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -80) {
            if (navigator.vibrate) navigator.vibrate(50);
            onDelete(quiz.id, event as unknown as React.MouseEvent);
            controls.start({ x: 0 }); // reset position if not deleted
        } else {
            controls.start({ x: 0 });
        }
    };

    const progressColor = progressPercent === 0 ? '#9ca3af' // grey-400
        : progressPercent < 50 ? '#4f46e5' // indigo-600
        : progressPercent < 100 ? '#d97706' // amber-600
        : '#059669'; // emerald-600

    return (
        <div className="relative group p-[1px] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ml-3 mt-3 cursor-pointer">
            {/* Delete Pane Background (Glassmorphic) */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-800 rounded-3xl flex items-center justify-end px-8 z-0">
                <Trash2 className="text-white w-6 h-6" />
            </div>

            <motion.div
                drag={isTouchDevice ? "x" : false}
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative w-full h-full bg-indigo-50/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl z-10"
                onClick={handleCardClick}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0 pointer-events-none rounded-3xl" />
                <div className="absolute inset-0 rounded-3xl border-[2px] border-black dark:border-gray-400 z-10 transition-all duration-300 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 pointer-events-none" />

                {/* Micro-Typography Tag */}
                <div className="absolute top-0 left-0 bg-yellow-400 text-black font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-tl-3xl rounded-br-xl z-20 uppercase tracking-widest border-b-[2px] border-r-[2px] border-black pointer-events-none">
                    IDX: {String(index + 1).padStart(2, '0')}
                </div>

                {/* Main Content Area */}
                <div className="relative z-20 flex flex-col items-start justify-between p-5 sm:p-6 pt-7 sm:pt-8 gap-4">

                    <div className="flex w-full justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-indigo-600 group-hover:to-indigo-800 dark:group-hover:from-indigo-300 dark:group-hover:to-indigo-100 transition-all duration-300 truncate">
                                        {quiz.name || 'Untitled Quiz'}
                                    </h3>
                                    <button
                                        onClick={startEditing}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shrink-0"
                                        title="Edit Name"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Actions Container */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Talk Button (Visible by default) */}
                            {!isQuizFinished && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/quiz/live/' + quiz.id); }}
                                    className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-200/50 dark:border-amber-700/50 rounded-full transition-colors shadow-sm backdrop-blur-sm"
                                    title="Talk to Quiz Master"
                                >
                                    <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 300 }}><Mic className="w-4 h-4" /></motion.div>
                                </button>
                            )}

                            {/* FAB Progress Ring */}
                            <button
                                onClick={handleActionClick}
                                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                                title={isQuizFinished ? "Results" : isQuizStarted ? "Resume" : "Start"}
                            >
                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        className="stroke-slate-200 dark:stroke-slate-700"
                                        strokeWidth="3"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        stroke={progressColor}
                                        strokeWidth="3"
                                        strokeDasharray="100"
                                        strokeDashoffset={100 - progressPercent}
                                        strokeLinecap="round"
                                        className="transition-all duration-500 ease-out"
                                        style={{
                                            filter: progressPercent === 100 ? 'drop-shadow(0 0 4px rgba(5,150,105,0.5))' : 'none'
                                        }}
                                    />
                                </svg>
                                {isQuizFinished ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 z-10" />
                                ) : (
                                    <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400 z-10 ml-0.5" />
                                )}
                            </button>

                            {/* Desktop Delete - Appears on Hover */}
                            {!isTouchDevice && (
                                <button
                                    onClick={(e) => onDelete(quiz.id, e)}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100 absolute -right-2 top-2"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable Details Area */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={{
                                    visible: { opacity: 1, height: 'auto', marginTop: 12, transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.8, staggerChildren: 0.05 } },
                                    hidden: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }
                                }}
                                className="w-full overflow-hidden flex flex-wrap gap-2.5 text-xs font-semibold"
                            >
                                <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{quiz.filters.subject}</span>
                                </motion.div>
                                <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                </motion.div>
                                <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }} className={`flex items-center gap-1 px-2.5 py-1 rounded-md backdrop-blur-sm border ${
                                    quiz.mode === 'mock'
                                    ? 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300'
                                    : 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                    {quiz.mode === 'mock' ? 'Mock Test' : 'Learning Mode'}
                                </motion.div>
                                <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 backdrop-blur-sm">
                                    <span className="opacity-70">Progress:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">
                                        {Object.keys(quiz.state.answers).length} / {quiz.questions.length}
                                    </span>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </div>
    );
};
