import React from 'react';
import { Play, Calendar, Target, History, ChevronRight } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SavedQuiz } from '@/features/quiz/types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface DashboardGreetingProps {
  user: User | null;
  latestQuiz?: SavedQuiz | null;
  onResumeQuiz: (quiz: SavedQuiz) => void;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  user,
  latestQuiz,
  onResumeQuiz,
}) => {
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Aspirant';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none relative overflow-hidden z-10">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent blur-3xl -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-transparent blur-2xl -z-10 rounded-full" />

      {/* Greeting */}
      <div className="mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 tracking-tight leading-none">
          {getGreeting()}, <span className="font-bold text-slate-800 dark:text-white">{firstName}</span> 👋
        </h2>
      </div>

      {/* Thin Divider */}
      <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-200 to-transparent dark:from-slate-800 dark:via-slate-800 mb-4"></div>

      {/* Heading */}
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Today</h3>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Today's Plan */}
        <button
          onClick={() => navigate((ROUTES as any).TODAYS_PLAN || '/todays-plan')}
          className="flex flex-col items-center sm:items-start justify-center p-1.5 sm:p-2 md:p-3 text-center sm:text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left group"
        >
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-0 sm:mb-1 w-full justify-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-[10px] leading-tight sm:text-xs md:text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Today's Plan</span>
            </div>
            <ChevronRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
          </div>
          <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">your 5 min plan</span>
        </button>

        {/* Daily Mission */}
        <button
          onClick={() => navigate((ROUTES as any).DAILY_MISSION || '/daily-mission')}
          className="flex flex-col items-center sm:items-start justify-center p-1.5 sm:p-2 md:p-3 text-center sm:text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left group"
        >
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-0 sm:mb-1 w-full justify-center sm:justify-between">
             <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-[10px] leading-tight sm:text-xs md:text-sm text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Daily Mission</span>
            </div>
            <ChevronRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
          </div>
          <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">today's challenge</span>
        </button>

        {/* Continue / Resume */}
        <button
          onClick={() => latestQuiz && onResumeQuiz(latestQuiz)}
          disabled={!latestQuiz}
          className={`flex flex-col items-center sm:items-start justify-center p-1.5 sm:p-2 md:p-3 rounded-xl border transition-all text-center sm:text-left group ${
            latestQuiz
            ? 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-200 dark:hover:border-indigo-500/40 cursor-pointer'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-0 sm:mb-1 w-full justify-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Play className={`w-4 h-4 ${latestQuiz ? 'text-violet-500' : 'text-slate-400'}`} />
              <span className={`font-bold text-[10px] leading-tight sm:text-xs md:text-sm transition-colors ${latestQuiz ? 'text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-800 dark:group-hover:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>Continue</span>
            </div>
             {latestQuiz && <ChevronRight className="hidden sm:block w-4 h-4 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />}
          </div>
          <span className={`hidden sm:block text-xs font-medium truncate w-full ${latestQuiz ? 'text-indigo-600/70 dark:text-indigo-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
            {latestQuiz ? latestQuiz.name || 'Paused Quiz' : 'no paused quiz'}
          </span>
        </button>

        {/* Quiz History */}
        <button
          onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
          className="flex flex-col items-center sm:items-start justify-center p-1.5 sm:p-2 md:p-3 text-center sm:text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left group"
        >
           <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-0 sm:mb-1 w-full justify-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-[10px] leading-tight sm:text-xs md:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Quiz History</span>
            </div>
             <ChevronRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
          </div>
          <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">attempted quiz</span>
        </button>
      </div>
    </div>
  );
};
