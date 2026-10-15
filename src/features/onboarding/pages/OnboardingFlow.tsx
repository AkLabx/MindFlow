import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { OnboardingPolicy } from '@/lib/navigation/policies/OnboardingPolicy';
import { Button } from '@/components/Button/Button';
import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, UserCircle, CheckCircle2 } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to MindFlow',
    description: 'We are excited to help you learn faster and smarter. Let’s get your account set up.',
    icon: Sparkles
  },
  {
    id: 'profile',
    title: 'Personalize Your Profile',
    description: 'Setting up your profile helps us tailor the content specifically to your learning goals.',
    icon: UserCircle
  },
  {
    id: 'permissions',
    title: 'Privacy & Permissions',
    description: 'We respect your privacy. MindFlow stores most data locally on your device for a fast, offline-first experience.',
    icon: ShieldCheck
  },
  {
    id: 'finish',
    title: 'You’re All Set!',
    description: 'Your account is ready. Dive into a world of endless learning.',
    icon: CheckCircle2
  }
];

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (user) {
       // Only mark as started if not already in progress or completed
       const status = OnboardingPolicy.getStatus(user.id);
       if (status === 'NOT_STARTED') {
           OnboardingPolicy.markStarted(user.id);
       }
    }
  }, [user]);

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (user) {
        // Fire and forget, don't block UI navigation
        supabase.auth.updateUser({
          data: { onboarding_completed: true }
        }).catch(err => console.warn('Failed to update onboarding_completed in Supabase:', err));

        OnboardingPolicy.markCompleted(user.id);
      }
      const intent = IntentPolicy.popIntent();
      navigate(intent ? intent : '/dashboard', { replace: true });
    }
  };

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden relative">

      {/* Background decoration */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent dark:from-indigo-900/20 pointer-events-none" />

      <motion.div
        layout
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-2xl relative z-10 border border-slate-100 dark:border-slate-700/50"
      >

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-500'
                  : idx < currentStepIndex
                    ? 'w-2 bg-indigo-300 dark:bg-indigo-800'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
               <Icon className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              {currentStep.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed min-h-[80px]">
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <Button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
             {currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Go to Dashboard' : 'Continue'}
             {currentStepIndex !== ONBOARDING_STEPS.length - 1 && <ArrowRight className="w-5 h-5" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
