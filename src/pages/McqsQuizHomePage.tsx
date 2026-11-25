import React from "react";
import {
  CreateQuizSVG,
  SavedQuizzesSVG,
  GodModeSVG,
} from "@/features/quiz";
import { useNavigate } from "react-router-dom";
import { useNavSpinner } from "@/hooks/useNavSpinner";
import { ArrowLeft, ChevronRight, Loader2, Upload } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { SubjectStrip } from "@/features/dashboard";
import { InfoHintPopover } from "@/components/ui/InfoHintPopover";
import { triggerHaptic } from "@/lib/haptics";

interface McqsQuizHomeProps {
  onBack?: () => void;
}

interface StudioCardConfig {
  id: string;
  title: string;
  description: string;
  accentGradient: string;
  borderClass: string;
  titleGradient: string;
  spinnerColor: string;
  hintTitle: string;
  hintPurpose: string;
  hintExample: string;
  renderIcon: () => React.ReactNode;
  onPress: () => void;
}

export const McqsQuizHomePage: React.FC<McqsQuizHomeProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { loadingId, handleNavigation } = useNavSpinner();

  const handleBack = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const studioCards: StudioCardConfig[] = [
    {
      id: "full-custom-builder",
      title: "Full Custom Quiz Builder",
      description: "Filter by exam, subject, topic, difficulty & question count.",
      accentGradient: "from-indigo-500/12 via-violet-500/5 to-transparent",
      borderClass: "border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-500",
      titleGradient: "from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100",
      spinnerColor: "text-indigo-500",
      hintTitle: "Full Custom Quiz Builder",
      hintPurpose: "Build a personalized MCQ practice set across any combination of exams, subjects, topics, and difficulty levels.",
      hintExample: "Pick SSC CGL + Polity + 25 Questions in Learning Mode for instant step-by-step explanations.",
      renderIcon: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-md">
          <CreateQuizSVG />
        </div>
      ),
      onPress: () => handleNavigation("full-custom-builder", () => navigate(ROUTES.QUIZ.CONFIG)),
    },
    {
      id: "god-mode-blueprints",
      title: "Exam Blueprints (God-Mode)",
      description: "Create balanced multi-subject exam blueprints with custom section weights.",
      accentGradient: "from-rose-500/12 via-pink-500/5 to-transparent",
      borderClass: "border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-500",
      titleGradient: "from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100",
      spinnerColor: "text-rose-500",
      hintTitle: "Exam Blueprints (God-Mode)",
      hintPurpose: "Design section-wise mock blueprints with exact subject quotas and real exam timing rules.",
      hintExample: "Allocate 25% History, 25% Polity, 25% Geography, and 25% Science in one timed test.",
      renderIcon: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-md">
          <GodModeSVG />
        </div>
      ),
      onPress: () =>
        handleNavigation("god-mode-blueprints", () =>
          navigate(ROUTES.QUIZ.CONFIG, { state: { initialMode: "god" } })
        ),
    },
    {
      id: "created-custom-quizzes",
      title: "Created Custom Quizzes",
      description: "Resume paused custom sets, re-attempt, or review your saved builds.",
      accentGradient: "from-emerald-500/12 via-teal-500/5 to-transparent",
      borderClass: "border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500",
      titleGradient: "from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100",
      spinnerColor: "text-emerald-500",
      hintTitle: "Created Custom Quizzes",
      hintPurpose: "Access all custom quizzes you have generated or imported so you can resume or retake them anytime.",
      hintExample: "Open the Created Custom tab in Quiz History to replay an earlier custom revision set.",
      renderIcon: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-md">
          <SavedQuizzesSVG />
        </div>
      ),
      onPress: () =>
        handleNavigation("created-custom-quizzes", () =>
          navigate(`${ROUTES.QUIZ.LIBRARY}?tab=created`)
        ),
    },
    {
      id: "upload-own-questions",
      title: "Upload Your Own Questions",
      description: "Import your JSON/CSV question sets and practice them offline.",
      accentGradient: "from-amber-500/12 via-orange-500/5 to-transparent",
      borderClass: "border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500",
      titleGradient: "from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100",
      spinnerColor: "text-amber-500",
      hintTitle: "Upload Your Own Questions",
      hintPurpose: "Import personal MCQ collections into MindFlow so you can drill your own notes in Learning or Mock mode.",
      hintExample: "Upload a structured JSON file of current affairs MCQs to quiz yourself immediately.",
      renderIcon: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
          <Upload className="w-7 h-7" aria-hidden="true" />
        </div>
      ),
      onPress: () =>
        handleNavigation("upload-own-questions", () => navigate(ROUTES.MCQS_UPLOAD_CUSTOM)),
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full pb-28 scroll-mb-28 bg-gradient-to-b from-[#EEF2FF] via-[#F8FAFC] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 space-y-5">
        {/* Header Section */}
        <header className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] min-w-[44px] w-fit px-3 py-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/70 dark:hover:bg-slate-800/70 inline-flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider active:scale-95 touch-manipulation cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Create Your Customized Quiz
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                Centralized Custom Quiz Studio — build topic sets, exam blueprints, or import your own MCQs.
              </p>
            </div>
            <InfoHintPopover
              title="Custom Quiz Studio"
              purpose="Build self-paced or timed quizzes from the entire PYQ bank, design God-Mode blueprints, or practice by GK/GS subject."
              example="Use Subject-Wise Custom Quiz below to jump straight into History, Polity, or Science drills."
              align="end"
            />
          </div>
        </header>

        {/* Studio Action Cards */}
        <section aria-label="Custom Quiz Builders" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {studioCards.map((card) => {
            const isLoading = loadingId === card.id;
            return (
              <div
                key={card.id}
                className="relative rounded-2xl scroll-mb-28"
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    card.onPress();
                  }}
                  disabled={isLoading}
                  className={`group relative w-full min-h-[120px] p-4 sm:p-5 pr-14 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border ${card.borderClass} shadow-xs hover:shadow-md transition-all text-left flex items-center gap-4 active:scale-95 touch-manipulation cursor-pointer overflow-hidden`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-br ${card.accentGradient} pointer-events-none`}
                  />

                  <div className="relative z-10 transition-transform duration-200 group-hover:scale-105">
                    {isLoading ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                        <Loader2 className={`w-7 h-7 animate-spin ${card.spinnerColor}`} />
                      </div>
                    ) : (
                      card.renderIcon()
                    )}
                  </div>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className={`text-sm sm:text-base font-black leading-snug bg-clip-text text-transparent bg-gradient-to-r ${card.titleGradient}`}>
                        {card.title}
                      </h2>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </button>

                <InfoHintPopover
                  title={card.hintTitle}
                  purpose={card.hintPurpose}
                  example={card.hintExample}
                  align="end"
                  className="absolute top-2.5 right-2.5 z-20"
                />
              </div>
            );
          })}
        </section>

        {/* Centralized GK/GS Subject-Wise Custom Quiz */}
        <SubjectStrip
          onSubjectClick={(sub) => {
            triggerHaptic('light');
            navigate(ROUTES.SUBJECT.view(sub));
          }}
          onViewAllClick={() => {
            triggerHaptic('light');
            navigate(ROUTES.DASHBOARD_SUBJECTS);
          }}
        />
      </div>
    </div>
  );
};
