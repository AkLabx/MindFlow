import React from 'react';
import { ListChecks, FileText, BookOpen, Languages, Save } from 'lucide-react';
import { Button } from '../../../components/Button/Button';

interface DashboardProps {
    onStartQuiz: () => void;
    onEnglish: () => void;
    onBackToIntro: () => void;
    onSavedQuizzes: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartQuiz, onEnglish, onBackToIntro, onSavedQuizzes }) => {
    return (
        <div className="flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 relative z-10 animate-fade-in">
                {/* Hero Section */}
                <div className="relative text-center max-w-4xl mx-auto mt-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight mb-4 drop-shadow-sm">
                        Master Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                            Knowledge.
                        </span>
                    </h1>

                    <p className="text-base text-gray-600 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                        Adaptive quizzes, detailed analytics, and instant feedback to help you learn faster.
                    </p>

                    <div className="flex items-center justify-center gap-3 relative z-20">
                        <Button
                            size="lg"
                            onClick={onStartQuiz}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-indigo-200 transition-all transform active:scale-95"
                        >
                            Create Quiz
                        </Button>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {/* Card 1 - Custom Quiz */}
                    <div
                        onClick={onStartQuiz}
                        className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-indigo-300"
                    >
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ListChecks className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Create Quiz</h3>
                        <p className="text-gray-500 text-xs font-medium">
                            Filter by subject, topic, and difficulty.
                        </p>
                    </div>

                    {/* Card 2 - Saved Quizzes */}
                    <div
                        onClick={onSavedQuizzes}
                        className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-green-300"
                    >
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Save className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">My Quizzes</h3>
                        <p className="text-gray-500 text-xs font-medium">
                            Resume saved quizzes and view history.
                        </p>
                    </div>

                    {/* Card 3 - English */}
                    <div
                        onClick={onEnglish}
                        className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-rose-300"
                    >
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Languages className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">English Zone</h3>
                        <p className="text-gray-500 text-xs font-medium">
                            Vocab, Grammar & Mock Tests.
                        </p>
                    </div>

                    {/* Card 4 - Guide */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md hover:border-blue-300">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">User Guide</h3>
                        <p className="text-gray-500 text-xs font-medium">
                            Learn how to use the app.
                        </p>
                    </div>
                </div>

                <div className="w-full text-center pb-4">
                    <button onClick={onBackToIntro} className="text-xs text-gray-400 hover:text-indigo-500 font-semibold uppercase tracking-widest">
                        Back to Intro
                    </button>
                </div>
            </div>
        </div>
    );
};
