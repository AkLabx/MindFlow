import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

export const AIHome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 animate-fade-in w-full max-w-4xl mx-auto pb-32 relative">

            {/* Back Button */}
            <div className="absolute top-6 left-6 w-full flex justify-start">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Content */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-8 shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
                    <Brain className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">AI Features Coming Soon</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto text-xl leading-relaxed">
                    We're building exciting new AI-powered tools. Stay tuned!
                </p>
            </div>

        </div>
    );
};
