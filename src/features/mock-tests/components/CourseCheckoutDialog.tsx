import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import {
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Lock,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { useNotification } from '@/hooks/useNotification';
import { ROUTES } from '@/config/routes';
import { supabase } from '@/lib/supabase';
import { triggerHaptic } from '@/lib/haptics';
import {
    fetchUserPurchaseReceipts,
    getCachedUserPurchaseReceiptsSnapshot,
    submitCoursePaymentRequest,
    type CoursePaymentRequestResult,
    type UserPaymentReceiptItem,
} from '../api/mockTestsApi';

export interface CourseCheckoutSeriesInfo {
    id: string;
    name: string;
    price_inr: number;
    mrp_inr?: number | null;
    validity_days?: number;
    category_name?: string;
    free_demo_count?: number;
}

interface CourseCheckoutDialogProps {
    isOpen: boolean;
    onClose: () => void;
    series: CourseCheckoutSeriesInfo | null;
    studentId?: string | null;
    userId?: string | null;
    isRenewal?: boolean;
    onRequestSubmitted?: (result: CoursePaymentRequestResult) => void;
}

export const CourseCheckoutDialog: React.FC<CourseCheckoutDialogProps> = ({
    isOpen,
    onClose,
    series,
    studentId,
    userId,
    isRenewal = false,
    onRequestSubmitted,
}) => {
    const navigate = useNavigate();
    const { showToast } = useNotification();

    const [upiRef, setUpiRef] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copiedStudentId, setCopiedStudentId] = useState(false);
    const [copiedUpiId, setCopiedUpiId] = useState(false);
    const [submittedResult, setSubmittedResult] = useState<CoursePaymentRequestResult | null>(null);
    const [existingPending, setExistingPending] = useState<UserPaymentReceiptItem | null>(null);
    const [configuredUpiId, setConfiguredUpiId] = useState<string | null>(() => {
        const envUpi = import.meta.env.VITE_MINDFLOW_UPI_ID;
        return typeof envUpi === 'string' && envUpi.trim() ? envUpi.trim() : null;
    });

    const studentCopyTimerRef = useRef<number | null>(null);
    const upiCopyTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (studentCopyTimerRef.current !== null) {
                window.clearTimeout(studentCopyTimerRef.current);
            }
            if (upiCopyTimerRef.current !== null) {
                window.clearTimeout(upiCopyTimerRef.current);
            }
        };
    }, []);

    const seriesId = series?.id ?? '';

    useEffect(() => {
        if (!isOpen || !seriesId) return;
        let cancelled = false;
        setErrorMsg(null);
        setSubmittedResult(null);
        setUpiRef('');

        if (userId) {
            const cached = getCachedUserPurchaseReceiptsSnapshot(userId);
            const foundCachedPending =
                cached?.find(
                    (r) => r.series_id === seriesId && r.status === 'pending_verification'
                ) ?? null;
            setExistingPending(foundCachedPending);

            if (typeof navigator === 'undefined' || navigator.onLine !== false) {
                fetchUserPurchaseReceipts(userId, { forceRefresh: true })
                    .then((rows) => {
                        if (cancelled) return;
                        const match =
                            rows.find(
                                (r) => r.series_id === seriesId && r.status === 'pending_verification'
                            ) ?? null;
                        setExistingPending(match);
                    })
                    .catch(() => {});
            }
        } else {
            setExistingPending(null);
        }

        return () => {
            cancelled = true;
        };
    }, [isOpen, seriesId, userId]);

    useEffect(() => {
        if (!isOpen || configuredUpiId || typeof (supabase as any)?.from !== 'function') {
            return;
        }
        let cancelled = false;
        supabase
            .from('app_ui_config')
            .select('branding')
            .eq('id', 1)
            .maybeSingle()
            .then(
                ({ data }) => {
                    if (cancelled) return;
                    const upi = (data as any)?.branding?.upi_id;
                    if (typeof upi === 'string' && upi.trim()) {
                        setConfiguredUpiId(upi.trim());
                    }
                },
                () => {}
            );
        return () => {
            cancelled = true;
        };
    }, [isOpen, configuredUpiId]);

    if (!series) return null;

    const priceInr = Math.max(0, Number(series.price_inr ?? 0));
    const mrpInr = series.mrp_inr != null ? Number(series.mrp_inr) : null;
    const discountPct =
        mrpInr && mrpInr > priceInr
            ? Math.round(((mrpInr - priceInr) / mrpInr) * 100)
            : 0;
    const validityDays = Math.max(1, Number(series.validity_days ?? 365));

    const handleCopy = async (text: string, type: 'student' | 'upi') => {
        if (!text) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Clipboard.write({ string: text });
            } else {
                await navigator.clipboard.writeText(text);
            }
            triggerHaptic('light');
            if (type === 'student') {
                setCopiedStudentId(true);
                if (studentCopyTimerRef.current !== null) {
                    window.clearTimeout(studentCopyTimerRef.current);
                }
                studentCopyTimerRef.current = window.setTimeout(() => setCopiedStudentId(false), 1800);
            } else {
                setCopiedUpiId(true);
                if (upiCopyTimerRef.current !== null) {
                    window.clearTimeout(upiCopyTimerRef.current);
                }
                upiCopyTimerRef.current = window.setTimeout(() => setCopiedUpiId(false), 1800);
            }
            showToast({
                variant: 'success',
                title: type === 'student' ? 'Student ID Copied' : 'UPI ID Copied',
                message: `${text} copied to clipboard.`,
            });
        } catch {
            showToast({
                variant: 'error',
                title: 'Copy Failed',
                message: 'Could not copy automatically. Please copy manually.',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setErrorMsg('Please sign in to submit a course purchase request.');
            return;
        }
        setErrorMsg(null);
        setSubmitting(true);
        try {
            const res = await submitCoursePaymentRequest({
                seriesId: series.id,
                upiReference: upiRef,
                userId,
            });
            triggerHaptic('success');
            setSubmittedResult(res);
            showToast({
                variant: 'success',
                title: 'Payment Request Submitted',
                message: `Order ${res.order_code} is awaiting Admin verification.`,
            });
            onRequestSubmitted?.(res);
        } catch (err: any) {
            triggerHaptic('error');
            setErrorMsg(err?.message || 'Unable to submit payment request.');
        } finally {
            setSubmitting(false);
        }
    };

    const activePending = submittedResult
        ? {
              order_code: submittedResult.order_code,
              upi_reference: submittedResult.upi_reference,
              amount_inr: submittedResult.amount_inr,
              validity_days: submittedResult.validity_days,
          }
        : existingPending
          ? {
                order_code: existingPending.order_code,
                upi_reference: existingPending.upi_reference,
                amount_inr: existingPending.amount_inr,
                validity_days: existingPending.validity_days ?? validityDays,
            }
          : null;

    return (
        <NativeDialog
            isOpen={isOpen}
            onClose={onClose}
            variant="bottom-sheet"
            ariaLabelledBy="course-checkout-title"
            dataTestId="course-checkout-dialog"
            className="sm:max-w-lg sm:mx-auto"
            panelClassName="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90dvh] overflow-y-auto"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider">
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        <span>{isRenewal ? 'Renew Course Access' : 'Unlock Course Access'}</span>
                    </div>
                    <h2
                        id="course-checkout-title"
                        className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight"
                    >
                        {series.name}
                    </h2>
                    {series.category_name && (
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {series.category_name} • {validityDays} Days Validity
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close checkout dialog"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer shrink-0"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Pricing Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 p-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                        Course Fee
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ₹{priceInr}
                        </span>
                        {mrpInr && mrpInr > priceInr && (
                            <span className="text-sm font-bold text-slate-400 line-through">
                                ₹{mrpInr}
                            </span>
                        )}
                        {discountPct > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
                                {discountPct}% OFF
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                        <span>{validityDays}d Access</span>
                    </span>
                </div>
            </div>

            {/* Immutable Student ID Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Your Unique Student ID
                    </p>
                    <p
                        data-testid="checkout-student-id"
                        className="text-base font-mono font-black text-indigo-700 dark:text-indigo-300 tracking-wide truncate"
                    >
                        {studentId || 'Assigned on profile'}
                    </p>
                </div>
                {studentId && (
                    <button
                        type="button"
                        onClick={() => handleCopy(studentId, 'student')}
                        aria-label="Copy Student ID"
                        className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer shrink-0"
                    >
                        {copiedStudentId ? (
                            <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        ) : (
                            <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{copiedStudentId ? 'Copied' : 'Copy ID'}</span>
                    </button>
                )}
            </div>

            {activePending ? (
                <div
                    data-testid="checkout-pending-state"
                    className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 space-y-3"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                            {submittedResult ? (
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            ) : (
                                <Clock className="w-5 h-5" aria-hidden="true" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                {submittedResult
                                    ? 'Payment Request Submitted!'
                                    : 'Verification Already Pending'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                Order <strong className="font-mono">{activePending.order_code}</strong>{' '}
                                (UTR: <strong className="font-mono">{activePending.upi_reference}</strong>) is awaiting Admin verification for Student ID{' '}
                                <strong className="font-mono">{studentId || 'your account'}</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                navigate(ROUTES.PURCHASED);
                            }}
                            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                        >
                            View in My Purchase
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm active:scale-95 touch-manipulation cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 p-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-100">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                            <span>{isRenewal ? 'How UPI Renewal Works' : 'How UPI Enrollment Works'}</span>
                        </div>
                        {isRenewal && (
                            <p className="text-slate-600 dark:text-slate-300">
                                Renewing extends your course access validity for {validityDays} days upon Admin verification (e.g., Student ID <strong className="font-mono">MIND-100042</strong>).
                            </p>
                        )}
                        {configuredUpiId ? (
                            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                                    UPI: {configuredUpiId}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(configuredUpiId, 'upi')}
                                    className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold text-xs inline-flex items-center gap-1 active:scale-95 touch-manipulation cursor-pointer shrink-0"
                                >
                                    {copiedUpiId ? 'Copied' : 'Copy UPI'}
                                </button>
                            </div>
                        ) : (
                            <p>
                                Complete the ₹{priceInr} UPI transfer using MindFlow official UPI details (or share your Student ID with support), then enter your UPI Reference / UTR below.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="upi-reference-input"
                            className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300"
                        >
                            UPI Transaction Reference / UTR *
                        </label>
                        <input
                            id="upi-reference-input"
                            type="text"
                            value={upiRef}
                            onChange={(e) => setUpiRef(e.target.value)}
                            placeholder="e.g., 432918273645"
                            required
                            minLength={6}
                            maxLength={64}
                            autoComplete="off"
                            className="w-full min-h-[48px] px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {errorMsg && (
                        <p
                            role="alert"
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl px-3 py-2"
                        >
                            {errorMsg}
                        </p>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[48px] px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm active:scale-95 touch-manipulation cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || upiRef.trim().length < 6}
                            data-testid="submit-upi-request-btn"
                            className="flex-1 min-h-[48px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm disabled:opacity-50"
                        >
                            {submitting ? 'Submitting Request...' : 'Submit Payment Request'}
                        </button>
                    </div>
                </form>
            )}
        </NativeDialog>
    );
};
