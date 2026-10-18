import React from 'react';
import { ChevronRight, Landmark, Scale, Globe2, TrendingUp, Atom, Award, Sparkles } from 'lucide-react';
import { SSC_SUBJECTS } from '../constants/sscDashboardConfig';

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

      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
          {SSC_SUBJECTS.map((subject) => {
            const Icon = IconMap[subject.icon] || Sparkles;
            return (
              <button
                key={subject.id}
                onClick={() => onSubjectClick(subject.dbKey)}
                className="flex flex-col items-center gap-2 group active:scale-95 transition-transform duration-150"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${subject.bgClass} ${subject.textClass} border ${subject.colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-transparent'} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                  {subject.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
