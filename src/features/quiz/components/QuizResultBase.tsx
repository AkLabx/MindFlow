import React, { useState } from 'react';
import { Trophy, CheckCircle2, XCircle, HelpCircle, RotateCcw, Home, Bookmark } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { Question } from '../../../types/models';
import { cn } from '../../../utils/cn';
import { QuestionSolutionCard } from './QuestionSolutionCard';
import { QuizReview } from './QuizReview';

export interface QuizResultBaseProps {
  quizName?: string;
  score: number;
  total: number;
  accuracy: number;
  timeSpent: number; // in seconds
  stats: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  questions: Question[];
  answers: Record<string, string>;
  bookmarks?: string[];
  timeTaken?: Record<string, number>;
  onRestart: () => void;
  onGoHome?: () => void;
  analyticsSlot?: React.ReactNode;
  themeColor?: 'indigo' | 'amber' | 'emerald'; // To support God Mode vs Mock vs Normal
}

export const QuizResultBase: React.FC<QuizResultBaseProps> = ({
  quizName = 'My Custom Mock Test',
  score,
  total,
  accuracy,
  timeSpent,
  stats,
  questions,
  answers,
  bookmarks = [],
  timeTaken = {},
  onRestart,
  onGoHome,
  analyticsSlot,
  themeColor = 'indigo'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');
  const [reviewModeIndex, setReviewModeIndex] = useState<number | null>(null);

  const filteredQuestions = questions.filter(q => {
    const isCorrect = answers[q.id] === q.correct;
    const isUnattempted = !answers[q.id];

    switch (activeTab) {
      case 'correct': return isCorrect && !isUnattempted;
      case 'incorrect': return !isCorrect && !isUnattempted;
      case 'unattempted': return isUnattempted;
      default: return true;
    }
  });

  const getThemeClasses = () => {
    switch (themeColor) {
      case 'amber':
        return {
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-900/10',
          border: 'border-amber-100 dark:border-amber-900/30',
          buttonPrimary: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0',
          buttonOutline: 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20'
        };
      case 'emerald':
        return {
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/10',
          border: 'border-emerald-100 dark:border-emerald-900/30',
          buttonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white border-0',
          buttonOutline: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
        };
      default: // indigo
        return {
          text: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-900/10',
          border: 'border-indigo-100 dark:border-indigo-900/30',
          buttonPrimary: 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white border-0', // Matching the screenshot's dark blue button
          buttonOutline: 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
        };
    }
  };

  const theme = getThemeClasses();

  // Format time as MM:SS (e.g. 00:36)
  const formattedTimeSpent = `${Math.floor(timeSpent / 60).toString().padStart(2, '0')}:${Math.floor(timeSpent % 60).toString().padStart(2, '0')}`;

  if (reviewModeIndex !== null) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 absolute inset-0 z-[100] overflow-y-auto">
             <div className="dark:bg-slate-900 overflow-hidden">
                <QuizReview
                    questions={questions}
                    userAnswers={answers}
                    timeTaken={timeTaken}
                    bookmarkedQuestions={bookmarks}
                    onBackToScore={() => setReviewModeIndex(null)}
                    onGoHome={onGoHome || (() => {})}
                    initialReviewIndex={reviewModeIndex}
                />
             </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe md:pb-24 pt-safe z-[100] relative">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <button onClick={onGoHome} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            {/* The screenshot shows a back arrow here, which typically implies going home or back to previous screen */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Scorecard & Solutions</h1>
        <button onClick={onGoHome} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
          <Home className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Main Score Card */}
        <Card className="p-5 md:p-6 flex flex-col items-center justify-center text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl relative overflow-hidden">
            {/* Subtle background glow based on theme */}
            <div className={cn("absolute inset-0 opacity-10", theme.bg)}></div>

            <div className="relative z-10 w-full">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                </div>

                <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{quizName}</h2>

                <div className="flex items-baseline justify-center gap-1.5 md:gap-2 mb-5 md:mb-6">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{score.toFixed(2)}</span>
                    <span className="text-sm md:text-lg font-semibold text-slate-500 dark:text-slate-400">/ {total.toFixed(1)} Marks</span>
                </div>

                <div className="flex justify-center items-center gap-8 md:gap-12 pt-5 md:pt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{accuracy.toFixed(1)}%</span>
                        <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Accuracy</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">{formattedTimeSpent}</span>
                        <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Spent</span>
                    </div>
                </div>
            </div>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Card className="p-3 md:p-4 flex flex-col items-center justify-center text-center space-y-1.5 md:space-y-2 border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1">
                     <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                </div>
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{stats.correct}</div>
                <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">Correct</div>
            </Card>

            <Card className="p-3 md:p-4 flex flex-col items-center justify-center text-center space-y-1.5 md:space-y-2 border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-1">
                     <XCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                </div>
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{stats.incorrect}</div>
                <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">Incorrect</div>
            </Card>

            <Card className="p-3 md:p-4 flex flex-col items-center justify-center text-center space-y-1.5 md:space-y-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                     <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                </div>
                <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{stats.unattempted}</div>
                <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">Unattempted</div>
            </Card>
        </div>

        {/* Action Buttons (from screenshot) */}
        <div className="flex gap-3 md:gap-4">
             <Button
                variant="outline"
                onClick={onRestart}
                className={cn("flex-1 py-3 md:py-4 bg-white dark:bg-slate-900 rounded-xl font-semibold shadow-sm text-sm md:text-base", theme.buttonOutline)}
             >
                <span className="flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Retake Test</span>
             </Button>

             {onGoHome && (
                 <Button
                    onClick={onGoHome}
                    className={cn("flex-1 py-3 md:py-4 rounded-xl font-semibold shadow-sm text-sm md:text-base border-0", theme.buttonPrimary)}
                 >
                    <span className="flex items-center justify-center gap-2"><Home className="w-4 h-4" /> Dashboard</span>
                 </Button>
             )}
        </div>

        {/* Additional Analytics Slot (for Mode specific data like Time Management tables) */}
        {analyticsSlot && (
            <div className="py-2">
                {analyticsSlot}
            </div>
        )}

        {/* Detailed Solutions Section */}
        <div className="mt-8 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                Detailed Question Solutions
            </h3>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                        "whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors",
                        activeTab === 'all'
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                >
                    All ({questions.length})
                </button>
                <button
                    onClick={() => setActiveTab('incorrect')}
                    className={cn(
                        "whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors",
                        activeTab === 'incorrect'
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                >
                    Incorrect ({stats.incorrect})
                </button>
                <button
                    onClick={() => setActiveTab('correct')}
                    className={cn(
                        "whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors",
                        activeTab === 'correct'
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                >
                    Correct ({stats.correct})
                </button>
                <button
                    onClick={() => setActiveTab('unattempted')}
                    className={cn(
                        "whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors",
                        activeTab === 'unattempted'
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                >
                    Unattempted ({stats.unattempted})
                </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4 mt-4">
                {filteredQuestions.map((q, idx) => {
                    // Find actual index in full array for display
                    const displayIndex = questions.findIndex(orig => orig.id === q.id);
                    const userAnswer = answers[q.id];
                    const isBookmarked = bookmarks?.includes(q.id);

                    return (
                        <div key={q.id} className="cursor-pointer transition-transform active:scale-[0.98]" onClick={() => setReviewModeIndex(displayIndex)}>
                            <QuestionSolutionCard
                                question={q}
                                displayIndex={displayIndex + 1}
                                userAnswer={userAnswer}
                                isBookmarked={isBookmarked}
                            />
                        </div>
                    );
                })}

                {filteredQuestions.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                        No questions found for this filter.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
