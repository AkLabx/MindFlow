import React from 'react';
import { BookA, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { VocabPlanItem } from '../types';

interface VocabBoosterCardProps {
  vocabItems: VocabPlanItem[];
}

export const VocabBoosterCard: React.FC<VocabBoosterCardProps> = ({ vocabItems }) => {
  const navigate = useNavigate();
  const hasItems = vocabItems.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookA className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              English Vocabulary Booster
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tricky Idioms and One Word Substitutions marked for active reinforcement.
          </p>
        </div>

        <button
          onClick={() => navigate(ROUTES.ENGLISH)}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Open English Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasItems ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vocabItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {item.term}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.meaning}
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize shrink-0">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/30">
          <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            All Caught Up on Vocabulary!
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You don't have any tricky vocabulary cards pending. Practice decks in the English Hub to add words to your spaced review.
          </p>
        </div>
      )}
    </div>
  );
};
