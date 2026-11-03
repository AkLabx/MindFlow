import React from 'react';
import { ChevronRight, Landmark, Scale, Globe2, TrendingUp, Atom, Award, Sparkles, FlaskConical, Dna } from 'lucide-react';
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
  FlaskConical,
  Dna,
};

export const SUBJECT_COUNTS_CACHE_KEY = 'mindflow_subject_counts';

export const getInitialSubjectCounts = (): Record<string, number> | undefined => {
  try {
    const raw = localStorage.getItem(SUBJECT_COUNTS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const sanitized: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed)) {
        sanitized[k] = Number(v) || 0;
      }
      return sanitized;
    }
  } catch {
    // Graceful fallback on corrupted storage
  }
  return undefined;
};

export const SubjectStrip: React.FC<SubjectStripProps> = ({ onSubjectClick, onViewAllClick }) => {
  const { data: subjectCounts, isLoading } = useQuery({
    queryKey: ['dashboard-subject-counts'],
    initialData: getInitialSubjectCounts,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_subject_counts');
      if (error) throw error;
      const counts = data || {};
      try {
        localStorage.setItem(SUBJECT_COUNTS_CACHE_KEY, JSON.stringify(counts));
      } catch {}
      return counts;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60,
  });

  return (
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5 flex flex-col gap-3 relative z-10">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">GK / GS Subjects</h2>
        <button
          onClick={onViewAllClick}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Row Horizontal Scroll Grid */}
      <div className="grid grid-rows-2 grid-flow-col auto-cols-[calc(44vw-16px)] sm:auto-cols-[165px] lg:auto-cols-[185px] gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory no-scrollbar">
        {SSC_SUBJECTS.map((subject) => {
          const Icon = IconMap[subject.icon] || Sparkles;
          const count = subjectCounts?.[subject.dbKey] || 0;

          return (
            <button
              key={subject.id}
              onClick={() => onSubjectClick(subject.dbKey)}
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 text-left rounded-xl bg-slate-50/80 dark:bg-slate-800/60 shadow-xs border border-slate-200/90 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600/70 transition-all group snap-start shrink-0 cursor-pointer active:scale-[0.98]"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${subject.bgClass} ${subject.textClass} border ${subject.colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-transparent'} group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {subject.label}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                  {isLoading ? '...' : `${count}+ Qs`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
