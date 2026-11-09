import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
  showHints?: boolean;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  bgColor: string;
  feedback: string;
}

export const evaluatePasswordStrength = (pass: string = ''): PasswordStrength => {
  if (!pass) {
    return {
      score: 0,
      label: 'Weak',
      color: 'text-gray-400 dark:text-gray-500',
      bgColor: 'bg-gray-200 dark:bg-gray-700',
      feedback: 'Enter a secure password of at least 8 characters.'
    };
  }

  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Weak',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500',
      feedback: 'Weak password. Add uppercase letters, digits, and special characters.'
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Fair',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      feedback: 'Fair. Make it longer than 10 characters with numbers and symbols.'
    };
  }
  if (score === 3 || score === 4) {
    return {
      score: 3,
      label: 'Good',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500',
      feedback: 'Good security. Add a symbol or increase length for maximum protection.'
    };
  }
  return {
    score: 4,
    label: 'Strong',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500',
    feedback: 'Excellent! Your password meets rigorous enterprise cryptographic entropy.'
  };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  showHints = true
}) => {
  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="w-full mt-2 space-y-1.5" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
          {strength.score >= 3 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          ) : strength.score === 2 ? (
            <Shield className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          )}
          Password Strength:
        </span>
        <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
      </div>

      {/* Segmented Strength Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isActive = strength.score >= step;
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? strength.bgColor : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          );
        })}
      </div>

      {showHints && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
          {strength.feedback}
        </p>
      )}
    </div>
  );
};
