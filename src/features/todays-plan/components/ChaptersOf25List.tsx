import React from 'react';
import { BookOpen, CheckCircle, Lock, Play, Layers } from 'lucide-react';
import { PlanChapter } from '../types';

interface ChaptersOf25ListProps {
  chapters: PlanChapter[];
  onStartChapter: (chapter: PlanChapter, mode: 'learning' | 'mock') => void;
  isLaunching: boolean;
}

export const ChaptersOf25List: React.FC<ChaptersOf25ListProps> = ({
  chapters,
  onStartChapter,
  isLaunching
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chapters of 25 (Mastery Syllabus)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Split into bite-sized parts of 25 questions. Use <strong>Read</strong> for study & instant explanations, or <strong>Test</strong> to check your exam recall.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {chapters.map((chap) => {
          const progressPercent = Math.min(100, Math.round((chap.masteredCount / chap.totalQuestions) * 100));
          const isComplete = progressPercent === 100;

          return (
            <div
              key={chap.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                chap.isUnlocked
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                  : 'bg-slate-100/50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : chap.isUnlocked
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isComplete ? <CheckCircle className="w-4 h-4" /> : chap.chapterNumber}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {chap.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{chap.subject}</span>
                      <span>•</span>
                      <span>{chap.totalQuestions} Questions</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {chap.masteredCount} Mastered ({progressPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {chap.isUnlocked ? (
                    <>
                      <button
                        onClick={() => onStartChapter(chap, 'learning')}
                        disabled={isLaunching}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Read</span>
                      </button>

                      <button
                        onClick={() => onStartChapter(chap, 'mock')}
                        disabled={isLaunching}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Test</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Complete Part {chap.chapterNumber - 1} first</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
