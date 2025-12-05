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
 *
 * @param {QuickStartButtonsProps} props - The component props.
 * @returns {JSX.Element} The rendered QuickStartButtons panel.
 */
export const QuickStartButtons: React.FC<QuickStartButtonsProps> = ({ onQuickStart }) => {
  return (
    <div className="bg-indigo-100/50 border border-indigo-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
        <h3 className="font-bold text-indigo-900 text-lg">Quick Start</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
            onClick={() => onQuickStart('Easy')} 
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Easy
        </button>
        <button 
            onClick={() => onQuickStart('Medium')} 
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Moderate
        </button>
        <button 
            onClick={() => onQuickStart('Hard')} 
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Hard
        </button>
        <button 
            onClick={() => onQuickStart('Mix')} 
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold py-3 rounded-lg text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
            Quick 25 Mix Level
        </button>
      </div>
    </div>
  );
};
