import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { OnboardingPolicy } from '@/lib/navigation/policies/OnboardingPolicy';
import { Button } from '@/components/Button/Button';
import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNotification } from '@/stores/useNotificationStore';

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

  const handleSubmit = async () => {
    if (!targetExam) {
      showToast({ message: 'Please select a target exam', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    if (user) {
      try {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            full_name: fullName,
            target_exam: targetExam
          }
        });
        OnboardingPolicy.markCompleted(user.id);
      } catch (err) {
        console.warn('Failed to update onboarding_completed in Supabase:', err);
      }
    }

    const intent = IntentPolicy.popIntent();
    navigate(intent ? intent : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent dark:from-indigo-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-2xl relative z-10 border border-slate-100 dark:border-slate-700/50"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
             <Sparkles className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Welcome to MindFlow!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
            Let's personalize your learning experience.
          </p>

          <div className="w-full space-y-4 text-left">
            {!user?.user_metadata?.full_name && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam
              </label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white appearance-none"
              >
                <option value="" disabled>Select your primary goal...</option>
                <option value="ssc">SSC (CGL, CHSL, MTS)</option>
                <option value="banking">Banking (IBPS, SBI)</option>
                <option value="railways">Railways (RRB)</option>
                <option value="state_psc">State PSC / Police</option>
                <option value="other">Other Competitive Exams</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mb-4 px-2">
            By continuing, you agree to our Terms of Service and Privacy Policy. Your data is stored securely.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70"
          >
             {isSubmitting ? 'Setting up...' : 'Go to Dashboard'}
             {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
