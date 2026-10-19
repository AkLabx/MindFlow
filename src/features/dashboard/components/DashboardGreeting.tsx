import React from "react";
import { Play, Calendar, Target, History, ChevronRight } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { SavedQuiz } from "@/features/quiz/types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

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
  const firstName =
    user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Aspirant";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative z-10 w-full mb-2">
      {/* Greeting */}
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 tracking-tight mb-3">
          {getGreeting()},{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {firstName}
          </span>{" "}
          👋
        </h2>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Today's Plan */}
        <button
          onClick={() =>
            navigate((ROUTES as any).TODAYS_PLAN || "/todays-plan")
          }
          className="flex flex-col items-center justify-center p-2.5 sm:p-4 text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <Calendar className="w-5 h-5 sm:w-5 sm:h-5 text-indigo-500" />
              <span className="font-semibold text-[11px] leading-tight sm:text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Today's Plan
              </span>
            </div>
          </div>
          <span className="block text-[9px] leading-tight sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            your 5 min plan
          </span>
        </button>

        {/* Daily Mission */}
        <button
          onClick={() =>
            navigate((ROUTES as any).DAILY_MISSION || "/daily-mission")
          }
          className="flex flex-col items-center justify-center p-2.5 sm:p-4 text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <Target className="w-5 h-5 sm:w-5 sm:h-5 text-rose-500" />
              <span className="font-semibold text-[11px] leading-tight sm:text-sm text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Daily Mission
              </span>
            </div>
          </div>
          <span className="block text-[9px] leading-tight sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            today's challenge
          </span>
        </button>

        {/* Continue / Resume */}
        <button
          onClick={() => latestQuiz && onResumeQuiz(latestQuiz)}
          disabled={!latestQuiz}
          className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl border transition-all text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none group w-full ${
            latestQuiz
              ? "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-200 dark:hover:border-indigo-500/40 cursor-pointer"
              : "bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/50 opacity-60 cursor-not-allowed"
          }`}
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <Play
                className={`w-5 h-5 sm:w-5 sm:h-5 ${latestQuiz ? "text-violet-500" : "text-slate-400"}`}
              />
              <span
                className={`font-semibold text-[11px] leading-tight sm:text-sm transition-colors ${latestQuiz ? "text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-800 dark:group-hover:text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}
              >
                Continue
              </span>
            </div>
          </div>
          <span
            className={`block text-[9px] leading-tight sm:text-[10px] font-medium truncate w-full mt-1 ${latestQuiz ? "text-indigo-600/70 dark:text-indigo-400/70" : "text-slate-500 dark:text-slate-400"}`}
          >
            {latestQuiz ? latestQuiz.name || "Paused Quiz" : "no paused quiz"}
          </span>
        </button>

        {/* Quiz History */}
        <button
          onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
          className="flex flex-col items-center justify-center p-2.5 sm:p-4 text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <History className="w-5 h-5 sm:w-5 sm:h-5 text-emerald-500" />
              <span className="font-semibold text-[11px] leading-tight sm:text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Quiz History
              </span>
            </div>
          </div>
          <span className="block text-[9px] leading-tight sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            attempted quiz
          </span>
        </button>
      </div>
    </div>
  );
};
