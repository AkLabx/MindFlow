import React from 'react';
import { cn } from '../../../../utils/cn';
import { Idiom } from '../../../types/models';
import { BookOpen, Lightbulb, Quote, RotateCw } from 'lucide-react';

/**
 * Props for the Flashcard component.
 */
interface FlashcardProps {
  /** The idiom data to display on the card. */
  idiom: Idiom;
  /** The serial number of the card in the current session (1-based). */
  serialNumber: number;
  /** Whether the card is currently showing its back side. */
  isFlipped: boolean;
}

/**
 * A 3D flipping flashcard component.
 *
 * Displays the idiom phrase on the front and detailed meanings/usage on the back.
 * Uses CSS 3D transforms for the flip animation.
 *
 * @param {FlashcardProps} props - The component props.
 * @returns {JSX.Element} The rendered Flashcard.
 */
export const Flashcard: React.FC<FlashcardProps> = ({ idiom, serialNumber, isFlipped }) => {
  return (
    <div
      className="relative w-full h-full perspective-1000 cursor-pointer group"
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-3xl",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">

          {/* Header Decoration */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="absolute top-4 right-4 text-amber-100">
            <RotateCw className="w-6 h-6" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-amber-50/30">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2 shadow-sm">
              <Quote className="w-8 h-8 fill-current" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight drop-shadow-sm font-serif">
              {idiom.content.phrase}
            </h2>

            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-4">
              Tap to Reveal Meaning
            </p>
          </div>

          {/* Footer Tags */}
          <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded-md">{idiom.properties.difficulty}</span>
            <span>#{serialNumber}</span>
            <span>{idiom.sourceInfo.pdfName} | {idiom.sourceInfo.examYear}</span>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">
          {/* Header */}
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
            <h3 className="font-bold text-amber-900 truncate max-w-[80%] font-serif text-lg">{idiom.content.phrase}</h3>
            <div className="text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">

            {/* Meanings */}
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning (English)</p>
                <p className="text-gray-800 font-medium leading-relaxed text-lg">{idiom.content.meanings.english}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-orange-400 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning (Hindi)</p>
                <p className="text-gray-800 font-hindi font-medium text-lg">{idiom.content.meanings.hindi}</p>
              </div>
            </div>

            {/* Usage */}
            <div className="relative pl-4 italic text-gray-600 text-sm md:text-base leading-relaxed">
              <span className="absolute top-0 left-0 text-4xl text-gray-200 font-serif">"</span>
              {idiom.content.usage}
            </div>

            {/* Extras */}
            {(idiom.content.extras.mnemonic || idiom.content.extras.origin) && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span>Memory Aids</span>
                </div>

                {idiom.content.extras.mnemonic && (
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase">Mnemonic: </span>
                    <span className="text-indigo-900 text-sm">{idiom.content.extras.mnemonic}</span>
                  </div>
                )}

                {idiom.content.extras.origin && (
                  <div className="pt-2 border-t border-indigo-100 mt-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Origin: </span>
                    <span className="text-indigo-900 text-sm">{idiom.content.extras.origin}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
