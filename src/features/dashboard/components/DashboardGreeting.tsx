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
            await db.saveBookmark(q);
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
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-[0_2px_16px_-6px_rgba(99,102,241,0.10)] dark:shadow-none p-3 sm:p-4">
        {/* Compact Greeting */}
        <h2 className="text-[13px] sm:text-base font-medium text-slate-500 dark:text-slate-400 tracking-tight mb-2 sm:mb-2.5 pl-0.5">
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
            className="flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-slate-50/80 dark:bg-slate-700/40 hover:bg-indigo-50 dark:hover:bg-slate-600/50 transition-all group w-full cursor-pointer active:scale-95"
          >
            <Calendar className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-semibold text-[10px] leading-tight sm:text-xs text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Today's Plan
            </span>
            <span className="block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              your 5 min plan
            </span>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() =>
              navigate(ROUTES.QUIZ.BOOKMARKS)
            }
            className="flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-slate-50/80 dark:bg-slate-700/40 hover:bg-amber-50 dark:hover:bg-slate-600/50 transition-all group w-full cursor-pointer active:scale-95"
          >
            <Bookmark className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-semibold text-[10px] leading-tight sm:text-xs text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Bookmarks
            </span>
            <span className="block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {bookmarkCount > 0 ? `${bookmarkCount} saved Qs` : "saved questions"}
            </span>
          </button>

          {/* Resume Quiz */}
          <button
            onClick={() => latestQuiz && onResumeQuiz(latestQuiz)}
            disabled={!latestQuiz}
            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all text-center group w-full active:scale-95 ${
              latestQuiz
                ? "bg-gradient-to-br from-indigo-50/80 to-violet-50/80 dark:from-indigo-900/30 dark:to-violet-900/30 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/50 dark:hover:to-violet-900/50 cursor-pointer"
                : "bg-slate-50/80 dark:bg-slate-700/40 opacity-50 cursor-not-allowed"
            }`}
          >
            <Play
              className={`w-5 h-5 mb-1 ${latestQuiz ? "text-violet-500 group-hover:scale-110 transition-transform" : "text-slate-400"}`}
            />
            <span
              className={`font-semibold text-[10px] leading-tight sm:text-xs transition-colors ${latestQuiz ? "text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-800 dark:group-hover:text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}
            >
              Resume Quiz
            </span>
            <span
              className={`block text-[8px] leading-tight sm:text-[9px] font-medium truncate w-full mt-0.5 ${latestQuiz ? "text-indigo-500/70 dark:text-indigo-400/70" : "text-slate-400 dark:text-slate-500"}`}
            >
              {latestQuiz ? latestQuiz.name || "Paused Quiz" : "no quiz in progress"}
            </span>
          </button>

          {/* Quiz History */}
          <button
            onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
            className="flex flex-col items-center justify-center p-2 sm:p-3 text-center rounded-xl bg-slate-50/80 dark:bg-slate-700/40 hover:bg-emerald-50 dark:hover:bg-slate-600/50 transition-all group w-full cursor-pointer active:scale-95"
          >
            <FolderClock className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform mb-1" />
            <span className="font-semibold text-[10px] leading-tight sm:text-xs text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Quiz History
            </span>
            <span className="block text-[8px] leading-tight sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              history & saved
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
