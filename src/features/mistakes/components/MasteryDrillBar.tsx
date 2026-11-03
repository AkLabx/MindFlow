import React, { useState } from 'react';
import { Flame, HelpCircle, Zap, Loader2, ArrowRight } from 'lucide-react';
import { UserQuestionMasteryRecord } from '../types';
import { masteryService } from '../../quiz/services/masteryService';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

interface MasteryDrillBarProps {
  questions: UserQuestionMasteryRecord[];
  activeSubject?: string;
}

export const MasteryDrillBar: React.FC<MasteryDrillBarProps> = ({
  questions,
  activeSubject
}) => {
  const [isLaunching, setIsLaunching] = useState<string | null>(null);
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  const handleLaunchDrill = async (drillType: 'critical' | 'guesses' | 'quick') => {
    setIsLaunching(drillType);

    try {
      let targetRecords: UserQuestionMasteryRecord[] = [];
      let drillTitle = '';

      if (drillType === 'critical') {
        // High-vulnerability critical & repeated errors
        targetRecords = questions.filter(
          (q) => q.mastery_tier === 'CRITICAL_ERROR' || q.mastery_tier === 'REPEATED_ERROR'
        );
        if (targetRecords.length === 0) {
          // Fallback to fresh slips
          targetRecords = questions.filter((q) => q.mastery_tier === 'FRESH_SLIP');
        }
        drillTitle = `Targeted Drill: Kill Critical Traps (${Math.min(15, targetRecords.length)} Qs)`;
      } else if (drillType === 'guesses') {
        // Lucky guesses to verify
        targetRecords = questions.filter((q) => q.mastery_tier === 'UNVERIFIED_GUESS');
        drillTitle = `Targeted Drill: Verify Lucky Guesses (${Math.min(15, targetRecords.length)} Qs)`;
      } else {
        // Quick 10-Q Sweep
        targetRecords = questions.filter((q) => q.mastery_tier !== 'MASTERED');
        drillTitle = `Quick Error Sweep (${Math.min(10, targetRecords.length)} Qs)`;
      }

      if (targetRecords.length === 0) {
        showToast({
          variant: 'info',
          message: 'No questions currently available for this drill category. Excellent job!'
        });
        setIsLaunching(null);
        return;
      }

      // Limit subset to 15 (or 10 for quick)
      const maxCount = drillType === 'quick' ? 10 : 15;
      const selectedQuestions = targetRecords
        .slice(0, maxCount)
        .map((r) => r.question!)
        .filter(Boolean);

      if (selectedQuestions.length === 0) {
        showToast({
          variant: 'error',
          message: 'Question payloads could not be loaded. Please refresh.'
        });
        setIsLaunching(null);
        return;
      }

      const { quizId, error } = await masteryService.startMasteryRevisionDrill(
        selectedQuestions,
        drillTitle
      );

      if (error || !quizId) {
        showToast({
          variant: 'error',
          message: error || 'Failed to start revision drill'
        });
        setIsLaunching(null);
        return;
      }

      showToast({
        variant: 'success',
        message: `Starting ${drillTitle}...`
      });

      // Navigate to quiz session
      navigate(ROUTES.QUIZ.SESSION.learning(quizId));
    } catch (err: any) {
      console.error('[MasteryDrillBar] Launch error:', err);
      showToast({
        variant: 'error',
        message: err.message || 'Error launching drill'
      });
      setIsLaunching(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            Rapid Revision Launchers
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Instant Retention Drills</span>
            {activeSubject && activeSubject !== 'all' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {activeSubject}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-300">
            Target your specific cognitive vulnerabilities in 5-10 minute spaced practice sessions.
          </p>
        </div>
      </div>

      {/* 3 Drill Launch Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Kill Critical Traps */}
        <button
          onClick={() => handleLaunchDrill('critical')}
          disabled={Boolean(isLaunching)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-200">Kill Critical Traps</div>
              <div className="text-[10px] text-rose-300/80">3+ fails & repeated errors</div>
            </div>
          </div>
          {isLaunching === 'critical' ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
          ) : (
            <ArrowRight className="w-4 h-4 text-rose-300 group-hover:translate-x-1 transition-transform" />
          )}
        </button>

        {/* 2. Verify Lucky Guesses */}
        <button
          onClick={() => handleLaunchDrill('guesses')}
          disabled={Boolean(isLaunching)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-200">Verify Lucky Guesses</div>
              <div className="text-[10px] text-indigo-300/80">Confirm 1st-try correct Qs</div>
            </div>
          </div>
          {isLaunching === 'guesses' ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
          ) : (
            <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
          )}
        </button>

        {/* 3. Quick 10-Q Error Sweep */}
        <button
          onClick={() => handleLaunchDrill('quick')}
          disabled={Boolean(isLaunching)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">Quick 10-Q Sweep</div>
              <div className="text-[10px] text-amber-300/80">Top vulnerable questions</div>
            </div>
          </div>
          {isLaunching === 'quick' ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};
