
import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Settings, X, Menu, ZoomIn, ZoomOut } from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizExplanation } from '../components/QuizExplanation';
import { QuizBreadcrumbs } from '../components/QuizBreadcrumbs';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/ui/Badge';
import { useSound } from '../../../hooks/useSound';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { SettingsModal } from '../components/ui/SettingsModal';
import { cn } from '../../../utils/cn';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';

interface LearningSessionProps {
    questions: Question[];
    filters: InitialFilters;
    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
    onGoHome: () => void;
}

export const LearningSession: React.FC<LearningSessionProps> = ({ questions, filters, onComplete, onGoHome }) => {
    // Local State for Learning Mode
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    // Local derived
    const currentQuestion = questions[currentIndex];
    const userAnswer = answers[currentQuestion.id];
    const isAnswered = !!userAnswer;
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Sounds
    const playCorrect = useSound('/sounds/correct.mp3');
    const playIncorrect = useSound('/sounds/wrong.mp3');

    const handleAnswer = (option: string) => {
        if (isAnswered) return;

        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));

        if (option === currentQuestion.correct) {
            playCorrect();
        } else {
            playIncorrect();
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

    const finishSession = () => {
        // Calculate score
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });

        // Mock time taken (Learning mode doesn't strictly track per-question time in this simplified view yet)
        const timeTaken = questions.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {});

        onComplete({
            answers,
            timeTaken,
            score,
            bookmarks
        });
    };

    // --- RENDER ---

    const header = (
        <div className="flex items-center justify-between p-4 w-full">
             <div className="flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <QuizBreadcrumbs filters={filters} onGoHome={onGoHome} />
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden hidden sm:flex">
                            <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-gray-100 text-gray-500"><ZoomOut className="w-3 h-3" /></button>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-1.5 hover:bg-gray-100 text-gray-500"><ZoomIn className="w-3 h-3" /></button>
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={() => setIsNavOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 sm:hidden">
                        <Menu className="w-5 h-5" />
                     </button>
                     <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                     </div>
                     <span className="text-xs font-bold text-gray-400">{currentIndex + 1} / {questions.length}</span>
                 </div>
             </div>
             
             <div className="flex items-center gap-2 pl-4">
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
                <div className="mb-6 flex gap-2">
                    <Badge variant="primary">Learning Mode</Badge>
                    {currentQuestion.sourceInfo?.examName && (
                         <Badge variant="neutral">{currentQuestion.sourceInfo.examName}</Badge>
                    )}
                </div>

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
