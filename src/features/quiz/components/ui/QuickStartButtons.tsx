import React from 'react';
import { Zap } from 'lucide-react';

/**
 * Props for the QuickStartButtons component.
 */
interface QuickStartButtonsProps {
  /** Callback executed when a quick start button is clicked, passing the selected difficulty. */
  onQuickStart: (type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => void;
}

/**
 * A panel of buttons for launching pre-configured quizzes instantly.
 *
 * Provides shortcuts for "Quick 25" quizzes of varying difficulty levels.
 */
export const QuickStartButtons: React.FC<QuickStartButtonsProps> = React.memo(({ onQuickStart }) => {
  return (
    <div className="bg-indigo-100/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">Quick Start</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
            onClick={() => onQuickStart('Easy')} 
            className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-indigo-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Easy
        </button>
        <button 
            onClick={() => onQuickStart('Medium')} 
            className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-indigo-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Moderate
        </button>
        <button 
            onClick={() => onQuickStart('Hard')} 
            className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-indigo-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Hard
        </button>
        <button 
            onClick={() => onQuickStart('Mix')} 
            className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-indigo-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Mix Level
        </button>
      </div>
    </div>
  );
});
