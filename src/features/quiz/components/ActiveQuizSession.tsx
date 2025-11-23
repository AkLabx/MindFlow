import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Timer, 
  Settings, 
  Menu, 
  ZoomIn, 
  ZoomOut, 
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
import { cn } from '../../../utils/cn';
import { useSound } from '../../../hooks/useSound';
import { Button } from '../../../components/Button/Button';
import { useQuizSessionTimer } from '../hooks/useQuizSessionTimer';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';

interface ActiveQuizSessionProps {
  mode: QuizMode;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  allQuestions: Question[];
  userAnswers: Record<string, string>;
  timeTaken: Record<string, number>;
  remainingTime: number;
  globalTimeRemaining: number;
  hiddenOptions: Record<string, string[]>;
  bookmarks: string[];
  markedForReview: string[];
  score: number;
  
  onAnswer: (questionId: string, answer: string, timeTaken: number) => void;
  onLogTime: (questionId: string, timeTaken: number) => void;
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
  onLogTime,
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

  const { 
    secondsLeftLearning, 
    secondsLeftMock, 
    questionTimeElapsed, 
    formatTime 
  } = useQuizSessionTimer({
    mode,
    questionId: question.id,
    isAnswered,
    remainingTime,
    globalTimeRemaining,
    totalQuestions,
    onFinish,
    onSaveTime,
    onSyncGlobalTimer,
    onLogTime
  });

  const attemptStats = useMemo(() => {
      const attempted = Object.keys(userAnswers).length;
      return {
          attempted,
          unattempted: totalQuestions - attempted
      };
  }, [userAnswers, totalQuestions]);

  // --- Handlers ---

  const handleOptionSelect = useCallback((answer: string) => {
      if (isAnswered && !isMockMode) return; 
      
      const timeToLog = isMockMode ? 0 : 1;
      onAnswer(question.id, answer, timeToLog);

      if (!isMockMode) {
          setTimeout(() => {
            if (answer === question.correct) playCorrect();
            else playIncorrect();
          }, 10);
      }
  }, [isAnswered, isMockMode, onAnswer, question.id, question.correct, playCorrect, playIncorrect]);

  const handleFiftyFifty = () => {
      if (currentHiddenOptions.length > 0 || isAnswered) return;
      
      const incorrectOptions = question.options.filter(opt => opt !== question.correct);
      const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
      const toHide = shuffled.slice(0, Math.max(0, question.options.length - 2));
      
      onUseFiftyFifty(question.id, toHide);
  };

  const handleNext = () => {
      if (questionIndex === totalQuestions - 1) {
          handleFinishRequest();
      } else {
          onNext();
      }
  };

  const handleFinishRequest = () => {
      setShowSubmitConfirm(true);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') onPrev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, onPrev]);

  // --- RENDER ---

  const header = (
    <div className="flex flex-row items-center justify-between p-4 w-full">
      <div className="flex items-center gap-4">
         <button onClick={() => setIsNavOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu className="w-5 h-5" />
         </button>
         
         <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-colors whitespace-nowrap",
            (isMockMode ? secondsLeftMock : secondsLeftLearning) < 10 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"
         )}>
            <Timer className="w-4 h-4" />
            {isMockMode ? formatTime(secondsLeftMock) : formatTime(secondsLeftLearning)}
         </div>
      </div>

      <div className="hidden md:block flex-1 px-8">
         <QuizBreadcrumbs filters={filters} onGoHome={onGoHome} />
      </div>

      <div className="flex items-center gap-2">
         {!isMockMode && (
             <button 
                onClick={handleFiftyFifty}
                disabled={isAnswered || currentHiddenOptions.length > 0}
                className={cn(
                    "flex items-center justify-center h-8 w-14 rounded-md text-xs font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 outline-none",
                    (isAnswered || currentHiddenOptions.length > 0) 
                        ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed" 
                        : "bg-[#FFD700] text-black border-[#B8860B] hover:bg-[#FFEB3B] shadow-sm"
                )}
                title="Remove 2 incorrect options"
             >
                50:50
             </button>
         )}

         <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-gray-100 text-gray-500"><ZoomOut className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-1.5 hover:bg-gray-100 text-gray-500"><ZoomIn className="w-4 h-4" /></button>
            </div>
            
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <Settings className="w-5 h-5" />
            </button>
         </div>
      </div>
    </div>
  );

  const footer = (
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
  );

  const overlays = (
    <>
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
                                attemptStats.unattempted > 0 ? "bg-amber-50 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                            )}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
       )}
    </>
  );

  return (
    <ActiveQuizLayout
      header={header}
      footer={footer}
      overlays={overlays}
    >
       <QuizQuestionHeader 
          question={question}
          currentIndex={questionIndex}
          total={totalQuestions}
          isBookmarked={bookmarks.includes(question.id)}
          onToggleBookmark={() => onToggleBookmark(question.id)}
          elapsedTime={questionTimeElapsed}
       />

       <QuizQuestionDisplay 
          question={question}
          selectedAnswer={userAnswer}
          hiddenOptions={currentHiddenOptions}
          onAnswerSelect={handleOptionSelect}
          zoomLevel={zoomLevel}
          isMockMode={isMockMode}
       />

       {!isMockMode && isAnswered && (
           <QuizExplanation explanation={question.explanation} zoomLevel={zoomLevel} />
       )}
    </ActiveQuizLayout>
  );
};