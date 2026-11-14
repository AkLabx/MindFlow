import React, { useState, useEffect } from 'react';
import { NativeDialog } from '@/components/ui/NativeDialog';
import {
    CreditCard,
    DollarSign,
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
    Users,
    Zap,
    Crown
} from 'lucide-react';
import {
    fetchFinancialData,
    exportPaymentsToCSV,
    PaymentTransaction,
    FinancialMetrics
} from '../services/adminFinancialsService';
import { cn } from '@/utils/cn';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminFinancialsPage: React.FC = () => {
    const { showToast } = useNotificationStore();
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [planFilter, setPlanFilter] = useState('ALL');

    // Drawer / Payload Modal
    const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchFinancialData();
            setPayments(data.payments);
            setMetrics(data.metrics);
        } catch (err: any) {
            showToast({ title: 'Error', message: 'Failed to load financial records.', variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast({ title: 'Copied', message: 'ID copied to clipboard.', variant: 'info' });
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch =
            (p.razorpay_payment_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.razorpay_order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.id || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'captured' && ((p.status || '').includes('captured') || p.status === 'success')) ||
            (statusFilter === 'failed' && (p.status || '').includes('fail')) ||
            p.status === statusFilter;

        const matchesPlan =
            planFilter === 'ALL' ||
            (p.plan_purchased || '').toLowerCase() === planFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPlan;
    });

    const getStatusBadge = (status: string) => {
        const s = (status || 'pending').toLowerCase();
        if (s.includes('captured') || s === 'success') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" />
                    Captured
                </span>
            );
        }
        if (s.includes('fail')) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <XCircle className="w-3 h-3" />
                    Failed
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
                        Financials & Monetization Command Center
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Razorpay payment gateway ledger, tier subscriptions, transaction audits, and gross revenue metrics.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportPaymentsToCSV(filteredPayments)}
                        disabled={filteredPayments.length === 0}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20"
                        title="Refresh Transactions"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Gross Revenue */}
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
                        From {metrics?.successfulCount || 0} captured orders
                    </p>
                </div>

                {/* Successful Transactions */}
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
                        {metrics?.successfulCount || 0} captured / {payments.length} total
                    </p>
                </div>

                {/* Spark Subscriptions */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spark Tier</span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics?.subscriptionStats.spark || 0}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Active Spark subscribers
                    </p>
                </div>

                {/* Gateway Integration Status */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gateway Status</span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Razorpay Live
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Webhook ingestion operational
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Payment ID, Order ID, or User..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="captured">Captured / Success</option>
                        <option value="failed">Failed</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    >
                        <option value="ALL">All Plans</option>
                        <option value="spark">Spark Plan</option>
                        <option value="pro">Pro Plan</option>
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
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Plan</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Razorpay IDs</th>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredPayments.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {p.user_name}
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {p.user_id ? `${p.user_id.slice(0, 8)}...` : 'Guest / Direct'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                                                {p.plan_purchased || 'Spark'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                            {p.amount ? (
                                                `₹${(p.amount >= 1000 ? p.amount / 100 : p.amount).toLocaleString('en-IN')}`
                                            ) : (
                                                <span className="text-slate-400 font-normal">Included / Free</span>
                                            )}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {getStatusBadge(p.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                <span>{p.razorpay_payment_id || 'N/A'}</span>
                                                {p.razorpay_payment_id && (
                                                    <button
                                                        onClick={() => handleCopy(p.razorpay_payment_id!, p.id)}
                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-700"
                                                        title="Copy Payment ID"
                                                    >
                                                        {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                Order: {p.razorpay_order_id || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                                            <div>{new Date(p.created_at).toLocaleDateString()}</div>
                                            <div className="text-[11px] text-slate-400">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedPayment(p)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Payload
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                        <span className="text-slate-400 block font-semibold uppercase">Customer</span>
                                        <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">{selectedPayment.user_name}</span>
                                        <span className="text-slate-400 font-mono text-[11px]">{selectedPayment.user_id || 'No user ID'}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400 block font-semibold uppercase">Plan & Status</span>
                                        <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block uppercase">{selectedPayment.plan_purchased || 'Spark'}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">{selectedPayment.status}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                        Raw Webhook / Transaction Payload
                                    </label>
                                    <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-64 border border-slate-800">
                                        {JSON.stringify(
                                            selectedPayment.webhook_payload || {
                                                id: selectedPayment.id,
                                                razorpay_payment_id: selectedPayment.razorpay_payment_id,
                                                razorpay_order_id: selectedPayment.razorpay_order_id,
                                                amount: selectedPayment.amount,
                                                status: selectedPayment.status,
                                                plan: selectedPayment.plan_purchased,
                                                created_at: selectedPayment.created_at
                                            },
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button
                                    onClick={() => setSelectedPayment(null)}
                                    className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
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
