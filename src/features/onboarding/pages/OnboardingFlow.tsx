import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useAuth } from '@/features/auth';
import { OnboardingPolicy } from '@/lib/navigation/policies/OnboardingPolicy';
import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Award,
  Landmark,
  Train,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useNotification } from '@/stores/useNotificationStore';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { triggerHaptic } from '@/lib/haptics';
import { BrandSpinner } from '@/components/brand';

interface ExamOption {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    id: 'ssc',
    title: 'SSC Exams',
    subtitle: 'CGL, CHSL, MTS, CPO',
    badge: 'Popular',
    icon: Award,
  },
  {
    id: 'railways',
    title: 'Railways (RRB)',
    subtitle: 'NTPC, Group D, ALP',
    badge: 'Central Govt',
    icon: Train,
  },
  {
    id: 'state_psc',
    title: 'State PSC & Police',
    subtitle: 'BPSC, UPPSC, SI, Constable',
    badge: 'State Exams',
    icon: Landmark,
  },
  {
    id: 'banking',
    title: 'Banking Exams',
    subtitle: 'IBPS PO/Clerk, SBI PO/Clerk',
    badge: 'Finance',
    icon: Briefcase,
  },
  {
    id: 'other',
    title: 'Other Competitive Exams',
    subtitle: 'General Studies, CSAT & Aptitude',
    badge: 'General',
    icon: GraduationCap,
  },
];

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [targetExam, setTargetExam] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const status = OnboardingPolicy.getStatus(user.id);
      if (status === 'NOT_STARTED') {
        OnboardingPolicy.markStarted(user.id);
      }
    }
  }, [user]);

  // Capacitor Android Hardware & Gesture Back Button Listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: any = null;
    const registerBackHandler = async () => {
      listenerHandle = await App.addListener('backButton', () => {
        // At onboarding root, minimize the app gracefully rather than logging out
        App.minimizeApp();
      });
    };

    registerBackHandler();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, []);

  const handleSelectExam = (id: string) => {
    triggerHaptic('light');
    setTargetExam(id);
  };

  const handleSubmit = async () => {
    if (!targetExam) {
      triggerHaptic('error');
      showToast({ message: 'Please select your target exam to proceed', variant: 'error' });
      return;
    }

    triggerHaptic('light');
    setIsSubmitting(true);

    // Sync to MindFlow multi-exam context store
    const examMap: Record<string, string> = {
      ssc: 'ssc_cgl',
      state_psc: 'bpsc',
      railways: 'rrb_ntpc',
    };
    const canonicalId = examMap[targetExam] || 'ssc_cgl';
    useExamContextStore.getState().setActiveExam(canonicalId);

    if (user) {
      try {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            full_name: fullName.trim() || undefined,
            target_exam: targetExam,
          },
        });
        OnboardingPolicy.markCompleted(user.id);
      } catch (err) {
        console.warn('Failed to update onboarding_completed in Supabase:', err);
      }
    }

    triggerHaptic('success');
    const intent = IntentPolicy.popIntent();
    navigate(intent ? intent : '/dashboard', { replace: true });
  };

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-[100dvh] w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 md:bg-gradient-to-br md:from-slate-50 md:via-indigo-50/30 md:to-purple-50/20 md:dark:from-slate-950 md:dark:via-slate-900 md:dark:to-indigo-950/40 p-0 sm:p-0 md:p-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-x-hidden overscroll-contain select-none md:flex-row md:items-center md:justify-center"
    >
      {/* Background ambient lighting on desktop */}
      <div className="hidden md:block absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/50 to-transparent dark:from-indigo-900/20 pointer-events-none" />

      {/* Main Responsive Canvas: Edge-to-edge on mobile, elevated card on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl mx-auto flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 md:rounded-3xl md:shadow-2xl md:border md:border-slate-200/80 md:dark:border-slate-800 overflow-hidden min-h-[100dvh] md:min-h-[640px] md:max-h-[85vh]"
      >
        {/* Scrollable Content Zone */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center pt-2 sm:pt-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome to MindFlow
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm">
              Personalize your adaptive drills, speed tests, and daily mistake revision.
            </p>
          </div>

          {/* User Name input if not already available */}
          {!user?.user_metadata?.full_name && (
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-fullname"
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Your Full Name
              </label>
              <input
                id="onboarding-fullname"
                type="text"
                autoComplete="name"
                inputMode="text"
                enterKeyHint="done"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Kumar"
                className="select-text block w-full px-4 min-h-[44px] h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
              />
            </div>
          )}

          {/* Material 3 Exam Choice Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Your Primary Goal
              </label>
              <span className="text-[11px] text-slate-400">Choose one to start</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {EXAM_OPTIONS.map((exam) => {
                const isSelected = targetExam === exam.id;
                const IconComponent = exam.icon;

                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => handleSelectExam(exam.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 active:scale-[0.98] active:brightness-95 select-none ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-bold text-sm truncate ${
                              isSelected
                                ? 'text-indigo-950 dark:text-indigo-100'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {exam.title}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {exam.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {exam.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom-Pinned Action Bar (Android Thumb Ergonomics) */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-20 shrink-0 pb-[max(env(safe-area-inset-bottom),16px)]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !targetExam}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] active:brightness-95 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all select-none"
          >
            {isSubmitting ? (
              <>
                <BrandSpinner variant="inline" size="sm" />
                <span>Personalizing Experience...</span>
              </>
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
};

export default OnboardingFlow;
