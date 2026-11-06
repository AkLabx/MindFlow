import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Brain,
  Target,
  Flame,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useVulnerabilityEngine } from '../hooks/useVulnerabilityEngine';
import { telemetry } from '../../../lib/telemetry/index';

interface AIAdaptiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AdaptiveDrillMode = 'weakness' | 'pyq' | 'diagnostic';

export const AIAdaptiveQuizModal: React.FC<AIAdaptiveQuizModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    activeExam,
    primaryVulnerability,
    hasMistakeData,
  } = useVulnerabilityEngine();

  const [selectedMode, setSelectedMode] = useState<AdaptiveDrillMode>('weakness');
  const [questionCount, setQuestionCount] = useState<number>(15);

  if (!isOpen) return null;

  const handleLaunch = () => {
    let drillFilters: any = {
      examName: activeExam.dbExamNames,
      subject: [],
      topic: [],
      tags: [],
    };

    if (selectedMode === 'weakness') {
      if (primaryVulnerability && !primaryVulnerability.isDiagnostic) {
        drillFilters.subject = [primaryVulnerability.subject];
        drillFilters.topic = [primaryVulnerability.topic];
      } else {
        drillFilters.tags = ['PYQ'];
      }
    } else if (selectedMode === 'pyq') {
      drillFilters.tags = ['PYQ'];
    }

    telemetry.emit('ai_drill_launched', {
      examId: activeExam.id,
      topic: selectedMode === 'weakness' && primaryVulnerability ? primaryVulnerability.topic : 'Adaptive Mix',
      mode: 'learning',
      isDiagnostic: selectedMode === 'diagnostic' || (selectedMode === 'weakness' && !hasMistakeData),
    });

    telemetry.emit('quiz_generated', {
      examId: activeExam.id,
      mode: 'learning',
      count: questionCount,
      durationMs: 12,
      reusedSession: false,
    });

    onClose();

    navigate('/quiz/config', {
      state: {
        initialFilters: {
          subject: drillFilters.subject || [],
          topic: drillFilters.topic || [],
          subTopic: [],
          difficulty: [],
          questionType: [],
          examName: drillFilters.examName || activeExam.dbExamNames,
          examYear: [],
          examDateShift: [],
          tags: drillFilters.tags || [],
        },
        initialMode: 'learning',
        autoStart: true,
        returnTo: '/ai',
        from: '/ai',
        fixedExamContext: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Adaptive Quiz
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold uppercase tracking-wide">
                  Intelligence
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized drills generated for your target exam
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Active Target Exam Pill */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Target Exam: {activeExam.displayName}</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-200 font-bold uppercase text-[10px]">
              {activeExam.shortCode}
            </span>
          </div>

          {/* Drill Strategy Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Practice Strategy
            </label>

            {/* Option 1: Weak Topic Sprint */}
            <div
              onClick={() => setSelectedMode('weakness')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedMode === 'weakness'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Target Weak Areas (Adaptive)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 shrink-0">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {hasMistakeData && primaryVulnerability
                    ? `Focuses on ${primaryVulnerability.topic} (${primaryVulnerability.errorCount} mistakes detected).`
                    : `Baseline diagnostic drill targeting top concept pillars.`}
                </p>
              </div>
            </div>

            {/* Option 2: High Yield PYQ */}
            <div
              onClick={() => setSelectedMode('pyq')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedMode === 'pyq'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    High-Yield PYQ Sprint
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                    High Yield
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Frequently asked previous years questions for {activeExam.shortCode}.
                </p>
              </div>
            </div>

            {/* Option 3: Balanced Drill */}
            <div
              onClick={() => setSelectedMode('diagnostic')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedMode === 'diagnostic'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Balanced Mixed Simulation
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 shrink-0">
                    Balanced
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Multi-subject coverage across the entire {activeExam.shortCode} syllabus.
                </p>
              </div>
            </div>
          </div>

          {/* Question Count Selection */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Drill Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 25].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    questionCount === count
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/25 flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Generate & Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
