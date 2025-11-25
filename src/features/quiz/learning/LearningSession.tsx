
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Star, Settings, Menu, ZoomIn, ZoomOut, Maximize2, Minimize2, Clock, ChevronLeft, Home, AlertCircle, X, Pause, Play } from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizExplanation } from '../components/QuizExplanation';
import { QuizBreadcrumbs } from '../components/QuizBreadcrumbs';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/ui/Badge';
import { useQuizSounds } from '../../../hooks/useQuizSounds';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { SettingsModal } from '../components/ui/SettingsModal';
import { cn } from '../../../utils/cn';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';
import { APP_CONFIG } from '../../../constants/config';
import { useLearningTimer } from '../hooks/useLearningTimer';

interface LearningSessionProps {
    questions: Question[];
    filters: InitialFilters;
    remainingTimes: Record<string, number>;
    isPaused: boolean;

    // State from Parent
    currentIndex: number;
    answers: Record<string, string>;
    bookmarks: string[];
    timeTaken: Record<string, number>; // Add this if needed for completion

    // Actions
    onAnswer: (questionId: string, answer: string, timeTaken: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onJump: (index: number) => void;
    onToggleBookmark: (questionId: string) => void;

    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
    onGoHome: () => void;
    onPause: (questionId?: string, timeLeft?: number) => void;
    onResume: () => void;
    onSaveTimer: (questionId: string, time: number) => void;
}

export const LearningSession: React.FC<LearningSessionProps> = ({
    questions,
    filters,
    remainingTimes,
    isPaused,
    currentIndex,
    answers,
    bookmarks,
    timeTaken,
    onAnswer,
    onNext,
    onPrev,
    onJump,
    onToggleBookmark,
    onComplete,
    onGoHome,
    onPause,
    onResume,
    onSaveTimer
}) => {
    // UI State (Local)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Pop-up state for timer expiry
    const [showTimeUpModal, setShowTimeUpModal] = useState(false);
    
    const currentQuestion = questions[currentIndex];
    const userAnswer = answers[currentQuestion.id];
    
    // Check if question is conceptually "done"
    const isAnswered = !!userAnswer; 

    const progress = ((currentIndex + 1) / questions.length) * 100;

    // New Synthesized Sounds
    const { playCorrect, playWrong, playTick } = useQuizSounds();

    const finishSession = () => {
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });

        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }

        onComplete({
            answers,
            timeTaken: timeTaken || {},
            score,
            bookmarks
        });
    };

    // Handle Timer Expiry
    const handleTimeUp = useCallback(() => {
        setShowTimeUpModal(true);
        // Mark as time up (0 time taken for this attempt effectively, or max?)
        // Ideally we pass 0 or current time?
        // We call onAnswer with a special marker.
        onAnswer(currentQuestion.id, 'TIME_UP', 0);
        playWrong();
    }, [currentQuestion.id, playWrong, onAnswer]);

    // Dedicated Learning Timer
    const { timeLeft, formatTime } = useLearningTimer({
        initialTime: remainingTimes[currentQuestion.id] ?? APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT,
        questionId: currentQuestion.id,
        isPaused: isPaused || isAnswered,
        onTimeUp: handleTimeUp,
        onTick: (time) => {
            // Play tick sound in last 5 seconds
            if (time <= 5 && time > 0) playTick();
        }
    });

    // Save timer when unmounting or changing questions
    useEffect(() => {
        return () => {
            if (!isAnswered && !isPaused) {
                onSaveTimer(currentQuestion.id, timeLeft);
            }
        };
    }, [currentQuestion.id, isAnswered, isPaused, onSaveTimer, timeLeft]);

    const handlePause = () => {
        onPause(currentQuestion.id, timeLeft);
    };

    const handleResume = () => {
        onResume();
    };

    const handleAnswerSelect = (option: string) => {
        if (isAnswered) return;

        // Calculate time spent on this question
        // Total allowed - remaining = spent
        const allowed = remainingTimes[currentQuestion.id] ?? APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT;
        const spent = allowed - timeLeft;

        onAnswer(currentQuestion.id, option, spent);

        if (option === currentQuestion.correct) {
            playCorrect();
        } else {
            playWrong();
        }
    };

    const handleNextClick = () => {
        setShowTimeUpModal(false);
        if (currentIndex < questions.length - 1) {
            onNext();
        } else {
            finishSession();
        }
    };

    const handlePrevClick = () => {
        setShowTimeUpModal(false);
        if (currentIndex > 0) {
            onPrev();
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    // --- RENDER ---

    const header = (
        <div className="flex items-center justify-between p-3 sm:p-4 w-full bg-white relative z-20">
             <div className="flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    {/* Desktop Breadcrumbs */}
                    <div className="hidden sm:block"><QuizBreadcrumbs filters={filters} onGoHome={onGoHome} /></div>
                    
                    {/* Mobile Home Button */}
                    <div className="sm:hidden">
                        <Button variant="ghost" size="sm" onClick={onGoHome} className="p-0 text-gray-500 hover:bg-transparent">
                            <Home className="w-5 h-5" />
                        </Button>
                    </div>
                    
                    {/* Tools Group */}
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        
                         {/* Timer Badge */}
                         <Badge 
                            variant="neutral" 
                            icon={<Clock className="w-3.5 h-3.5" />}
                            className={cn(
                                "font-mono font-bold tabular-nums min-w-[4rem] justify-center transition-colors",
                                timeLeft <= 10 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-gray-50"
                            )}
                         >
                            {formatTime(timeLeft)}
                         </Badge>

                         {/* Pause Button */}
                         <button
                            onClick={handlePause}
                            className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-500"
                            title="Pause Quiz"
                            data-testid="pause-button"
                         >
                             <Pause className="w-4 h-4" />
                         </button>

                        {/* Zoom Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-gray-200 text-gray-500 active:bg-gray-300"><ZoomOut className="w-4 h-4" /></button>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.1))} className="p-1.5 hover:bg-gray-200 text-gray-500 active:bg-gray-300"><ZoomIn className="w-4 h-4" /></button>
                        </div>

                        {/* Fullscreen Toggle */}
                        <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border border-gray-200 flex">
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                 </div>
                 
                 {/* Progress Bar Row */}
                 <div className="flex items-center gap-3">
                     <button onClick={() => setIsNavOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                        <Menu className="w-5 h-5" />
                     </button>
                     
                     <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                     </div>
                     <span className="text-xs font-bold text-gray-500 min-w-[3rem] text-right">{currentIndex + 1} / {questions.length}</span>
                 </div>
             </div>
             
             {/* Right Actions */}
             <div className="flex items-center gap-2 pl-3 border-l border-gray-100 ml-3">
                 <button onClick={() => onToggleBookmark(currentQuestion.id)} className={cn("p-2 rounded-full transition-colors", bookmarks.includes(currentQuestion.id) ? "bg-amber-100 text-amber-500" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}>
                     <Star className={cn("w-5 h-5", bookmarks.includes(currentQuestion.id) && "fill-current")} />
                 </button>
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                     <Settings className="w-5 h-5" />
                 </button>
             </div>
        </div>
    );

    const footer = (
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center gap-4">
             <Button 
                variant="ghost" 
                onClick={handlePrevClick}
                disabled={currentIndex === 0} 
                className="text-gray-500 hover:text-indigo-600"
             >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
             </Button>

             <Button 
                onClick={handleNextClick}
                disabled={!isAnswered}
                className={cn(
                    "px-8 transition-all shadow-lg",
                    !isAnswered ? "opacity-50 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                )}
             >
                {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"} <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
        </div>
    );

    const overlays = (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <QuizNavigationPanel 
                isOpen={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                questions={questions}
                userAnswers={answers}
                currentQuestionIndex={currentIndex}
                onJumpToQuestion={(idx) => {
                    onJump(idx);
                    setIsNavOpen(false);
                }}
                markedForReview={[]}
                bookmarks={bookmarks}
                onSubmitAndReview={finishSession}
                mode='learning'
            />
            
            {isFullScreen && (
                <div className="fixed top-4 right-4 z-50">
                     <button 
                        onClick={toggleFullScreen}
                        className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-2 transition-all"
                    >
                        <Minimize2 className="w-4 h-4" /> Exit Full Screen
                    </button>
                </div>
            )}

            {showTimeUpModal && (
                 <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/20 pointer-events-none">
                    <div className="bg-white border border-red-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-10 pointer-events-auto max-w-sm w-full mx-auto">
                         <div className="bg-red-100 p-3 rounded-full text-red-600">
                             <AlertCircle className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="font-bold text-gray-900">Time's Up!</h3>
                             <p className="text-xs text-gray-500">Revealing answer & explanation.</p>
                         </div>
                         <button 
                            onClick={() => setShowTimeUpModal(false)}
                            className="ml-auto text-gray-400 hover:text-gray-600"
                         >
                             <X className="w-5 h-5" />
                         </button>
                    </div>
                 </div>
            )}

            {/* Pause Overlay - Heavily Blurred */}
            {isPaused && (
                <div
                    className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-black/10 backdrop-blur-md animate-in fade-in duration-300"
                    data-testid="session-paused-overlay"
                >
                    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Pause className="w-8 h-8 fill-current" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Paused</h2>
                        <p className="text-gray-500 mb-6">Take a break! Your progress is saved.</p>

                        <Button
                            onClick={handleResume}
                            size="lg"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" /> Resume Quiz
                        </Button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <ActiveQuizLayout 
            header={isFullScreen ? null : header} 
            footer={footer} 
            overlays={overlays}
        >
            <div className={cn("pb-8", isPaused && "filter blur-lg transition-all duration-300 select-none pointer-events-none")}>
                <QuizQuestionDisplay 
                    question={currentQuestion}
                    selectedAnswer={userAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    zoomLevel={zoomLevel}
                    isMockMode={false}
                />

                {isAnswered && (
                    <QuizExplanation explanation={currentQuestion.explanation} zoomLevel={zoomLevel} />
                )}
            </div>
        </ActiveQuizLayout>
    );
};
