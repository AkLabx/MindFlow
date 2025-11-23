
import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Settings, X, Menu, ZoomIn, ZoomOut, Maximize2, Minimize2, Clock } from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizExplanation } from '../components/QuizExplanation';
import { QuizBreadcrumbs } from '../components/QuizBreadcrumbs';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/ui/Badge';
import { useQuizSounds } from '../../../hooks/useQuizSounds'; // UPDATED import
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { SettingsModal } from '../components/ui/SettingsModal';
import { cn } from '../../../utils/cn';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';
import { useQuizSessionTimer } from '../hooks/useQuizSessionTimer';
import { useQuiz } from '../hooks/useQuiz';

interface LearningSessionProps {
    questions: Question[];
    filters: InitialFilters;
    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
    onGoHome: () => void;
}

export const LearningSession: React.FC<LearningSessionProps> = ({ questions, filters, onComplete, onGoHome }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Hook to sync with global store for persistence
    const { saveTimer, syncGlobalTimer, logTimeSpent, state } = useQuiz();
    
    const currentQuestion = questions[currentIndex];
    const userAnswer = answers[currentQuestion.id];
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
            timeTaken: {}, 
            score,
            bookmarks
        });
    };

    // Timer Integration
    const { secondsLeftLearning, formatTime } = useQuizSessionTimer({
        mode: 'learning',
        questionId: currentQuestion.id,
        isAnswered: isAnswered,
        remainingTime: state.remainingTimes[currentQuestion.id],
        globalTimeRemaining: 0,
        totalQuestions: questions.length,
        onFinish: () => {}, // Timer running out in learning mode doesn't force finish
        onSaveTime: saveTimer,
        onSyncGlobalTimer: syncGlobalTimer,
        onLogTime: logTimeSpent,
        onTick: playTick // Passing the synthesized tick sound
    });

    const handleAnswer = (option: string) => {
        if (isAnswered) return;

        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));

        if (option === currentQuestion.correct) {
            playCorrect();
        } else {
            playIncorrect: playWrong(); // Using the new playWrong
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            finishSession();
        }
    };

    const toggleBookmark = () => {
        setBookmarks(prev => {
            if (prev.includes(currentQuestion.id)) return prev.filter(id => id !== currentQuestion.id);
            return [...prev, currentQuestion.id];
        });
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
        <div className="flex items-center justify-between p-3 sm:p-4 w-full bg-white">
             <div className="flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <div className="hidden sm:block"><QuizBreadcrumbs filters={filters} onGoHome={onGoHome} /></div>
                    
                    {/* Tools Group */}
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        
                         {/* Timer Badge */}
                         <Badge 
                            variant="neutral" 
                            icon={<Clock className="w-3.5 h-3.5" />}
                            className={cn(
                                "font-mono font-bold tabular-nums min-w-[4rem] justify-center transition-colors",
                                secondsLeftLearning <= 10 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-gray-50"
                            )}
                         >
                            {formatTime(secondsLeftLearning)}
                         </Badge>

                        {/* Zoom Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-gray-200 text-gray-500 active:bg-gray-300"><ZoomOut className="w-4 h-4" /></button>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.1))} className="p-1.5 hover:bg-gray-200 text-gray-500 active:bg-gray-300"><ZoomIn className="w-4 h-4" /></button>
                        </div>

                        {/* Fullscreen Toggle */}
                        <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border border-gray-200 hidden sm:flex">
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                 </div>
                 
                 {/* Progress Bar Row */}
                 <div className="flex items-center gap-3">
                     <button onClick={() => setIsNavOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 sm:hidden border border-gray-200">
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
                 <button onClick={toggleBookmark} className={cn("p-2 rounded-full transition-colors", bookmarks.includes(currentQuestion.id) ? "bg-amber-100 text-amber-500" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}>
                     <Star className={cn("w-5 h-5", bookmarks.includes(currentQuestion.id) && "fill-current")} />
                 </button>
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                     <Settings className="w-5 h-5" />
                 </button>
             </div>
        </div>
    );

    const footer = (
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
             <Button variant="ghost" onClick={onGoHome} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4 mr-2" /> Quit
             </Button>

             <Button 
                onClick={handleNext} 
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
                    setCurrentIndex(idx);
                    setIsNavOpen(false);
                }}
                markedForReview={[]}
                bookmarks={bookmarks}
                onSubmitAndReview={finishSession}
                mode='learning'
            />
        </>
    );

    return (
        <ActiveQuizLayout header={header} footer={footer} overlays={overlays}>
            <div className="pb-8">
                <QuizQuestionDisplay 
                    question={currentQuestion}
                    selectedAnswer={userAnswer}
                    onAnswerSelect={handleAnswer}
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
