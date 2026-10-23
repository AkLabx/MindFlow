import React from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer flex items-center justify-between p-4 sm:p-5 border border-black/10 dark:border-white/10 dark:bg-slate-900 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all w-full"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
        <ChevronRight className="w-6 h-6" />
      </div>
    </Card>
  );
};
