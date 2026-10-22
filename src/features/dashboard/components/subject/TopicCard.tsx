import React from 'react';
import { ChevronRight, ListTree } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface TopicCardProps {
  topic: string;
  subTopics: string[];
  onClick: () => void;
  onSubTopicClick?: (subTopic: string, e: React.MouseEvent) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, subTopics, onClick, onSubTopicClick }) => {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer flex flex-col gap-3 p-4 sm:p-5 border border-black/10 dark:border-white/10 dark:bg-slate-900 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all w-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
             <ListTree className="w-5 h-5" />
           </div>
           <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
             {topic}
           </h3>
        </div>
        <div className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {subTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {subTopics.slice(0, 5).map(sub => (
            <span
              key={sub}
              onClick={(e) => onSubTopicClick?.(sub, e)}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {sub}
            </span>
          ))}
          {subTopics.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              +{subTopics.length - 5} more
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
