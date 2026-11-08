import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BrandLogo, BrandSpinner } from '@/components/brand';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { ArrowLeft, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const showToast = useNotificationStore((state) => state.showToast);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      triggerHaptic('success');
      showToast({
        title: 'Password Updated',
        message: 'Your password has been reset successfully.',
        variant: 'success',
      });

      // Brief delay so user sees confirmation before navigation
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err: any) {
      console.error('[ResetPassword] Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 sm:px-6 py-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto"
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-0 inset-x-0 h-[260px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(120% 220px at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 100%)',
        }}
      />

      {/* Main Cohesive Card Container */}
      <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col my-auto bg-transparent md:bg-white md:dark:bg-slate-900/90 md:p-8 md:rounded-3xl md:shadow-2xl md:border md:border-slate-200/80 md:dark:border-slate-800/80 md:backdrop-blur-xl transition-all">
        {/* Header Block */}
        <header className="flex flex-col items-center text-center mb-6 shrink-0 relative">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to Login"
            className="absolute left-0 top-0 w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="mb-2">
            <BrandLogo variant="wordmark" size="md" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            Reset Password
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Create a secure new password for your MindFlow account
          </p>
        </header>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-6 px-4 space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Password Updated!</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your password has been changed. Taking you to your dashboard...
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password Input */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="select-text block w-full px-3.5 sm:px-4 pr-11 h-11 sm:h-12 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="select-text block w-full px-3.5 sm:px-4 pr-11 h-11 sm:h-12 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Animated Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Password Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold h-11 sm:h-12 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.99] ${
                isLoading ? 'cursor-wait opacity-80' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <BrandSpinner variant="inline" size="sm" className="relative z-10" />
                  <span className="relative z-10">Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Save New Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default ResetPasswordPage;
