import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  X,
  Play,
  SlidersHorizontal,
  Target,
  BookOpen,
  Timer,
  Clock,
  Sparkles,
  Flame,
  Brain,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/Button/Button';
import { telemetry } from '@/lib/telemetry/index';
import { triggerHaptic } from '@/lib/haptics';

export interface DashboardDrillInfo {
  type: 'targeted_drill' | 'daily_pyq' | 'important_topic' | 'exam_quick_drill';
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: 'purple' | 'blue' | 'rose' | 'amber' | 'emerald';
  examShortCode?: string;
  examDisplayName?: string;
  description: string;
  subject?: string;
  topics?: string[];
  tags?: string[];
  defaultQuestionCount: number;
  defaultMode: 'learning' | 'mock';
  filters: Record<string, any>;
  fixedSubjectContext?: boolean;
}

export interface DashboardDrillBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  drillInfo: DashboardDrillInfo | null;
  onStartDrill: (filters: Record<string, any>, mode: 'learning' | 'mock', count: number) => void;
  onCustomizeFilters: (filters: Record<string, any>, mode: 'learning' | 'mock', count: number) => void;
}

const QUESTION_COUNT_OPTIONS = [10, 15, 20, 25];

export const DashboardDrillBottomSheet: React.FC<DashboardDrillBottomSheetProps> = ({
  isOpen,
  onClose,
  drillInfo,
  onStartDrill,
  onCustomizeFilters,
}) => {
  const [selectedMode, setSelectedMode] = useState<'learning' | 'mock'>('learning');
  const [selectedCount, setSelectedCount] = useState<number>(10);

  // Sync state whenever drillInfo changes
  useEffect(() => {
    if (drillInfo) {
      setSelectedMode(drillInfo.defaultMode || 'learning');
      setSelectedCount(drillInfo.defaultQuestionCount || 10);
    }
  }, [drillInfo]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  // Capacitor Android Hardware Back Button listener
  useEffect(() => {
    if (!isOpen) return;

    let backHandler: any;
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', () => {
        onClose();
      }).then((handle) => {
        backHandler = handle;
      });
    }

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [isOpen, onClose]);

  // Telemetry when sheet is opened
  useEffect(() => {
    if (isOpen && drillInfo) {
      telemetry.emit('dashboard_drill_sheet_opened', {
        drillType: drillInfo.type,
        drillTitle: drillInfo.title,
        exam: drillInfo.examShortCode,
      });
    }
  }, [isOpen, drillInfo]);

  const estimatedMinutes = useMemo(() => {
    // Approx 45-50 seconds per question for practice drills
    return Math.max(5, Math.round((selectedCount * 48) / 60));
  }, [selectedCount]);

  if (!drillInfo) return null;

  const getBadgeStyle = () => {
    switch (drillInfo.badgeVariant) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'amber':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'purple':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'blue':
      default:
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
  };

  const getTypeIcon = () => {
    switch (drillInfo.type) {
      case 'targeted_drill':
        return <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'daily_pyq':
        return <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'important_topic':
        return <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'exam_quick_drill':
      default:
        return <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const handleStart = () => {
    triggerHaptic('medium');
    telemetry.emit('dashboard_drill_started', {
      drillType: drillInfo.type,
      drillTitle: drillInfo.title,
      mode: selectedMode,
      questionCount: selectedCount,
    });
    onStartDrill(drillInfo.filters, selectedMode, selectedCount);
  };

  const handleCustomize = () => {
    triggerHaptic('light');
    telemetry.emit('dashboard_drill_customize_clicked', {
      drillType: drillInfo.type,
      drillTitle: drillInfo.title,
      mode: selectedMode,
      questionCount: selectedCount,
    });
    onCustomizeFilters(drillInfo.filters, selectedMode, selectedCount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Bottom Sheet Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-sheet-title"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* Grab / Drag Bar (Mobile visual cue) */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-3.5 sm:hidden" />

            {/* Header: Badges & Close Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type & Category Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${getBadgeStyle()}`}
                >
                  {getTypeIcon()}
                  <span>{drillInfo.badgeLabel || 'Practice Drill'}</span>
                </div>

                {/* Target Exam Badge */}
                {drillInfo.examShortCode && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{drillInfo.examShortCode}</span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                aria-label="Close dialog"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1 -mt-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none touch-manipulation active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drill Title & Subtitle */}
            <div className="mt-2.5">
              <h2
                id="drill-sheet-title"
                className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight"
              >
                {drillInfo.title}
              </h2>
              {drillInfo.subtitle && (
                <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {drillInfo.subtitle}
                </p>
              )}
            </div>

            {/* Explanatory Info Card: Tells user which button is doing what */}
            <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                  About this practice session
                </span>
                {drillInfo.description}
              </div>
            </div>

            {/* Interactive Mode Selector: Learning vs Mock */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Quiz Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Learning Mode */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedMode('learning');
                  }}
                  className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                    selectedMode === 'learning'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen
                        className={`w-4 h-4 ${
                          selectedMode === 'learning'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Learning
                      </span>
                    </div>
                    {selectedMode === 'learning' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Instant answer & AI solution after each question.
                  </span>
                </button>

                {/* Mock Mode */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedMode('mock');
                  }}
                  className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer select-none touch-manipulation active:scale-[0.98] ${
                    selectedMode === 'mock'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <Timer
                        className={`w-4 h-4 ${
                          selectedMode === 'mock'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Mock Exam
                      </span>
                    </div>
                    {selectedMode === 'mock' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Timed exam simulation. Score & detailed review at the end.
                  </span>
                </button>
              </div>
            </div>

            {/* Question Count Selector & Estimated Time */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Questions to Practice
                </label>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Est. ~{estimatedMinutes} mins</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {QUESTION_COUNT_OPTIONS.map((count) => {
                  const isSelected = selectedCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCount(count);
                      }}
                      className={`min-h-[44px] py-2 px-1 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex flex-col items-center justify-center select-none touch-manipulation active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      <span>{count} Qs</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2.5">
              {/* Primary Action: Launch Quiz */}
              <button
                type="button"
                onClick={handleStart}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer select-none touch-manipulation"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  Start {selectedMode === 'mock' ? 'Mock Test' : 'Practice Drill'} ({selectedCount} Qs)
                </span>
              </button>

              {/* Secondary Actions Row: Customize or Cancel */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCustomize}
                  className="min-h-[44px] py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation active:scale-[0.98]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Customize Filters</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="min-h-[44px] py-2 px-3 rounded-xl border border-transparent bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold text-xs sm:text-sm hover:bg-slate-200/80 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation active:scale-[0.98]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
