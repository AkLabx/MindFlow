import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { NativeDialog } from '@/components/ui/NativeDialog';
import {
    CreditCard,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    RefreshCw,
    Search,
    Copy,
    Check,
    Eye,
    X,
    ShieldCheck,
    UserCheck,
    Sparkles,
} from 'lucide-react';
import {
    fetchFinancialData,
    fetchEnrollableMockSeries,
    lookupStudentByStudentId,
    activateCourseForStudent,
    rejectCoursePaymentRequest,
    exportPaymentsToCSV,
    resolvePaymentAmountInr,
    PaymentTransaction,
    FinancialMetrics,
    EnrollableCourseSeriesOption,
    StudentEnrollmentLookupResult,
} from '../services/adminFinancialsService';
import { cn } from '@/utils/cn';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminFinancialsPage: React.FC = () => {
    const { showToast } = useNotificationStore();
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [courseOptions, setCourseOptions] = useState<EnrollableCourseSeriesOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [planFilter, setPlanFilter] = useState('ALL');

    // Direct Activation by Student ID
    const [studentIdInput, setStudentIdInput] = useState('');
    const [lookingUpStudent, setLookingUpStudent] = useState(false);
    const [lookupResult, setLookupResult] = useState<StudentEnrollmentLookupResult | null>(null);
    const [selectedSeriesId, setSelectedSeriesId] = useState('');
    const [customValidityDays, setCustomValidityDays] = useState('');
    const [adminGrantNote, setAdminGrantNote] = useState('');
    const [activatingDirect, setActivatingDirect] = useState(false);

    // Pending Request Action Lock
    const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

    // Drawer / Payload Modal
    const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const copyTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current !== null) {
                window.clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [data, seriesList] = await Promise.all([
                fetchFinancialData(),
                fetchEnrollableMockSeries().catch(() => [] as EnrollableCourseSeriesOption[]),
            ]);
            setPayments(data.payments);
            setMetrics(data.metrics);
            setCourseOptions(seriesList);
            if (!selectedSeriesId && seriesList.length > 0) {
                const paidFirst = seriesList.find((s) => s.is_premium || s.price_inr > 0) ?? seriesList[0];
                setSelectedSeriesId(paidFirst.id);
                setCustomValidityDays(String(paidFirst.validity_days || 365));
            }
        } catch {
            showToast({ title: 'Error', message: 'Failed to load financial records.', variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handleCopy = async (text: string, id: string) => {
        if (!text) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Clipboard.write({ string: text });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                await Clipboard.write({ string: text });
            }
            setCopiedId(id);
            if (copyTimerRef.current !== null) {
                window.clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2000);
            showToast({ title: 'Copied', message: 'ID copied to clipboard.', variant: 'info' });
        } catch {
            showToast({ title: 'Copy Failed', message: 'Could not copy ID to clipboard.', variant: 'error' });
        }
    };

    const handleLookupStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = studentIdInput.trim().toUpperCase();
        if (!trimmed) return;
        setLookingUpStudent(true);
        try {
            const res = await lookupStudentByStudentId(trimmed);
            setLookupResult(res);
            if (!res.found) {
                showToast({
                    title: 'Student Not Found',
                    message: `No profile matches Student ID ${trimmed}.`,
                    variant: 'warning',
                });
            }
        } catch (err: any) {
            showToast({
                title: 'Lookup Failed',
                message: err?.message || 'Unable to verify Student ID.',
                variant: 'error',
            });
        } finally {
            setLookingUpStudent(false);
        }
    };

    const handleDirectActivate = async () => {
        const sid = lookupResult?.profile?.student_id || studentIdInput.trim().toUpperCase();
        if (!sid || !selectedSeriesId) return;
        setActivatingDirect(true);
        try {
            const parsedDays = customValidityDays.trim()
                ? Math.min(3650, Math.max(1, Math.round(Number(customValidityDays))))
                : null;
            const res = await activateCourseForStudent({
                studentId: sid,
                seriesId: selectedSeriesId,
                validityDays: parsedDays && !Number.isNaN(parsedDays) ? parsedDays : null,
                adminNote: adminGrantNote.trim() || null,
            });
            showToast({
                title: 'Course Activated',
                message: `${res?.series_name || 'Course'} unlocked for ${sid}.`,
                variant: 'success',
            });
            setAdminGrantNote('');
            const refreshed = await lookupStudentByStudentId(sid);
            setLookupResult(refreshed);
            await loadData();
        } catch (err: any) {
            showToast({
                title: 'Activation Failed',
                message: err?.message || 'Could not activate course entitlement.',
                variant: 'error',
            });
        } finally {
            setActivatingDirect(false);
        }
    };

    const handleApprovePending = async (p: PaymentTransaction) => {
        const sid = p.student_id || p.student_id_snapshot;
        if (!sid || !p.series_id) {
            showToast({
                title: 'Missing Student ID or Course',
                message: 'Cannot auto-activate a request without Student ID and Course ID.',
                variant: 'error',
            });
            return;
        }
        setBusyPaymentId(p.id);
        try {
            const res = await activateCourseForStudent({
                studentId: sid,
                seriesId: p.series_id,
                validityDays: p.validity_days ?? null,
                paymentId: p.id,
            });
            showToast({
                title: 'Payment Approved & Course Unlocked',
                message: `Order ${res?.order_code || p.order_code || ''} activated for ${sid}.`,
                variant: 'success',
            });
            await loadData();
        } catch (err: any) {
            showToast({
                title: 'Approval Failed',
                message: err?.message || 'Failed to activate entitlement.',
                variant: 'error',
            });
        } finally {
            setBusyPaymentId(null);
        }
    };

    const handleRejectPending = async (p: PaymentTransaction) => {
        setBusyPaymentId(p.id);
        try {
            await rejectCoursePaymentRequest({ paymentId: p.id });
            showToast({
                title: 'Request Rejected',
                message: `Payment request ${p.order_code || p.id.slice(0, 8)} marked rejected.`,
                variant: 'info',
            });
            await loadData();
        } catch (err: any) {
            showToast({
                title: 'Rejection Failed',
                message: err?.message || 'Could not reject request.',
                variant: 'error',
            });
        } finally {
            setBusyPaymentId(null);
        }
    };

    const pendingRequests = useMemo(
        () => payments.filter((p) => String(p.status).toLowerCase() === 'pending_verification'),
        [payments]
    );

    const planFilterOptions = useMemo(() => {
        const seen = new Map<string, string>();
        for (const c of courseOptions) {
            const label = String(c.name ?? '').trim();
            if (label && !seen.has(label.toLowerCase())) {
                seen.set(label.toLowerCase(), label);
            }
        }
        for (const p of payments) {
            const label = String(p.plan_purchased ?? '').trim();
            if (label && !seen.has(label.toLowerCase())) {
                seen.set(label.toLowerCase(), label);
            }
        }
        return Array.from(seen.values());
    }, [courseOptions, payments]);

    const filteredPayments = payments.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (p.order_code || '').toLowerCase().includes(q) ||
            (p.student_id || '').toLowerCase().includes(q) ||
            (p.upi_reference || '').toLowerCase().includes(q) ||
            (p.razorpay_payment_id || '').toLowerCase().includes(q) ||
            (p.razorpay_order_id || '').toLowerCase().includes(q) ||
            (p.user_name || '').toLowerCase().includes(q) ||
            (p.plan_purchased || '').toLowerCase().includes(q) ||
            (p.id || '').toLowerCase().includes(q);

        const st = String(p.status || '').toLowerCase();
        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'captured' &&
                (st === 'paid' || st.includes('captured') || st === 'success')) ||
            (statusFilter === 'pending_verification' && st === 'pending_verification') ||
            (statusFilter === 'failed' && (st.includes('fail') || st === 'rejected')) ||
            st === statusFilter.toLowerCase();

        const matchesPlan =
            planFilter === 'ALL' ||
            (p.plan_purchased || '').toLowerCase() === planFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPlan;
    });

    const getStatusBadge = (status: string) => {
        const s = (status || 'pending').toLowerCase();
        if (s === 'paid' || s.includes('captured') || s === 'success') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" />
                    {s === 'paid' ? 'Paid / Active' : 'Captured'}
                </span>
            );
        }
        if (s.includes('fail') || s === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <XCircle className="w-3 h-3" />
                    {s === 'rejected' ? 'Rejected' : 'Failed'}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                <Clock className="w-3 h-3" />
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        Financials &amp; Course Enrollment Center
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Verify student UPI requests, activate paid courses by Student ID, and audit transaction receipts.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => exportPaymentsToCSV(filteredPayments)}
                        disabled={filteredPayments.length === 0}
                        className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={isLoading}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors inline-flex items-center justify-center disabled:opacity-50 shadow-md shadow-emerald-600/20"
                        title="Refresh Transactions"
                        aria-label="Refresh financial records"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Volume</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                        ₹{(metrics?.totalRevenueInr || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        From {metrics?.successfulCount || 0} completed orders
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Success Rate</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                        {payments.length > 0
                            ? Math.round(((metrics?.successfulCount || 0) / payments.length) * 100)
                            : 0}%
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        {metrics?.successfulCount || 0} paid / {payments.length} total
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending UPI Queue</span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics?.pendingCount || 0}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Awaiting admin UTR verification
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fulfillment Mode</span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        UPI + Student ID
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Manual UTR verification &amp; instant grants
                    </p>
                </div>
            </div>

            {/* Direct Activation by Unique Student ID */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">
                                Direct Course Activation by Student ID
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Look up a student&apos;s immutable ID (e.g. MF-100001) and grant timed course access.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleLookupStudent} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                        type="text"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        placeholder="Enter Student ID (e.g. MF-100001)"
                        className="flex-1 min-h-[44px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={lookingUpStudent || !studentIdInput.trim()}
                        className="min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Search className="w-4 h-4" />
                        <span>{lookingUpStudent ? 'Searching...' : 'Lookup Student'}</span>
                    </button>
                </form>

                {lookupResult && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-4">
                        {!lookupResult.found || !lookupResult.profile ? (
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                No student account matches that Student ID.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                            {lookupResult.profile.full_name || 'Student'}{' '}
                                            <span className="ml-1.5 font-mono text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                                {lookupResult.profile.student_id}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {lookupResult.profile.email || 'No email'}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {lookupResult.entitlements.length} existing entitlements
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                            Course Series
                                        </label>
                                        <select
                                            value={selectedSeriesId}
                                            onChange={(e) => {
                                                const nextId = e.target.value;
                                                setSelectedSeriesId(nextId);
                                                const match = courseOptions.find((c) => c.id === nextId);
                                                if (match) setCustomValidityDays(String(match.validity_days || 365));
                                            }}
                                            className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                                        >
                                            {courseOptions.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} (₹{c.price_inr} • {c.validity_days}d)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                            Validity (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={customValidityDays}
                                            onChange={(e) => setCustomValidityDays(e.target.value)}
                                            className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="admin-grant-note-input"
                                            className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                                        >
                                            Admin Note (Optional)
                                        </label>
                                        <input
                                            id="admin-grant-note-input"
                                            type="text"
                                            value={adminGrantNote}
                                            onChange={(e) => setAdminGrantNote(e.target.value)}
                                            placeholder="e.g., UPI verified"
                                            maxLength={120}
                                            className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        disabled={activatingDirect || !selectedSeriesId}
                                        onClick={handleDirectActivate}
                                        className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{activatingDirect ? 'Activating...' : 'Activate Course Access'}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </section>

            {/* Pending UPI Verification Queue */}
            {pendingRequests.length > 0 && (
                <section className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl p-5 sm:p-6 border border-amber-200 dark:border-amber-800/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Pending UPI Verification Queue ({pendingRequests.length})
                        </h2>
                    </div>
                    <div className="space-y-2.5">
                        {pendingRequests.map((p) => {
                            const isBusy = busyPaymentId === p.id;
                            return (
                                <div
                                    key={p.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                                {p.student_id || p.student_id_snapshot || 'No Student ID'}
                                            </span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {p.user_name}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                ₹{resolvePaymentAmountInr(p)}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {p.plan_purchased || 'Course'} • Order <span className="font-mono">{p.order_code || p.id.slice(0, 8)}</span> • UTR{' '}
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {p.upi_reference || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleRejectPending(p)}
                                            className="min-h-[44px] px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleApprovePending(p)}
                                            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-50"
                                        >
                                            {isBusy ? 'Processing...' : 'Approve & Activate'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Student ID, Order Code, UTR, Course, or User..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="pending_verification">Pending Verification</option>
                        <option value="captured">Paid / Captured</option>
                        <option value="failed">Rejected / Failed</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    >
                        <option value="ALL">All Courses / Plans</option>
                        {planFilterOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction Ledger</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Showing {filteredPayments.length} of {payments.length} transactions</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-24 text-center">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">Querying ledger records...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="py-24 text-center">
                        <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">No transactions match filters</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting the status or plan filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Course / Plan</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Order / Reference</th>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredPayments.map((p) => {
                                    const amtInr = resolvePaymentAmountInr(p);
                                    const refCode = p.upi_reference || p.razorpay_payment_id;
                                    const orderCode = p.order_code || p.razorpay_order_id;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {p.user_name}
                                                </div>
                                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                                    {p.student_id || (p.user_id ? `${p.user_id.slice(0, 8)}...` : 'Guest / Direct')}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                                                    {p.plan_purchased || 'Spark'}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                                {amtInr > 0 ? (
                                                    `₹${amtInr.toLocaleString('en-IN')}`
                                                ) : (
                                                    <span className="text-slate-400 font-normal">Included / Free</span>
                                                )}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {getStatusBadge(p.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                    <span>{refCode || 'Admin Grant'}</span>
                                                    {refCode && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(refCode, p.id)}
                                                            aria-label={`Copy reference ${refCode}`}
                                                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                                                            title="Copy Reference ID"
                                                        >
                                                            {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    Order: {orderCode || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                                                <div>{new Date(p.created_at).toLocaleDateString()}</div>
                                                <div className="text-[11px] text-slate-400">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment(p)}
                                                    className="min-h-[44px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Payload
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Webhook Payload Drawer */}
            <NativeDialog
                isOpen={Boolean(selectedPayment)}
                onClose={() => setSelectedPayment(null)}
                ariaLabelledBy="payment-details-title"
                className="max-w-2xl"
                panelClassName="relative w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] border border-slate-200 dark:border-slate-800"
            >
                {selectedPayment && (
                    <>
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 id="payment-details-title" className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-500" />
                                    Payment Transaction Details
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedPayment.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPayment(null)}
                                aria-label="Close payment details"
                                className="p-2 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block font-semibold uppercase">Student</span>
                                    <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">{selectedPayment.user_name}</span>
                                    <span className="text-indigo-500 font-mono text-[11px]">{selectedPayment.student_id || selectedPayment.user_id || 'No ID'}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block font-semibold uppercase">Course &amp; Status</span>
                                    <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">{selectedPayment.plan_purchased || 'Spark'}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">{selectedPayment.status}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                    Transaction Metadata
                                </label>
                                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-64 border border-slate-800">
                                    {JSON.stringify(
                                        selectedPayment.webhook_payload || {
                                            id: selectedPayment.id,
                                            order_code: selectedPayment.order_code,
                                            student_id: selectedPayment.student_id,
                                            payment_method: selectedPayment.payment_method,
                                            upi_reference: selectedPayment.upi_reference,
                                            valid_until: selectedPayment.valid_until,
                                            razorpay_payment_id: selectedPayment.razorpay_payment_id,
                                            razorpay_order_id: selectedPayment.razorpay_order_id,
                                            amount: selectedPayment.amount,
                                            status: selectedPayment.status,
                                            plan: selectedPayment.plan_purchased,
                                            created_at: selectedPayment.created_at,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedPayment(null)}
                                className="min-h-[44px] px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </>
                )}
            </NativeDialog>
        </div>
    );
};
