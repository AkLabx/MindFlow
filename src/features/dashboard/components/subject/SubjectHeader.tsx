import React from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
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
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleBack}
        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </button>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${subjectConfig.bgClass} ${subjectConfig.textClass}`}
      >
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
        {subjectConfig.label}
      </h1>
    </div>
  );
};
