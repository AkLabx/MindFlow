import React from 'react';
import { SynonymWord } from '../../quiz/types';
import { useSynonymProgress } from '../hooks/useSynonymProgress';
import { cn } from '../../../utils/cn';

interface SynonymCardProps {
  data: SynonymWord;
  serialNumber: number;
  isFlipped: boolean;
}

export const SynonymCard: React.FC<SynonymCardProps> = ({ data, serialNumber, isFlipped }) => {
  const { markMastered, getStatus } = useSynonymProgress();
  const status = getStatus(data);

  return (
    <div className={cn(
      "relative w-full h-full transition-transform duration-500 transform-style-3d",
      isFlipped ? 'rotate-y-180' : ''
    )}>

      {/* FRONT OF CARD */}
      <div className={cn(
        "absolute inset-0 w-full h-full backface-hidden rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center",
        status === 'mastered'
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      )}>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {data.importance_score > 10 && <span className="text-2xl" title="High Frequency">🔥</span>}
          {data.importance_score >= 5 && data.importance_score <= 10 && <span className="text-xl" title="Medium Frequency">⭐</span>}
        </div>

        {status === 'familiar' && (
          <div className="absolute top-4 left-4 flex items-center gap-1 text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md text-sm">
            🟡 Familiar
          </div>
        )}
        {status === 'mastered' && (
          <div className="absolute top-4 left-4 flex items-center gap-1 text-green-600 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md text-sm">
            🟢 Mastered
          </div>
        )}

        <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          {data.word}
        </h2>

        {data.pos && (
          <span className="text-lg text-gray-500 dark:text-gray-400 italic mb-4">
            {data.pos}
          </span>
        )}

        <div className="absolute bottom-6 font-mono text-gray-300 dark:text-gray-600 font-bold text-sm select-none pointer-events-none">
           #{serialNumber}
        </div>
      </div>

      {/* BACK OF CARD */}
      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 z-50">

        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">{data.word}</h3>
          <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-3">{data.hindiMeaning}</p>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{data.meaning}</p>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Top Synonyms</h4>
          <ul className="space-y-3">
            {data.synonyms?.map((syn, idx) => (
              <li key={idx} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                <span className="font-bold text-gray-800 dark:text-gray-200 mr-2">{syn.text}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">({syn.hindiMeaning})</span>
              </li>
            ))}
          </ul>

          {data.confusable_with && data.confusable_with.length > 0 && (
            <div className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
              <span className="text-orange-800 dark:text-orange-300 text-sm font-medium">
                ⚠️ Confusable with: <strong>{data.confusable_with.join(', ')}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons on Back */}
        <div className="mt-6 flex justify-center pt-4 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          {status !== 'mastered' ? (
            <button
              onClick={() => {
                markMastered(data);
              }}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 w-full justify-center"
            >
              ✓ Mark as Mastered
            </button>
          ) : (
            <div className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 py-3 w-full border-2 border-green-200 dark:border-green-800 rounded-full">
              🟢 Mastered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
