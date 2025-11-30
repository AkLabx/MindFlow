import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Clock, BookOpen, Edit2, Check, X, Save } from 'lucide-react';
import { db } from '../../../lib/db';
import { SavedQuiz } from '../types';
import { useQuizContext } from '../context/QuizContext';

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
            // Sort by createdAt desc
            setQuizzes(data.sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error("Failed to load quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResume = (quiz: SavedQuiz) => {
        loadSavedQuiz({ ...quiz.state, isPaused: false });
        if (quiz.mode === 'mock') {
            navigate('/quiz/session/mock');
        } else {
            navigate('/quiz/session/learning');
        }
    };

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

    const startEditing = (quiz: SavedQuiz, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(quiz.id);
        setEditName(quiz.name);
    };

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

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditName('');
    };

    const isQuizStarted = (quiz: SavedQuiz) => {
        return quiz.state.currentQuestionIndex > 0 || Object.keys(quiz.state.answers).length > 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Saved Quizzes</h1>
                    <button
                        onClick={() => navigate('/quiz/config')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create New Quiz
                    </button>
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Quizzes</h3>
                        <p className="text-gray-500 mb-6">Create a quiz to start learning!</p>
                        <button
                            onClick={() => navigate('/quiz/config')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Create Quiz
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map(quiz => (
                            <div
                                key={quiz.id}
                                onClick={() => handleResume(quiz)}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-4">
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
                                                <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {quiz.name || 'Untitled Quiz'}
                                                </h3>
                                                <button
                                                    onClick={(e) => startEditing(quiz, e)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Edit Name"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                                                <span className="font-medium text-gray-700">
                                                    {quiz.state.currentQuestionIndex + 1} / {quiz.questions.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleResume(quiz)}
                                            className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
                                            title={isQuizStarted(quiz) ? "Resume Quiz" : "Start Quiz"}
                                        >
                                            <Play className="w-4 h-4" />
                                            {isQuizStarted(quiz) ? "Resume" : "Start"}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(quiz.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
