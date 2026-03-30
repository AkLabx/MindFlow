import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Book } from 'lucide-react';
import { IdiomsSVG, OwsSVG, SynonymsSVG } from './DashboardSVGs';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2 } from 'lucide-react';

interface VocabQuizHomeProps {
  onBack: () => void;
  onIdiomsClick: () => void;
  onOWSClick: () => void;
  onSynonymsClick?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

export const VocabQuizHome: React.FC<VocabQuizHomeProps> = ({ onBack, onIdiomsClick, onOWSClick, onSynonymsClick }) => {
  const { loadingId, handleNavigation } = useNavSpinner();

  const items = [
    {
      id: 'idioms',
      title: "Idioms & Phrases",
      description: "Master common expressions and hidden meanings.",
      SvgComponent: IdiomsSVG,
      colorTheme: 'amber',
      action: onIdiomsClick
    },
    {
      id: 'ows',
      title: "One Word Substitution",
      description: "Learn single words replacing entire phrases.",
      SvgComponent: OwsSVG,
      colorTheme: 'purple',
      action: onOWSClick
    },
    {
      id: 'synonyms',
      title: "Synonyms & Antonyms Master",
      description: "Master words through grouped clusters.",
      SvgComponent: SynonymsSVG,
      colorTheme: 'emerald',
      action: onSynonymsClick,
      badgeText: "New"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
      <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full">
        {/* Header Section */}
        <header className="relative text-left w-full mt-2 max-w-7xl mx-auto flex flex-col gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
            Back to English Zone
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                Vocabulary Master
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                Expand your word power.
              </p>
            </div>
          </div>
        </header>

        {/* Cards Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20 mt-4">
          {items.map((item) => {
            // Determine colors dynamically based on the theme
            let borderHover = '';
            let borderBottom = '';
            let glowColor = '';
            let textGradient = '';

            switch (item.colorTheme) {
              case 'amber':
                borderHover = 'group-hover:border-amber-300 dark:group-hover:border-amber-500';
                borderBottom = 'border-b-amber-200/50 dark:border-b-amber-700/50';
                glowColor = 'bg-amber-500';
                textGradient = 'from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100';
                break;
              case 'purple':
                borderHover = 'group-hover:border-purple-300 dark:group-hover:border-purple-500';
                borderBottom = 'border-b-purple-200/50 dark:border-b-purple-700/50';
                glowColor = 'bg-purple-500';
                textGradient = 'from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100';
                break;
              case 'emerald':
                borderHover = 'group-hover:border-emerald-300 dark:group-hover:border-emerald-500';
                borderBottom = 'border-b-emerald-200/50 dark:border-b-emerald-700/50';
                glowColor = 'bg-emerald-500';
                textGradient = 'from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100';
                break;
            }

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation(item.id, item.action || (() => {}))}
                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
              >
                {/* Glow Background Layer */}
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                {/* Interactive Inner Shadow / Border */}
                <div className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] ${borderBottom} ${borderHover}`}></div>

                {/* Centered Subtle Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 ${glowColor}`}></div>

                {loadingId === item.id ? (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                    <Loader2 className={`w-8 h-8 text-${item.colorTheme}-500 animate-spin drop-shadow-md`} />
                  </div>
                ) : null}

                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === item.id ? 'opacity-0' : 'opacity-100'}`}>

                  {item.badgeText && (
                    <div className="absolute top-4 right-4 z-30">
                       <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                           {item.badgeText}
                       </span>
                    </div>
                  )}

                  {/* SVG Container */}
                  <motion.div
                    className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <item.SvgComponent />
                  </motion.div>

                  {/* Text Area */}
                  <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                    <h3 className={`text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r ${textGradient} mb-1 sm:mb-2`}>
                      {item.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
