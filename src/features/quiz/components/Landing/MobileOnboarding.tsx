import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Brain, Layers, Download, Play, SkipForward, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import founderImage from '../../../../assets/aalok.jpg';

interface MobileOnboardingProps {
  onComplete: () => void;
  onInstallClick?: () => void;
  shouldShowInstallButton?: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const MobileOnboarding: React.FC<MobileOnboardingProps> = ({
  onComplete,
  onInstallClick,
  shouldShowInstallButton
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slides = [
    {
      id: 'welcome',
      icon: <Brain className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />,
      title: 'Welcome to MindFlow',
      subtitle: 'Your intelligent knowledge engine.',
      description: 'Master complex topics effortlessly with our adaptive learning tools designed just for you.',
      color: 'from-indigo-500 to-purple-600',
      isFinal: false
    },
    {
      id: 'flashcards',
      icon: <Layers className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />,
      title: 'Smart Flashcards',
      subtitle: 'Learn Vocab & Synonyms.',
      description: 'Swipe through interactive flashcards. Track your mastery from New to Mastered with our smart spaced repetition.',
      color: 'from-emerald-400 to-teal-500',
      isFinal: false
    },
    {
      id: 'ai',
      icon: <Target className="w-16 h-16 text-amber-500 dark:text-amber-400" />,
      title: 'AI Chat & Live Talk',
      subtitle: 'Ask anything, anytime.',
      description: 'Have real-time voice conversations or deep text chats with our advanced AI to clarify your doubts instantly.',
      color: 'from-amber-400 to-orange-500',
      isFinal: false
    },
    {
      id: 'final',
      icon: <Download className="w-16 h-16 text-pink-500 dark:text-pink-400" />,
      title: 'Ready to Explore?',
      subtitle: 'Take quizzes & export PDFs.',
      description: 'Customizable GK quizzes, offline PWA support, and so much more.',
      color: 'from-pink-500 to-rose-500',
      isFinal: true
    }
  ];

  const paginate = (newDirection: number) => {
    const nextIndex = page + newDirection;
    if (nextIndex >= 0 && nextIndex < slides.length) {
      setPage([nextIndex, newDirection]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && page < slides.length - 1) {
      paginate(1);
    } else if (isRightSwipe && page > 0) {
      paginate(-1);
    }
    setTouchStart(null);
  };

  const currentSlide = slides[page];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-hidden font-sans">
      {/* Header Actions */}
      <div className="flex justify-between items-center px-6 py-4 z-10">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-6 bg-indigo-600 dark:bg-indigo-400' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>

        {page < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Skip <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Slide Content */}
      <div
        className="flex-1 relative flex items-center justify-center px-6 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold && page < slides.length - 1) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold && page > 0) {
                paginate(-1);
              }
            }}
          >
            {/* Slide Visual Container */}
            <div className={`w-32 h-32 mb-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-center justify-center relative`}>
              {/* Background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.color} opacity-10 rounded-3xl blur-xl`}></div>
              {currentSlide.icon}
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              {currentSlide.title}
            </h2>
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
              {currentSlide.subtitle}
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed px-4">
              {currentSlide.description}
            </p>

            {/* Special Final Slide Additions */}
            {currentSlide.isFinal && (
              <div className="mt-8 flex flex-col w-full max-w-[280px] gap-4 items-center animate-fade-in-up">
                {shouldShowInstallButton && (
                  <button
                    onClick={onInstallClick}
                    className="flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 shadow-sm"
                  >
                    <Download className="w-5 h-5" /> Install App
                  </button>
                )}

                {/* Meet the Founder Mini */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 pr-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mt-2 w-full text-left">
                  <img src={founderImage} alt="Founder" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900 shadow-sm" />
                  <div className="flex-1">
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-0.5">Created By</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Aalok Kumar Sharma</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 pb-8 pt-4 flex-shrink-0 z-10">
        {page === slides.length - 1 ? (
          <button
            onClick={onComplete}
            className="w-full relative group overflow-hidden rounded-2xl p-[3px] focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl hover:shadow-indigo-200 dark:shadow-none"
          >
             <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F1F5F9_0%,#F1F5F9_50%,#6366F1_75%,#EC4899_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#1E293B_0%,#1E293B_50%,#6366F1_75%,#EC4899_100%)]" />
             <span className="relative flex items-center justify-center gap-3 h-full w-full rounded-[14px] bg-white dark:bg-slate-900 px-8 py-4 text-lg font-bold text-slate-900 dark:text-white backdrop-blur-3xl transition-all duration-300 group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                <span className="flex items-center">
                  Get Started
                </span>
                <Play className="w-5 h-5 fill-current text-indigo-600 dark:text-indigo-400" />
             </span>
          </button>
        ) : (
          <Button
            onClick={() => paginate(1)}
            className="w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-md"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
