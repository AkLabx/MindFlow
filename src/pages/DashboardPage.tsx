import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuizContext } from '@/features/quiz/context/QuizContext';
import { STARTER_DIAGNOSTIC_QUESTIONS } from '@/features/quiz/data/starterDiagnosticQuestions';
import { db } from '@/lib/db';
import { AdminSVG } from "@/features/admin";
import {
  McqsQuizSVG,
  EnglishZoneSVG,
  ToolsSVG,
  AnalyticsSVG,
  BookmarksSVG,
  AboutSVG,
  DownloadSVG,
} from "@/features/quiz";
import {
  ListChecks,
  FileText,
  BookOpen,
  Languages,
  Save,
  Wrench,
  BarChart2,
  Star,
  ChevronRight,
  Info,
  Zap,
  BookA,
  MessageCircle,
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useNotification } from "@/stores/useNotificationStore";
import { isNativeApp } from "@/utils/platform";

interface DashboardProps {
  onBackToIntro?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onBackToIntro }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { state: quizState, startQuiz } = useQuizContext();
  const [totalAttempts, setTotalAttempts] = useState<number | null>(null);

  useEffect(() => {
    // Check if user has any previous attempts to determine new user status
    const checkAttempts = async () => {
      try {

        const allQuizzes = [];
        const attempts = allQuizzes;
        setTotalAttempts(attempts.length);
      } catch (err) {
        console.error("Failed to fetch quiz attempts", err);
        setTotalAttempts(0);
      }
    };
    checkAttempts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  const handleDownloadClick = () => {
    window.open(
      "https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF",
      "_blank",
    );
    showToast({
      message: "Your download page has been opened in next tab go and see",
      variant: "info",
      duration: 3000,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleStartFirstDrill = () => {
      // Use the first 5 questions for the actual dashboard drill
      const questions = STARTER_DIAGNOSTIC_QUESTIONS.slice(0, 5);
      startQuiz(questions, {} as any, 'learning');
      navigate(`/mcqs/session/${Date.now()}`);
  };

  const handleResumeQuiz = () => {
      if (quizState.quizId) {
          navigate(`/mcqs/session/${quizState.quizId}`);
      } else {
          navigate('/mcqs');
      }
  };

  const isNewUser = totalAttempts === 0;
  const hasPausedQuiz = quizState.isPaused && quizState.quizId;

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden flex flex-col selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-900/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col z-10 overflow-y-auto overflow-x-hidden pt-safe-top pb-[calc(100px_+_env(safe-area-inset-bottom))] lg:pb-12 custom-scrollbar">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400">{user?.user_metadata?.full_name?.split(' ')[0] || "Aspirant"}</span>
              <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
              Ready to conquer your goals today?
            </p>
          </div>

          {!isNativeApp() && (
          <div className="flex sm:justify-end">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Get it on Google Play"
              height="32" className="h-8 sm:h-10 w-auto transition-transform hover:scale-105 active:scale-95 drop-shadow-md cursor-pointer"
            />
          </div>
          )}
        </motion.div>

        {/* --- Smart Hero Card --- */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
              if (isNewUser) handleStartFirstDrill();
              else if (hasPausedQuiz) handleResumeQuiz();
              else navigate("/mcqs");
          }}
          className="relative group cursor-pointer w-full rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden mb-4 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-fuchsia-900/40 dark:from-indigo-900/40 dark:via-purple-900/20 dark:to-fuchsia-950/60 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
          <div className="absolute inset-0 bg-white/30 dark:bg-black/20 z-0"></div>
          <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-indigo-200/60 dark:border-indigo-700/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[6px] border-b-indigo-400/50 dark:border-b-indigo-600/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-400"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500 pointer-events-none"></div>

          <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between h-full w-full p-6 sm:p-10 transition-opacity duration-300">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left mb-6 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-900 dark:from-indigo-300 dark:to-purple-100 drop-shadow-sm mb-2">
                {isNewUser ? "Start Your First Drill" : hasPausedQuiz ? "Resume Paused Quiz" : "Start Practicing"}
              </h2>
              <p className="text-indigo-900/70 dark:text-indigo-100/70 text-sm sm:text-base font-bold leading-tight">
                {isNewUser ? "A quick 5-question diagnostic to get you started." : hasPausedQuiz ? "Pick up exactly where you left off." : "Dive into 10,000+ PYQs and Mock Tests."}
              </p>
            </div>

            <div className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all transform hover:scale-105 active:scale-95 gap-2 backdrop-blur-sm border border-indigo-400/50 whitespace-nowrap">
              <span className="text-sm sm:text-base tracking-wide">{isNewUser ? "Start Drill" : hasPausedQuiz ? "Resume Now" : "Go to Hub"}</span>
              <Play className="w-5 h-5 fill-current" />
            </div>
          </div>
        </motion.div>

        {/* --- 1-Tap Quick Launchers --- */}
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
            {[
                { name: 'Quick GK', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', route: '/mcqs/random' },
                { name: 'OWS', icon: BookA, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', route: '/vocab/ows/session' },
                { name: 'Idioms', icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30', route: '/vocab/idioms/session' },
                { name: 'Synonyms', icon: Languages, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', route: '/vocab/synonyms/session' }
            ].map((launcher, idx) => (
                <motion.button
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(launcher.route)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all gap-2"
                >
                    <div className={`p-2 rounded-xl ${launcher.bg} ${launcher.color}`}>
                        <launcher.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">{launcher.name}</span>
                </motion.button>
            ))}
        </motion.div>

        {/* --- 2x2 Core Grid --- */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 px-1">Core Modules</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20 mb-8"
        >

          {/* Card: MCQs Hub */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/mcqs")}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-indigo-200/50 dark:border-b-indigo-700/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-indigo-500"></div>

            <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300">
              <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                <McqsQuizSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100">MCQs & Tests</h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Hub for all subjects</p>
              </div>
            </div>
          </motion.div>

          {/* Card: English Zone */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/english")}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-rose-500"></div>

            <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300">
              <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                <EnglishZoneSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100">English Zone</h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Vocab, Grammar & Tests</p>
              </div>
            </div>
          </motion.div>

          {/* Card: Analytics */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/quiz-results")}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-blue-500"></div>

            <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300">
              <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                <AnalyticsSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100">Analytics</h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">{isNewUser ? "Attempt a quiz to see stats!" : "Track your progress"}</p>
              </div>
            </div>
          </motion.div>

          {/* Card: Bookmarks */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/bookmarks")}
            className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
            <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[2px] border-b-yellow-200/50 dark:border-b-yellow-700/50 group-hover:border-yellow-300 dark:group-hover:border-yellow-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-yellow-500"></div>

            <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300">
              <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                <BookmarksSVG />
              </motion.div>
              <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                  <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-900 dark:from-yellow-300 dark:to-yellow-100">Bookmarks</h3>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">{isNewUser ? "Save questions to review here." : "Review saved questions"}</p>
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Secondary Utilities List */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 px-1 mt-4">Utilities & More</h3>
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3 z-20"
        >
            <motion.button
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/tools")}
                className="flex items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
            >
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl mr-4">
                    <Wrench className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Tools</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Flashcard Maker & Utilities</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.button>

            <motion.button
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadClick}
                className="flex items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
            >
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl mr-4">
                    <FileText className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Download Notes</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Get study materials & PDFs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.button>

            {user?.email === "admin@mindflow.com" && (
                <motion.button
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/admin")}
                    className="flex items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-red-200/50 dark:border-red-900/30 shadow-sm"
                >
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl mr-4">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Admin Room</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast & Upload</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
            )}
        </motion.div>
      </div>
    </div>
  );
};
