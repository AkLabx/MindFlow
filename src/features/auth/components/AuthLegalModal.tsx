import React from 'react';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { X, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface AuthLegalModalProps {
  isOpen: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const AuthLegalModal: React.FC<AuthLegalModalProps> = ({
  isOpen,
  type,
  onClose
}) => {
  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const isTerms = type === 'terms';

  return (
    <NativeDialog
      isOpen={isOpen && !!type}
      onClose={handleClose}
      variant="bottom-sheet"
      ariaLabelledBy="legal-modal-title"
      className="sm:my-auto sm:w-[calc(100%-3rem)] max-w-2xl"
      panelClassName="relative w-full max-h-[88dvh] sm:max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Android Drag Handle Pill on Mobile */}
      <div className="sm:hidden pt-3 pb-1 flex justify-center w-full shrink-0 select-none">
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  {isTerms ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h2 id="legal-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {isTerms ? 'Terms of Service' : 'Privacy Policy & Data Notice'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Version 2.1 • Effective November 2024 • Governed by Laws of India
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-slate-600 dark:text-slate-300 space-y-5 leading-relaxed">
          {isTerms ? (
            <>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  1. Acceptance & Eligibility
                </h3>
                <p>
                  By registering or using MindFlow, you agree to comply with and be bound by these Terms. Users must be 18 years of age or older, or possess verifiable parental/guardian consent if under 18 years of age (including school learners).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  2. Lawful User Conduct & Integrity
                </h3>
                <p>
                  MindFlow is an educational platform. You agree to use the service strictly for legitimate academic preparation. Any attempt to scrape questions, circumvent rate limits, disrupt servers, or reverse engineer the AI engine is strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  3. Intellectual Property Rights
                </h3>
                <p>
                  All curriculum syntheses, mock assessments, neural explanations, and trademarked logos are the intellectual property of MindFlow and its licensors. Unauthorized commercial redistribution is strictly forbidden.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  4. Limitation of Liability
                </h3>
                <p>
                  While mock questions and AI tutor responses are synthesized to mirror real government examination benchmarks, MindFlow provides services on an "as is" basis without warranty of guaranteed exam outcomes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  5. Governing Law & Jurisdiction
                </h3>
                <p>
                  These terms are governed by and construed in accordance with the Information Technology Act 2000 and the laws of the Republic of India. Competent courts in India retain exclusive jurisdiction.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Notice under DPDP Act 2023 (Section 5)
                </h4>
                <p className="text-xs text-indigo-800/90 dark:text-indigo-200/90 leading-relaxed">
                  MindFlow collects your email, full name, and learning interaction telemetry solely for personalized mock generation, streak retention, and secure session management.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  1. Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Identity:</strong> Email and display name provided during registration or Google OAuth.</li>
                  <li><strong>Learning Telemetry:</strong> Quiz responses, timing analytics, accuracy by subject, and mistake notebook entries.</li>
                  <li><strong>Offline-First Storage:</strong> Cached locally in browser IndexedDB for zero-latency offline drills.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  2. Purpose & Processing Limitation
                </h3>
                <p>
                  Your personal data is never sold, leased, or monetized for third-party targeted advertisements. Data is securely processed through Supabase PostgreSQL infrastructure with row-level security (RLS).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  3. User Rights: Access, Correction & Erasure
                </h3>
                <p>
                  Under Section 11 of the DPDP Act 2023, you have the right to review, update, or completely erase your account and associated quiz history. Account deletion is self-serve in Settings &gt; Developer &gt; Delete Account, or within 30 days upon emailing support.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                  4. Statutory Grievance Redressal Officer (Section 8)
                </h3>
                <p>
                  For data protection inquiries or grievance escalation under the DPDP Act 2023:
                  <br />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Grievance Officer: Data Protection Desk
                  </span>
                  <br />
                  Email: <a href="mailto:support@mindflow.com?subject=Attn:%20Grievance%20Redressal%20Officer%20-%20Data%20Protection" className="text-indigo-600 dark:text-indigo-400 underline font-medium">support@mindflow.com</a>
                  <br />
                  Response SLA: Statutory response within 48 business hours.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between select-none">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Verified Statutory Compliance
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
          >
            I Understand
          </button>
        </div>
    </NativeDialog>
  );
};
