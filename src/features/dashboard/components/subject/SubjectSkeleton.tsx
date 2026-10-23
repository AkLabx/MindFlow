import React from "react";
import { Card } from "@/components/ui/Card";

export const SubjectSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={i}
          className="p-4 sm:p-5 border border-black/5 dark:border-white/5 dark:bg-slate-900 rounded-2xl w-full"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
