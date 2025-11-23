
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, CheckCircle, Flag, Star } from 'lucide-react';
import { Question, QuizMode } from '../types';
import { cn } from '../../../utils/cn';

export function QuizNavigationPanel({
  isOpen, onClose, questions, userAnswers, currentQuestionIndex,
  onJumpToQuestion, markedForReview, bookmarks, onSubmitAndReview, mode
}: {
  isOpen: boolean; onClose: () => void; questions: Question[];
  userAnswers: { [key: string]: string }; currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
  markedForReview: string[]; 
  bookmarks: string[];
  onSubmitAndReview: () => void;
  mode: QuizMode;
}) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const chunkSize = 25;

  // Auto-scroll/focus to current group on open
  useEffect(() => {
      if (isOpen) {
          const groupIdx = Math.floor(currentQuestionIndex / chunkSize);
          setOpenGroups(new Set([groupIdx]));
      }
  }, [isOpen, currentQuestionIndex]);

  // Group questions into chunks
  const groups = [];
  for (let i = 0; i < questions.length; i += chunkSize) {
      groups.push(questions.slice(i, i + chunkSize));
  }

  const toggleGroup = (idx: number) => {
    setOpenGroups(prev => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
    });
  };

  // Real-time stats for the header skeleton
  const stats = useMemo(() => {
      let correct = 0;
      let incorrect = 0;
      let answered = 0;
      
      questions.forEach(q => {
          const ans = userAnswers[q.id];
          if (ans) {
              answered++;
              if (ans === q.correct) correct++;
              else incorrect++;
          }
      });
      
      return {
          total: questions.length,
          answered,
          correct,
          incorrect,
          remaining: questions.length - answered
      };
  }, [questions, userAnswers]);

  const getStatusStyles = (q: Question, isCurrent: boolean) => {
      const ans = userAnswers[q.id];
      const isAnswered = !!ans;
      const isCorrect = isAnswered && ans === q.correct;
      
      const baseStyles = "h-10 w-full rounded-lg border text-sm font-bold flex items-center justify-center relative transition-all shadow-sm";
      
      // 1. Answer Status Color
      let statusColor = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"; // Default / Unanswered
      
      if (isAnswered) {
          if (mode === 'mock') {
              // Mock Mode: Just show answered (Gray/Blue), don't reveal correctness
              statusColor = "bg-indigo-100 border-indigo-200 text-indigo-700";
          } else {
              // Learning Mode: Show Correct/Incorrect
              if (isCorrect) {
                  statusColor = "bg-emerald-100 border-emerald-200 text-emerald-700";
              } else {
                  statusColor = "bg-rose-100 border-rose-200 text-rose-700";
              }
          }
      }

      // 2. Current Question Indicator (Ring overrides border visually)
      const currentIndicator = isCurrent ? "ring-2 ring-indigo-600 ring-offset-1 z-10 scale-105" : "";

      return cn(baseStyles, statusColor, currentIndicator);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay - Increased z-index to 70 */}
      <div 
        className={cn(
            "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity duration-300 animate-in fade-in"
        )}
        onClick={onClose}
      />
      
      {/* Drawer - Increased z-index to 80 */}
      <div className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[80] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-200 animate-in slide-in-from-right"
      )}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-gray-900 text-lg">Question Map</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Overview of your progress</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Skeleton / Stats Summary */}
        <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Progress</span>
                <span className="text-xs font-bold text-indigo-600">{stats.answered}/{stats.total} Attempted</span>
            </div>
            
            {mode === 'mock' ? (
                // Mock Mode Stats (Hide Correct/Wrong)
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-indigo-600 leading-none">{stats.answered}</div>
                        <div className="text-[10px] font-bold text-indigo-800/70 uppercase">Done</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-gray-600 leading-none">{stats.remaining}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Left</div>
                    </div>
                </div>
            ) : (
                // Learning Mode Stats
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-emerald-600 leading-none">{stats.correct}</div>
                        <div className="text-[10px] font-bold text-emerald-800/70 uppercase">Correct</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-rose-600 leading-none">{stats.incorrect}</div>
                        <div className="text-[10px] font-bold text-rose-800/70 uppercase">Wrong</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                        <div className="text-lg font-black text-gray-600 leading-none">{stats.remaining}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Left</div>
                    </div>
                </div>
            )}
        </div>

        {/* Scrollable Map */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-2">
                {mode === 'mock' ? (
                    <>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-100 border border-indigo-300 rounded-full"></div> Attempted</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-slate-50 border border-gray-300 rounded-full"></div> Unanswered</div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-full"></div> Correct</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-100 border border-rose-300 rounded-full"></div> Wrong</div>
                    </>
                )}
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-full"></div> Current</div>
                <div className="flex items-center gap-2"><Flag className="w-3 h-3 text-purple-500 fill-current" /> Review</div>
            </div>

            {groups.map((group, i) => {
                const start = i * chunkSize + 1;
                const end = Math.min((i + 1) * chunkSize, questions.length);
                const isOpenGroup = openGroups.has(i);

                return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleGroup(i)}
                            className="w-full flex justify-between items-center p-3 bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
                        >
                            <span>Questions {start}-{end}</span>
                            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpenGroup ? "rotate-180" : "")} />
                        </button>
                        
                        {isOpenGroup && (
                            <div className="p-3 pt-0 grid grid-cols-5 gap-2 bg-white">
                                {group.map((q) => {
                                    const overallIdx = questions.findIndex(qu => qu.id === q.id);
                                    const isReview = markedForReview.includes(q.id);
                                    const isBookmarked = bookmarks.includes(q.id);
                                    const isCurrent = overallIdx === currentQuestionIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                onJumpToQuestion(overallIdx);
                                                // onClose(); // Keep open for rapid navigation
                                            }}
                                            className={getStatusStyles(q, isCurrent)}
                                        >
                                            {overallIdx + 1}
                                            
                                            {/* Status Indicators */}
                                            {isReview && (
                                                <Flag className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-purple-600 fill-purple-100 bg-white rounded-full shadow-sm ring-1 ring-white" />
                                            )}
                                            {isBookmarked && (
                                                <Star className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-amber-400 fill-amber-400 bg-white rounded-full shadow-sm ring-1 ring-white" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-200 bg-white">
            <button 
                onClick={onSubmitAndReview}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
            >
                <CheckCircle className="w-5 h-5" /> Submit Quiz
            </button>
        </div>
      </div>
    </>,
    document.body
  );
}
