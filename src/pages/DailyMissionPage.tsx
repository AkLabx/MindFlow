import React from 'react';
import { ArrowLeft, Target, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export const DailyMissionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 absolute left-1/2 -translate-x-1/2">
          Daily Mission
        </h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden text-center sm:text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-transparent blur-3xl -z-10 rounded-full" />

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                Your Daily Challenge
              </h2>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            Daily missions will be dynamically controlled by the server data of the plan you choose. Complete your daily challenges to maintain your streak and boost your exam preparation!
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/20">
          <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Feature Coming Soon!</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            We are preparing personalized daily missions just for you. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
};
