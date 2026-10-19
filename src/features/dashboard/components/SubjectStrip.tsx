import React from 'react';
import { ChevronRight, Landmark, Scale, Globe2, TrendingUp, Atom, Award, Sparkles } from 'lucide-react';
import { SSC_SUBJECTS } from '../constants/sscDashboardConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SubjectStripProps {
  onSubjectClick: (subjectDbKey: string) => void;
  onViewAllClick: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  Landmark,
  Scale,
  Globe2,
  TrendingUp,
  Atom,
  Award,
  Sparkles,
};

export const SubjectStrip: React.FC<SubjectStripProps> = ({ onSubjectClick, onViewAllClick }) => {
  const { data: subjectCounts, isLoading } = useQuery({
    queryKey: ['dashboard-subject-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_subject_counts');
      if (error) throw error;
      return data || {};
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="flex flex-col gap-3 relative z-10">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white">Subjects</h2>
        <button
          onClick={onViewAllClick}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
        {SSC_SUBJECTS.map((subject) => {
          const Icon = IconMap[subject.icon] || Sparkles;
          const count = subjectCounts?.[subject.dbKey] || 0;

          return (
            <button
              key={subject.id}
              onClick={() => onSubjectClick(subject.dbKey)}
              className="flex flex-col items-center justify-center p-2.5 sm:p-4 text-center rounded-2xl bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group w-full"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2 mb-0 w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${subject.bgClass} ${subject.textClass} border ${subject.colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-transparent'} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[11px] leading-tight sm:text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {subject.label}
                  </span>
                </div>
              </div>
              <span className="block text-[9px] leading-tight sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {isLoading ? '...' : `${count}+ Qs`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
