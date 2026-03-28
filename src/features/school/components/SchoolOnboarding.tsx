import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, ChevronRight, Calculator, FlaskConical, PlayCircle, Trophy, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../../stores/useSettingsStore';

const slides = [
  {
    id: 1,
    title: "Welcome to MindFlow School",
    description: "Your personalized learning companion for complete syllabus mastery.",
    icon: <GraduationCap className="w-16 h-16 text-emerald-500" />,
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: 2,
    title: "Interactive Video Lessons",
    description: "Learn complex topics easily with high-quality animated videos.",
    icon: <PlayCircle className="w-16 h-16 text-indigo-500" />,
    color: "from-indigo-400 to-blue-500"
  },
  {
    id: 3,
    title: "Smart Mock Tests",
    description: "Test your knowledge with chapter-wise and full-length mock exams.",
    icon: <Trophy className="w-16 h-16 text-amber-500" />,
    color: "from-amber-400 to-orange-500"
  }
];

export const SchoolOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const { setSchoolBoard, setSchoolClass, setSchoolOnboardingSeen } = useSettingsStore();

  const handleNext = () => {
    if (currentSlide < slides.length) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleFinish = () => {
    if (selectedBoard && selectedClass) {
      setSchoolBoard(selectedBoard);
      setSchoolClass(selectedClass);
      setSchoolOnboardingSeen(true);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[100] flex flex-col font-outfit">
      {/* Progress Dots */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-2 z-10">
        {[...Array(slides.length + 1)].map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'w-8 bg-emerald-500'
                : i < currentSlide
                  ? 'w-2 bg-emerald-500/50'
                  : 'w-2 bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentSlide < slides.length ? (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center max-w-sm w-full"
            >
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20`}>
                <div className="bg-white dark:bg-slate-900 w-28 h-28 rounded-full flex items-center justify-center">
                  {slides[currentSlide].icon}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {slides[currentSlide].title}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col w-full max-w-md h-full justify-center mt-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Let's set up your profile
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                Select your board and class to get started.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Select Board
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['CBSE', 'ICSE', 'State Board', 'Other'].map(board => (
                      <button
                        key={board}
                        onClick={() => setSelectedBoard(board)}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedBoard === board
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-200 dark:hover:border-emerald-800'
                        }`}
                      >
                        <span className="font-medium">{board}</span>
                        {selectedBoard === board && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Select Class
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                      <button
                        key={cls}
                        onClick={() => setSelectedClass(cls.toString())}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          selectedClass === cls.toString()
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-200 dark:hover:border-emerald-800'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {currentSlide < slides.length ? (
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!selectedBoard || !selectedClass}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedBoard && selectedClass
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            Start Learning <GraduationCap className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
