
import React, { useState, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Clock, ZoomIn, ZoomOut, Wand2, Settings, 
  Maximize, Minimize, Menu, ChevronDown, Filter,
  AlertTriangle, ArrowRight, CheckCircle2, Flame
} from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { useTimer } from '../../../hooks/useTimer';
import { SettingsContext } from '../../../context/SettingsContext';
import { SettingsModal } from './ui/SettingsModal';
import { Button } from '../../../components/Button/Button';
import { useLocalStorageState } from '../../../hooks/useLocalStorageState';

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
    // Persist zoom level preference
    const [zoomLevel, setZoomLevel] = useLocalStorageState('quiz_zoom_level', 1); 
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Gamification State
    const [streak, setStreak] = useState(0);
    
    // Overlays & Modals
    const [showTimeUpOverlay, setShowTimeUpOverlay] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Audio Refs (Singleton Pattern)
    const audioCtxRef = useRef<AudioContext | null>(null);
    const activeOscillatorRef = useRef<OscillatorNode | null>(null);
    const activeGainRef = useRef<GainNode | null>(null);

    // Swipe Refs - Updated to store X and Y for diagonal check
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

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
            setStreak(0); // Reset streak on timeout

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

    // Navigation Wrapper
    const handleNavigation = useCallback((navAction: () => void) => {
        if (!isAnswered) {
            onSaveTime(question.id, secondsLeft);
        }
        navAction();
    }, [isAnswered, onSaveTime, question.id, secondsLeft]);

    // Swipe Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        };
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartRef.current.x - touchEndX;
        const diffY = touchStartRef.current.y - touchEndY;
        const minSwipeDistance = 50;
        
        // Only trigger swipe if horizontal movement is greater than vertical movement (Diagonal Scroll Fix)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            // Swipe Left -> Next (diffX > 0)
            if (diffX > 0) {
                if (questionIndex < totalQuestions - 1) {
                    handleNavigation(onNext);
                } else {
                    // If last question, treat swipe left as finish attempt
                    handleFinishRequest();
                }
            }
            // Swipe Right -> Prev (diffX < 0)
            else {
                if (questionIndex > 0) {
                    handleNavigation(onPrev);
                }
            }
        }
        
        touchStartRef.current = null;
    };

    // Intercept Finish Action
    const handleFinishRequest = useCallback(() => {
        if (markedForReview.length > 0) {
            setShowReviewModal(true);
        } else {
            // Show simple confirmation before immediate submit
            setShowSubmitConfirm(true);
        }
    }, [markedForReview]);

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

    const handleOptionSelect = useCallback((option: string) => {
        // Prevent select if answered, time up, OR option is hidden (50:50)
        if (isAnswered || showTimeUpOverlay || currentHiddenOptions.includes(option)) return;

        const isCorrect = option === question.correct;
        
        if (isHapticEnabled && navigator.vibrate) {
            if (isCorrect) navigator.vibrate(50);
            else navigator.vibrate([50, 50, 50]);
        }

        if (isCorrect) {
            playCorrectSound();
            setStreak(s => s + 1);
        } else {
            playIncorrectSound();
            setStreak(0);
        }

        const timeSpent = QUIZ_DURATION_SECONDS - secondsLeft;
        onAnswer(question.id, option, timeSpent);
    }, [isAnswered, showTimeUpOverlay, currentHiddenOptions, question, isHapticEnabled, playCorrectSound, playIncorrectSound, secondsLeft, onAnswer]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid interfering with native inputs if any exist
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowRight':
                    if (questionIndex < totalQuestions - 1) handleNavigation(onNext);
                    else handleFinishRequest();
                    break;
                case 'ArrowLeft':
                    if (questionIndex > 0) handleNavigation(onPrev);
                    break;
                case '1':
                case 'Numpad1':
                    if (question.options[0]) handleOptionSelect(question.options[0]);
                    break;
                case '2':
                case 'Numpad2':
                    if (question.options[1]) handleOptionSelect(question.options[1]);
                    break;
                case '3':
                case 'Numpad3':
                    if (question.options[2]) handleOptionSelect(question.options[2]);
                    break;
                case '4':
                case 'Numpad4':
                    if (question.options[3]) handleOptionSelect(question.options[3]);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [question, questionIndex, totalQuestions, onNext, onPrev, handleFinishRequest, handleNavigation, handleOptionSelect]);

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
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto",
                                (!isAnswered && questionIndex === totalQuestions - 1) ? "bg-amber-100" : "bg-green-100"
                            )}>
                                {(!isAnswered && questionIndex === totalQuestions - 1) ? (
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {(!isAnswered && questionIndex === totalQuestions - 1) ? "Skip Last Question?" : "Submit Quiz?"}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {(!isAnswered && questionIndex === totalQuestions - 1)
                                    ? "You haven't answered the last question. It will be marked as skipped."
                                    : "You are about to finish the quiz. You won't be able to change your answers after this."
                                }
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
                                className={cn(
                                    "flex-1 text-white py-2.5 rounded-lg font-bold shadow-md",
                                    (!isAnswered && questionIndex === totalQuestions - 1) 
                                        ? "bg-amber-500 hover:bg-amber-600" 
                                        : "bg-green-600 hover:bg-green-700"
                                )}
                            >
                                {(!isAnswered && questionIndex === totalQuestions - 1) ? "Skip & Submit" : "Submit"}
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
                        
                        {/* UPDATED LAYOUT: Zoom and Tools on single row */}
                        <div className="flex flex-row justify-between items-center gap-4">
                            {/* Left: Zoom Controls */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
                                <button onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))} className="p-1.5 hover:bg-white rounded-md text-gray-500 transition-all"><ZoomOut className="w-4 h-4" /></button>
                                <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-1.5 hover:bg-white rounded-md text-gray-500 transition-all"><ZoomIn className="w-4 h-4" /></button>
                            </div>
                            
                            {/* Right: Streak, Timer, 50:50 */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Streak Badge */}
                                {streak > 1 && (
                                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold text-xs bg-orange-100 text-orange-600 border border-orange-200 animate-in zoom-in duration-300">
                                        <Flame className="w-3 h-3 fill-orange-500 animate-pulse" />
                                        <span>{streak}</span>
                                    </div>
                                )}

                                <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg font-mono font-medium text-xs sm:text-sm border ${secondsLeft < 10 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-600 border-gray-200'}`}>
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {secondsLeft}s
                                </div>

                                <button 
                                    onClick={handleFiftyFifty}
                                    disabled={isFiftyFiftyDisabled}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap",
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

                    <div>
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
