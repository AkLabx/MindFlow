import React from 'react';
import { ListChecks, FileText, BookOpen, Languages, Save, Wrench, BarChart2, Star, ChevronRight, Info } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2 } from 'lucide-react';

/**
 * Props for the Dashboard component.
 */
interface DashboardProps {
    /** Callback to start creating a new quiz. */
    onStartQuiz: () => void;
    /** Callback to navigate to the English Zone. */
    onEnglish: () => void;
    /** Callback to return to the Landing Page intro. */
    onBackToIntro: () => void;
    /** Callback to view saved quizzes. */
    onSavedQuizzes: () => void;
}

/**
 * The main Dashboard screen for logged-in users.
 *
 * Provides quick access to:
 * - Create New Quiz
 * - Saved Quizzes
 * - English Zone (Specialized features)
 * - Tools (Utilities like Flashcard Maker)
 * - User Guide (Static content)
 *
 * @param {DashboardProps} props - The component props.
 * @returns {JSX.Element} The rendered Dashboard.
 */
export const Dashboard: React.FC<DashboardProps> = ({ onStartQuiz, onEnglish, onBackToIntro, onSavedQuizzes }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const { user } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };


    return (
        <div className="flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 relative z-10 animate-fade-in">
                {/* Hero Section */}
                <div className="relative text-center max-w-4xl mx-auto mt-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4 drop-shadow-sm">
                        Dashboard
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                        {getGreeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'buddy'}!
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {/* Card 1 - Custom Quiz */}
                    <div
                        onClick={() => handleNavigation('card-1', onStartQuiz)}
                        className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-indigo-100 dark:border-indigo-900/40 border-b-4 border-b-indigo-200 dark:border-b-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-500"
                    >
                        {loadingId === 'card-1' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-1' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <ListChecks className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Create Quiz</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Filter by subject, topic, and difficulty.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-indigo-400 dark:text-indigo-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-1' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                    {/* Card 2 - Created Quizzes */}
                    <div
                        onClick={() => handleNavigation('card-2', onSavedQuizzes)}
                        className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500"
                    >
                        {loadingId === 'card-2' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-2' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <Save className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Created Quizzes</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Resume paused quizzes or view completed ones.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-emerald-400 dark:text-emerald-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-2' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                    {/* Card 3 - English */}
                    <div
                        onClick={() => handleNavigation('card-3', onEnglish)}
                        className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500"
                    >
                        {loadingId === 'card-3' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-3' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <Languages className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">English Zone</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Vocab, Grammar & Mock Tests.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-rose-400 dark:text-rose-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-3' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                    {/* Card 4 - Tools */}
                    <div
                        onClick={() => handleNavigation('card-4', () => navigate('/tools'))}
                        className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-amber-100 dark:border-amber-900/40 border-b-4 border-b-amber-200 dark:border-b-amber-700 hover:border-amber-300 dark:hover:border-amber-500"
                    >
                        {loadingId === 'card-4' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-4' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <Wrench className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tools</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Flashcard Maker & Utilities.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-amber-400 dark:text-amber-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-4' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                    {/* Card 5 - Analytics */}
                    <div
                        onClick={() => handleNavigation('card-5', () => navigate('/quiz/analytics'))}
                        className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-blue-100 dark:border-blue-900/40 border-b-4 border-b-blue-200 dark:border-b-blue-700 hover:border-blue-300 dark:hover:border-blue-500"
                    >
                        {loadingId === 'card-5' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-5' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <BarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Analytics</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Detailed report cards & stats.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-blue-400 dark:text-blue-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-5' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                    {/* Card 6 - Bookmarks */}
                    <div
                        onClick={() => handleNavigation('card-6', () => navigate('/quiz/bookmarks'))}
                        className="bg-violet-50 dark:bg-violet-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-violet-100 dark:border-violet-900/40 border-b-4 border-b-violet-200 dark:border-b-violet-700 hover:border-violet-300 dark:hover:border-violet-500 sm:col-span-2 lg:col-span-1"
                    >
                        {loadingId === 'card-6' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-6' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <Star className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Bookmarks</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Review your saved questions.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-violet-400 dark:text-violet-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-6' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>

                    {/* Card 7 - About Us */}
                    <div
                        onClick={() => handleNavigation('card-7', () => navigate('/about'))}
                        className="bg-slate-50 dark:bg-slate-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-slate-100 dark:border-slate-800/40 border-b-4 border-b-slate-200 dark:border-b-slate-700 hover:border-slate-300 dark:hover:border-slate-600 sm:col-span-2 lg:col-span-1"
                    >
                        {loadingId === 'card-7' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                            </div>
                        ) : null}
                        <div className={`flex items-center gap-4 flex-1 transition-opacity ${loadingId === 'card-7' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                <Info className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">About Us</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Developer info, Privacy Policy & Terms.
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 group-hover:translate-x-1 transition-transform ${loadingId === 'card-7' ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                </div>

                {/* Footer Link */}
                <div className="w-full text-center pb-4">
                    <button onClick={onBackToIntro} className="text-xs text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 font-semibold uppercase tracking-widest">
                        Back to Intro
                    </button>
                </div>
            </div>
        </div>
    );
};
