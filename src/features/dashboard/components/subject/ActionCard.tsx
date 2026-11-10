import React from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { triggerHaptic } from "@/lib/haptics";

interface ActionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
}) => {
  const handlePress = () => {
    triggerHaptic("light");
    onClick();
  };

  return (
    <Card
      onClick={handlePress}
      className="group cursor-pointer flex items-center justify-between p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] active:bg-slate-100/80 dark:active:bg-slate-800/90 transition-all w-full select-none touch-manipulation"
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 group-active:scale-95 transition-transform">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-active:translate-x-0.5 transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Card>
  );
};
