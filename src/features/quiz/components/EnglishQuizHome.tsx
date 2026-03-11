import React from 'react';
import { ArrowLeft, BookA, PenTool, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/Button/Button';

interface EnglishQuizHomeProps {
  onBack: () => void;
  onVocabClick: () => void;
}

/**
 * A dedicated landing page for the English Subject Zone.
 *
 * Provides navigation to:
 * - Vocabulary Quizzes (Idioms, OWS, etc.)
 * - Grammar Quizzes (Placeholder for future)
 * - Mock Tests (Placeholder for future)
 *
 * @param {EnglishQuizHomeProps} props - The component props.
 * @returns {JSX.Element} The rendered English Zone home screen.
 */
export const EnglishQuizHome: React.FC<EnglishQuizHomeProps> = ({ onBack, onVocabClick }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-10 relative z-10">
        
        {/* Navigation Bar */}
        <div className="w-full max-w-6xl mx-auto px-4">
           <Button 
              variant="ghost" 
              onClick={onBack} 
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2 transition-colors"
           >
             <ArrowLeft className="w-4 h-4" /> Back to Dashboard
           </Button>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 transition-colors">
            English <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Proficiency</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
            Master vocabulary, grammar, and comprehension with targeted quizzes designed for competitive exams.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-4">

          {/* Card 1: Vocab Quiz */}
          <div 
            onClick={onVocabClick}
            className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500"
          >
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    <BookA className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Vocab Quiz</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        Idioms, One-word substitutions, Synonyms, and Antonyms.
                    </p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 dark:text-emerald-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
          {/* Card 2: Grammar Quiz */}
          <div
            onClick={undefined}
            className="bg-violet-50 dark:bg-violet-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-violet-100 dark:border-violet-900/40 border-b-4 border-b-violet-200 dark:border-b-violet-700 hover:border-violet-300 dark:hover:border-violet-500"
          >
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    <PenTool className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Grammar Quiz</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        Test your grammar skills with error detection and sentence improvement.
                    </p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-violet-400 dark:text-violet-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
          {/* Card 3: Mock Test */}
          <div
            onClick={undefined}
            className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500"
          >
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">English Mock</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        Full length mock test with 25-30 questions. (Coming Soon)
                    </p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 dark:text-rose-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
