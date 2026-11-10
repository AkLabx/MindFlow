import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { triggerHaptic } from "@/lib/haptics";
import { SSC_SUBJECTS } from "../../constants/sscDashboardConfig";
import {
  Landmark,
  Scale,
  Globe2,
  TrendingUp,
  Atom,
  Award,
  FlaskConical,
  Dna,
} from "lucide-react";

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

interface SubjectHeaderProps {
  subjectName: string;
  onBack?: () => void;
}

export const SubjectHeader: React.FC<SubjectHeaderProps> = ({
  subjectName,
  onBack,
}) => {
  const navigate = useNavigate();

  // Find subject config or use fallback
  const subjectConfig = SSC_SUBJECTS.find((s) => s.dbKey === subjectName) || {
    label: subjectName,
    icon: "Sparkles",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-600",
  };

  const Icon = IconMap[subjectConfig.icon] || Sparkles;

  const handleBack = () => {
    triggerHaptic("light");
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <header className="sticky top-0 z-30 -mx-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2.5 sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0 bg-[#EEF2FF]/90 dark:bg-slate-950/90 sm:bg-transparent sm:dark:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-b border-slate-200/70 dark:border-slate-800/70 sm:border-none flex items-center gap-3 select-none">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="min-w-[44px] min-h-[44px] -ml-1 flex items-center justify-center rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800/70 active:bg-slate-200 dark:active:bg-slate-800 active:scale-90 transition-all cursor-pointer touch-manipulation"
      >
        <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-slate-200" />
      </button>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${subjectConfig.bgClass} ${subjectConfig.textClass}`}
      >
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
        {subjectConfig.label}
      </h1>
    </header>
  );
};
