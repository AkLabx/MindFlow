import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Landmark, Scale, Globe2, TrendingUp, Atom, Award, Sparkles } from 'lucide-react';
import { SSC_SUBJECTS } from '../constants/sscDashboardConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';

const IconMap: Record<string, React.ElementType> = {
  Landmark,
  Scale,
  Globe2,
  TrendingUp,
  Atom,
  Award,
  Sparkles,
};

export const SubjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: subjectCounts, isLoading } = useQuery({
    queryKey: ['dashboard-subject-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_subject_counts');
      if (error) throw error;
      return data || {};
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const handleSubjectClick = (subjectDbKey: string) => {
    navigate(ROUTES.SUBJECT.view(subjectDbKey));
  };

  return (
    <div className="min-h-full -mx-4 -mt-4 px-4 pt-4 overflow-x-hidden bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-6 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">All Subjects</h1>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {SSC_SUBJECTS.map((subject) => {
            const Icon = IconMap[subject.icon] || Sparkles;
            const count = subjectCounts?.[subject.dbKey] || 0;

            return (
              <button
                key={subject.id}
                onClick={() => handleSubjectClick(subject.dbKey)}
                className="flex flex-col items-center justify-center p-4 sm:p-6 text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-0 w-full justify-center">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${subject.bgClass} ${subject.textClass} border ${subject.colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-transparent'} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {subject.label}
                  </span>
                </div>
                <span className="block text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
                  {isLoading ? '...' : `${count}+ Qs`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
