import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Languages, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Play, 
  Sparkles,
  Check
} from 'lucide-react';
import { UserQuestionMasteryRecord } from '../types';
import { masteryService } from '../../quiz/services/masteryService';
import { AiExplanationButton } from '../../quiz/components/AiExplanationButton';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { cn } from '../../../utils/cn';

interface MistakeQuestionCardProps {
  record: UserQuestionMasteryRecord;
  displayIndex: number;
  onStatusChange?: (questionId: string, newTier: string) => void;
  onPracticeSolo?: (record: UserQuestionMasteryRecord) => void;
}

export const MistakeQuestionCard: React.FC<MistakeQuestionCardProps> = ({
  record,
  displayIndex,
  onStatusChange,
  onPracticeSolo
}) => {
  const [showHindi, setShowHindi] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userNote, setUserNote] = useState(record.user_note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isMastered, setIsMastered] = useState(record.mastery_tier === 'MASTERED');
  const [isMarkingMastered, setIsMarkingMastered] = useState(false);

  const question = record.question;
  const showToast = useNotificationStore((s) => s.showToast);

  if (!question) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500">
        Loading question details ({record.question_id})...
      </div>
    );
  }

  // Determine Tier styling and copy
  const getTierBadge = () => {
    switch (record.mastery_tier) {
      case 'CRITICAL_ERROR':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          title: `Critical Blindspot • MVI ${record.vulnerability_index}`,
          subtitle: `Missed ${record.times_incorrect} times`,
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
          indicatorColor: 'bg-rose-500'
        };
      case 'REPEATED_ERROR':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          title: `Repeated Error • MVI ${record.vulnerability_index}`,
          subtitle: `Missed 2 times consecutively`,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
          indicatorColor: 'bg-amber-500'
        };
      case 'FRESH_SLIP':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />,
          title: `Fresh Slip • MVI ${record.vulnerability_index}`,
          subtitle: `Missed 1 time`,
          badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/50',
          indicatorColor: 'bg-yellow-500'
        };
      case 'UNVERIFIED_GUESS':
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          title: `Unverified Guess • MVI ${record.vulnerability_index}`,
          subtitle: `1st attempt correct — verify if lucky guess`,
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
          indicatorColor: 'bg-indigo-500'
        };
      case 'FAMILIAR':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />,
          title: `Familiar • MVI ${record.vulnerability_index}`,
          subtitle: `2 consecutive correct`,
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50',
          indicatorColor: 'bg-teal-500'
        };
      case 'MASTERED':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          title: `Mastered • MVI 0`,
          subtitle: `Solidified in long-term memory`,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
          indicatorColor: 'bg-emerald-500'
        };
    }
  };

  const tierInfo = getTierBadge();

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const ok = await masteryService.updateUserNote(record.question_id, userNote);
    setIsSavingNote(false);
    if (ok) {
      showToast({ variant: 'success', message: 'Concept note saved successfully' });
    } else {
      showToast({ variant: 'error', message: 'Failed to save note' });
    }
  };

  const handleToggleMastered = async () => {
    if (isMastered) return;
    setIsMarkingMastered(true);
    const ok = await masteryService.markAsMastered(record.question_id);
    setIsMarkingMastered(false);
    if (ok) {
      setIsMastered(true);
      if (onStatusChange) {
        onStatusChange(record.question_id, 'MASTERED');
      }
      showToast({ variant: 'success', message: 'Question marked as Mastered!' });
    } else {
      showToast({ variant: 'error', message: 'Could not mark question as mastered' });
    }
  };

  const questionText = showHindi && question.question_hi ? question.question_hi : question.question;
  const optionsList = (showHindi && question.options_hi && question.options_hi.length > 0)
    ? question.options_hi
    : (question.options || []);

  const explanationObj = question.explanation as any;
  const explanationText = typeof question.explanation === 'string'
    ? question.explanation
    : (explanationObj?.summary || explanationObj?.analysis_correct || explanationObj?.text || explanationObj?.en || '');

  const explanationTextHi = typeof question.explanation === 'object'
    ? (explanationObj?.hi || '')
    : '';

  return (
    <div className={cn(
      "rounded-3xl p-5 sm:p-6 border bg-white dark:bg-slate-900 transition-all duration-200 shadow-sm relative overflow-hidden",
      isMastered 
        ? "border-emerald-200 dark:border-emerald-900/40 opacity-80" 
        : record.mastery_tier === 'CRITICAL_ERROR'
          ? "border-rose-300 dark:border-rose-900/60 shadow-rose-50/50 dark:shadow-none"
          : "border-slate-200 dark:border-slate-800"
    )}>
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Index & Number */}
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            #{displayIndex}
          </span>

          {/* Subject Chip */}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {record.subject || 'General'}
          </span>

          {record.topic && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {record.topic}
            </span>
          )}

          {/* Cognitive Vulnerability Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
            tierInfo.badgeClass
          )}>
            {tierInfo.icon}
            <span>{tierInfo.title}</span>
          </div>
        </div>

        {/* Language switch if Hindi available */}
        {question.question_hi && (
          <button
            onClick={() => setShowHindi(!showHindi)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showHindi ? 'English' : 'हिंदी'}</span>
          </button>
        )}
      </div>

      {/* Question Text */}
      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 leading-relaxed text-left">
        {questionText}
      </p>

      {/* Options Breakdown */}
      <div className="space-y-2 mb-4">
        {optionsList.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isCorrect = opt === question.correct;
          const isUserChoice = opt === record.last_selected_option;

          let cardStyle = "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300";
          let badge = null;

          if (isCorrect) {
            cardStyle = "border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-medium";
            badge = (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3" /> Correct Answer
              </span>
            );
          } else if (isUserChoice) {
            cardStyle = "border-rose-300 dark:border-rose-700/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-medium";
            badge = (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 shrink-0">
                ✕ Your Choice
              </span>
            );
          }

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all",
                cardStyle
              )}
            >
              <div className="flex items-center gap-2.5 text-left pr-2">
                <span className="font-bold opacity-60 shrink-0">({letter})</span>
                <span>{opt}</span>
              </div>
              {badge}
            </div>
          );
        })}
      </div>

      {/* Explanation Accordion Toggle */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Official Explanation & Key Concepts</span>
          </div>
          {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-left space-y-2">
            {explanationText && (
              <p>{explanationText}</p>
            )}
            {explanationTextHi && (
              <p className="text-slate-600 dark:text-slate-400 border-t border-indigo-100/40 dark:border-indigo-900/20 pt-2 font-hindi">
                {explanationTextHi}
              </p>
            )}
            {!explanationText && !explanationTextHi && (
              <p className="text-slate-400 italic">No static explanation attached. Click "Ask AI Tutor" below for in-depth reasoning.</p>
            )}
          </div>
        )}
      </div>

      {/* Student Concept Sticky Note Input */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>My Concept Takeaway / Why I Failed</span>
          </label>
          <button
            onClick={handleSaveNote}
            disabled={isSavingNote}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            <span>{isSavingNote ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
        <input
          type="text"
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="e.g. Remember: 42nd Amendment added Socialist & Secular in 1976..."
          className="w-full text-xs px-3 py-2 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Action Footer Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Ask AI Tutor Modal Button */}
          <AiExplanationButton question={question} selectedAnswer={record.last_selected_option} />

          {/* Practice Solo 1-Q Drill */}
          {onPracticeSolo && (
            <button
              onClick={() => onPracticeSolo(record)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Play className="w-3 h-3 text-indigo-500" />
              <span>Practice This Q</span>
            </button>
          )}
        </div>

        {/* Mastered Toggle */}
        <button
          onClick={handleToggleMastered}
          disabled={isMastered || isMarkingMastered}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all",
            isMastered
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <CheckCircle2 className={cn("w-3.5 h-3.5", isMastered ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} />
          <span>{isMastered ? 'Mastered ✓' : 'Mark as Mastered'}</span>
        </button>
      </div>
    </div>
  );
};
