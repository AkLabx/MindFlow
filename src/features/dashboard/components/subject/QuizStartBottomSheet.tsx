import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Info,
  Play,
  Save,
  Trash2,
  CheckCircle2,
  RotateCcw,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import { useSubTopicModeProgress } from "@/features/quiz/hooks/useQuizProgress";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

interface QuizStartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  topic: string;
  subTopic: string;
  questionCount: number;
  onStartQuiz: (mode: "learning" | "mock") => void;
  onSaveForLater: (mode: "learning" | "mock") => void;
}

export const QuizStartBottomSheet: React.FC<QuizStartBottomSheetProps> = ({
  isOpen,
  onClose,
  subject,
  topic,
  subTopic,
  questionCount,
  onStartQuiz,
  onSaveForLater,
}) => {
  const [mode, setMode] = useState<"learning" | "mock">("learning");
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  const { learningStatus, mockStatus, isLoading } = useSubTopicModeProgress(
    subject,
    topic,
    subTopic,
  );

  const currentStatus = mode === "learning" ? learningStatus : mockStatus;

  const handlePrimaryAction = () => {
    if (currentStatus.status === "COMPLETED" && currentStatus.quizId) {
      // Route to results
      navigate(ROUTES.RESULT.view(currentStatus.quizId));
      onClose();
    } else {
      // Start or Resume (quizCreationService handles duplicate detection and resuming inherently)
      onStartQuiz(mode);
    }
  };

  const getPrimaryButtonConfig = () => {
    if (isLoading) {
      return {
        label: "Loading...",
        icon: (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ),
        disabled: true,
      };
    }

    if (currentStatus.status === "COMPLETED") {
      return {
        label: "View Results",
        icon: <BarChart2 className="w-5 h-5" />,
        disabled: false,
      };
    }

    if (currentStatus.status === "IN_PROGRESS") {
      return {
        label: "Resume Quiz",
        icon: <RotateCcw className="w-5 h-5" />,
        disabled: false,
      };
    }

    return {
      label: "Start Quiz Now",
      icon: <Play className="w-5 h-5" />,
      disabled: questionCount === 0,
    };
  };

  const primaryConfig = getPrimaryButtonConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 pb-safe flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {subTopic}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {subject} • {topic}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Available Questions
                </p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {questionCount}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  Select Mode
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </label>
              </div>

              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <strong>Learning:</strong> Get immediate feedback and
                      explanations after each question.
                      <br />
                      <strong>Mock:</strong> Take a timed test like a real exam.
                      Feedback is shown at the end.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("learning")}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    mode === "learning"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span className="font-semibold mb-1">Learning</span>
                  {!isLoading && learningStatus.status === "IN_PROGRESS" && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  )}
                  {!isLoading && learningStatus.status === "COMPLETED" && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setMode("mock")}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    mode === "mock"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span className="font-semibold mb-1">Mock Exam</span>
                  {!isLoading && mockStatus.status === "IN_PROGRESS" && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  )}
                  {!isLoading && mockStatus.status === "COMPLETED" && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                size="lg"
                onClick={handlePrimaryAction}
                disabled={primaryConfig.disabled}
                className={`w-full h-14 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg dark:shadow-none ${
                  currentStatus.status === "COMPLETED"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    : currentStatus.status === "IN_PROGRESS"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                }`}
              >
                {primaryConfig.icon}
                <span className="font-semibold text-lg">
                  {primaryConfig.label}
                </span>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onSaveForLater(mode)}
                  disabled={
                    questionCount === 0 || currentStatus.status === "COMPLETED"
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold">Save for Later</span>
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-xl text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-semibold">Discard</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
