import { MIN_PASSWORD_LENGTH } from './authRedirect';

export type AuthErrorKind =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'weak_password'
  | 'smtp_error'
  | 'generic';

export type AuthErrorContext =
  | 'signup'
  | 'signin'
  | 'otp'
  | 'resend'
  | 'recovery'
  | 'verify'
  | 'password_update';

export interface FormattedAuthError {
  kind: AuthErrorKind;
  message: string;
  canRetry: boolean;
  suggestGoogleFallback: boolean;
}

export interface PasswordPolicyResult {
  valid: boolean;
  missing: string[];
  message: string | null;
}

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/**
 * Validates MindFlow's password policy aligned with live Supabase Auth rules:
 * >= 8 chars, lowercase, uppercase, digit, and special character.
 */
export const validatePasswordPolicy = (password: string): PasswordPolicyResult => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      missing: [`at least ${MIN_PASSWORD_LENGTH} characters`],
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) missing.push('an uppercase letter');
  if (!/\d/.test(password)) missing.push('a number');
  if (!SPECIAL_CHAR_REGEX.test(password)) missing.push('a special character (e.g. !@#$)');

  if (missing.length > 0) {
    const formattedList =
      missing.length === 1
        ? missing[0]
        : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`;
    return {
      valid: false,
      missing,
      message: `Password must include ${formattedList}.`,
    };
  }

  return { valid: true, missing: [], message: null };
};

const extractErrorDetails = (err: unknown): { name: string; message: string; code: string; status: number | null } => {
  if (!err || typeof err !== 'object') {
    return { name: '', message: typeof err === 'string' ? err : '', code: '', status: null };
  }
  const obj = err as Record<string, any>;
  return {
    name: String(obj.name || ''),
    message: String(obj.message || obj.error_description || obj.error || ''),
    code: String(obj.code || obj.error_code || ''),
    status: typeof obj.status === 'number' ? obj.status : null,
  };
};

const isEmailDispatchContext = (context: AuthErrorContext): boolean =>
  context === 'signup' || context === 'otp' || context === 'resend' || context === 'recovery';

/**
 * Normalizes raw browser DOMExceptions (e.g. `signal timed out`), Supabase 504/429/422 errors,
 * and network drops into clear, actionable user-facing messages with recovery flags.
 */
export const formatAuthError = (err: unknown, context: AuthErrorContext): FormattedAuthError => {
  const { name, message, code, status } = extractErrorDetails(err);
  const lowerMsg = message.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerCode = code.toLowerCase();

  // 1. Timeout / 504 Gateway Timeout / AbortSignal.timeout('signal timed out')
  const isTimeout =
    lowerName === 'timeouterror' ||
    lowerCode === 'request_timeout' ||
    status === 504 ||
    lowerMsg.includes('signal timed out') ||
    lowerMsg.includes('timeouterror') ||
    lowerMsg.includes('context deadline exceeded') ||
    lowerMsg.includes('request_timeout') ||
    lowerMsg.includes('gateway timeout') ||
    lowerMsg.includes('authtimeout');

  if (isTimeout) {
    if (isEmailDispatchContext(context)) {
      return {
        kind: 'timeout',
        message:
          'The verification email service took too long to respond. Please tap Try Again in a moment or continue with Google.',
        canRetry: true,
        suggestGoogleFallback: context === 'signup' || context === 'otp',
      };
    }
    return {
      kind: 'timeout',
      message: 'The request timed out. Please check your internet connection and try again.',
      canRetry: true,
      suggestGoogleFallback: context === 'signin',
    };
  }

  // 2. Upstream SMTP / Mailer Failure
  const isSmtpError =
    lowerMsg.includes('error sending confirmation email') ||
    lowerMsg.includes('error sending recovery email') ||
    lowerMsg.includes('error sending magic link') ||
    lowerMsg.includes('error sending email') ||
    lowerMsg.includes('smtp') ||
    lowerMsg.includes('535 ');

  if (isSmtpError) {
    return {
      kind: 'smtp_error',
      message:
        'We could not deliver the verification email right now. Please tap Try Again shortly or continue with Google.',
      canRetry: true,
      suggestGoogleFallback: context === 'signup' || context === 'otp',
    };
  }

  // 3. Offline / Network Drops
  const isNetworkError =
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network request failed') ||
    lowerMsg.includes('load failed') ||
    lowerMsg.includes('err_internet_disconnected');

  if (isNetworkError) {
    return {
      kind: 'network',
      message: 'Unable to reach MindFlow servers. Please check your internet connection and try again.',
      canRetry: true,
      suggestGoogleFallback: false,
    };
  }

  // 4. Rate Limiting (429 / GoTrue email cooldown)
  const isRateLimit =
    status === 429 ||
    lowerCode === 'over_email_send_rate_limit' ||
    lowerCode === 'over_request_rate_limit' ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('you can only request this after');

  if (isRateLimit) {
    return {
      kind: 'rate_limit',
      message:
        'Too many email requests right now. Please wait a minute before trying again, or continue with Google.',
      canRetry: false,
      suggestGoogleFallback: context === 'signup' || context === 'otp',
    };
  }

  // 5. Supabase 422 Password Complexity Rejection
  const isWeakPassword =
    lowerCode === 'weak_password' ||
    lowerMsg.includes('password should contain at least one character of each') ||
    lowerMsg.includes('password is too weak');

  if (isWeakPassword) {
    return {
      kind: 'weak_password',
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (e.g. !@#$).',
      canRetry: false,
      suggestGoogleFallback: false,
    };
  }

  // 6. Clean fallback
  const defaultMessages: Record<AuthErrorContext, string> = {
    signup: 'Failed to create account. Please try again.',
    signin: 'An error occurred during sign in. Please try again.',
    otp: 'Unable to send sign-in code. Please try again.',
    resend: 'Failed to resend confirmation email. Please try again.',
    recovery: 'Unable to send password reset email. Please try again.',
    verify: 'Could not verify code. Please try again.',
    password_update: 'Failed to update password. Please try again.',
  };

  return {
    kind: 'generic',
    message: message.trim() || defaultMessages[context],
    canRetry: false,
    suggestGoogleFallback: false,
  };
};
