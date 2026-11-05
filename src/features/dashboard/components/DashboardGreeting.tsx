import { supabase } from '@/lib/supabase';
import { fetchQuestionsByIds } from '@/features/quiz/services/questionService';
import React from "react";
import { Play, Calendar, Bookmark, FolderClock } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { SavedQuiz } from "@/features/quiz/types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "@/features/auth";
import { getUserDisplayName } from "@/utils/user";

interface DashboardGreetingProps {
  user: User | null;
  profile?: any | null;
  latestQuiz?: SavedQuiz | null;
  onResumeQuiz: (quiz: SavedQuiz) => void;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  user: propUser,
  profile: propProfile,
  latestQuiz,
  onResumeQuiz,
}) => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile } = useAuth();
  const user = propUser ?? authUser;
  const profile = propProfile ?? authProfile;

  const displayName = getUserDisplayName(profile, user, "Aspirant");

  const { data: bookmarkCount = 0 } = useQuery({
    queryKey: ['dashboard-bookmark-count', user?.id],
    queryFn: async () => {
      const all = await db.getAllBookmarks().catch(() => []);
      if (all && all.length > 0) return all.length;
      if (user) {
        const { data: remoteBookmarks } = await supabase
          .from('user_bookmarks')
          .select('question_id')
          .eq('user_id', user.id);
        if (remoteBookmarks && remoteBookmarks.length > 0) {
          const ids = remoteBookmarks.map((b: any) => b.question_id);
          const fullQuestions = await fetchQuestionsByIds(ids);
          for (const q of fullQuestions) {
            await db.saveBookmark(q, { skipRemotePush: true });
          }
          return fullQuestions.length;
        }
      }
      return 0;
    },
    staleTime: 1000 * 60 * 2,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative z-10 w-full">
      {/* Hero Strip — Greeting + Action Buttons in one unified card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5">
        {/* Compact Greeting */}
        <h2 className="text-[13px] sm:text-base font-bold text-slate-700 dark:text-slate-300 tracking-tight mb-2.5 sm:mb-3 pl-0.5">
          {getGreeting()},{" "}
          <span className="font-bold text-slate-800 dark:text-white">
            {displayName}
          </span>{" "}
          👋
        </h2>

        {/* Action Buttons Grid — inside the hero strip */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {/* Today's Plan */}
          <button
            onClick={() =>
              navigate(ROUTES.TODAYS_PLAN || "/todays-plan")
            }
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-sm transition-all w-full cursor-pointer active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-800/50 bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 transition-transform mb-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="relative z-10 font-bold text-[10px] leading-tight sm:text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Today's Plan
            </span>
            <span className="relative z-10 block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              your 5 min plan
            </span>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() =>
              navigate(ROUTES.QUIZ.BOOKMARKS)
            }
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-sm transition-all w-full cursor-pointer active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-amber-200/70 dark:border-amber-800/50 bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 transition-transform mb-1.5">
              <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="relative z-10 font-bold text-[10px] leading-tight sm:text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Bookmarks
            </span>
            <span className="relative z-10 block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {bookmarkCount > 0 ? `${bookmarkCount} saved Qs` : "saved questions"}
            </span>
          </button>

          {/* Resume Quiz */}
          <button
            onClick={() => latestQuiz && onResumeQuiz(latestQuiz)}
            disabled={!latestQuiz}
            className={`group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all text-center w-full active:scale-95 overflow-hidden ${
              latestQuiz
                ? "bg-white dark:bg-slate-900 border border-violet-200/80 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-600 cursor-pointer shadow-xs hover:shadow-sm"
                : "bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 opacity-50 cursor-not-allowed"
            }`}
          >
            {latestQuiz && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/12 via-indigo-500/5 to-transparent pointer-events-none" />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              latestQuiz
                ? "border-violet-200/70 dark:border-violet-800/50 bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 text-violet-600 dark:text-violet-400"
                : "border-slate-200/60 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800/60 text-slate-400"
            } transition-transform mb-1.5`}>
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span
              className={`relative z-10 font-bold text-[10px] leading-tight sm:text-xs transition-colors ${latestQuiz ? "text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              Resume Quiz
            </span>
            <span
              className={`relative z-10 block text-[8px] leading-tight sm:text-[9px] font-medium truncate w-full mt-0.5 ${latestQuiz ? "text-violet-600/80 dark:text-violet-400/80" : "text-slate-400 dark:text-slate-500"}`}
            >
              {latestQuiz ? latestQuiz.name || "Paused Quiz" : "no quiz in progress"}
            </span>
          </button>

          {/* Quiz History */}
          <button
            onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-sm transition-all w-full cursor-pointer active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-emerald-200/70 dark:border-emerald-800/50 bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 transition-transform mb-1.5">
              <FolderClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="relative z-10 font-bold text-[10px] leading-tight sm:text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Quiz History
            </span>
            <span className="relative z-10 block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              history & saved
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
