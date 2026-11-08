import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useNavigate, useLocation } from 'react-router-dom';

import { supabase } from '../../../lib/supabase';
import { BrandLogo, BrandSpinner } from '@/components/brand';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * Props for the AuthPage component.
 */
interface AuthPageProps {
  onBack?: () => void;
}

/**
 * Authentication page component handling progressive 2-step Sign In flow.
 * Step 1: Google OAuth or Email identification with format validation.
 * Step 2: Password authentication with active email pill and password manager autofill support.
 *
 * Senior UX Architecture:
 * - Cohesive vertical centering: eliminates the massive whitespace void on tall phones (e.g. Samsung M51 915px height).
 * - Terms & Privacy notice permanently placed directly below primary action button (never vanishes during typing).
 * - Focus ring clearance: p-1 gutter prevents focus ring from being clipped by overflow-hidden on the left/right.
 * - Dynamic height adaptability: gracefully scales down on ultra-short screens (<500px) and landscape devices with 0 scroll.
 * - Minimum 44x44px touch targets on all interactive elements.
 * - Hardware Back & Escape navigation from Step 2 to Step 1.
 * - Password manager credential compatibility with hidden username field.
 */
const AuthPage: React.FC<AuthPageProps> = () => {
  // 2-Step progressive flow state: 'email' -> 'password'
  const [step, setStep] = useState<'email' | 'password'>('email');
  // Direction for slide transition: 1 = forward (slide left), -1 = backward (slide right)
  const [direction, setDirection] = useState<1 | -1>(1);

  const location = useLocation();
  const [email, setEmail] = useState(() => (location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Input refs for programmatic focus between steps
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();


  const showToast = useNotificationStore((state) => state.showToast);

  // Reliable programmatic focus management between steps
  useEffect(() => {
    // 60ms delay ensures Framer Motion AnimatePresence has mounted the incoming DOM node
    const timer = setTimeout(() => {
      if (step === 'email') {
        emailInputRef.current?.focus();
      } else if (step === 'password') {
        passwordInputRef.current?.focus();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [step]);

  // Keyboard Escape and Android hardware back button handling on Step 2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'password') {
        e.preventDefault();
        e.stopPropagation();
        handleBackToEmail();
      }
    };
    // Attach to document in capture phase to reliably intercept back events dispatched from useHardwareBackButton
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [step]);

  /**
   * Return from Step 2 to Step 1.
   */
  const handleBackToEmail = () => {
    setDirection(-1);
    setStep('email');
    setError(null);


  };

  /**
   * Step 1 Continue: Validates email format and slides forward to Step 2.
   * (Zero account existence / enumeration check for user safety).
   */
  const handleContinueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      emailInputRef.current?.focus();
      return;
    }

    // Standard email regex format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    // Persist clean sanitized email into state
    setEmail(trimmed);
    setDirection(1);
    setStep('password');

  };

  /**
   * Step 2 Submit: Authenticates email + password with Supabase.
   */
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


    if (!password) {
      setError('Password is required.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsEmailLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please try again or reset your password.');
        }
        throw signInError;
      }

      if (data.session) {
        triggerHaptic('success');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      triggerHaptic('error');
      setIsEmailLoading(false);
    }
  };

  /**
   * Handles Google OAuth sign-in.
   */
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        setError(err.message || 'Google sign in failed');
        triggerHaptic('error');
        setIsGoogleLoading(false);
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + window.location.pathname + '#/',
          },
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message || 'Google sign in failed');
        setIsGoogleLoading(false);
      }
    }
  };

  /**
   * Handle Forgot Password click.
   * Dispatches password recovery email via Supabase Auth.
   */
  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic('light');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showToast({
        title: 'Reset Password',
        message: 'Please enter your email in Step 1 first.',
        variant: 'info',
      });
      handleBackToEmail();
      return;
    }

    setIsResettingPassword(true);
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}#/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      showToast({
        title: 'Reset Link Sent',
        message: `Password reset instructions sent to ${cleanEmail}`,
        variant: 'success',
      });
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      showToast({
        title: 'Reset Failed',
        message: err.message || 'Unable to send password reset email. Please try again.',
        variant: 'error',
      });
      triggerHaptic('error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Direction-aware Framer Motion variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -32 : 32,
      opacity: 0,
    }),
  };

  return (
    <main
      id="main-content"
      role="main"
      className="h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-center relative bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 sm:px-6 py-2 sm:py-6 [@media(max-height:500px)]:py-1 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-0 inset-x-0 h-[260px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(120% 220px at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 100%)',
        }}
      />

      {/* Main Cohesive Card Container */}
      <div
        data-headlessui-state={step === 'password' ? 'open' : undefined}
        className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col my-auto bg-transparent md:bg-white md:dark:bg-slate-900/90 md:p-8 md:rounded-3xl md:shadow-2xl md:border md:border-slate-200/80 md:dark:border-slate-800/80 md:backdrop-blur-xl transition-all"
      >
        {/* 1. Header Block (Cohesive Spacing - No 260px void) */}
        <header className="flex flex-col items-center text-center mb-3 sm:mb-5 [@media(max-height:500px)]:mb-1.5 shrink-0 relative">
          {/* Quick Back Arrow for Step 2 */}
          {step === 'password' && (
            <button
              type="button"
              onClick={handleBackToEmail}
              aria-label="Back to email"
              className="absolute left-0 top-0 w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="mb-2 [@media(max-height:500px)]:mb-1">
            <BrandLogo variant="wordmark" size="md" />
          </div>

          <h1 className="text-xl sm:text-2xl [@media(max-height:500px)]:text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            {step === 'email' ? 'Welcome Back' : 'Enter Password'}
          </h1>

          <p className="mt-1 [@media(max-height:500px)]:mt-0.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 [@media(max-height:420px)]:hidden">
            {step === 'email' ? (
              <>
                New to MindFlow?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup', { state: { email } })}
                  className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline py-0.5 px-1 transition-colors"
                >
                  CREATE ACCOUNT
                </button>
              </>
            ) : (
              'Enter your password to sign in'
            )}
          </p>
        </header>

        {/* 2. Step Slider Container (p-1 Gutter guarantees focus ring is NEVER clipped by overflow-hidden) */}
        <div className="w-full relative overflow-hidden p-1 -m-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 'email' ? (
              /* ================= STEP 1: EMAIL & GOOGLE IDENTIFICATION ================= */
              <motion.div
                key="step-email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full flex flex-col gap-2.5 sm:gap-3 [@media(max-height:500px)]:gap-1.5"
              >
                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isEmailLoading || isGoogleLoading}
                  className={`w-full group relative flex justify-center items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold h-11 sm:h-12 [@media(max-height:500px)]:h-9 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 dark:focus:ring-indigo-400/50 text-xs sm:text-sm transition-all shadow-sm ${
                    isEmailLoading ? 'opacity-50 cursor-not-allowed' : isGoogleLoading ? 'cursor-wait' : ''
                  }`}
                >
                  {isGoogleLoading ? (
                    <>
                      <BrandSpinner variant="inline" size="sm" className="relative z-10 text-indigo-600 dark:text-indigo-400" />
                      <span className="relative z-10 font-bold">Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
                        <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
                        <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50" />
                        <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
                      </svg>
                      <span className="font-semibold tracking-normal">Sign in with Google</span>
                    </>
                  )}
                </button>

                {/* Or continue with email divider */}
                <div className="relative my-0.5">
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-[#F5F7FF] dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Input Form */}
                <form onSubmit={handleContinueEmail} className="space-y-2.5 sm:space-y-3 [@media(max-height:500px)]:space-y-1.5">
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1 [@media(max-height:500px)]:mb-0.5"
                    >
                      Email Address
                    </label>
                    <input
                      ref={emailInputRef}
                      id="email-input"
                      name="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="select-text block w-full px-3.5 sm:px-4 h-11 sm:h-12 [@media(max-height:500px)]:h-9 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                    />
                  </div>

                  {/* Animated Error Alert */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Continue Button */}
                  <button
                    type="submit"
                    className="w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold h-11 sm:h-12 [@media(max-height:500px)]:h-9 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.99]"
                  >
                    <span>Continue</span>
                    <motion.svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ x: 0 }}
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                  </button>
                </form>

                {/* 3. Authoritative Terms & Privacy notice (Directly below Continue - Never Vanishes) */}
                <p className="text-[11px] [@media(max-height:500px)]:text-[10px] text-center text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                  By continuing, you agree to our{' '}
                  <a
                    href="#/about/terms-of-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a
                    href="#/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </motion.div>
            ) : (
              /* ================= STEP 2: PASSWORD AUTHENTICATION ================= */
              <motion.div
                key="step-password"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full flex flex-col gap-2.5 sm:gap-3 [@media(max-height:500px)]:gap-1.5"
              >
                {/* Active Email Pill with Quick Change Action */}
                <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 [@media(max-height:500px)]:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2 py-0.5 px-1"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleAuthAction} className="space-y-2.5 sm:space-y-3 [@media(max-height:500px)]:space-y-1.5">
                  {/* Visually hidden username input for password managers */}
                  <input
                    type="email"
                    name="username"
                    value={email}
                    autoComplete="username"
                    tabIndex={-1}
                    className="sr-only"
                    readOnly
                  />

                  <div>
                    <div className="flex justify-between items-baseline mb-1 [@media(max-height:500px)]:mb-0.5">
                      <label
                        htmlFor="password-input"
                        className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isResettingPassword || isEmailLoading}
                        className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResettingPassword ? 'Sending Link...' : 'Forgot Password?'}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        id="password-input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="select-text block w-full px-3.5 sm:px-4 pr-11 h-11 sm:h-12 [@media(max-height:500px)]:h-9 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                      />
                      {/* Password toggle button with guaranteed 44x44px touch target */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
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

                  {/* Animated Error Alert */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isEmailLoading || isGoogleLoading}
                    className={`w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold h-11 sm:h-12 [@media(max-height:500px)]:h-9 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.99] ${
                      isGoogleLoading ? 'opacity-50 cursor-not-allowed' : isEmailLoading ? 'cursor-wait' : ''
                    }`}
                  >
                    {isEmailLoading ? (
                      <>
                        <BrandSpinner variant="inline" size="sm" className="relative z-10" />
                        <span className="relative z-10">Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Sign In</span>
                        <motion.svg
                          className="w-4 h-4 relative z-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </motion.svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Terms notice on Step 2 as well */}
                <p className="text-[11px] [@media(max-height:500px)]:text-[10px] text-center text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                  By continuing, you agree to our{' '}
                  <a
                    href="#/about/terms-of-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a
                    href="#/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
