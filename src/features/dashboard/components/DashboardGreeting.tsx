import React from 'react';
import { Play } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SavedQuiz } from '@/features/quiz/types';

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
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Aspirant';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
          {getGreeting()}, {firstName} 👋
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Ready to continue your learning journey?
        </p>
      </div>

      {latestQuiz && (
        <button
          onClick={() => onResumeQuiz(latestQuiz)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all flex-shrink-0"
        >
          <Play className="w-4 h-4" />
          <span className="truncate max-w-[150px]">Resume {latestQuiz.name || 'Quiz'}</span>
        </button>
      )}
    </div>
  );
};
