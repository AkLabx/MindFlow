import React, { useId, useRef, useEffect } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { BrandSpinner } from '@/components/brand';
import { triggerHaptic } from '@/lib/haptics';

export const OTP_LENGTH = 6;

/**
 * Strips all non-numeric characters and clamps to 6 digits while preserving leading zeros.
 */
export function sanitizeOtpCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export interface EmailOtpInputProps {
  value: string;
  onChange: (nextCode: string) => void;
  onSubmit: (code: string) => void;
  onResend?: () => void;
  resendCooldown?: number;
  isVerifying?: boolean;
  isResending?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  hint?: string;
  submitLabel?: string;
  verifyingLabel?: string;
  resendLabel?: string;
  error?: string | null;
  testIdPrefix?: string;
  /** When true, renders as a standalone <form> (default). Set false if already inside a parent <form>. */
  asForm?: boolean;
}

/**
 * Reusable 6-digit Email OTP verification control.
 *
 * Follows Google Chrome Modern Web Guidance (`sms-otp-form`, `forms`):
 * - Single `<input type="text" inputMode="numeric" autoComplete="one-time-code">` (never `type="number"`,
 *   never 6 split inputs so browser/OS autofill, paste, and screen readers work reliably).
 * - Instructional hint placed visually above the input so mobile keyboards/autofill bars do not obscure it.
 * - `>= 44x44px` touch targets, `font-size >= 16px`, and `active:scale-95` tactile feedback.
 */
export const EmailOtpInput: React.FC<EmailOtpInputProps> = ({
  value,
  onChange,
  onSubmit,
  onResend,
  resendCooldown = 0,
  isVerifying = false,
  isResending = false,
  disabled = false,
  autoFocus = false,
  label = '6-Digit Verification Code',
  hint = 'Enter or paste the 6-digit code from your email.',
  submitLabel = 'Verify Code',
  verifyingLabel = 'Verifying Code...',
  resendLabel = 'Resend Code',
  error = null,
  testIdPrefix = 'email-otp',
  asForm = true,
}) => {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const normalized = sanitizeOtpCode(value);
  const isComplete = normalized.length === OTP_LENGTH;
  const isBusy = isVerifying || disabled;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeOtpCode(e.target.value);
    onChange(cleaned);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (!pasted) return;
    const cleaned = sanitizeOtpCode(pasted);
    if (cleaned) {
      e.preventDefault();
      triggerHaptic('light');
      onChange(cleaned);
    }
  };

  const handleTriggerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBusy) return;
    onSubmit(normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!asForm && e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleTriggerSubmit();
    }
  };

  const content = (
    <div className="space-y-3" data-testid={`${testIdPrefix}-container`}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            {label}
          </label>
          <span
            aria-hidden="true"
            className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400"
          >
            {normalized.length}/{OTP_LENGTH}
          </span>
        </div>

        {/* Hint placed ABOVE the input so mobile keyboards and autofill bars never obscure it */}
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {hint}
        </p>

        <input
          ref={inputRef}
          id={inputId}
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          pattern="\d{6}"
          maxLength={OTP_LENGTH}
          required
          disabled={isBusy}
          value={normalized}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          aria-describedby={hintId}
          aria-invalid={error ? 'true' : undefined}
          placeholder="000000"
          data-testid={`${testIdPrefix}-input`}
          className="select-text block w-full min-h-[52px] px-4 py-2.5 text-center font-mono text-xl sm:text-2xl font-bold tracking-[0.45em] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25 transition-all shadow-sm disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type={asForm ? 'submit' : 'button'}
          onClick={asForm ? undefined : () => handleTriggerSubmit()}
          disabled={isBusy}
          data-testid={`${testIdPrefix}-submit`}
          className={`w-full min-h-[44px] h-12 flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-95 select-none disabled:opacity-60 ${
            !isComplete && !isBusy ? 'opacity-90' : ''
          }`}
        >
          {isVerifying ? (
            <>
              <BrandSpinner variant="inline" size="sm" />
              <span>{verifyingLabel}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>

        {onResend && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onResend();
            }}
            disabled={isResending || resendCooldown > 0 || isBusy}
            data-testid={`${testIdPrefix}-resend`}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                ? `${resendLabel} (${resendCooldown}s)`
                : resendLabel}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  if (asForm) {
    return (
      <form onSubmit={handleTriggerSubmit} noValidate>
        {content}
      </form>
    );
  }

  return content;
};

export default EmailOtpInput;
