import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Clock, BookOpen, Edit2, Check, X, Save, Home, PlusCircle, CheckCircle } from 'lucide-react';
import { db } from '../../../lib/db';
import { SavedQuiz } from '../types';
import { useQuizContext } from '../context/QuizContext';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';

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


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 transition-colors font-medium"
                    >
                        <Home className="w-5 h-5" /> Back to Home
                    </button>
                </div>
                <div className="flex items-center justify-between mb-8">

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Created Quizzes</h1>
                    <div className="flex gap-4">

                        <button
                            onClick={() => navigate('/quiz/attempted')}
                            className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/40 border-b-4 border-b-emerald-300 dark:border-b-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:translate-y-1 active:border-b transition-all shadow-sm flex items-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            View Attempted quizzes
                        </button>
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Created Quizzes</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Start a new quiz to see it here!</p>
                        <button
                            onClick={() => navigate('/quiz/config')}
                            className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/40 border-b-4 border-b-indigo-300 dark:border-b-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:translate-y-1 active:border-b transition-all shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create New Quiz
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map(quiz => (
                            <div
                                key={quiz.id}
                                onClick={() => handleResume(quiz)}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-4">
                                        {/* Name / Edit Mode */}
                                        {editingId === quiz.id ? (
                                            <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    autoFocus
                                                />
                                                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEdit} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                                                    {quiz.name || 'Untitled Quiz'}
                                                </h3>
                                                <button
                                                    onClick={(e) => startEditing(quiz, e)}
                                                    className="p-1 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Edit Name"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{quiz.filters.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quiz.mode === 'mock' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {quiz.mode === 'mock' ? 'Mock Test' : 'Learning Mode'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                                    {quiz.state.currentQuestionIndex + 1} / {quiz.questions.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleResume(quiz)}
                                            className="flex items-center gap-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:bg-indigo-900/40 rounded-lg transition-colors font-medium text-sm"
                                            title={isQuizFinished(quiz) ? "View Results" : isQuizStarted(quiz) ? "Resume Quiz" : "Start Quiz"}
                                        >
                                            <Play className="w-4 h-4" />
                                            {isQuizFinished(quiz) ? "View Results" : isQuizStarted(quiz) ? "Resume" : "Start"}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(quiz.id, e)}
                                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Quiz"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
