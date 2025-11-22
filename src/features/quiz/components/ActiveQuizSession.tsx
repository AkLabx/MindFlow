
import React, { useState, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Clock, ZoomIn, ZoomOut, Wand2, Settings, 
  Maximize, Minimize, Menu, ChevronDown, Filter,
  AlertTriangle, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { useTimer } from '../../../hooks/useTimer';
import { SettingsContext } from '../../../context/SettingsContext';
import { SettingsModal } from './ui/SettingsModal';
import { Button } from '../../../components/Button/Button';

// Components
import { QuizOverallProgress } from './QuizOverallProgress';
import { QuizQuestionHeader } from './QuizQuestionHeader';
import { QuizQuestionDisplay } from './QuizQuestionDisplay';
import { QuizExplanation } from './QuizExplanation';
import { QuizBottomNav } from './QuizBottomNav';
import { QuizBreadcrumbs } from './QuizBreadcrumbs';
import { QuizNavigationPanel } from './QuizNavigationPanel';
import { cn } from '../../../utils/cn';

const QUIZ_DURATION_SECONDS = 60; // Default duration per question

export function ActiveQuizSession({
    question, 
    questionIndex, 
    totalQuestions, 
    allQuestions,
    userAnswers,
    timeTaken,
    remainingTime,
    hiddenOptions,
    bookmarks,
    markedForReview,
    score,
    
    onAnswer,
    onSaveTime,
    onNext,
    onPrev,
    onJump,
    onToggleBookmark,
    onToggleReview,
    onUseFiftyFifty,
    onFinish,
    onGoHome,
    
    filters
}: {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    allQuestions: Question[];
    userAnswers: Record<string, string>;
    timeTaken: Record<string, number>;
    remainingTime: number;
    hiddenOptions: Record<string, string[]>;
    bookmarks: string[];
    markedForReview: string[];
    score: number;
    
    onAnswer: (id: string, answer: string, time: number) => void;
    onSaveTime: (id: string, time: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onJump: (idx: number) => void;
    onToggleBookmark: (id: string) => void;
    onToggleReview: (id: string) => void;
    onUseFiftyFifty: (id: string, options: string[]) => void;
    onFinish: () => void;
    onGoHome: () => void;
    
    filters: InitialFilters;
}) {
    // Local UI State
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 1.2 = 120%
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Overlays & Modals
    const [showTimeUpOverlay, setShowTimeUpOverlay] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Refs
    const explanationRef = useRef<HTMLDivElement>(null);
    
    // Audio Refs (Singleton Pattern)
    const audioCtxRef = useRef<AudioContext | null>(null);
    const activeOscillatorRef = useRef<OscillatorNode | null>(null);
    const activeGainRef = useRef<GainNode | null>(null);

    // Swipe Refs
    const touchStartRef = useRef<number | null>(null);
    const touchEndRef = useRef<number | null>(null);

    // Access settings
    const { isHapticEnabled, isSoundEnabled } = useContext(SettingsContext);
    
    const userAnswer = userAnswers[question.id];
    const isAnswered = !!userAnswer;
    
    // 50:50 Logic
    const currentHiddenOptions = hiddenOptions[question.id] || [];
    const isFiftyFiftyUsed = currentHiddenOptions.length > 0;

    // Contextual Filter String
    const filterContextString = useMemo(() => {
        const parts = [];
        if (filters.subject.length) parts.push(...filters.subject);
        if (filters.topic.length) parts.push(...filters.topic);
        if (filters.difficulty.length) parts.push(...filters.difficulty);
        if (filters.examName.length) parts.push(...filters.examName);
        
        if (parts.length === 0) return "Custom Quiz";
        return `[ ${parts.join(', ')} ]`;
    }, [filters]);

    // --- Audio Engine (Singleton implementation to prevent overlap) ---
    const stopCurrentSound = () => {
        if (activeOscillatorRef.current) {
            try {
                activeOscillatorRef.current.stop();
                activeOscillatorRef.current.disconnect();
            } catch (e) { /* ignore if already stopped */ }
            activeOscillatorRef.current = null;
        }
        if (activeGainRef.current) {
            try {
                activeGainRef.current.disconnect();
            } catch (e) { /* ignore */ }
            activeGainRef.current = null;
        }
    };

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const playTone = useCallback((freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'sine') => {
        if (!isSoundEnabled) return;
        
        stopCurrentSound(); // Stop overlapping sounds
        
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freqStart, ctx.currentTime);
        if (freqEnd) {
            oscillator.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);

        activeOscillatorRef.current = oscillator;
        activeGainRef.current = gainNode;
    }, [isSoundEnabled]);

    const playCorrectSound = useCallback(() => playTone(600, 1000, 0.3, 'sine'), [playTone]);
    const playIncorrectSound = useCallback(() => playTone(300, 150, 0.3, 'triangle'), [playTone]);


    const handleFiftyFifty = () => {
        if (isFiftyFiftyUsed || isAnswered || showTimeUpOverlay) return;
        // Find incorrect options
        const incorrectOptions = question.options.filter(o => o !== question.correct);
        // Shuffle and take 2
        const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
        const toHide = shuffled.slice(0, 2);
        onUseFiftyFifty(question.id, toHide);
    };

    // Timer Logic
    const handleTimeUp = useCallback(() => {
        if (!isAnswered && !showTimeUpOverlay) {
            // 1. Show Overlay
            setShowTimeUpOverlay(true);
            
            // 2. Play Sound
            playIncorrectSound();

            // 3. Wait then Reveal
            setTimeout(() => {
                onAnswer(question.id, "TIME_UP", QUIZ_DURATION_SECONDS);
                setShowTimeUpOverlay(false);
            }, 1500);
        }
    }, [question.id, isAnswered, onAnswer, playIncorrectSound, showTimeUpOverlay]);

    // Initialize Timer
    const [secondsLeft] = useTimer({ 
        duration: remainingTime, 
        onTimeUp: handleTimeUp, 
        key: question.id, 
        isPaused: isAnswered || showTimeUpOverlay 
    });
    
    const progressPercent = (secondsLeft / QUIZ_DURATION_SECONDS) * 100;

    // Auto-scroll to explanation
    useEffect(() => {
        if (isAnswered) {
            const timer = setTimeout(() => {
                explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isAnswered]);

    // Navigation Wrapper
    const handleNavigation = (navAction: () => void) => {
        if (!isAnswered) {
            onSaveTime(question.id, secondsLeft);
        }
        navAction();
    };

    // Swipe Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        touchEndRef.current = e.changedTouches[0].clientX;
        
        const distance = touchStartRef.current - touchEndRef.current;
        const minSwipeDistance = 50;
        
        // Swipe Left -> Next
        if (distance > minSwipeDistance) {
            if (questionIndex < totalQuestions - 1) {
                handleNavigation(onNext);
            } else {
                // If last question, treat swipe left as finish attempt
                handleFinishRequest();
            }
        }
        
        // Swipe Right -> Prev
        if (distance < -minSwipeDistance) {
            if (questionIndex > 0) {
                handleNavigation(onPrev);
            }
        }
        
        touchStartRef.current = null;
        touchEndRef.current = null;
    };

    // Intercept Finish Action
    const handleFinishRequest = () => {
        if (markedForReview.length > 0) {
            setShowReviewModal(true);
        } else {
            // Show simple confirmation before immediate submit
            setShowSubmitConfirm(true);
        }
    };

    const handleReviewAction = () => {
        const firstMarkedId = markedForReview[0];
        const index = allQuestions.findIndex(q => q.id === firstMarkedId);
        if (index !== -1) {
            handleNavigation(() => onJump(index));
        }
        setShowReviewModal(false);
        setIsNavOpen(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const handleOptionSelect = (option: string) => {
        if (isAnswered || showTimeUpOverlay) return;

        const isCorrect = option === question.correct;
        
        if (isHapticEnabled && navigator.vibrate) {
            if (isCorrect) navigator.vibrate(50);
            else navigator.vibrate([50, 50, 50]);
        }

        if (isCorrect) playCorrectSound();
        else playIncorrectSound();

        const timeSpent = QUIZ_DURATION_SECONDS - secondsLeft;
        onAnswer(question.id, option, timeSpent);
    };

    const isFiftyFiftyDisabled = isFiftyFiftyUsed || isAnswered || showTimeUpOverlay;

    return (
        <div 
            className="bg-white md:rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-[calc(100vh-2rem)] md:h-auto md:min-h-[600px] relative transition-all"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Inject Styles for Shake Animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                .zoom-container {
                    font-size: ${zoomLevel}rem;
                }
            `}</style>

            {/* --- Time's Up Overlay --- */}
            {showTimeUpOverlay && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white px-12 py-10 rounded-3xl shadow-2xl flex flex-col items-center border-4 border-red-50 animate-in zoom-in-95 duration-300 transform scale-100">
                        <div className="bg-red-100 p-5 rounded-full mb-6 shadow-inner">
                            <Clock className="w-14 h-14 text-red-600" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Time's Up!</h2>
                        <p className="text-slate-500 font-medium text-lg">Let's check the answer...</p>
                    </div>
                </div>
            )}

            {/* --- Review Warning Modal --- */}
            {showReviewModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 animate-in slide-in-from-bottom-4 duration-300 p-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Review Pending</h3>
                            <p className="text-gray-600">
                                You have <span className="font-bold text-purple-600">{markedForReview.length} questions</span> marked for review. 
                                Do you want to check them before submitting?
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button 
                                onClick={handleReviewAction}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200"
                            >
                                Review Questions <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <button 
                                onClick={() => { setShowReviewModal(false); onFinish(); }}
                                className="w-full py-3 rounded-xl text-gray-500 font-semibold hover:bg-gray-100 transition-colors"
                            >
                                No, Submit Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- General Submit Confirmation Modal --- */}
            {showSubmitConfirm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300 p-6">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Quiz?</h3>
                            <p className="text-gray-600 text-sm">
                                You are about to finish the quiz. You won't be able to change your answers after this.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 py-2.5 rounded-lg text-gray-600 font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                Cancel
                            </button>
                            <Button 
                                onClick={() => { setShowSubmitConfirm(false); onFinish(); }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold shadow-md"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-20">
                <div className="flex flex-col">
                    <QuizBreadcrumbs filters={filters} onGoHome={onGoHome} />
                    <h1 className="text-lg font-black text-indigo-900 tracking-tight hidden sm:block">MindFlow</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors" aria-label="Settings">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors" aria-label="Toggle Fullscreen">
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsNavOpen(true)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-gray-50 border border-gray-100">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Collapsible Info & Toolbar */}
            <div className="bg-white border-b border-gray-100 transition-all duration-300 ease-in-out relative z-10">
                <div className="px-6 py-2 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-700 text-xs truncate max-w-[80%] flex items-center gap-2">
                        <Filter className="w-3 h-3 text-indigo-500" />
                        {filterContextString}
                    </h3>
                    <button onClick={() => setIsStatsVisible(!isStatsVisible)} className="text-gray-400 hover:text-gray-600">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isStatsVisible ? '' : 'rotate-180'}`} />
                    </button>
                </div>

                {isStatsVisible && (
                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <QuizOverallProgress current={questionIndex + 1} total={totalQuestions} />
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))} className="p-1.5 hover:bg-white rounded-md text-gray-500 transition-all"><ZoomOut className="w-4 h-4" /></button>
                                <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-1.5 hover:bg-white rounded-md text-gray-500 transition-all"><ZoomIn className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-medium text-sm border ${secondsLeft < 10 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-600 border-gray-200'}`}>
                                    <Clock className="w-4 h-4" />
                                    {secondsLeft}s
                                </div>

                                <button 
                                    onClick={handleFiftyFifty}
                                    disabled={isFiftyFiftyDisabled}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
                                        isFiftyFiftyDisabled 
                                            ? "bg-gray-200 text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] cursor-not-allowed border border-gray-200"
                                            : "bg-yellow-400 text-black hover:bg-yellow-500 hover:-translate-y-0.5 border-b-2 border-yellow-600 active:border-b-0 active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    <Wand2 className="w-3.5 h-3.5" /> 50:50
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${secondsLeft < 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/30">
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
                    />

                    <div ref={explanationRef}>
                        {isAnswered && (
                            <QuizExplanation 
                                explanation={question.explanation} 
                                zoomLevel={zoomLevel}
                            />
                        )}
                    </div>
                </div>
            </div>

            <QuizBottomNav 
                onPrevious={() => handleNavigation(onPrev)}
                onNext={() => {
                    if (questionIndex === totalQuestions - 1) {
                        handleFinishRequest();
                    } else {
                        handleNavigation(onNext);
                    }
                }}
                onToggleMarkForReview={() => onToggleReview(question.id)}
                isMarked={markedForReview.includes(question.id)}
                isFirst={questionIndex === 0}
                isLast={questionIndex === totalQuestions - 1}
                isAnswered={isAnswered}
            />

            <QuizNavigationPanel 
                isOpen={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                questions={allQuestions}
                userAnswers={userAnswers}
                currentQuestionIndex={questionIndex}
                onJumpToQuestion={(idx) => handleNavigation(() => onJump(idx))}
                markedForReview={markedForReview}
                bookmarks={bookmarks}
                onSubmitAndReview={handleFinishRequest}
            />

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
            />

        </div>
    );
}
