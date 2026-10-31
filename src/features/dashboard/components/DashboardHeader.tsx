import React from 'react';
import { Flame, Bell, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getUserDisplayName } from '@/utils/user';

interface DashboardHeaderProps {
  user: User | null;
  profile?: any | null;
  streak: number;
  onAvatarClick: () => void;
  onNotificationClick: () => void;
  onStreakClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  profile,
  streak,
  onAvatarClick,
  onNotificationClick,
  onStreakClick
}) => {
  const displayName = getUserDisplayName(profile, user, 'Aspirant');
  const isAdmin = user?.email === 'admin@mindflow.com';

  return (
    <div className="flex items-center justify-between mb-2 mt-1 sm:mt-2 px-1 relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain">
             <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
             <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
             <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
             <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
             <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
             <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
             <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
             <path d="M6 18a4 4 0 0 1-1.967-.516"/>
             <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                MindFlow
              </h1>
              {isAdmin && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[9px] font-bold border border-red-100 dark:border-red-800">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>ADMIN</span>
                  </div>
              )}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {displayName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onStreakClick}
          className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-700/50 flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-xs active:scale-95 transition-transform"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{streak}d</span>
        </button>

        <button
          onClick={onNotificationClick}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 relative active:scale-95 transition-transform"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white dark:border-slate-800"></span>
        </button>

        <button
          onClick={onAvatarClick}
          className="w-9 h-9 rounded-full ring-2 ring-indigo-500/20 overflow-hidden active:scale-95 transition-transform bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
        >
            {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <UserIcon className="w-5 h-5" />
            )}
        </button>
      </div>
    </div>
  );
};
