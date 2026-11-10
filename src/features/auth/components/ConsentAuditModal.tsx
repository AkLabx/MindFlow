import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, LogOut, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CURRENT_AGE_ATTESTATION, CURRENT_TERMS_VERSION } from '@/constants/legal';
import { AuthLegalModal } from './AuthLegalModal';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { telemetry } from '@/lib/telemetry';

const formatConsentError = (err: unknown): string => {
  const raw = (err as any)?.message ? String((err as any).message).trim() : '';
  if (!raw) {
    return 'Unable to save your consent right now. Please check your internet connection and tap Accept & Continue again, or Sign Out.';
  }
  return `${raw} Please tap Accept & Continue to retry, or Sign Out.`;
};

/**
 * Prompts authenticated users who lack a recorded statutory consent timestamp
 * for the active legal version (e.g., Google OAuth signups, legacy accounts, or version bumps)
 * to confirm Terms & DPDP Notice.
 * Never blocks account deletion routes and always provides a Sign Out escape path.
 */
export const ConsentAuditModal: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const showToast = useNotificationStore((s) => s.showToast);

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    setAgreed(false);
    setErrorMessage(null);
    setLegalModalType(null);
  }, [user?.id]);

  if (!user || !profile) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  const hasMetadataConsent =
    user.user_metadata?.terms_accepted_version === CURRENT_TERMS_VERSION &&
    Boolean(user.user_metadata?.age_confirmed);

  const hasProfileConsent =
    profile.terms_accepted_version === CURRENT_TERMS_VERSION &&
    Boolean(profile.terms_accepted_at) &&
    Boolean(profile.age_confirmed);

  if (hasProfileConsent || hasMetadataConsent) return null;

  const handleOpenLegal = (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    e.stopPropagation();
    setLegalModalType(type);
  };

  const handleConfirm = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.rpc('record_user_consent', {
        p_terms_version: CURRENT_TERMS_VERSION,
        p_age_confirmed: CURRENT_AGE_ATTESTATION,
      });
      if (error) throw error;

      await refreshProfile();
      telemetry.emit('consent_recorded', { version: CURRENT_TERMS_VERSION });
      showToast({
        variant: 'success',
        title: 'Consent Recorded',
        message: 'Thank you for confirming our updated Terms & Privacy Policy.',
      });
    } catch (err: any) {
      console.error('[ConsentAuditModal] Failed to record consent:', err);
      const actionableMessage = formatConsentError(err);
      setErrorMessage(actionableMessage);
      telemetry.emit('consent_record_failed', {
        version: CURRENT_TERMS_VERSION,
        reason: err?.code || err?.message || 'unknown_error',
      });
      showToast({
        variant: 'error',
        title: 'Could Not Save Consent',
        message: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-audit-title"
      >
        <div className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="consent-audit-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Review Terms &amp; Privacy Notice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                DPDP Act 2023 Compliance • Version {CURRENT_TERMS_VERSION}
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto">
            <p className="leading-relaxed">
              Before continuing to your dashboard, please review and record your consent to our Terms of Service and Privacy Policy.
            </p>

            <label className="min-h-[44px] flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
              />
              <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                I confirm I am 18+, or have parental/guardian consent if under 18, and agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => handleOpenLegal(e, 'terms')}
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={(e) => handleOpenLegal(e, 'privacy')}
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => signOut()}
              disabled={submitting}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!agreed || submitting}
              className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Accept & Continue'}</span>
            </button>
          </div>
        </div>
      </div>

      <AuthLegalModal
        isOpen={legalModalType !== null}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </>
  );
};
