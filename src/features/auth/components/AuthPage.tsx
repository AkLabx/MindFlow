import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useLocation } from 'react-router-dom';

import { supabase } from '../../../lib/supabase';
import { BrandLogo, BrandSpinner } from '@/components/brand';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AuthHeroShowcase } from './AuthHeroShowcase';
import { AuthLegalModal } from './AuthLegalModal';
import { PasswordStrengthMeter, evaluatePasswordStrength } from './PasswordStrengthMeter';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';

export interface AuthPageProps {
  onBack?: () => void;
  initialMode?: 'signin' | 'signup';
}

interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'mindflow_auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const getStoredRateLimit = (): RateLimitState => {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return { attempts: 0, lockedUntil: null };
};

const recordFailedAttempt = (): RateLimitState => {
  const current = getStoredRateLimit();
  const attempts = current.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_SECONDS * 1000 : null;
  const updated = { attempts: lockedUntil ? 0 : attempts, lockedUntil };
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota
  }
  return updated;
};

const clearRateLimit = () => {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // ignore
  }
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin'
}) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const showToast = useNotificationStore((state) => state.showToast);

  // Authentication Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    if (location.pathname.includes('/signup')) return 'signup';
    return initialMode;
  });

  // Step Machine: 'email' -> 'password' (Sign In) or 'details' (Sign Up)
  const [step, setStep] = useState<'email' | 'credentials'>('email');
  const [direction, setDirection] = useState<1 | -1>(1);

  // Form State
  const [email, setEmail] = useState(() => (location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Feedback States
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(0);

  // Rate Limiting State
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Legal In-App Modal State
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // Refs for auto-focus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  // Check rate limit timer
  useEffect(() => {
    const checkLockout = () => {
      const stored = getStoredRateLimit();
      if (stored.lockedUntil && stored.lockedUntil > Date.now()) {
        const remaining = Math.ceil((stored.lockedUntil - Date.now()) / 1000);
        setLockoutRemaining(remaining);
      } else {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cooldown countdown for Forgot Password
  useEffect(() => {
    if (forgotPasswordCooldown <= 0) return;
    const timer = setTimeout(() => {
      setForgotPasswordCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [forgotPasswordCooldown]);

  // Programmatic focus transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'email') {
        emailInputRef.current?.focus();
      } else if (mode === 'signin') {
        passwordInputRef.current?.focus();
      } else {
        fullNameInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [step, mode]);

  // Escape (Web) & Android Hardware Back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (legalModalType) {
          triggerHaptic('light');
          setLegalModalType(null);
          return;
        }
        if (step === 'credentials') {
          e.preventDefault();
          handleBackToEmail();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [step, legalModalType]);

  // Capacitor Android Hardware & Gesture Back Button Listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: any = null;
    const registerBackHandler = async () => {
      listenerHandle = await App.addListener('backButton', () => {
        if (legalModalType) {
          triggerHaptic('light');
          setLegalModalType(null);
          return;
        }
        if (step === 'credentials') {
          triggerHaptic('light');
          handleBackToEmail();
          return;
        }
        // At root login step on Android, minimize the app smoothly
        App.minimizeApp();
      });
    };

    registerBackHandler();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, [step, legalModalType]);

  const handleBackToEmail = () => {
    triggerHaptic('light');
    setDirection(-1);
    setStep('email');
    setError(null);
    setSuccessNotice(null);
    setForgotPasswordSent(false);
  };

  const handleSwitchMode = (newMode: 'signin' | 'signup') => {
    triggerHaptic('light');
    setMode(newMode);
    setError(null);
    setSuccessNotice(null);
    setForgotPasswordSent(false);
  };

  /**
   * Step 1 Submit: Format validation and advance to credentials step
   */
  const handleContinueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      triggerHaptic('error');
      setError('Please enter your email address.');
      emailInputRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      triggerHaptic('error');
      setError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    triggerHaptic('light');
    setEmail(trimmed);
    setDirection(1);
    setStep('credentials');
  };

  /**
   * Sign In Submit
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (lockoutRemaining > 0) {
      setError(`Too many failed attempts. Please wait ${lockoutRemaining}s before trying again.`);
      return;
    }

    if (!password) {
      setError('Password is required.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsEmailLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        // Record failure for brute force tracking
        const updated = recordFailedAttempt();
        if (updated.lockedUntil) {
          setLockoutRemaining(LOCKOUT_SECONDS);
          throw new Error(`Account temporarily locked for ${LOCKOUT_SECONDS}s due to repeated failed attempts.`);
        }

        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. Please verify your credentials or reset your password.');
        }
        if (signInError.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('Email not confirmed. Please verify your inbox or click Resend below.');
        }
        throw signInError;
      }

      if (data?.session) {
        clearRateLimit();
        triggerHaptic('success');
      } else {
        throw new Error('Unable to establish session. Please verify your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      triggerHaptic('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  /**
   * Sign Up Submit
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Please enter your full name.');
      fullNameInputRef.current?.focus();
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      passwordInputRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please confirm your age and agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsEmailLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: cleanName,
            terms_accepted_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
            age_confirmed: CURRENT_AGE_ATTESTATION,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        triggerHaptic('success');
        setSuccessNotice('Account created successfully! Please check your email for the verification link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      triggerHaptic('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  /**
   * Resend Email Confirmation
   */
  const handleResendConfirmation = async () => {
    setIsResendingConfirmation(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (resendError) throw resendError;
      showToast({
        title: 'Confirmation Resent',
        message: `A fresh verification link was sent to ${email}.`,
        variant: 'success',
      });
      setSuccessNotice(`Verification link sent to ${email}. Please check your inbox and spam folder.`);
      triggerHaptic('success');
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email.');
      triggerHaptic('error');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  /**
   * Forgot Password Handler with Cooldown
   */
  const handleForgotPassword = async () => {
    if (forgotPasswordCooldown > 0) return;
    triggerHaptic('light');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      handleBackToEmail();
      return;
    }

    setIsEmailLoading(true);
    try {
      const cleanPath = window.location.pathname.endsWith('/')
        ? window.location.pathname
        : window.location.pathname + '/';
      const redirectUrl = `${window.location.origin}${cleanPath}#/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setForgotPasswordSent(true);
      setForgotPasswordCooldown(60);
      showToast({
        title: 'Reset Instructions Sent',
        message: `Password reset link delivered to ${cleanEmail}`,
        variant: 'success',
      });
      triggerHaptic('success');
    } catch (err: any) {
      setError(err.message || 'Unable to send password reset email.');
      triggerHaptic('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  /**
   * Google OAuth Handler with Graceful Cancellation
   */
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setSuccessNotice(null);

    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const { error: sError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (sError) throw sError;
        triggerHaptic('success');
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        // Gracefully ignore native user cancellation (code 12501 or cancelled)
        if (err?.code === '12501' || msg.includes('12501') || msg.toLowerCase().includes('cancel')) {
          console.log('[Auth] Google sign-in cancelled by user.');
        } else {
          setError(err.message || 'Google sign-in was interrupted. Please retry.');
          triggerHaptic('error');
        }
      } finally {
        setIsGoogleLoading(false);
      }
    } else {
      try {
        const { error: oAuthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}${window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/'}#/`,
          },
        });
        if (oAuthError) throw oAuthError;
        triggerHaptic('success');
      } catch (err: any) {
        setError(err.message || 'Google sign in failed');
        setIsGoogleLoading(false);
      }
    }
  };

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

  const isEmailNotConfirmed = error?.toLowerCase().includes('email not confirmed');

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-[100dvh] w-full flex flex-col lg:items-center lg:justify-center relative bg-slate-50 dark:bg-slate-950 lg:bg-gradient-to-br lg:from-slate-50 lg:via-indigo-50/30 lg:to-purple-50/20 lg:dark:from-slate-950 lg:dark:via-slate-900 lg:dark:to-indigo-950/40 p-0 sm:p-0 md:p-4 lg:p-8 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-x-hidden overscroll-contain select-none"
    >
      {/* Background ambient lighting (desktop only) */}
      <div className="hidden lg:block absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Main Responsive Container: Edge-to-edge native surface on mobile, floating card on desktop */}
      <div className="relative z-10 w-full max-w-5xl my-0 lg:my-auto bg-white dark:bg-slate-900 border-0 md:border border-slate-200/80 dark:border-slate-800 rounded-none md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[100dvh] md:min-h-[600px] lg:min-h-[680px] flex-1 lg:flex-initial">
        
        {/* Left Column: Desktop Hero Showcase */}
        <div className="hidden lg:flex lg:col-span-7 h-full">
          <AuthHeroShowcase />
        </div>

        {/* Right Column: Interactive Auth Console */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 flex-1">
          {/* Android Native Top App Bar on Mobile when on credentials step */}
          {step === 'credentials' && (
            <div className="flex items-center h-14 px-4 border-b border-slate-100 dark:border-slate-800/80 lg:hidden shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
              <button
                type="button"
                onClick={handleBackToEmail}
                aria-label="Back to email input"
                className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="ml-2 font-semibold text-sm text-slate-800 dark:text-slate-100">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </span>
            </div>
          )}

          <div className="p-5 sm:p-8 lg:p-10 flex-1 flex flex-col justify-between">
            <div>
              {/* Brand Logo & Mobile Intro Header */}
              <header className="flex flex-col items-center text-center mb-5 shrink-0 relative">
                {step === 'credentials' && (
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    aria-label="Back to email input"
                    className="hidden lg:flex absolute left-0 top-0 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="mb-2">
                  <BrandLogo variant="wordmark" size="md" />
                </div>

                {/* Dual-Tab Mode Switcher with Android Material Feel */}
                <div className="w-full max-w-xs mt-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signin')}
                    className={`flex-1 min-h-[38px] rounded-xl transition-all active:scale-[0.97] ${
                      mode === 'signin'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className={`flex-1 min-h-[38px] rounded-xl transition-all active:scale-[0.97] ${
                      mode === 'signup'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-4">
                  {mode === 'signin'
                    ? step === 'email'
                      ? 'Welcome Back'
                      : 'Enter Password'
                    : step === 'email'
                    ? 'Join MindFlow'
                    : 'Complete Profile'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'signin'
                    ? 'Access your saved mock drills and personal notebook'
                    : 'Get start-to-finish AI preparation for competitive exams'}
                </p>
              </header>

            {/* Step Slider */}
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
                    className="w-full flex flex-col gap-3"
                  >
                    {/* Google OAuth Button */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        handleGoogleSignIn();
                      }}
                      disabled={isEmailLoading || isGoogleLoading}
                      className={`w-full min-h-[44px] h-12 flex justify-center items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-sm transition-all shadow-sm active:scale-[0.98] active:bg-slate-100 dark:active:bg-slate-700/60 select-none ${
                        isEmailLoading ? 'opacity-50 cursor-not-allowed' : isGoogleLoading ? 'cursor-wait' : ''
                      }`}
                    >
                      {isGoogleLoading ? (
                        <>
                          <BrandSpinner variant="inline" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                          <span>Connecting Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
                            <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
                            <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50" />
                            <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
                          </svg>
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    <div className="relative my-1">
                      <div aria-hidden="true" className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white dark:bg-slate-900 text-slate-400">
                          Or continue with email
                        </span>
                      </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleContinueEmail} className="space-y-3">
                      <div>
                        <label
                          htmlFor="email-input"
                          className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
                        >
                          Email Address
                        </label>
                        <input
                          ref={emailInputRef}
                          id="email-input"
                          name="email"
                          type="email"
                          inputMode="email"
                          enterKeyHint="next"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="aspirant@mindflow.app"
                          /* 16px font on mobile prevents iOS Safari auto-zoom bug */
                          className="select-text block w-full px-4 min-h-[44px] h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                        />
                      </div>

                      {/* Error Banner */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium overflow-hidden"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        className="w-full min-h-[44px] h-12 flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] active:brightness-95 select-none"
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
                  </motion.div>
                ) : (
                  /* ================= STEP 2: CREDENTIALS (SIGN IN OR SIGN UP) ================= */
                  <motion.div
                    key="step-credentials"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="w-full flex flex-col gap-3"
                  >
                    {/* Active Email Pill */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="min-h-[44px] px-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    {/* Mode: SIGN IN */}
                    {mode === 'signin' ? (
                      <form onSubmit={handleSignIn} className="space-y-3">
                        {/* Hidden username for password manager compliance */}
                        <input type="email" name="username" value={email} autoComplete="username" tabIndex={-1} className="sr-only" readOnly />

                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <label
                              htmlFor="password-input"
                              className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              disabled={isEmailLoading || forgotPasswordCooldown > 0}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 min-h-[44px] flex items-center"
                            >
                              {forgotPasswordCooldown > 0
                                ? `Retry in ${forgotPasswordCooldown}s`
                                : 'Forgot Password?'}
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              ref={passwordInputRef}
                              id="password-input"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              enterKeyHint="go"
                              autoComplete="current-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              /* 16px on mobile prevents iOS Safari auto-zoom */
                              className="select-text block w-full px-4 pr-12 min-h-[44px] h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowPassword(!showPassword);
                              }}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute inset-y-0 right-0 min-w-[44px] w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Forgot Password Confirmation Banner */}
                        {forgotPasswordSent && (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                            <Mail className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                            <div>
                              <p className="font-semibold">Reset instructions dispatched!</p>
                              <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                                Check your inbox and spam folder. Follow the link to reset your credentials.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Error Alert */}
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              role="alert"
                              aria-live="assertive"
                              initial={{ opacity: 0, y: -4, height: 'auto' }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -4, height: 0 }}
                              className="flex flex-col gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                              </div>

                              {/* Resend Confirmation Email Action */}
                              {isEmailNotConfirmed && (
                                <button
                                  type="button"
                                  onClick={handleResendConfirmation}
                                  disabled={isResendingConfirmation}
                                  className="self-start mt-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                  {isResendingConfirmation ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Resending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Resend Confirmation Email</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Rate Limit Lockout Banner */}
                        {lockoutRemaining > 0 && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Too many attempts. Lockout active: <strong>{lockoutRemaining}s</strong></span>
                          </div>
                        )}

                        {/* Sign In Submit Button */}
                        <button
                          type="submit"
                          disabled={isEmailLoading || isGoogleLoading || lockoutRemaining > 0}
                          className="w-full min-h-[44px] h-12 flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] active:brightness-95 select-none disabled:opacity-50"
                        >
                          {isEmailLoading ? (
                            <>
                              <BrandSpinner variant="inline" size="sm" />
                              <span>Signing In...</span>
                            </>
                          ) : (
                            <span>Sign In</span>
                          )}
                        </button>

                        {/* Step 2 New Aspirant Rescue Action */}
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleSwitchMode('signup')}
                            className="min-h-[44px] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 active:scale-95 transition-transform"
                          >
                            New to MindFlow? Create an account with this email
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Mode: SIGN UP */
                      <form onSubmit={handleSignUp} className="space-y-3">
                        <input type="email" name="username" value={email} autoComplete="username" tabIndex={-1} className="sr-only" readOnly />

                        {/* Full Name */}
                        <div>
                          <label htmlFor="fullname-input" className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Full Name
                          </label>
                          <input
                            ref={fullNameInputRef}
                            id="fullname-input"
                            type="text"
                            enterKeyHint="next"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Aspirant Name"
                            className="select-text block w-full px-4 min-h-[44px] h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                          />
                        </div>

                        {/* Password & Strength Meter */}
                        <div>
                          <label htmlFor="signup-password" className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Choose Password
                          </label>
                          <div className="relative">
                            <input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              enterKeyHint="next"
                              autoComplete="new-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="At least 8 characters"
                              className="select-text block w-full px-4 pr-12 min-h-[44px] h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowPassword(!showPassword);
                              }}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute inset-y-0 right-0 min-w-[44px] w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <PasswordStrengthMeter password={password} />
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              enterKeyHint="done"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              className="select-text block w-full px-4 pr-12 min-h-[44px] h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowConfirmPassword(!showConfirmPassword);
                              }}
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              className="absolute inset-y-0 right-0 min-w-[44px] w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* DPDP Act 2023 Statutory Minor / Learner Consent Clause */}
                        <div className="flex items-start gap-2.5 pt-1">
                          <input
                            id="terms-consent"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => {
                              triggerHaptic('light');
                              setAgreedToTerms(e.target.checked);
                              if (error) setError(null);
                            }}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <label htmlFor="terms-consent" className="text-xs text-slate-600 dark:text-slate-300 leading-normal select-none">
                            I confirm I am 18+, or have parental/guardian consent if under 18, and agree to the{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                triggerHaptic('light');
                                setLegalModalType('terms');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-700 active:opacity-75"
                            >
                              Terms of Service
                            </button>
                            {' '}and{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                triggerHaptic('light');
                                setLegalModalType('privacy');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-700 active:opacity-75"
                            >
                              Privacy Policy
                            </button>
                            .
                          </label>
                        </div>

                        {/* Error & Success Alerts */}
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              role="alert"
                              aria-live="assertive"
                              initial={{ opacity: 0, y: -4, height: 'auto' }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -4, height: 0 }}
                              className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{error}</span>
                            </motion.div>
                          )}
                          {successNotice && (
                            <motion.div
                              role="status"
                              aria-live="polite"
                              initial={{ opacity: 0, y: -4, height: 'auto' }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -4, height: 0 }}
                              className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                              <span>{successNotice}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Sign Up Submit Button */}
                        <button
                          type="submit"
                          disabled={isEmailLoading || isGoogleLoading}
                          className="w-full min-h-[44px] h-12 flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] active:brightness-95 select-none disabled:opacity-50"
                        >
                          {isEmailLoading ? (
                            <>
                              <BrandSpinner variant="inline" size="sm" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <span>Create Account</span>
                          )}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

          {/* Footer Legal Links (omitted on Create Account details step where the consent checkbox already sits) */}
          {!(step === 'credentials' && mode === 'signup') && (
            <footer className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 text-center select-none">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-1.5 leading-normal">
                <span>By continuing, you agree to our</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setLegalModalType('terms');
                  }}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline min-h-[44px] inline-flex items-center px-1"
                >
                  Terms of Service
                </button>
                <span>and</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setLegalModalType('privacy');
                  }}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline min-h-[44px] inline-flex items-center px-1"
                >
                  Privacy Policy
                </button>
                <span>.</span>
              </p>
            </footer>
          )}
        </div>
      </div>

      {/* In-App Zero-Latency Legal Viewer Dialog */}
      <AuthLegalModal
        isOpen={legalModalType !== null}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </main>
  );
};

export default AuthPage;
