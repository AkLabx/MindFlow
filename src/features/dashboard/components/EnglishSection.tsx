import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Languages, BookOpen, FileText, Sparkles, ShieldAlert, Link2, Zap } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface EnglishSectionProps {
  onOpenHub?: () => void;
}

export const EnglishSection: React.FC<EnglishSectionProps> = ({ onOpenHub }) => {
  const navigate = useNavigate();

  const handleOpenHub = () => {
    if (onOpenHub) {
      onOpenHub();
    } else {
      navigate(ROUTES.ENGLISH);
    }
  };

  const pillars = [
    {
      id: 'synonyms',
      title: 'Synonyms & Antonyms',
      shortTitle: 'Synonyms',
      count: '1,200+ Words',
      badge: 'Word Clusters',
      icon: Languages,
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderClass: 'border-indigo-100 dark:border-indigo-900/60',
      route: `${ROUTES.ENGLISH}?tab=vocabsynonyms`,
    },
    {
      id: 'ows',
      title: 'One Word Substitution',
      shortTitle: 'One Word (OWS)',
      count: '900+ Terms',
      badge: 'High-Yield PYQ',
      icon: FileText,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-100 dark:border-emerald-900/60',
      route: `${ROUTES.ENGLISH}?tab=vocabows`,
    },
    {
      id: 'idioms',
      title: 'Idioms & Phrases',
      shortTitle: 'Idioms & Phrases',
      count: '850+ Phrases',
      badge: 'Repeated PYQ',
      icon: BookOpen,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-100 dark:border-amber-900/60',
      route: `${ROUTES.ENGLISH}?tab=vocabidiom`,
    },
  ];

  const games = [
    {
      id: 'imposter',
      label: 'The Imposter Trap',
      icon: ShieldAlert,
      iconColor: 'text-rose-500',
      route: '/vocab/synonyms/quiz?mode=imposter',
    },
    {
      id: 'connect',
      label: 'Tap & Connect',
      icon: Link2,
      iconColor: 'text-violet-500',
      route: '/vocab/synonyms/quiz?mode=connect',
    },
    {
      id: 'speed',
      label: 'Speed Match',
      icon: Zap,
      iconColor: 'text-amber-500',
      route: '/vocab/synonyms/quiz?mode=speed',
    },
  ];

  return (
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none p-3.5 sm:p-4.5 flex flex-col gap-3 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            English & Vocabulary
          </h2>
        </div>
        <button
          onClick={handleOpenHub}
          className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          Open Hub <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Core Pillar Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <button
              key={pillar.id}
              onClick={() => navigate(pillar.route)}
              className="flex flex-col items-start justify-between p-2.5 sm:p-3.5 text-left rounded-xl bg-slate-50/80 dark:bg-slate-800/60 shadow-xs border border-slate-200/90 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600/70 transition-all group cursor-pointer active:scale-[0.98] min-h-[95px] sm:min-h-[110px]"
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${pillar.bgClass} ${pillar.colorClass} border ${pillar.borderClass} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {pillar.badge}
                </span>
              </div>
              <div className="flex flex-col min-w-0 w-full mt-2">
                <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {pillar.shortTitle}
                </span>
                <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                  {pillar.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Micro-Bar: Quick Vocab Booster Games */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/70 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Games:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {games.map((game) => {
            const GameIcon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => navigate(game.route)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-600/70 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer active:scale-95"
              >
                <GameIcon className={`w-3 h-3 ${game.iconColor}`} />
                <span>{game.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
