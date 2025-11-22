
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Timer, 
  Settings, 
  Menu, 
  ZoomIn, 
  ZoomOut, 
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Question, InitialFilters, QuizMode } from '../types';
import { QuizQuestionDisplay } from './QuizQuestionDisplay';
import { QuizQuestionHeader } from './QuizQuestionHeader';
import { QuizBottomNav } from './QuizBottomNav';
import { QuizExplanation } from './QuizExplanation';
import { QuizNavigationPanel } from './QuizNavigationPanel';
import { QuizBreadcrumbs } from './QuizBreadcrumbs';
import { SettingsModal } from './ui/SettingsModal';
import { useTimer } from '../../../hooks/useTimer';
import { cn } from '../../../utils/cn';
import { useSound } from '../../../hooks/useSound';
import { Button } from '../../../components/Button/Button';

interface ActiveQuizSessionProps {
  mode: QuizMode;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  allQuestions: Question[];
  userAnswers: Record<string, string>;
  timeTaken: Record<string, number>;
  remainingTime: number; // Per question time for Learning mode
  globalTimeRemaining: number; // Total time for Mock mode
  hiddenOptions: Record<string, string[]>;
  bookmarks: string[];
  markedForReview: string[];
  score: number;
  
  onAnswer: (questionId: string, answer: string, timeTaken: number) => void;
  onSaveTime: (questionId: string, time: number) => void;
  onSyncGlobalTimer: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  onToggleBookmark: (questionId: string) => void;
  onToggleReview: (questionId: string) => void;
  onUseFiftyFifty: (questionId: string, hiddenOptions: string[]) => void;
  onFinish: () => void;
  onGoHome: () => void;
  
  filters: InitialFilters;
}

export const ActiveQuizSession: React.FC<ActiveQuizSessionProps> = ({
  mode,
  question,
  questionIndex,
  totalQuestions,
  allQuestions,
  userAnswers,
  timeTaken,
  remainingTime,
  globalTimeRemaining,
  hiddenOptions,
  bookmarks,
  markedForReview,
  onAnswer,
  onSaveTime,
  onSyncGlobalTimer,
  onNext,
  onPrev,
  onJump,
  onToggleBookmark,
  onToggleReview,
  onUseFiftyFifty,
  onFinish,
  onGoHome,
  filters
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Sound effects
  const playCorrect = useSound('/sounds/correct.mp3');
  const playIncorrect = useSound('/sounds/wrong.mp3');

  const isMockMode = mode === 'mock';
  const userAnswer = userAnswers[question.id];
  const isAnswered = !!userAnswer;
  const currentHiddenOptions = hiddenOptions[question.id] || [];

  // --- Timer Logic ---
  
  // Learning Mode Timer (Per Question)
  const [secondsLeftLearning] = useTimer({
    duration: remainingTime,
    onTimeUp: () => {
       // In learning mode, we might not auto-submit, just let it sit at 0
    },
    key: question.id, // Resets when question changes
    isPaused: isAnswered || isMockMode
  });

  // Mock Mode Timer (Global)
  const [secondsLeftMock] = useTimer({
    duration: globalTimeRemaining,
    onTimeUp: onFinish,
    key: 'global-mock-timer',
    isPaused: !isMockMode || (globalTimeRemaining <= 0)
  });

  // Sync timers back to state
  useEffect(() => {
      if (!isMockMode && !isAnswered) {
          return () => onSaveTime(question.id, secondsLeftLearning);
      }
  }, [question.id, isMockMode, isAnswered, secondsLeftLearning, onSaveTime]);

  useEffect(() => {
      if (isMockMode) {
          const interval = setInterval(() => onSyncGlobalTimer(secondsLeftMock), 5000);
          return () => {
              clearInterval(interval);
              onSyncGlobalTimer(secondsLeftMock);
          }
      }
  }, [isMockMode, secondsLeftMock, onSyncGlobalTimer]);

  // Display Time
  const displayTime = isMockMode ? secondsLeftMock : secondsLeftLearning;
  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Stats for Submission ---
  const attemptStats = useMemo(() => {
      const attempted = Object.keys(userAnswers).length;
      return {
          attempted,
          unattempted: totalQuestions - attempted
      };
  }, [userAnswers, totalQuestions]);

  // --- Handlers ---

  const handleOptionSelect = useCallback((answer: string) => {
      // In Mock Mode, we always allow changing answers (unless time is up, handled globally)
      // In Learning Mode, once answered, it's locked.
      if (isAnswered && !isMockMode) return; 
      
      // Simple approach for time tracking in this context
      onAnswer(question.id, answer, 1);

      if (!isMockMode) {
          if (answer === question.correct) playCorrect();
          else playIncorrect();
      }
  }, [isAnswered, isMockMode, onAnswer, question.id, question.correct, playCorrect, playIncorrect]);

  const handleFiftyFifty = () => {
      if (currentHiddenOptions.length > 0 || isAnswered) return;
      
      const incorrectOptions = question.options.filter(opt => opt !== question.correct);
      const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
      const toHide = shuffled.slice(0, Math.max(0, question.options.length - 2));
      
      onUseFiftyFifty(question.id, toHide);
  };

  // Navigation Handlers
  const handleNext = () => {
      // If last question, trigger finish logic
      if (questionIndex === totalQuestions - 1) {
          handleFinishRequest();
      } else {
          onNext();
      }
  };

  const handleFinishRequest = () => {
      // Always show confirmation modal
      setShowSubmitConfirm(true);
  };

  // Keyboard navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') onPrev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, onPrev]);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-100px)]">
       
       {/* --- Header Bar --- */}
       <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm sticky top-4 z-40">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsNavOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                <Menu className="w-5 h-5" />
             </button>
             
             <div className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-colors",
                 displayTime < 10 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"
             )}>
                <Timer className="w-4 h-4" />
                {formatTime(displayTime)}
             </div>
          </div>

          <div className="hidden md:block flex-1 px-8">
             <QuizBreadcrumbs filters={filters} onGoHome={onGoHome} />
          </div>

          <div className="flex items-center gap-2">
             {/* 50-50 Lifeline (Learning Mode only) */}
             {!isMockMode && (
                 <button 
                    onClick={handleFiftyFifty}
                    disabled={isAnswered || currentHiddenOptions.length > 0}
                    className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                        (isAnswered || currentHiddenOptions.length > 0) 
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                            : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 shadow-sm"
                    )}
                    title="Remove 2 incorrect options"
                 >
                    <Zap className={cn("w-3.5 h-3.5", !(isAnswered || currentHiddenOptions.length > 0) && "fill-yellow-500")} />
                    <span className="hidden sm:inline">50:50</span>
                 </button>
             )}

             <div className="flex items-center border-l border-gray-200 pl-2 ml-2 gap-1">
                <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ZoomIn className="w-4 h-4" /></button>
             </div>
             
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 ml-1">
                <Settings className="w-5 h-5" />
             </button>
          </div>
       </header>

       {/* --- Main Content Area --- */}
       <main className="flex-1 relative">
          <div className="max-w-3xl mx-auto">
             
             <QuizQuestionHeader 
                question={question}
                currentIndex={questionIndex}
                total={totalQuestions}
                isBookmarked={bookmarks.includes(question.id)}
                onToggleBookmark={() => onToggleBookmark(question.id)}
             />

             <QuizQuestionDisplay 
                question={question}
                selectedAnswer={userAnswer}
                hiddenOptions={currentHiddenOptions}
                onAnswerSelect={handleOptionSelect}
                zoomLevel={zoomLevel}
                isMockMode={isMockMode}
             />

             {/* Explanation (Learning Mode Only) */}
             {!isMockMode && isAnswered && (
                 <QuizExplanation explanation={question.explanation} zoomLevel={zoomLevel} />
             )}

          </div>
       </main>

       {/* --- Bottom Navigation --- */}
       <footer className="sticky bottom-0 z-30 -mx-4 sm:mx-0 mt-8">
          <QuizBottomNav 
             onPrevious={onPrev}
             onNext={handleNext}
             onToggleMarkForReview={() => onToggleReview(question.id)}
             isMarked={markedForReview.includes(question.id)}
             isFirst={questionIndex === 0}
             isLast={questionIndex === totalQuestions - 1}
             isAnswered={isAnswered}
             mode={mode}
          />
       </footer>

       {/* --- Drawers & Modals --- */}
       <QuizNavigationPanel 
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          questions={allQuestions}
          userAnswers={userAnswers}
          currentQuestionIndex={questionIndex}
          onJumpToQuestion={(idx) => {
              onJump(idx);
              setIsNavOpen(false);
          }}
          markedForReview={markedForReview}
          bookmarks={bookmarks}
          onSubmitAndReview={handleFinishRequest}
          mode={mode}
       />

       <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
       />

       {/* --- Submission Confirmation Modal --- */}
        {showSubmitConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center scale-100 animate-in zoom-in-95 duration-200">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                        attemptStats.unattempted > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                    )}>
                        {attemptStats.unattempted > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {isMockMode ? "Submit Test?" : "Finish Quiz?"}
                    </h2>
                    
                    <div className="text-gray-600 mb-6 space-y-1">
                        <p>You have attempted <span className="font-bold text-indigo-600">{attemptStats.attempted}</span> out of <span className="font-bold">{totalQuestions}</span> questions.</p>
                        {attemptStats.unattempted > 0 && (
                            <p className="text-amber-600 text-sm font-medium">
                                {attemptStats.unattempted} question{attemptStats.unattempted > 1 ? 's' : ''} will be marked as skipped.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
                            Keep Playing
                        </Button>
                        <Button 
                            onClick={() => {
                                setShowSubmitConfirm(false);
                                onFinish();
                            }}
                            className={cn(
                                "text-white",
                                attemptStats.unattempted > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                            )}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
