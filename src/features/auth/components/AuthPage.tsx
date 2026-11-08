import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { BrandLogo, BrandSpinner } from '@/components/brand';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';

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
 * Supported features:
 * - Direction-aware Framer Motion horizontal slide transition (respects prefers-reduced-motion).
 * - Fixed, anchored brand header (never jumps between steps).
 * - Android hardware back button & Escape key returns from Step 2 to Step 1.
 * - Auto-focus on password input on Step 2, and email input on return to Step 1.
 * - Password manager credential preservation with hidden username field in Step 2.
 * - Single pinned terms/privacy line at bottom.
 */
const AuthPage: React.FC<AuthPageProps> = () => {
  // 2-Step progressive flow state: 'email' -> 'password'
  const [step, setStep] = useState<'email' | 'password'>('email');
  // Direction for slide transition: 1 = forward (slide left), -1 = backward (slide right)
  const [direction, setDirection] = useState<1 | -1>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Focus tracking to hide footer only while virtual keyboard is open on small phones
  const [isFormFocused, setIsFormFocused] = useState(false);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Input refs for programmatic focus between steps
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Debounced focus handling to prevent jumping when moving between fields
  const handleFormFocusIn = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    setIsFormFocused(true);
  };

  const handleFormFocusOut = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = setTimeout(() => {
      setIsFormFocused(false);
    }, 150);
  };

  // Keyboard Escape and Android hardware back button handling on Step 2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'password') {
        e.preventDefault();
        handleBackToEmail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [step]);

  /**
   * Return from Step 2 to Step 1.
   */
  const handleBackToEmail = () => {
    setDirection(-1);
    setStep('email');
    setError(null);
    requestAnimationFrame(() => {
      emailInputRef.current?.focus();
    });
  };

  /**
   * Step 1 Continue: Validates email format and slides forward to Step 2.
   * (Zero account existence / enumeration check for user safety).
   */
  const handleContinueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      emailInputRef.current?.focus();
      return;
    }

    // Standard email regex format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    setDirection(1);
    setStep('password');
    // Programmatic focus on password input in same gesture
    requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
    });
  };

  /**
   * Step 2 Submit: Authenticates email + password with Supabase.
   */
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password) {
      setError("Password is required.");
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
          throw new Error("Invalid email or password. Please try again.");
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
            redirectTo: window.location.origin + window.location.pathname + '#/'
          }
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message || 'Google sign in failed');
        setIsGoogleLoading(false);
      }
    }
  };

  // Direction-aware Framer Motion variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? 36 : -36),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? -36 : 36),
      opacity: 0,
    }),
  };

  return (
    <main
      id="main-content"
      role="main"
      className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-between relative bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-0 inset-x-0 h-[220px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)' }}
      />

      <div
        // data-headlessui-state="open" allows useHardwareBackButton to intercept back button on Step 2 and trigger Escape
        data-headlessui-state={step === 'password' ? 'open' : undefined}
        className="w-full max-w-sm sm:max-w-md h-full flex flex-col justify-between relative z-10 bg-transparent border-0 shadow-none p-0 md:bg-white md:dark:bg-slate-900/80 md:p-8 md:rounded-3xl md:shadow-xl md:border md:border-slate-200/50 md:dark:border-slate-800/50 md:backdrop-blur-xl md:h-auto md:max-h-[92dvh] md:my-auto"
      >
        {/* 1. Anchored Header Block (Never shifts or collapses) */}
        <header className="flex flex-col items-center text-center shrink-0 pt-1 pb-1 [@media(min-height:750px)]:pb-3">
          <div className="mb-2 [@media(min-height:750px)]:mb-3">
            <BrandLogo variant="wordmark" size="md" />
          </div>
          <h1 className="text-xl [@media(min-height:750px)]:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs [@media(min-height:750px)]:text-sm text-gray-600 dark:text-gray-400">
            New to MindFlow?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              CREATE ACCOUNT
            </button>
          </p>
        </header>

        {/* 2. Middle Step Container (Stable min-height to prevent vertical layout shifts) */}
        <div className="w-full my-auto flex flex-col justify-center min-h-[220px] [@media(min-height:750px)]:min-h-[250px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 'email' ? (
              /* STEP 1: EMAIL & GOOGLE IDENTIFICATION */
              <motion.div
                key="step-email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full flex flex-col gap-2.5 [@media(min-height:750px)]:gap-3.5"
              >
                {/* Primary Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isEmailLoading || isGoogleLoading}
                  className={`w-full group relative flex justify-center items-center gap-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold h-11 [@media(min-height:750px)]:h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-xs [@media(min-height:750px)]:text-sm transition-all duration-200 shadow-sm overflow-hidden ${
                    isEmailLoading ? 'opacity-50 cursor-not-allowed' : (isGoogleLoading ? 'cursor-wait' : '')
                  }`}
                >
                  {isGoogleLoading ? (
                    <>
                      <BrandSpinner variant="inline" size="sm" className="relative z-10 text-indigo-600 dark:text-indigo-400" />
                      <span className="relative z-10 font-bold">Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative z-10 flex items-center justify-center bg-transparent p-0.5 rounded-full"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path></svg>
                      </motion.div>
                      <span className="relative z-10 font-bold tracking-wide">Sign in with Google</span>
                    </>
                  )}
                </button>

                {/* Or continue with email divider */}
                <div className="relative my-0.5">
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-[#F5F7FF] dark:bg-slate-900/90 text-gray-500">Or continue with email</span>
                  </div>
                </div>

                {/* Email Input Form */}
                <form
                  onSubmit={handleContinueEmail}
                  onFocusCapture={handleFormFocusIn}
                  onBlurCapture={handleFormFocusOut}
                  className="space-y-2.5 [@media(min-height:750px)]:space-y-3.5"
                >
                  <div>
                    <label className="block text-xs [@media(min-height:750px)]:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1" htmlFor="email-input">
                      Email
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
                      className="select-text block w-full px-3.5 h-11 [@media(min-height:750px)]:h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs [@media(min-height:750px)]:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                    />
                  </div>

                  {error && <p className="text-xs text-red-500 text-center py-0.5">{error}</p>}
                  {message && <p className="text-xs text-green-500 text-center py-0.5">{message}</p>}

                  <button
                    type="submit"
                    className="w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold h-11 [@media(min-height:750px)]:h-12 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-xs [@media(min-height:750px)]:text-sm transition-all duration-200 shadow-sm"
                  >
                    <span>Continue</span>
                    <motion.svg
                      className="w-4 h-4 [@media(min-height:750px)]:w-5 [@media(min-height:750px)]:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ x: 0 }}
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                  </button>
                </form>
              </motion.div>
            ) : (
              /* STEP 2: PASSWORD AUTHENTICATION */
              <motion.div
                key="step-password"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full flex flex-col gap-2.5 [@media(min-height:750px)]:gap-3.5"
              >
                {/* Active Email Pill with Quick Change Action */}
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                <form
                  onSubmit={handleAuthAction}
                  onFocusCapture={handleFormFocusIn}
                  onBlurCapture={handleFormFocusOut}
                  className="space-y-2.5 [@media(min-height:750px)]:space-y-3.5"
                >
                  {/* Hidden email input for password manager credential matching */}
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
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block text-xs [@media(min-height:750px)]:text-sm font-semibold text-gray-900 dark:text-gray-200" htmlFor="password-input">
                        Password
                      </label>
                      <a
                        href="#!"
                        onClick={() => alert('Forgot password functionality to be implemented')}
                        className="text-xs [@media(min-height:750px)]:text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Forgot Password?
                      </a>
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
                        className="select-text block w-full px-3.5 pr-10 h-11 [@media(min-height:750px)]:h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 text-xs [@media(min-height:750px)]:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 00-4.243-4.243" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd"></path></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-500 text-center py-0.5">{error}</p>}
                  {message && <p className="text-xs text-green-500 text-center py-0.5">{message}</p>}

                  <button
                    type="submit"
                    disabled={isEmailLoading || isGoogleLoading}
                    className={`w-full group relative flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold h-11 [@media(min-height:750px)]:h-12 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-xs [@media(min-height:750px)]:text-sm transition-all duration-200 shadow-sm overflow-hidden ${
                      isGoogleLoading ? 'opacity-50 cursor-not-allowed' : (isEmailLoading ? 'cursor-wait' : '')
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
                          className="w-4 h-4 [@media(min-height:750px)]:w-5 [@media(min-height:750px)]:h-5 relative z-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </motion.svg>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Pinned Legal Footer (Hidden only on small screens when typing) */}
        <footer
          className={`pt-2 pb-1 text-center shrink-0 transition-opacity duration-200 ${
            isFormFocused ? 'hidden md:block' : 'block'
          }`}
        >
          <p className="text-[11px] [@media(min-height:750px)]:text-xs text-gray-500 dark:text-gray-400 leading-tight">
            By continuing, you agree to our{' '}
            <a href="#/about/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">
              Terms of Service
            </a>
            ,{' '}
            <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">
              Privacy Policy
            </a>{' '}
            and Cookie Use.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default AuthPage;
