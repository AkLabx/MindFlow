
import React from 'react';
import { Trophy, RotateCcw, Home, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import { InitialFilters } from '../../types';
import { motion } from 'framer-motion';

interface FlashcardSummaryProps {
  totalCards: number;
  filters: InitialFilters;
  onRestart: () => void;
  onHome: () => void;
}

export const FlashcardSummary: React.FC<FlashcardSummaryProps> = ({
  totalCards,
  filters,
  onRestart,
  onHome
}) => {
  
  const sourceName = filters.examName.length > 0 ? filters.examName.join(", ") : "Various Sources";
  const difficulty = filters.difficulty.length > 0 ? filters.difficulty.join(", ") : "Mixed Difficulty";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-amber-50/50">
      <motion.div 
        {...({
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 }
        } as any)}
        className="bg-white rounded-3xl shadow-xl border border-amber-100 p-8 max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full opacity-50 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full opacity-50 blur-2xl" />

        <motion.div 
          {...({
              initial: { y: 20, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: 0.2 }
          } as any)}
          className="relative z-10"
        >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Trophy className="w-10 h-10 text-amber-600" />
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-2">Session Complete!</h1>
            <p className="text-gray-500 font-medium mb-8">You've just reviewed an entire deck.</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex flex-col items-center gap-1">
                        <BookOpen className="w-5 h-5 text-amber-500 mb-1" />
                        <span className="text-2xl font-black text-gray-800">{totalCards}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cards</span>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center items-center gap-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-sm font-bold text-gray-800 mt-1 truncate max-w-full px-2">{difficulty}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</span>
                </div>
            </div>

            <div className="text-sm text-gray-400 mb-8 italic">
                "{sourceName}" set completed.
            </div>

            <div className="space-y-3">
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={onRestart}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-200"
                >
                    <RotateCcw className="w-4 h-4 mr-2" /> Review Again
                </Button>
                <Button 
                    fullWidth 
                    variant="ghost" 
                    onClick={onHome}
                    className="text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                    <Home className="w-4 h-4 mr-2" /> Dashboard
                </Button>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
