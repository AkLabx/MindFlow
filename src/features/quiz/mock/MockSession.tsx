
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Menu, Flag, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Question } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';
import { Button } from '../../../components/Button/Button';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { cn } from '../../../utils/cn';
import { APP_CONFIG } from '../../../constants/config';

interface MockSessionProps {
    questions: Question[];
    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
}

export const MockSession: React.FC<MockSessionProps> = ({ questions, onComplete }) => {
    // Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [markedForReview, setMarkedForReview] = useState<string[]>([]);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Timer State
    const totalTime = questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION;
    const [timeLeft, setTimeLeft] = useState(totalTime);
    
    // Track time per question for analytics (approximate)
    const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<string, number>>({});
    const currentQTimer = useRef(0);

    // Global Timer Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishSession();
                    return 0;
                }
                return prev - 1;
            });
            currentQTimer.current += 1;
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Record time when switching questions
    const saveCurrentQuestionTime = () => {
        const qId = questions[currentIndex].id;
        setTimeSpentPerQuestion(prev => ({
            ...prev,
            [qId]: (prev[qId] || 0) + currentQTimer.current
        }));
        currentQTimer.current = 0;
    };

    const handleAnswer = (option: string) => {
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));
    };

    const handleNext = () => {
        saveCurrentQuestionTime();
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        saveCurrentQuestionTime();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleJump = (index: number) => {
        saveCurrentQuestionTime();
        setCurrentIndex(index);
        setIsNavOpen(false);
    };

    const toggleReview = () => {
        const qId = questions[currentIndex].id;
        setMarkedForReview(prev => {
            if (prev.includes(qId)) return prev.filter(id => id !== qId);
            return [...prev, qId];
        });
    };

    const finishSession = () => {
        saveCurrentQuestionTime(); // Save last question time
        
        // Calculate score
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });

        onComplete({
            answers,
            timeTaken: timeSpentPerQuestion,
            score,
            bookmarks: [] // Mock mode bookmarks can be handled via review list if needed
        });
    };

    // Format Timer
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const attemptedCount = Object.keys(answers).length;

    // --- RENDER ---

    const header = (
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shadow-md">
             <div className="font-bold text-lg tracking-tight">Mock Test</div>
             
             <div className={cn(
                 "flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono font-bold text-xl border border-slate-700 bg-slate-800",
                 timeLeft < 60 ? "text-red-400 border-red-900 animate-pulse" : "text-emerald-400"
             )}>
                 <Clock className="w-5 h-5" />
                 {formatTime(timeLeft)}
             </div>

             <button 
                onClick={() => setIsNavOpen(true)} 
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
             >
                 <Menu className="w-6 h-6" />
             </button>
        </div>
    );

    const footer = (
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="flex gap-2">
                 <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="px-3">
                    <ChevronLeft className="w-5 h-5" />
                 </Button>
                 <button 
                    onClick={toggleReview}
                    className={cn(
                        "p-2.5 rounded-lg border flex items-center justify-center transition-colors",
                        markedForReview.includes(questions[currentIndex].id) 
                            ? "bg-purple-100 border-purple-300 text-purple-700" 
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                    title="Mark for Review"
                 >
                    <Flag className="w-5 h-5 fill-current" />
                 </button>
             </div>

             <div className="flex gap-2">
                 <Button 
                    onClick={() => {
                        if (currentIndex === questions.length - 1) {
                            setShowConfirmModal(true);
                        } else {
                            handleNext();
                        }
                    }} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 shadow-lg shadow-indigo-200"
                 >
                    {currentIndex === questions.length - 1 ? "Submit Test" : "Save & Next"} 
                    {currentIndex !== questions.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
                 </Button>
             </div>
        </div>
    );

    const activeQuestion = questions[currentIndex];

    return (
        <>
            <ActiveQuizLayout 
                header={header} 
                footer={footer} 
                overlays={
                    <>
                    <QuizNavigationPanel 
                        isOpen={isNavOpen} 
                        onClose={() => setIsNavOpen(false)} 
                        questions={questions}
                        userAnswers={answers}
                        currentQuestionIndex={currentIndex}
                        onJumpToQuestion={handleJump}
                        markedForReview={markedForReview}
                        bookmarks={[]}
                        onSubmitAndReview={() => setShowConfirmModal(true)}
                        mode="mock"
                    />
                    {showConfirmModal && (
                         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center scale-100 animate-in zoom-in-95 duration-200">
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                                    questions.length - attemptedCount > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                                )}>
                                    {questions.length - attemptedCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Test?</h2>
                                
                                <div className="text-gray-600 mb-6 space-y-1">
                                    <p>You have attempted <span className="font-bold text-indigo-600">{attemptedCount}</span> out of <span className="font-bold">{questions.length}</span> questions.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Keep Playing</Button>
                                    <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={finishSession}>Submit</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                }
            >
                <div className="pb-8 pt-2">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                        {markedForReview.includes(activeQuestion.id) && (
                            <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                <Flag className="w-3 h-3 fill-current" /> Review Later
                            </span>
                        )}
                    </div>

                    <QuizQuestionDisplay 
                        question={activeQuestion}
                        selectedAnswer={answers[activeQuestion.id]}
                        onAnswerSelect={handleAnswer}
                        zoomLevel={1}
                        isMockMode={true}
                    />
                </div>
            </ActiveQuizLayout>
        </>
    );
};
