import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight, Map } from 'lucide-react';
import { Idiom } from '../../../types/models';
import { cn } from '../../../../utils/cn';

/**
 * Props for the FlashcardNavigationPanel component.
 */
interface FlashcardNavigationPanelProps {
  /** Whether the panel is open (visible). */
  isOpen: boolean;
  /** Callback to close the panel. */
  onClose: () => void;
  /** The full list of idioms being studied. */
  idioms: Idiom[];
  /** The index of the currently displayed idiom. */
  currentIndex: number;
  /** Callback to jump to a specific idiom index. */
  onJump: (index: number) => void;
}

/**
 * A side drawer navigation panel for the Flashcard session.
 *
 * Allows users to:
 * - See an overview of all idioms grouped in chunks.
 * - Jump directly to a specific idiom number.
 * - Visualize their current position within the session.
 *
 * Renders as a Portal to overlay the entire application.
 *
 * @param {FlashcardNavigationPanelProps} props - The component props.
 * @returns {JSX.Element | null} The rendered panel or null if closed.
 */
export const FlashcardNavigationPanel: React.FC<FlashcardNavigationPanelProps> = ({
  isOpen, onClose, idioms, currentIndex, onJump
}) => {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const chunkSize = 50;

  // Auto-expand current group on open to show the active question
  useEffect(() => {
    if (isOpen) {
      const currentGroup = Math.floor(currentIndex / chunkSize);
      setOpenGroups(new Set([currentGroup]));
    }
  }, [isOpen, currentIndex]);

  if (!isOpen) return null;

  const totalChunks = Math.ceil(idioms.length / chunkSize);

  /** Toggles the expansion state of a chunk group. */
  const toggleGroup = (index: number) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return createPortal(
    <>
      {/* Overlay - click to close */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-amber-900 leading-tight">Idiom Map</h2>
              <p className="text-xs text-amber-700 font-medium">{idioms.length} items total</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200/50 rounded-full text-amber-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List - Grouped Idioms */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-amber-200">
          {Array.from({ length: totalChunks }).map((_, chunkIndex) => {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, idioms.length);
            const isOpen = openGroups.has(chunkIndex);

            // Check if current idiom is in this chunk for styling emphasis
            const containsCurrent = currentIndex >= start && currentIndex < end;

            return (
              <div key={chunkIndex} className={cn(
                "border rounded-xl overflow-hidden transition-all duration-200",
                containsCurrent ? "border-amber-300 shadow-sm bg-white" : "border-gray-200 bg-white"
              )}>
                <button
                  onClick={() => toggleGroup(chunkIndex)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-sm font-bold transition-colors",
                    containsCurrent ? "bg-amber-50 text-amber-800" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span>Idioms {start + 1} - {end}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="p-3 grid grid-cols-5 gap-2 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                    {idioms.slice(start, end).map((idiom, localIdx) => {
                      const globalIdx = start + localIdx;
                      const isCurrent = globalIdx === currentIndex;

                      return (
                        <button
                          key={idiom.id}
                          onClick={() => {
                            onJump(globalIdx);
                            onClose();
                          }}
                          title={idiom.content.phrase}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                            isCurrent
                              ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-300 ring-offset-1 scale-105 z-10"
                              : "bg-gray-50 border border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600 hover:text-amber-900"
                          )}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
};
