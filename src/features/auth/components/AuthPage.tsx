import React, { useState, useEffect, useRef, useId } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useLocation, useNavigate } from 'react-router-dom';

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
  Clock,
  KeyRound,
  Lock,
  User,
  ChevronRight,
} from 'lucide-react';
import { AuthHeroShowcase } from './AuthHeroShowcase';
import { AuthLegalModal } from './AuthLegalModal';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { EmailOtpInput, OTP_LENGTH, sanitizeOtpCode } from './EmailOtpInput';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';
import { telemetry } from '@/lib/telemetry/telemetryService';
import { buildAuthRedirectUrl } from '../utils/authRedirect';
import { formatAuthError, validatePasswordPolicy } from '../utils/authErrorMapper';

export interface AuthPageProps {
  onBack?: () => void;
  initialMode?: 'signin' | 'signup';
}

type AuthView =
  | 'signin-email'
  | 'signin-choose'
  | 'signin-password'
  | 'signin-otp'
  | 'signin-recovery'
  | 'signup'
  | 'verify-email';

interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'mindflow_auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

interface ReadOnlyEmailFieldProps {
  email: string;
  onChangeEmail: () => void;
  changeLabel?: string;
}

/**
 * Displays the user's entered email as a clean, properly labeled read-only input box
 * with a leading Mail icon and accessible Change action (no status dots or toy badges).
 */
const ReadOnlyEmailField: React.FC<ReadOnlyEmailFieldProps> = ({
  email,
  onChangeEmail,
  changeLabel = 'Change',
}) => {
  const fieldId = useId();
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
      >
        Email Address
      </label>
      <div
        data-testid="auth-locked-email-field"
        className="flex items-center min-h-[48px] bg-slate-50 dark:bg-slate-800/75 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors"
      >
        <Mail
          className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-3.5"
          aria-hidden="true"
        />
        <input
          id={fieldId}
          type="email"
          value={email}
          readOnly
          aria-readonly="true"
          tabIndex={-1}
          className="select-text w-full min-w-0 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 truncate focus:outline-none cursor-default"
        />
        <button
          type="button"
          data-testid="auth-change-email-btn"
          onClick={onChangeEmail}
          className="min-h-[44px] px-3.5 mr-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 rounded-lg active:scale-95 transition-all shrink-0"
        >
          {changeLabel}
        </button>
      </div>
    </div>
  );
};

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
    <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
    <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" fill="#4CAF50" />
    <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,34.464,44,29.561,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const showToast = useNotificationStore((state) => state.showToast);

  // Clean linear screen state machine (zero parallel tab bars)
  const [view, setView] = useState<AuthView>(() => {
    if (location.pathname.includes('/signup') || initialMode === 'signup') return 'signup';
    return 'signin-email';
  });
  const [direction, setDirection] = useState<1 | -1>(1);

  // Form State
  const [email, setEmail] = useState(() => (location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Email OTP State (Signup, Passwordless Sign-In, Recovery)
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingSignInOtp, setIsSendingSignInOtp] = useState(false);
  const [signInOtpSent, setSignInOtpSent] = useState(false);
  const [signInOtpCooldown, setSignInOtpCooldown] = useState(0);
  const [signInOtpUnregistered, setSignInOtpUnregistered] = useState(false);
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [isVerifyingRecoveryOtp, setIsVerifyingRecoveryOtp] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  // Status & Feedback States
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [existingAccountNotice, setExistingAccountNotice] = useState(false);
  const [signupRecoveryOptions, setSignupRecoveryOptions] = useState<{
    canRetry: boolean;
    suggestGoogleFallback: boolean;
  } | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(0);

  // Rate Limiting State
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Legal In-App Modal State
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // Refs for programmatic focus & in-flight mutexes
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const signupPasswordInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const signupEmailInputRef = useRef<HTMLInputElement>(null);
  const isCheckingVerificationRef = useRef(false);
  const isSubmittingSignUpRef = useRef(false);
  const isSendingSignInOtpRef = useRef(false);
  const otpSentForEmailRef = useRef<string>('');

  const clearTransientFeedback = () => {
    setError(null);
    setSuccessNotice(null);
    setExistingAccountNotice(false);
    setSignupRecoveryOptions(null);
    setSignInOtpUnregistered(false);
  };

  const transitionToView = (nextView: AuthView, nextDir: 1 | -1) => {
    setDirection(nextDir);
    setView(nextView);
    clearTransientFeedback();
  };

  // Surface any expired/invalid email redirect errors captured by useAppBootstrap
  useEffect(() => {
    try {
      const redirectErr = sessionStorage.getItem('mindflow_auth_redirect_error');
      if (redirectErr) {
        sessionStorage.removeItem('mindflow_auth_redirect_error');
        setError(
          redirectErr.toLowerCase().includes('expired')
            ? 'Your verification or reset link has expired. Please sign in or request a fresh link.'
            : redirectErr
        );
      }
    } catch {}
  }, []);

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

  // Cooldown countdowns
  useEffect(() => {
    if (forgotPasswordCooldown <= 0) return;
    const timer = setTimeout(() => setForgotPasswordCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [forgotPasswordCooldown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (signInOtpCooldown <= 0) return;
    const timer = setTimeout(() => setSignInOtpCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [signInOtpCooldown]);

  // Programmatic focus transitions across linear steps (MWG multi-page forms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'signin-email') {
        emailInputRef.current?.focus();
      } else if (view === 'signin-password') {
        passwordInputRef.current?.focus();
      } else if (view === 'signup') {
        fullNameInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [view]);

  // Deterministic hierarchical back target (DEC-0002)
  const handleLogicalBack = () => {
    triggerHaptic('light');
    switch (view) {
      case 'signin-password':
      case 'signin-otp':
      case 'signin-recovery':
        setOtpCode('');
        setRecoveryOtpCode('');
        transitionToView('signin-choose', -1);
        return;
      case 'signin-choose':
        transitionToView('signin-email', -1);
        return;
      case 'signup':
        setPassword('');
        setConfirmPassword('');
        transitionToView('signin-email', -1);
        return;
      case 'verify-email':
        setOtpCode('');
        transitionToView('signup', -1);
        return;
      default:
        return;
    }
  };

  // Escape (Web) & Android Hardware Back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (legalModalType) {
          triggerHaptic('light');
          setLegalModalType(null);
          return;
        }
        if (view !== 'signin-email') {
          e.preventDefault();
          handleLogicalBack();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [view, legalModalType]);

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
        if (view !== 'signin-email') {
          handleLogicalBack();
          return;
        }
        App.minimizeApp();
      });
    };

    registerBackHandler();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, [view, legalModalType]);

  const handleEditEmail = () => {
    triggerHaptic('light');
    setOtpCode('');
    setRecoveryOtpCode('');
    setPassword('');
    transitionToView('signin-email', -1);
  };

  const handleOpenSignUp = () => {
    triggerHaptic('light');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setRecoveryOtpCode('');
    transitionToView('signup', 1);
  };

  const handleOpenSignIn = () => {
    triggerHaptic('light');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setRecoveryOtpCode('');
    const trimmed = email.trim().toLowerCase();
    if (trimmed && EMAIL_REGEX.test(trimmed)) {
      setEmail(trimmed);
      transitionToView('signin-choose', -1);
    } else {
      transitionToView('signin-email', -1);
    }
  };

  /**
   * Step 1 Submit (Sign In): Validate email and advance to stacked method chooser
   */
  const handleContinueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    clearTransientFeedback();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      triggerHaptic('error');
      setError('Please enter your email address.');
      emailInputRef.current?.focus();
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      triggerHaptic('error');
      setError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    // Reset stale OTP flags if user changed to a different email
    if (otpSentForEmailRef.current && otpSentForEmailRef.current !== trimmed) {
      setSignInOtpSent(false);
      setSignInOtpCooldown(0);
      setForgotPasswordCooldown(0);
      setOtpCode('');
      setRecoveryOtpCode('');
      otpSentForEmailRef.current = '';
    }

    triggerHaptic('light');
    setEmail(trimmed);
    transitionToView('signin-choose', 1);
  };

  /**
   * Sign In with Password Submit
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
        telemetry.emit('auth_login_succeeded', { provider: 'email' });
        triggerHaptic('success');
      } else {
        throw new Error('Unable to establish session. Please verify your email.');
      }
    } catch (err: any) {
      const formatted = formatAuthError(err, 'signin');
      setError(formatted.message);
      triggerHaptic('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  /**
   * Mutex-guarded Email + Password Account Creation (single vertical Create Account form)
   */
  const executeSignUp = async () => {
    if (isSubmittingSignUpRef.current) return;

    setError(null);
    setSuccessNotice(null);
    setExistingAccountNotice(false);
    setSignupRecoveryOptions(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Please enter your full name.');
      fullNameInputRef.current?.focus();
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      signupEmailInputRef.current?.focus();
      return;
    }
    setEmail(cleanEmail);

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message || 'Please choose a stronger password.');
      signupPasswordInputRef.current?.focus();
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

    isSubmittingSignUpRef.current = true;
    setIsEmailLoading(true);

    try {
      const emailRedirectTo = buildAuthRedirectUrl('signup');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
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
        const msg = String(signUpError.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          try {
            localStorage.removeItem('mindflow_is_signup');
          } catch {}
          setExistingAccountNotice(true);
          setError('An account with this email already exists. Please sign in or reset your password.');
          triggerHaptic('warning');
          return;
        }
        throw signUpError;
      }

      // Supabase Free Tier obfuscates existing accounts by returning a user with empty identities[]
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        try {
          localStorage.removeItem('mindflow_is_signup');
        } catch {}
        setExistingAccountNotice(true);
        setError('An account with this email already exists. Please sign in with your password, Google, or reset your password.');
        triggerHaptic('warning');
        return;
      }

      if (data?.user) {
        try {
          localStorage.setItem('mindflow_is_signup', 'true');
        } catch {
          // ignore storage quota errors
        }
        triggerHaptic('success');
        telemetry.emit('auth_signup_attempted', { provider: 'email' });
        if (data?.session) {
          clearRateLimit();
          setSuccessNotice('Account created successfully! Signing you in...');
        } else {
          setResendCooldown(60);
          setOtpCode('');
          transitionToView('verify-email', 1);
        }
      }
    } catch (err: any) {
      const formatted = formatAuthError(err, 'signup');
      setError(formatted.message);
      if (formatted.canRetry || formatted.suggestGoogleFallback) {
        setSignupRecoveryOptions({
          canRetry: formatted.canRetry,
          suggestGoogleFallback: formatted.suggestGoogleFallback,
        });
      }
      triggerHaptic('error');
    } finally {
      isSubmittingSignUpRef.current = false;
      setIsEmailLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSignUp();
  };

  /**
   * Checks whether newly registered email is confirmed (cross-tab session or signInWithPassword)
   * without tripping brute-force lockout on 'Email not confirmed'.
   */
  const checkEmailVerificationStatus = async (source: 'auto' | 'manual' = 'manual') => {
    if (isCheckingVerificationRef.current) return;
    isCheckingVerificationRef.current = true;
    if (source === 'manual') {
      setIsCheckingVerification(true);
      setError(null);
    }

    try {
      if (typeof (supabase.auth as any)?.getSession === 'function') {
        const { data: sessData } = await supabase.auth.getSession();
        if (sessData?.session) {
          clearRateLimit();
          telemetry.emit('auth_login_succeeded', { provider: 'email' });
          triggerHaptic('success');
          return;
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        if (source === 'manual') {
          setError('Please sign in with your email and password after confirming your inbox link.');
        }
        return;
      }

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInData?.session) {
        clearRateLimit();
        telemetry.emit('auth_login_succeeded', { provider: 'email' });
        triggerHaptic('success');
        showToast({
          title: 'Email Verified!',
          message: 'Your account is confirmed. Welcome to MindFlow!',
          variant: 'success',
        });
        return;
      }

      if (signInErr) {
        const msg = String(signInErr.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          if (source === 'manual') {
            setError(
              `Still waiting for verification. Please click the confirmation link sent to ${cleanEmail}, then tap Continue.`
            );
            triggerHaptic('warning');
          }
          return;
        }
        if (source === 'manual') {
          setError(formatAuthError(signInErr, 'verify').message);
          triggerHaptic('error');
        }
      }
    } catch (err: any) {
      if (source === 'manual') {
        setError(formatAuthError(err, 'verify').message);
      }
    } finally {
      isCheckingVerificationRef.current = false;
      if (source === 'manual') {
        setIsCheckingVerification(false);
      }
    }
  };

  // Automated 3-layer verification watcher on Verify Your Email view
  useEffect(() => {
    if (view !== 'verify-email') return;

    let pollCount = 0;
    const MAX_POLLS = 75;

    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        checkEmailVerificationStatus('auto');
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('mindflow-auth-sync');
        channel.onmessage = (msg) => {
          if (msg?.data?.type === 'AUTH_CONFIRMED') {
            checkEmailVerificationStatus('auto');
          }
        };
      }
    } catch {}

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      pollCount += 1;
      if (pollCount > MAX_POLLS) {
        clearInterval(intervalId);
        return;
      }
      checkEmailVerificationStatus('auto');
    }, 4000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      try {
        channel?.close();
      } catch {}
    };
  }, [view, email, password]);

  /**
   * Resend Email Confirmation
   */
  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 && view === 'verify-email') return;
    setIsResendingConfirmation(true);
    setError(null);
    try {
      const emailRedirectTo = buildAuthRedirectUrl('signup');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo,
        },
      });
      if (resendError) throw resendError;
      setResendCooldown(60);
      showToast({
        title: 'Confirmation Resent',
        message: `A fresh verification link was sent to ${email}.`,
        variant: 'success',
      });
      setSuccessNotice(`Fresh verification code and link sent to ${email}. Check your inbox and spam folder.`);
      triggerHaptic('success');
    } catch (err: any) {
      setError(formatAuthError(err, 'resend').message);
      triggerHaptic('error');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  /**
   * Forgot Password Handler with Cooldown — transitions into dedicated Recovery screen
   */
  const handleForgotPassword = async () => {
    if (forgotPasswordCooldown > 0 || isSendingRecovery) {
      if (forgotPasswordCooldown > 0 && view !== 'signin-recovery') {
        transitionToView('signin-recovery', 1);
      }
      return;
    }
    triggerHaptic('light');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      transitionToView('signin-email', -1);
      return;
    }

    setIsSendingRecovery(true);
    setIsEmailLoading(true);
    setError(null);
    try {
      const redirectUrl = buildAuthRedirectUrl('recovery');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setExistingAccountNotice(false);
      setRecoveryOtpCode('');
      setForgotPasswordCooldown(60);
      transitionToView('signin-recovery', 1);
      setSuccessNotice(`6-digit recovery code and reset link sent to ${cleanEmail}.`);
      showToast({
        title: 'Reset Code & Link Sent',
        message: `6-digit recovery code and reset link delivered to ${cleanEmail}`,
        variant: 'success',
      });
      triggerHaptic('success');
    } catch (err: any) {
      setError(formatAuthError(err, 'recovery').message);
      triggerHaptic('error');
    } finally {
      setIsSendingRecovery(false);
      setIsEmailLoading(false);
    }
  };

  /**
   * Verify 6-Digit Signup OTP (in-app alongside 3-layer link auto-detection)
   */
  const handleVerifySignupOtp = async (rawCode: string) => {
    const code = sanitizeOtpCode(rawCode);
    setError(null);
    setSuccessNotice(null);

    if (code.length !== OTP_LENGTH) {
      triggerHaptic('error');
      setError(`Please enter the complete ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsVerifyingOtp(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        const msg = String(verifyError.message || '').toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
          throw new Error('Invalid or expired verification code. Please check the 6-digit code or tap Resend.');
        }
        throw verifyError;
      }

      if (data?.session || data?.user) {
        clearRateLimit();
        telemetry.emit('auth_login_succeeded', { provider: 'email' });
        triggerHaptic('success');
        showToast({
          title: 'Email Verified!',
          message: 'Your account is confirmed. Welcome to MindFlow!',
          variant: 'success',
        });
      } else {
        throw new Error('Verification succeeded, but no session was returned. Please sign in.');
      }
    } catch (err: any) {
      setError(formatAuthError(err, 'verify').message);
      triggerHaptic('error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  /**
   * Send Passwordless Sign-In Email OTP (`shouldCreateUser: false` enforces DPDP consent on Create Account)
   */
  const handleSendSignInOtp = async (navigateOnSuccess = true) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      transitionToView('signin-email', -1);
      return;
    }

    // If an OTP was already sent for this exact email while cooldown is active, open OTP screen without re-sending
    if (
      navigateOnSuccess &&
      signInOtpSent &&
      otpSentForEmailRef.current === cleanEmail &&
      signInOtpCooldown > 0
    ) {
      transitionToView('signin-otp', 1);
      return;
    }

    if (signInOtpCooldown > 0 || isSendingSignInOtpRef.current) return;

    setError(null);
    setSuccessNotice(null);
    setSignInOtpUnregistered(false);

    if (lockoutRemaining > 0) {
      setError(`Too many failed attempts. Please wait ${lockoutRemaining}s before trying again.`);
      return;
    }

    isSendingSignInOtpRef.current = true;
    setIsSendingSignInOtp(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: buildAuthRedirectUrl('signup'),
        },
      });

      if (otpError) {
        const msg = String(otpError.message || '').toLowerCase();
        if (
          msg.includes('signups not allowed') ||
          msg.includes('user not found') ||
          msg.includes('not registered') ||
          msg.includes('no user')
        ) {
          setSignInOtpUnregistered(true);
          setError('No MindFlow account found for this email. Please create an account to accept Terms & age consent.');
          triggerHaptic('warning');
          return;
        }
        throw otpError;
      }

      otpSentForEmailRef.current = cleanEmail;
      setSignInOtpSent(true);
      setSignInOtpCooldown(60);
      setOtpCode('');
      if (navigateOnSuccess) {
        transitionToView('signin-otp', 1);
      }
      setSuccessNotice(`6-digit sign-in code sent to ${cleanEmail}. Check your inbox and spam folder.`);
      showToast({
        title: 'Sign-In Code Sent',
        message: `We sent a 6-digit code to ${cleanEmail}.`,
        variant: 'success',
      });
      triggerHaptic('success');
    } catch (err: any) {
      setError(formatAuthError(err, 'otp').message);
      triggerHaptic('error');
    } finally {
      isSendingSignInOtpRef.current = false;
      setIsSendingSignInOtp(false);
    }
  };

  /**
   * Verify 6-Digit Passwordless Sign-In OTP
   */
  const handleVerifySignInOtp = async (rawCode: string) => {
    const code = sanitizeOtpCode(rawCode);
    setError(null);
    setSuccessNotice(null);

    if (lockoutRemaining > 0) {
      setError(`Too many failed attempts. Please wait ${lockoutRemaining}s before trying again.`);
      return;
    }

    if (code.length !== OTP_LENGTH) {
      triggerHaptic('error');
      setError(`Please enter the complete ${OTP_LENGTH}-digit sign-in code.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsVerifyingOtp(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'email',
      });

      if (verifyError) {
        const updated = recordFailedAttempt();
        if (updated.lockedUntil) {
          setLockoutRemaining(LOCKOUT_SECONDS);
          throw new Error(`Account temporarily locked for ${LOCKOUT_SECONDS}s due to repeated failed attempts.`);
        }
        const msg = String(verifyError.message || '').toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
          throw new Error('Invalid or expired sign-in code. Please check the 6-digit code or request a fresh one.');
        }
        throw verifyError;
      }

      if (data?.session) {
        clearRateLimit();
        telemetry.emit('auth_login_succeeded', { provider: 'email' });
        triggerHaptic('success');
      } else {
        throw new Error('Unable to establish session. Please request a fresh code.');
      }
    } catch (err: any) {
      setError(formatAuthError(err, 'verify').message);
      triggerHaptic('error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  /**
   * Verify 6-Digit Password Recovery OTP and route directly to #/reset-password
   */
  const handleVerifyRecoveryOtp = async (rawCode: string) => {
    const code = sanitizeOtpCode(rawCode);
    setError(null);
    setSuccessNotice(null);

    if (code.length !== OTP_LENGTH) {
      triggerHaptic('error');
      setError(`Please enter the complete ${OTP_LENGTH}-digit recovery code.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsVerifyingRecoveryOtp(true);

    // Prevent NavigationManager GUEST_ONLY policy from redirecting to /dashboard before /reset-password mounts
    try {
      sessionStorage.setItem('mindflow_recovery_otp_pending', 'true');
    } catch {}

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'recovery',
      });

      if (verifyError) {
        try {
          sessionStorage.removeItem('mindflow_recovery_otp_pending');
        } catch {}
        const msg = String(verifyError.message || '').toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
          throw new Error('Invalid or expired recovery code. Please check the 6-digit code or request a new reset email.');
        }
        throw verifyError;
      }

      if (data?.session || data?.user) {
        clearRateLimit();
        telemetry.emit('auth_login_succeeded', { provider: 'email' });
        triggerHaptic('success');
        showToast({
          title: 'Recovery Code Verified',
          message: 'Create your new MindFlow password now.',
          variant: 'success',
        });
        navigate('/reset-password', { replace: true });
      } else {
        try {
          sessionStorage.removeItem('mindflow_recovery_otp_pending');
        } catch {}
        throw new Error('Unable to start recovery session. Please use the email reset link or request a new code.');
      }
    } catch (err: any) {
      try {
        sessionStorage.removeItem('mindflow_recovery_otp_pending');
      } catch {}
      setError(formatAuthError(err, 'verify').message);
      triggerHaptic('error');
    } finally {
      setIsVerifyingRecoveryOtp(false);
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
        telemetry.emit('auth_login_succeeded', { provider: 'google' });
      } catch (err: any) {
        const msg = String(err?.message || err || '');
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
            redirectTo: buildAuthRedirectUrl('oauth'),
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
      x: shouldReduceMotion ? 0 : dir > 0 ? 28 : -28,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -28 : 28,
      opacity: 0,
    }),
  };

  const isEmailNotConfirmed = error?.toLowerCase().includes('email not confirmed');
  const showBackControl = view !== 'signin-email';
  const showPassiveFooter = view !== 'signup' && view !== 'verify-email';

  const viewCopy: Record<AuthView, { appBar: string; heading: string; subtitle: string; backLabel: string }> = {
    'signin-email': {
      appBar: 'Sign In',
      heading: 'Welcome Back',
      subtitle: 'Sign in to continue your exam preparation',
      backLabel: 'Back',
    },
    'signin-choose': {
      appBar: 'Sign In',
      heading: 'Sign In to MindFlow',
      subtitle: 'Choose how you would like to continue',
      backLabel: 'Back to email input',
    },
    'signin-password': {
      appBar: 'Password Sign In',
      heading: 'Enter Password',
      subtitle: 'Use your MindFlow password to sign in',
      backLabel: 'Back to sign-in options',
    },
    'signin-otp': {
      appBar: 'Email OTP',
      heading: 'Enter Sign-In Code',
      subtitle: 'Enter the 6-digit code sent to your inbox',
      backLabel: 'Back to sign-in options',
    },
    'signin-recovery': {
      appBar: 'Reset Password',
      heading: 'Reset Password',
      subtitle: 'Enter the 6-digit recovery code or use your email link',
      backLabel: 'Back to sign-in options',
    },
    signup: {
      appBar: 'Create Account',
      heading: 'Create Your Account',
      subtitle: 'Start your AI-powered exam preparation',
      backLabel: 'Back to sign in',
    },
    'verify-email': {
      appBar: 'Verify Email',
      heading: 'Verify Your Email',
      subtitle: 'Enter the 6-digit code or open the link in your inbox',
      backLabel: 'Back to create account',
    },
  };

  const activeCopy = viewCopy[view];

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-[100dvh] w-full flex flex-col lg:items-center lg:justify-center relative bg-slate-50 dark:bg-slate-950 lg:bg-gradient-to-br lg:from-slate-50 lg:via-indigo-50/30 lg:to-purple-50/20 lg:dark:from-slate-950 lg:dark:via-slate-900 lg:dark:to-indigo-950/40 p-0 md:p-4 lg:p-8 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-x-clip select-none"
    >
      {/* Subtle top ambient gradient on desktop */}
      <div className="hidden lg:block absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Main Responsive Shell: Edge-to-edge native surface on mobile, elevated split card on desktop */}
      <div className="relative z-10 w-full max-w-5xl my-0 lg:my-auto bg-white dark:bg-slate-900 border-0 md:border border-slate-200/80 dark:border-slate-800 rounded-none md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[100dvh] md:min-h-[600px] lg:min-h-[680px] flex-1 lg:flex-initial">
        {/* Left Column: Desktop Hero Showcase */}
        <div className="hidden lg:flex lg:col-span-7 h-full">
          <AuthHeroShowcase />
        </div>

        {/* Right Column: Interactive Auth Console */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 flex-1">
          {/* Android-Native Sticky Top App Bar on Mobile sub-screens */}
          {showBackControl && (
            <div className="flex items-center h-14 px-3 border-b border-slate-100 dark:border-slate-800/80 lg:hidden shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
              <button
                type="button"
                onClick={handleLogicalBack}
                aria-label={activeCopy.backLabel}
                data-testid="auth-mobile-back-btn"
                className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="ml-1.5 font-semibold text-sm text-slate-800 dark:text-slate-100">
                {activeCopy.appBar}
              </span>
            </div>
          )}

          <div className="p-5 sm:p-8 lg:p-10 flex-1 flex flex-col justify-between">
            <div>
              {/* Brand Header (Zero Parallel Tabs) */}
              <header className="flex flex-col items-center text-center mb-6 shrink-0 relative">
                {showBackControl && (
                  <button
                    type="button"
                    onClick={handleLogicalBack}
                    aria-label={activeCopy.backLabel}
                    data-testid="auth-desktop-back-btn"
                    className="hidden lg:flex absolute left-0 top-0 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="mb-3">
                  <BrandLogo variant="wordmark" size="md" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {activeCopy.heading}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {activeCopy.subtitle}
                </p>
              </header>

              {/* Animated Linear Screen Container */}
              <div className="w-full relative overflow-hidden p-1 -m-1">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  {view === 'signin-email' && (
                    /* ================= SCREEN 1: SIGN IN HOME ================= */
                    <motion.div
                      key="view-signin-email"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-view-signin-email"
                      className="w-full flex flex-col gap-4"
                    >
                      {/* Google OAuth */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          handleGoogleSignIn();
                        }}
                        disabled={isEmailLoading || isGoogleLoading}
                        className={`w-full min-h-[48px] flex justify-center items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 text-sm transition-all shadow-sm active:scale-[0.98] select-none ${
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
                            <GoogleIcon />
                            <span>Continue with Google</span>
                          </>
                        )}
                      </button>

                      <div className="relative">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">
                            or continue with email
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleContinueEmail} noValidate className="space-y-4">
                        <div>
                          <label
                            htmlFor="email-input"
                            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                          >
                            Email Address
                          </label>
                          <div className="relative flex items-center">
                            <Mail
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              ref={emailInputRef}
                              id="email-input"
                              name="email"
                              type="email"
                              inputMode="email"
                              enterKeyHint="next"
                              autoComplete="username"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              required
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                              }}
                              aria-invalid={error ? 'true' : undefined}
                              placeholder="Enter your email address"
                              className="select-text block w-full pl-10 pr-4 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              role="alert"
                              aria-live="assertive"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{error}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          className="w-full min-h-[48px] flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] select-none"
                        >
                          <span>Continue</span>
                        </button>
                      </form>

                      {/* Clear, Unmistakable Create Account Switch */}
                      <div className="pt-1">
                        <button
                          type="button"
                          data-testid="switch-to-signup-btn"
                          onClick={handleOpenSignUp}
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                        >
                          <span>New to MindFlow?</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Create Account</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {view === 'signin-choose' && (
                    /* ================= SCREEN 2: STACKED SIGN-IN METHOD CHOOSER ================= */
                    <motion.div
                      key="view-signin-choose"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-view-signin-choose"
                      className="w-full flex flex-col gap-4"
                    >
                      <ReadOnlyEmailField email={email} onChangeEmail={handleEditEmail} />

                      {/* Error Alert (e.g., Unregistered Email DPDP Redirect or Lockout) */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex flex-col gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{error}</span>
                            </div>
                            {signInOtpUnregistered && (
                              <button
                                type="button"
                                data-testid="choose-create-account-instead-btn"
                                onClick={handleOpenSignUp}
                                className="self-start min-h-[44px] px-3.5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 active:scale-95 transition-all"
                              >
                                Create Account Instead
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {lockoutRemaining > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                          <span>Too many attempts. Lockout active: <strong>{lockoutRemaining}s</strong></span>
                        </div>
                      )}

                      {/* Two Vertically Stacked Method Buttons (Zero Tabs) */}
                      <div className="flex flex-col gap-3 pt-1">
                        <button
                          type="button"
                          data-testid="choose-login-password"
                          onClick={() => {
                            triggerHaptic('light');
                            transitionToView('signin-password', 1);
                          }}
                          disabled={isSendingSignInOtp || isSendingRecovery}
                          className="w-full min-h-[52px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-between shadow-md shadow-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 active:scale-[0.98] transition-all disabled:opacity-60"
                        >
                          <span className="flex items-center gap-3">
                            <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Login with Password</span>
                          </span>
                          <ChevronRight className="w-4 h-4 shrink-0 opacity-85" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          data-testid="choose-login-otp"
                          onClick={() => {
                            triggerHaptic('light');
                            void handleSendSignInOtp(true);
                          }}
                          disabled={isSendingSignInOtp || isSendingRecovery || lockoutRemaining > 0}
                          className="w-full min-h-[52px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-slate-900 dark:text-white font-semibold text-sm flex items-center justify-between shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 active:scale-[0.98] transition-all disabled:opacity-60"
                        >
                          {isSendingSignInOtp ? (
                            <span className="flex items-center gap-3 mx-auto">
                              <BrandSpinner variant="inline" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                              <span>Sending 6-Digit Code...</span>
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-3">
                                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                                <span>Login with Email OTP</span>
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Subtle Hyperlink: Forgot Password */}
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          data-testid="choose-forgot-password"
                          onClick={() => void handleForgotPassword()}
                          disabled={isSendingRecovery || isSendingSignInOtp}
                          className="min-h-[44px] px-3 inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isSendingRecovery
                            ? 'Sending Reset Code...'
                            : forgotPasswordCooldown > 0
                            ? `Reset Code Sent (${forgotPasswordCooldown}s)`
                            : 'Forgot Password?'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {view === 'signin-password' && (
                    /* ================= SCREEN 3A: LOGIN WITH PASSWORD ================= */
                    <motion.div
                      key="view-signin-password"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-view-signin-password"
                      className="w-full flex flex-col gap-4"
                    >
                      <ReadOnlyEmailField email={email} onChangeEmail={handleEditEmail} />

                      <form onSubmit={handleSignIn} noValidate className="space-y-4">
                        {/* Hidden username for browser Password Manager autofill compliance */}
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
                          <div className="flex justify-between items-center mb-1">
                            <label
                              htmlFor="password-input"
                              className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={() => void handleForgotPassword()}
                              disabled={isEmailLoading || isSendingRecovery}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 min-h-[44px] flex items-center px-1"
                            >
                              {forgotPasswordCooldown > 0
                                ? `Retry in ${forgotPasswordCooldown}s`
                                : 'Forgot Password?'}
                            </button>
                          </div>

                          <div className="relative flex items-center">
                            <Lock
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              ref={passwordInputRef}
                              id="password-input"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              enterKeyHint="go"
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(null);
                              }}
                              aria-invalid={error ? 'true' : undefined}
                              placeholder="Enter your password"
                              className="select-text block w-full pl-10 pr-12 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowPassword((prev) => !prev);
                              }}
                              aria-pressed={showPassword}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute inset-y-0 right-0 min-w-[44px] w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              role="alert"
                              aria-live="assertive"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex flex-col gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                            >
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{error}</span>
                              </div>
                              {isEmailNotConfirmed && (
                                <button
                                  type="button"
                                  onClick={handleResendConfirmation}
                                  disabled={isResendingConfirmation}
                                  className="self-start mt-1 min-h-[44px] px-3 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-1.5"
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

                        {lockoutRemaining > 0 && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                            <span>Too many attempts. Lockout active: <strong>{lockoutRemaining}s</strong></span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isEmailLoading || isGoogleLoading || lockoutRemaining > 0}
                          className="w-full min-h-[48px] flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] select-none disabled:opacity-50"
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
                      </form>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            void handleSendSignInOtp(true);
                          }}
                          disabled={isSendingSignInOtp || isEmailLoading}
                          className="min-h-[44px] px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all"
                        >
                          {isSendingSignInOtp ? 'Sending 6-Digit Code...' : 'Login with Email OTP instead'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {view === 'signin-otp' && (
                    /* ================= SCREEN 3B: LOGIN WITH EMAIL OTP ================= */
                    <motion.div
                      key="view-signin-otp"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-view-signin-otp"
                      className="w-full flex flex-col gap-4"
                    >
                      <ReadOnlyEmailField email={email} onChangeEmail={handleEditEmail} />

                      {successNotice && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                          <span>{successNotice}</span>
                        </div>
                      )}

                      {error && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{error}</span>
                        </div>
                      )}

                      {lockoutRemaining > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                          <span>Too many attempts. Lockout active: <strong>{lockoutRemaining}s</strong></span>
                        </div>
                      )}

                      <EmailOtpInput
                        autoFocus
                        value={otpCode}
                        onChange={(next) => {
                          setOtpCode(next);
                          if (error) setError(null);
                        }}
                        onSubmit={handleVerifySignInOtp}
                        onResend={() => void handleSendSignInOtp(false)}
                        resendCooldown={signInOtpCooldown}
                        isVerifying={isVerifyingOtp}
                        isResending={isSendingSignInOtp}
                        disabled={lockoutRemaining > 0}
                        label="6-Digit Sign-In Code"
                        hint="Enter or paste the 6-digit code from your email."
                        submitLabel="Verify & Sign In"
                        verifyingLabel="Signing In..."
                        resendLabel="Resend Sign-In Code"
                        error={error}
                        testIdPrefix="signin-otp"
                      />

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            transitionToView('signin-password', -1);
                          }}
                          className="min-h-[44px] px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all"
                        >
                          Login with Password instead
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {view === 'signin-recovery' && (
                    /* ================= SCREEN 3C: DEDICATED RECOVERY OTP ================= */
                    <motion.div
                      key="view-signin-recovery"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="recovery-otp-card"
                      className="w-full flex flex-col gap-4"
                    >
                      <ReadOnlyEmailField email={email} onChangeEmail={handleEditEmail} />

                      {successNotice && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                          <span>{successNotice}</span>
                        </div>
                      )}

                      {error && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{error}</span>
                        </div>
                      )}

                      <EmailOtpInput
                        autoFocus
                        value={recoveryOtpCode}
                        onChange={(next) => {
                          setRecoveryOtpCode(next);
                          if (error) setError(null);
                        }}
                        onSubmit={handleVerifyRecoveryOtp}
                        onResend={() => void handleForgotPassword()}
                        resendCooldown={forgotPasswordCooldown}
                        isVerifying={isVerifyingRecoveryOtp}
                        isResending={isSendingRecovery}
                        label="6-Digit Recovery Code"
                        hint="Enter the recovery code from your inbox, or click the reset link."
                        submitLabel="Verify Recovery Code"
                        verifyingLabel="Verifying Recovery Code..."
                        resendLabel="Resend Reset Code"
                        error={error}
                        testIdPrefix="recovery-otp"
                      />
                    </motion.div>
                  )}

                  {view === 'signup' && (
                    /* ================= SCREEN 4: SINGLE VERTICAL CREATE ACCOUNT ================= */
                    <motion.div
                      key="view-signup"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-view-signup"
                      className="w-full flex flex-col gap-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          handleGoogleSignIn();
                        }}
                        disabled={isEmailLoading || isGoogleLoading}
                        className={`w-full min-h-[48px] flex justify-center items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 text-sm transition-all shadow-sm active:scale-[0.98] select-none ${
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
                            <GoogleIcon />
                            <span>Sign up with Google</span>
                          </>
                        )}
                      </button>

                      <div className="relative">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">
                            or sign up with email
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleSignUp} noValidate className="space-y-3.5">
                        {/* Full Name */}
                        <div>
                          <label
                            htmlFor="fullname-input"
                            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
                          >
                            Full Name
                          </label>
                          <div className="relative flex items-center">
                            <User
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              ref={fullNameInputRef}
                              id="fullname-input"
                              name="full-name"
                              type="text"
                              enterKeyHint="next"
                              autoComplete="name"
                              required
                              value={fullName}
                              onChange={(e) => {
                                setFullName(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Enter your full name"
                              className="select-text block w-full pl-10 pr-4 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Email Address */}
                        <div>
                          <label
                            htmlFor="signup-email-input"
                            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
                          >
                            Email Address
                          </label>
                          <div className="relative flex items-center">
                            <Mail
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              ref={signupEmailInputRef}
                              id="signup-email-input"
                              name="email"
                              type="email"
                              inputMode="email"
                              enterKeyHint="next"
                              autoComplete="username"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              required
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Enter your email address"
                              className="select-text block w-full pl-10 pr-4 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Password & Strength Meter */}
                        <div>
                          <label
                            htmlFor="signup-password"
                            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
                          >
                            Choose Password
                          </label>
                          <div className="relative flex items-center">
                            <Lock
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              ref={signupPasswordInputRef}
                              id="signup-password"
                              name="new-password"
                              type={showPassword ? 'text' : 'password'}
                              enterKeyHint="next"
                              autoComplete="new-password"
                              required
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="At least 8 characters"
                              className="select-text block w-full pl-10 pr-12 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowPassword((prev) => !prev);
                              }}
                              aria-pressed={showPassword}
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
                          <label
                            htmlFor="confirm-password"
                            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
                          >
                            Confirm Password
                          </label>
                          <div className="relative flex items-center">
                            <Lock
                              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              id="confirm-password"
                              name="confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              enterKeyHint="done"
                              autoComplete="new-password"
                              required
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Re-enter password"
                              className="select-text block w-full pl-10 pr-12 min-h-[48px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowConfirmPassword((prev) => !prev);
                              }}
                              aria-pressed={showConfirmPassword}
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              className="absolute inset-y-0 right-0 min-w-[44px] w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* DPDP Act 2023 Statutory Minor / Learner Consent Clause */}
                        <div className="flex items-start gap-2.5 pt-0.5">
                          <input
                            id="terms-consent"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => {
                              triggerHaptic('light');
                              setAgreedToTerms(e.target.checked);
                              if (error) setError(null);
                            }}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 accent-indigo-600"
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
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex flex-col gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                            >
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{error}</span>
                              </div>
                              {existingAccountNotice && (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={handleOpenSignIn}
                                    className="min-h-[44px] px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 active:scale-95 transition-all"
                                  >
                                    Sign In Instead
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleForgotPassword()}
                                    disabled={isEmailLoading || forgotPasswordCooldown > 0}
                                    className="min-h-[44px] px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/60 active:scale-95 transition-all disabled:opacity-50"
                                  >
                                    {forgotPasswordCooldown > 0
                                      ? `Retry Reset (${forgotPasswordCooldown}s)`
                                      : 'Reset Password'}
                                  </button>
                                </div>
                              )}
                              {!existingAccountNotice && signupRecoveryOptions && (
                                <div
                                  data-testid="signup-timeout-recovery"
                                  className="flex flex-wrap items-center gap-2 pt-1"
                                >
                                  {signupRecoveryOptions.canRetry && (
                                    <button
                                      type="button"
                                      data-testid="signup-retry-btn"
                                      onClick={() => {
                                        triggerHaptic('light');
                                        telemetry.emit('recovery_action_clicked', {
                                          view: 'auth_signup',
                                          actionChosen: 'retry_signup',
                                        });
                                        void executeSignUp();
                                      }}
                                      disabled={isEmailLoading || isGoogleLoading}
                                      className="min-h-[44px] px-3.5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>Try Again</span>
                                    </button>
                                  )}
                                  {signupRecoveryOptions.suggestGoogleFallback && (
                                    <button
                                      type="button"
                                      data-testid="signup-google-fallback-btn"
                                      onClick={() => {
                                        triggerHaptic('light');
                                        telemetry.emit('recovery_action_clicked', {
                                          view: 'auth_signup',
                                          actionChosen: 'google_fallback',
                                        });
                                        void handleGoogleSignIn();
                                      }}
                                      disabled={isEmailLoading || isGoogleLoading}
                                      className="min-h-[44px] px-3.5 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/60 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                      Continue with Google
                                    </button>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                          {successNotice && (
                            <motion.div
                              role="status"
                              aria-live="polite"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                              <span>{successNotice}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Primary Create Account Submit */}
                        <button
                          type="submit"
                          disabled={isEmailLoading || isGoogleLoading}
                          className="w-full min-h-[48px] flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] select-none disabled:opacity-50"
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

                      {/* Clear Sign In Switch */}
                      <div className="pt-1">
                        <button
                          type="button"
                          data-testid="switch-to-signin-btn"
                          onClick={() => {
                            triggerHaptic('light');
                            setPassword('');
                            setConfirmPassword('');
                            transitionToView('signin-email', -1);
                          }}
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                        >
                          <span>Already have an account?</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Sign In</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {view === 'verify-email' && (
                    /* ================= SCREEN 5: VERIFY EMAIL (OTP + AUTO LINK) ================= */
                    <motion.div
                      key="view-verify-email"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      data-testid="auth-verify-email-step"
                      className="w-full flex flex-col gap-3.5"
                    >
                      <ReadOnlyEmailField
                        email={email}
                        onChangeEmail={() => {
                          triggerHaptic('light');
                          setOtpCode('');
                          transitionToView('signup', -1);
                        }}
                        changeLabel="Edit"
                      />

                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                        <span>Auto-detecting inbox confirmation...</span>
                      </div>

                      {successNotice && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                          <span>{successNotice}</span>
                        </div>
                      )}

                      {error && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{error}</span>
                        </div>
                      )}

                      <EmailOtpInput
                        autoFocus
                        value={otpCode}
                        onChange={(next) => {
                          setOtpCode(next);
                          if (error) setError(null);
                        }}
                        onSubmit={handleVerifySignupOtp}
                        onResend={handleResendConfirmation}
                        resendCooldown={resendCooldown}
                        isVerifying={isVerifyingOtp}
                        isResending={isResendingConfirmation}
                        label="6-Digit Verification Code"
                        hint="Enter the 6-digit code from your inbox, or click the confirmation link."
                        submitLabel="Verify 6-Digit Code"
                        verifyingLabel="Verifying Code..."
                        resendLabel="Resend Code & Link"
                        error={error}
                        testIdPrefix="signup-otp"
                      />

                      <div className="relative">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-[11px]">
                          <span className="px-2.5 bg-white dark:bg-slate-900 text-slate-400">
                            Or if you clicked the email link
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => checkEmailVerificationStatus('manual')}
                          disabled={isCheckingVerification || isVerifyingOtp}
                          data-testid="auth-verify-continue-btn"
                          className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100/70 dark:hover:bg-indigo-950/70 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {isCheckingVerification ? (
                            <>
                              <BrandSpinner variant="inline" size="sm" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>I&apos;ve Verified — Continue</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleEditEmail}
                          className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Change Email</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Single Passive Footer Legal Notice (omitted on Create Account & Verify Email) */}
            {showPassiveFooter && (
              <footer className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 text-center select-none">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-1 leading-normal">
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
