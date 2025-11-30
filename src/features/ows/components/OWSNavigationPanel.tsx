
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight, Map } from 'lucide-react';
import { OneWord } from '../../../types/models';
import { cn } from '../../../../utils/cn';

interface OWSNavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: OneWord[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export const OWSNavigationPanel: React.FC<OWSNavigationPanelProps> = ({
  isOpen, onClose, data, currentIndex, onJump
}) => {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const chunkSize = 50;

  // Auto-expand current group on open
  useEffect(() => {
    if (isOpen) {
      const currentGroup = Math.floor(currentIndex / chunkSize);
      setOpenGroups(new Set([currentGroup]));
    }
  }, [isOpen, currentIndex]);

  if (!isOpen) return null;

  const totalChunks = Math.ceil(data.length / chunkSize);

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
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-teal-100 bg-teal-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-teal-900 leading-tight">Word Map</h2>
              <p className="text-xs text-teal-700 font-medium">{data.length} items total</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-teal-200/50 rounded-full text-teal-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-teal-200">
          {Array.from({ length: totalChunks }).map((_, chunkIndex) => {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, data.length);
            const isOpen = openGroups.has(chunkIndex);

            const containsCurrent = currentIndex >= start && currentIndex < end;

            return (
              <div key={chunkIndex} className={cn(
                "border rounded-xl overflow-hidden transition-all duration-200",
                containsCurrent ? "border-teal-300 shadow-sm bg-white" : "border-gray-200 bg-white"
              )}>
                <button
                  onClick={() => toggleGroup(chunkIndex)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-sm font-bold transition-colors",
                    containsCurrent ? "bg-teal-50 text-teal-800" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span>Words {start + 1} - {end}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-teal-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="p-3 grid grid-cols-5 gap-2 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                    {data.slice(start, end).map((item, localIdx) => {
                      const globalIdx = start + localIdx;
                      const isCurrent = globalIdx === currentIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onJump(globalIdx);
                            onClose();
                          }}
                          title={item.content.word}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                            isCurrent
                              ? "bg-teal-500 text-white shadow-md ring-2 ring-teal-300 ring-offset-1 scale-105 z-10"
                              : "bg-gray-50 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-600 hover:text-teal-900"
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
