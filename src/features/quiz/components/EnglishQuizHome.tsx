
import React from 'react';
import { ArrowLeft, BookA, PenTool, FileText } from 'lucide-react';
import { Button } from '../../../components/Button/Button';

interface EnglishQuizHomeProps {
  onBack: () => void;
  onVocabClick: () => void;
}

export const EnglishQuizHome: React.FC<EnglishQuizHomeProps> = ({ onBack, onVocabClick }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-10 relative z-10">
        
        {/* Navigation */}
        <div className="w-full max-w-6xl mx-auto px-4">
           <Button 
              variant="ghost" 
              onClick={onBack} 
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
           >
             <ArrowLeft className="w-4 h-4" /> Back to Dashboard
           </Button>
        </div>

        {/* Header */}
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            English <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Proficiency</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master vocabulary, grammar, and comprehension with targeted quizzes designed for competitive exams.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto px-4">
          
          {/* Card 1: Vocab */}
          <div 
            onClick={onVocabClick}
            className="bg-white p-8 rounded-3xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#10b981,0px_20px_30px_rgba(16,185,129,0.3)] hover:border-emerald-300"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-emerald-100 group-hover:shadow-emerald-200">
              <BookA className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">Vocab Quiz</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
              Idioms, One-word substitutions, Synonyms, and Antonyms.
            </p>
          </div>

          {/* Card 2: Grammar */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#8b5cf6,0px_20px_30px_rgba(139,92,246,0.3)] hover:border-violet-300">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-violet-100 group-hover:shadow-violet-200">
              <PenTool className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-violet-700 transition-colors">Grammar Quiz</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
              Test your grammar skills with error detection and sentence improvement.
            </p>
          </div>

          {/* Card 3: Mock */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 cursor-pointer group relative z-20 transition-all duration-300 ease-out hover:-translate-y-2 shadow-[12px_2px_0px_0px_#e2e8f0,0px_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[12px_2px_0px_0px_#f43f5e,0px_20px_30px_rgba(244,63,94,0.3)] hover:border-rose-300">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-rose-100 group-hover:shadow-rose-200">
              <FileText className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-rose-700 transition-colors">English Mock</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600">
              Full length mock test with 25-30 questions. (Coming Soon)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
