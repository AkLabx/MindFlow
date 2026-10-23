import React, { useEffect, useState } from "react";
import { ChevronRight, ListTree, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { QuizProgressStatus } from "@/features/quiz/services/quizProgressService";

interface TopicCardProps {
  topic: string;
  subTopics: string[];
  counts?: Record<string, number>;
  statuses?: Record<string, QuizProgressStatus>;
  onClick: () => void;
  onSubTopicClick?: (subTopic: string, e: React.MouseEvent) => void;
}

const AnimatedCount: React.FC<{ target: number }> = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const incrementTime = 30; // ms
    const steps = duration / incrementTime;
    const increment = Math.max(1, Math.floor(target / steps));

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}Q</span>;
};

const StatusBadge: React.FC<{ status?: QuizProgressStatus }> = ({ status }) => {
  const baseClasses = "flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider min-w-[90px] text-center";

  if (!status || status === "NOT_STARTED") {
    return (
      <span className={`${baseClasses} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`}>
        <PlayCircle className="w-3 h-3" />
        Start
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span className={`${baseClasses} bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Resume
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className={`${baseClasses} bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Completed
      </span>
    );
  }

  return null;
};

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  subTopics,
  counts,
  statuses,
  onClick,
  onSubTopicClick,
}) => {
  return (
    <Card className="group flex flex-col gap-4 p-4 sm:p-5 border border-black/10 dark:border-white/10 dark:bg-slate-900 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] rounded-2xl w-full">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ListTree className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {topic}
          </h3>
        </div>
      </div>

      {subTopics.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          {subTopics.map((sub) => {
            const hasCount = counts && counts[sub] !== undefined;
            const countVal = hasCount ? counts[sub] : null;
            const status = statuses?.[sub];

            return (
              <button
                key={sub}
                onClick={(e) => onSubTopicClick?.(sub, e)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-900/20 dark:border-slate-100/20 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-600/30 dark:hover:border-indigo-400/30 hover:shadow-sm transition-all text-left min-h-[52px]"
              >
                <span className="text-sm font-semibold break-words whitespace-normal flex-grow min-w-0">{sub}</span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full min-w-[36px] text-center">
                    {!hasCount ? (
                      <span className="inline-flex gap-1 justify-center">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                      </span>
                    ) : countVal! > 0 ? (
                      <AnimatedCount target={countVal!} />
                    ) : (
                      <span>0Q</span>
                    )}
                  </span>

                  {status && <StatusBadge status={status} />}

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
};
