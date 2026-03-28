import React from 'react';
import { Outlet } from 'react-router-dom';

export const SchoolLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-0 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};
