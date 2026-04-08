import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { McqsQuizSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG, GodModeSVG } from './DashboardSVGs';
import { AdminSVG } from './AdminSVGs';
import { ListChecks, FileText, BookOpen, Languages, Save, Wrench, BarChart2, Star, ChevronRight, Info } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2 } from 'lucide-react';
import { useNotification } from '../../../stores/useNotificationStore';

/**
 * Props for the Dashboard component.
 */
interface DashboardProps {
    /** Callback to navigate to the English Zone. */
    onSchool: () => void;
    /** Callback to return to the Landing Page intro. */
    onBackToIntro: () => void;
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
export const Dashboard: React.FC<DashboardProps> = ({ onSchool, onBackToIntro }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const { user } = useAuth();
    const { showToast } = useNotification();




    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
        }
    };

    const handleDownloadClick = () => {
        window.open('https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF', '_blank');
        showToast({
            message: 'Your download page has been opened in next tab go and see',
            variant: 'info',
            duration: 3000
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };


    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
            <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full">
                {/* Hero Section */}
                <div className="relative text-left w-full mt-2">
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                        Dashboard
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                        {getGreeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'buddy'}!
                    </p>
                </div>

                {/* Cards Grid */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20">

                    {/* Card card-mcqs */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-mcqs', () => navigate('/mcqs'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-fuchsia-200/50 dark:border-b-fuchsia-700/50 group-hover:border-fuchsia-300 dark:group-hover:border-fuchsia-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-fuchsia-500"></div>

                        {loadingId === 'card-mcqs' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-mcqs' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <McqsQuizSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-fuchsia-900 dark:from-fuchsia-300 dark:to-fuchsia-100 mb-1 sm:mb-2">MCQs Quiz</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Create, resume, or review tests.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-3 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-3', onSchool)}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-rose-500"></div>

                        {loadingId === 'card-3' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-rose-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-3' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <EnglishZoneSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100 mb-1 sm:mb-2">English Zone</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Vocab, Grammar & Mock Tests.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-4 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-4', () => navigate('/tools'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-amber-200/50 dark:border-b-amber-700/50 group-hover:border-amber-300 dark:group-hover:border-amber-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-amber-500"></div>

                        {loadingId === 'card-4' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-4' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <ToolsSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100 mb-1 sm:mb-2">Tools</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Flashcard Maker & Utilities.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-5 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-5', () => navigate('/quiz/analytics'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-blue-500"></div>

                        {loadingId === 'card-5' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-5' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <AnalyticsSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100 mb-1 sm:mb-2">Analytics</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Detailed report cards & stats.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-godmode */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-godmode', () => navigate('/quiz/config', { state: { initialMode: 'god' } }))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden sm:col-span-2 md:col-span-3 lg:col-span-1"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-rose-500"></div>

                        {loadingId === 'card-godmode' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-rose-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-godmode' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <GodModeSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100 mb-1 sm:mb-2">God-Mode</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Create Exam Blueprints
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-6 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-6', () => navigate('/quiz/bookmarks'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-violet-200/50 dark:border-b-violet-700/50 group-hover:border-violet-300 dark:group-hover:border-violet-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-violet-500"></div>

                        {loadingId === 'card-6' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-violet-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-6' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <BookmarksSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-violet-900 dark:from-violet-300 dark:to-violet-100 mb-1 sm:mb-2">Bookmarks</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Review your saved questions.
                                </p>
                            </div>
                        </div>
                    </motion.div>



                    {/* Admin Room (Visible only to admin@mindflow.com) */}
                    {user?.email === 'admin@mindflow.com' && (
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-admin', () => navigate('/admin'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-red-200/50 dark:border-b-red-700/50 group-hover:border-red-300 dark:group-hover:border-red-500"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-red-500"></div>

                        {loadingId === 'card-admin' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-admin' ? 'opacity-0' : 'opacity-100'}`}>
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <AdminSVG />
                            </motion.div>

                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-900 dark:from-red-300 dark:to-red-100 mb-1 sm:mb-2">Admin Room</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Broadcast & Upload
                                </p>
                            </div>
                        </div>
                    </motion.div>
                    )}

                    {/* Card card-download */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-download', handleDownloadClick)}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-cyan-200/50 dark:border-b-cyan-700/50 group-hover:border-cyan-300 dark:group-hover:border-cyan-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-cyan-500"></div>

                        {loadingId === 'card-download' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-download' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <DownloadSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-900 dark:from-cyan-300 dark:to-cyan-100 mb-1 sm:mb-2">Download</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Get study materials & PDFs.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-7 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-7', () => navigate('/about'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-slate-200/50 dark:border-b-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-slate-500"></div>

                        {loadingId === 'card-7' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-slate-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-7' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                            >
                                <AboutSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-900 dark:from-slate-300 dark:to-slate-100 mb-1 sm:mb-2">About Us</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Developer info, Privacy Policy & Terms.
                                </p>
                            </div>
                        </div>
                    </motion.div>
</motion.div>

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
