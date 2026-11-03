import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { masteryService, UserQuestionMasteryRecord, MasterySummary } from '../../quiz/services/masteryService';
import { ActiveTierFilter } from '../types';
import { CognitiveSummaryDeck } from '../components/CognitiveSummaryDeck';
import { MasteryDrillBar } from '../components/MasteryDrillBar';
import { MistakeQuestionCard } from '../components/MistakeQuestionCard';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useAuth } from '../../auth';
import { cn } from '../../../utils/cn';

export const MistakeNotebookPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useNotificationStore((s) => s.showToast);
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<MasterySummary | null>(null);
  const [allQuestions, setAllQuestions] = useState<UserQuestionMasteryRecord[]>([]);

  // Filters
  const [activeTier, setActiveTier] = useState<ActiveTierFilter>('all_mistakes');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial Load
  const loadMasteryData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch summary
      const sum = await masteryService.getMasterySummary();
      setSummary(sum);

      // 2. Fetch all mastery questions
      const records = await masteryService.getMasteryQuestions({
        tier: 'all',
        limit: 50
      });
      setAllQuestions(records);

      if (isManualRefresh) {
        showToast({ variant: 'success', message: 'Mastery notebook updated!' });
      }
    } catch (err: any) {
      console.error('[MistakeNotebookPage] Error loading data:', err);
      showToast({ variant: 'error', message: 'Failed to load mistake notebook' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMasteryData();
    }
  }, [user]);

  // Collect available subjects from questions & summary
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    if (summary?.subjectBreakdown) {
      Object.keys(summary.subjectBreakdown).forEach((s) => subs.add(s));
    }
    allQuestions.forEach((q) => {
      if (q.subject) subs.add(q.subject);
    });
    return Array.from(subs).filter(Boolean).sort();
  }, [summary, allQuestions]);

  // Client-side filtering for fast, responsive switching
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // 1. Tier filtering
      if (activeTier === 'all_mistakes') {
        const isMistake = ['CRITICAL_ERROR', 'REPEATED_ERROR', 'FRESH_SLIP'].includes(q.mastery_tier);
        if (!isMistake) return false;
      } else if (activeTier === 'critical' && q.mastery_tier !== 'CRITICAL_ERROR') {
        return false;
      } else if (activeTier === 'repeated' && q.mastery_tier !== 'REPEATED_ERROR') {
        return false;
      } else if (activeTier === 'slips' && q.mastery_tier !== 'FRESH_SLIP') {
        return false;
      } else if (activeTier === 'unverified' && q.mastery_tier !== 'UNVERIFIED_GUESS') {
        return false;
      } else if (activeTier === 'mastered' && q.mastery_tier !== 'MASTERED') {
        return false;
      }

      // 2. Subject filtering
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchQ = q.question?.question?.toLowerCase().includes(query) || false;
        const matchQHi = q.question?.question_hi?.toLowerCase().includes(query) || false;
        const matchNote = q.user_note?.toLowerCase().includes(query) || false;
        const matchTopic = q.topic?.toLowerCase().includes(query) || false;
        if (!matchQ && !matchQHi && !matchNote && !matchTopic) return false;
      }

      return true;
    });
  }, [allQuestions, activeTier, selectedSubject, searchQuery]);

  // Handle Practice Solo (1-Question drill)
  const handlePracticeSolo = async (record: UserQuestionMasteryRecord) => {
    if (!record.question) return;

    try {
      const { quizId, error } = await masteryService.startMasteryRevisionDrill(
        [record.question],
        `Single Drill: ${record.subject || 'Question'} Revision`
      );

      if (error || !quizId) {
        showToast({ variant: 'error', message: error || 'Failed to start practice session' });
        return;
      }

      navigate(ROUTES.QUIZ.SESSION.learning(quizId));
    } catch (err: any) {
      showToast({ variant: 'error', message: 'Could not launch quiz' });
    }
  };

  const handleStatusChange = (questionId: string, newTier: string) => {
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.question_id === questionId ? { ...q, mastery_tier: newTier as any, vulnerability_index: 0 } : q
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Mistake Notebook & Mastery</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cognitive Error Revision & Spaced Memory Panacea
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMasteryData(true)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Sync & Recalculate Mastery"
            >
              <RotateCcw className={cn("w-3.5 h-3.5", (isRefreshing || isLoading) && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {isLoading && !summary ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Analyzing cognitive memory & mistake vulnerability...
            </p>
          </div>
        ) : (
          <>
            {/* Cognitive Summary Deck */}
            {summary && (
              <CognitiveSummaryDeck
                summary={summary}
                activeFilter={activeTier}
                onFilterChange={setActiveTier}
              />
            )}

            {/* Instant Retention Drills Bar */}
            <MasteryDrillBar
              questions={filteredQuestions}
              activeSubject={selectedSubject}
            />

            {/* Controls Bar: Search & Subject Filter Chips */}
            <div className="space-y-3 mb-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, topics, or your concept takeaways..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subject Chips Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedSubject('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border",
                    selectedSubject === 'all'
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  All Subjects
                </button>
                {availableSubjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border",
                      selectedSubject === sub
                        ? "bg-indigo-600 text-white border-transparent shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Question List Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Showing {filteredQuestions.length} Questions
              </div>
            </div>

            {/* Feed of Question Cards */}
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((record, idx) => (
                  <MistakeQuestionCard
                    key={record.id || record.question_id}
                    record={record}
                    displayIndex={idx + 1}
                    onStatusChange={handleStatusChange}
                    onPracticeSolo={handlePracticeSolo}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  No Questions in this Filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                  {activeTier === 'all_mistakes'
                    ? "Great job! You don't have any pending errors right now."
                    : `No questions found under the '${activeTier}' category.`}
                </p>
                <button
                  onClick={() => {
                    setActiveTier('all');
                    setSelectedSubject('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  View All Questions
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
