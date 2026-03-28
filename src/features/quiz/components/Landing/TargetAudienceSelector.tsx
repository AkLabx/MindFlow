import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, ArrowRight } from 'lucide-react';

interface TargetAudienceSelectorProps {
  onSelect: (audience: 'competitive' | 'school') => void;
}

export const TargetAudienceSelector: React.FC<TargetAudienceSelectorProps> = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0F19] flex flex-col justify-center items-center px-6 overflow-y-auto pt-10 pb-10"
    >
      <div className="w-full max-w-md mx-auto space-y-8">

        <div className="text-center space-y-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 font-cabinet tracking-tight">
              Choose Your Journey
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              How are you planning to use MindFlow?
            </p>
          </motion.div>
        </div>

        <div className="space-y-4">
          {/* Competitive Exams Option */}
          <motion.button
            onClick={() => onSelect('competitive')}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 group-hover:border-indigo-400 dark:group-hover:border-indigo-500/50 rounded-2xl p-6 flex items-start gap-5 transition-all duration-300 text-left">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Competitive Exams
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  UPSC, SSC, Banking, NDA, CDS & State PCS. Focus on current affairs, GS, vocabulary, and exam patterns.
                </p>
              </div>
              <div className="flex items-center justify-center h-full">
                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          </motion.button>

          {/* School Students Option */}
          <motion.button
            onClick={() => onSelect('school')}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 group-hover:border-emerald-400 dark:group-hover:border-emerald-500/50 rounded-2xl p-6 flex items-start gap-5 transition-all duration-300 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  School Students
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Classes 1 to 12 (CBSE/NCERT & State Boards). Step-by-step syllabus, interactive learning, and subject mastery.
                </p>
              </div>
              <div className="flex items-center justify-center h-full">
                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
