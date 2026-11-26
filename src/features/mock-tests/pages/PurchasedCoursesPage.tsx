import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    ChevronRight,
    Clock,
    Receipt,
    RefreshCw,
    ShoppingBag,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { triggerHaptic } from '@/lib/haptics';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import {
    CourseType,
    MOCK_CACHE_INVALIDATED_EVENT,
    UserCourseEntitlementItem,
    UserPaymentReceiptItem,
    fetchSeriesDetails,
    fetchUserCourseEntitlements,
    fetchUserPurchaseReceipts,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    getCachedUserPurchaseReceiptsSnapshot,
    readUserCourseEntitlementsIndexedDBCache,
    readUserPurchaseReceiptsIndexedDBCache,
} from '../api/mockTestsApi';
import {
    CourseCheckoutDialog,
    type CourseCheckoutSeriesInfo,
} from '../components/CourseCheckoutDialog';

const formatReceiptDate = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return '—';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(ms));
    } catch {
        return new Date(ms).toLocaleDateString();
    }
};

const SETTLED_PAYMENT_STATUSES = new Set([
    'paid',
    'verified',
    'captured',
    'captured_by_client',
    'settled',
    'completed',
]);

const computeDaysRemainingLabel = (
    status: string,
    validUntil: string | null | undefined,
    nowMs: number
): { label: string; tone: 'active' | 'pending' | 'warning' | 'expired' } => {
    const normalized = String(status ?? '').toLowerCase();
    if (normalized === 'pending_verification' || normalized === 'pending') {
        return { label: 'Awaiting Admin Approval', tone: 'pending' };
    }
    if (
        normalized === 'rejected' ||
        normalized === 'revoked' ||
        normalized === 'failed' ||
        normalized === 'cancelled'
    ) {
        return { label: 'Rejected / Inactive', tone: 'expired' };
    }
    if (!validUntil) {
        return { label: 'Active', tone: 'active' };
    }
    const endMs = Date.parse(validUntil);
    if (!Number.isFinite(endMs)) {
        return { label: 'Active', tone: 'active' };
    }
    const diffMs = endMs - nowMs;
    if (diffMs <= 0) {
        return { label: 'Expired', tone: 'expired' };
    }
    const days = Math.ceil(diffMs / 86_400_000);
    if (days <= 1) {
        return { label: '1 day remaining', tone: 'warning' };
    }
    if (days <= 14) {
        return { label: `${days} days remaining`, tone: 'warning' };
    }
    return { label: `${days} days remaining`, tone: 'active' };
};

const resolveSafeTargetRoute = (
    rawRoute: string | null | undefined,
    seriesId?: string | null
): string => {
    const trimmed = typeof rawRoute === 'string' ? rawRoute.trim() : '';
    if (trimmed && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
    }
    return seriesId ? ROUTES.TEST_SERIES.SERIES(seriesId) : ROUTES.TEST_SERIES.ROOT;
};

const COURSE_TYPE_BADGE: Record<
    Exclude<CourseType, 'mock_series'>,
    { label: string; className: string }
> = {
    bundle: {
        label: 'Bundle',
        className:
            'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    },
    video: {
        label: 'Video',
        className:
            'bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
    },
    pdf: {
        label: 'PDF',
        className:
            'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    },
};

export const PurchasedCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const userId = user?.id ?? null;

    const isMountedRef = useRef(true);
    const fetchSeqRef = useRef(0);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const [receipts, setReceipts] = useState<UserPaymentReceiptItem[]>(() =>
        userId ? getCachedUserPurchaseReceiptsSnapshot(userId) ?? [] : []
    );
    const [entitlements, setEntitlements] = useState<UserCourseEntitlementItem[]>(() =>
        userId ? getCachedUserCourseEntitlementsSnapshot(userId) ?? [] : []
    );
    const [renewalSeries, setRenewalSeries] = useState<CourseCheckoutSeriesInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(() => {
        if (!userId) return false;
        return getCachedUserPurchaseReceiptsSnapshot(userId) === null;
    });

    const loadPurchaseHistory = useCallback(
        async (forceRefresh = false) => {
            const seq = ++fetchSeqRef.current;
            if (!userId) {
                setReceipts([]);
                setEntitlements([]);
                setLoading(false);
                return;
            }

            try {
                const [idbReceipts, idbEntitlements] = await Promise.all([
                    readUserPurchaseReceiptsIndexedDBCache(userId),
                    readUserCourseEntitlementsIndexedDBCache(userId),
                ]);
                if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                if (idbReceipts) setReceipts(idbReceipts);
                if (idbEntitlements) setEntitlements(idbEntitlements);
                if (idbReceipts !== null || idbEntitlements !== null) {
                    setLoading(false);
                }

                if (typeof navigator === 'undefined' || navigator.onLine !== false) {
                    const [freshReceipts, freshEntitlements] = await Promise.all([
                        fetchUserPurchaseReceipts(userId, { forceRefresh }),
                        fetchUserCourseEntitlements(userId, { forceRefresh }),
                    ]);
                    if (!isMountedRef.current || fetchSeqRef.current !== seq) return;
                    setReceipts(freshReceipts);
                    setEntitlements(freshEntitlements);
                }
            } catch {
                // Keep cached receipts when offline
            } finally {
                if (isMountedRef.current && fetchSeqRef.current === seq) {
                    setLoading(false);
                }
            }
        },
        [userId]
    );

    useEffect(() => {
        void loadPurchaseHistory(true);
    }, [loadPurchaseHistory]);

    useEffect(() => {
        const handleCacheInvalidated = () => {
            void loadPurchaseHistory(true);
        };
        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        return () => {
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleCacheInvalidated);
        };
    }, [loadPurchaseHistory]);

    const purchaseCards = useMemo(() => {
        const nowMs = Date.now();
        const entitlementByPaymentId = new Map<string, UserCourseEntitlementItem>();
        const entitlementBySeriesId = new Map<string, UserCourseEntitlementItem>();
        const representedEntitlementIds = new Set<string>();

        for (const ent of entitlements) {
            if (ent.payment_id) entitlementByPaymentId.set(ent.payment_id, ent);
            if (ent.series_id) entitlementBySeriesId.set(ent.series_id, ent);
        }

        const merged = receipts.map((receipt) => {
            const normalizedReceiptStatus = String(receipt.status ?? '').toLowerCase();
            const isSettledReceipt = SETTLED_PAYMENT_STATUSES.has(normalizedReceiptStatus);
            const seriesEntitlementCandidate =
                isSettledReceipt && receipt.series_id
                    ? entitlementBySeriesId.get(receipt.series_id)
                    : undefined;
            const matchedEnt =
                entitlementByPaymentId.get(receipt.id) ??
                (seriesEntitlementCandidate &&
                (!seriesEntitlementCandidate.payment_id ||
                    seriesEntitlementCandidate.payment_id === receipt.id)
                    ? seriesEntitlementCandidate
                    : undefined);

            if (matchedEnt) {
                representedEntitlementIds.add(matchedEnt.id);
            }

            const effectiveValidUntil = matchedEnt?.valid_until ?? receipt.valid_until;
            const effectiveTargetRoute = resolveSafeTargetRoute(
                matchedEnt?.target_route ?? receipt.target_route,
                receipt.series_id
            );

            const effectiveStatus =
                normalizedReceiptStatus === 'pending_verification' && matchedEnt?.status === 'active'
                    ? 'paid'
                    : receipt.status;

            const daysInfo = computeDaysRemainingLabel(
                effectiveStatus,
                effectiveValidUntil,
                nowMs
            );

            return {
                id: receipt.id,
                seriesId: receipt.series_id,
                courseName: receipt.series_name,
                courseType: matchedEnt?.course_type ?? receipt.course_type,
                validityDays: receipt.validity_days ?? 365,
                orderCode: receipt.order_code,
                purchaseDate: receipt.created_at,
                endDate: effectiveValidUntil,
                amountInr: receipt.amount_inr,
                status: effectiveStatus,
                targetRoute: effectiveTargetRoute,
                upiReference: receipt.upi_reference,
                daysLabel: daysInfo.label,
                daysTone: daysInfo.tone,
            };
        });

        // Include any active entitlement granted directly without a matching payment record in view
        for (const ent of entitlements) {
            if (representedEntitlementIds.has(ent.id)) continue;
            const daysInfo = computeDaysRemainingLabel(ent.status, ent.valid_until, nowMs);
            merged.push({
                id: ent.id,
                seriesId: ent.series_id || null,
                courseName: ent.series_name?.trim() || 'MindFlow Course Access',
                courseType: ent.course_type,
                validityDays: 365,
                orderCode: `ENT-${ent.id.slice(0, 8).toUpperCase()}`,
                purchaseDate: ent.starts_at || ent.created_at,
                endDate: ent.valid_until,
                amountInr: 0,
                status: ent.status,
                targetRoute: resolveSafeTargetRoute(ent.target_route, ent.series_id),
                upiReference: null,
                daysLabel: daysInfo.label,
                daysTone: daysInfo.tone,
            });
        }

        return merged.sort((a, b) => {
            const bMs = Date.parse(b.purchaseDate);
            const aMs = Date.parse(a.purchaseDate);
            return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
        });
    }, [receipts, entitlements]);

    const handleOpenRenewDialog = useCallback((card: (typeof purchaseCards)[number]) => {
        if (!card.seriesId) return;
        triggerHaptic('light');
        const cachedSeries =
            getCachedAllPublishedMockSeriesCatalogSnapshot()?.series.find(
                (s) => s.id === card.seriesId
            ) ?? null;

        const initialInfo: CourseCheckoutSeriesInfo = cachedSeries
            ? {
                  id: String(cachedSeries.id),
                  name: String(cachedSeries.name),
                  price_inr: cachedSeries.price_inr,
                  mrp_inr: cachedSeries.mrp_inr,
                  validity_days: cachedSeries.validity_days,
                  free_demo_count: cachedSeries.free_demo_count,
                  category_name: cachedSeries.category_name,
              }
            : {
                  id: card.seriesId,
                  name: card.courseName,
                  price_inr: card.amountInr,
                  validity_days: card.validityDays,
              };

        setRenewalSeries(initialInfo);

        if (!cachedSeries && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
            fetchSeriesDetails(card.seriesId)
                .then((fresh) => {
                    if (!isMountedRef.current || !fresh) return;
                    setRenewalSeries((prev) => {
                        if (!prev || prev.id !== card.seriesId) return prev;
                        return {
                            id: String(fresh.id),
                            name: String(fresh.name ?? prev.name),
                            price_inr: Math.max(0, Number(fresh.price_inr ?? prev.price_inr)),
                            mrp_inr: fresh.mrp_inr != null ? Number(fresh.mrp_inr) : null,
                            validity_days: Math.max(
                                1,
                                Number(fresh.validity_days ?? prev.validity_days ?? 365)
                            ),
                            free_demo_count: Math.max(0, Number(fresh.free_demo_count ?? 1)),
                            category_name:
                                fresh.mock_categories?.name ??
                                fresh.exam_categories?.name ??
                                undefined,
                        };
                    });
                })
                .catch(() => {});
        }
    }, []);

    return (
        <div
            data-testid="my-purchase-page"
            className="flex flex-col min-h-[100dvh] w-full pb-28 scroll-mb-28 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
        >
            <DedicatedPageHeader
                title="My Purchase"
                subtitle="Course receipts & active course validity"
                onBack={() => navigate(ROUTES.DASHBOARD)}
                badge={
                    profile?.student_id ? (
                        <span
                            data-testid="purchase-header-student-id"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300"
                        >
                            {profile.student_id}
                        </span>
                    ) : undefined
                }
            />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-10">
                {loading ? (
                    <div className="space-y-3" aria-label="Loading purchases">
                        {[1, 2].map((idx) => (
                            <div
                                key={idx}
                                className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse p-5"
                            />
                        ))}
                    </div>
                ) : purchaseCards.length === 0 ? (
                    <div
                        data-testid="no-purchase-empty-state"
                        className="min-h-[58dvh] flex flex-col items-center justify-center text-center px-4"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            No purchase yet
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Your unlocked paid test series, order receipts, and remaining validity days will appear here.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                navigate(ROUTES.TEST_SERIES.ROOT);
                            }}
                            className="mt-6 min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                        >
                            <span>Browse Test Series</span>
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {purchaseCards.map((card) => {
                            const statusBadgeClasses =
                                card.daysTone === 'active'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                    : card.daysTone === 'warning'
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                      : card.daysTone === 'pending'
                                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';

                            const typeBadge =
                                card.courseType !== 'mock_series'
                                    ? COURSE_TYPE_BADGE[card.courseType]
                                    : null;
                            const showRenewalBanner =
                                (card.daysTone === 'warning' || card.daysTone === 'expired') &&
                                Boolean(card.seriesId);

                            return (
                                <article
                                    key={card.id}
                                    className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm overflow-hidden transition-colors"
                                >
                                    <button
                                        type="button"
                                        data-testid="purchase-receipt-card"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            navigate(card.targetRoute);
                                        }}
                                        className="w-full min-h-[44px] text-left p-4 sm:p-5 transition-all active:scale-[0.99] touch-manipulation cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-black ${statusBadgeClasses}`}
                                                    >
                                                        {card.daysLabel}
                                                    </span>
                                                    {typeBadge && (
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-black uppercase tracking-wider ${typeBadge.className}`}
                                                        >
                                                            {typeBadge.label}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                        <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                                                        <span>Order ID: #{card.orderCode}</span>
                                                    </span>
                                                </div>
                                                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                                    {card.courseName}
                                                </h2>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {card.amountInr > 0 && (
                                                    <span className="text-base font-black text-slate-900 dark:text-white">
                                                        ₹{card.amountInr}
                                                    </span>
                                                )}
                                                <span className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                                                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                <span>
                                                    Purchase Date:{' '}
                                                    <strong className="text-slate-900 dark:text-white">
                                                        {formatReceiptDate(card.purchaseDate)}
                                                    </strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                <span>
                                                    End Date:{' '}
                                                    <strong className="text-slate-900 dark:text-white">
                                                        {card.endDate
                                                            ? formatReceiptDate(card.endDate)
                                                            : String(card.status ?? '').toLowerCase() ===
                                                                    'pending_verification' ||
                                                                String(card.status ?? '').toLowerCase() ===
                                                                    'pending'
                                                              ? 'Pending'
                                                              : '—'}
                                                    </strong>
                                                </span>
                                            </div>

                                            {card.upiReference && (
                                                <div className="col-span-2 sm:col-span-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate sm:text-right">
                                                    UTR: {card.upiReference}
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {showRenewalBanner && (
                                        <div
                                            className={`px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                                                card.daysTone === 'expired'
                                                    ? 'border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20'
                                                    : 'border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20'
                                            }`}
                                        >
                                            <p
                                                className={`text-xs font-bold ${
                                                    card.daysTone === 'expired'
                                                        ? 'text-rose-800 dark:text-rose-200'
                                                        : 'text-amber-900 dark:text-amber-200'
                                                }`}
                                            >
                                                {card.daysTone === 'expired'
                                                    ? 'Course access has expired. Renew now to restore practice access.'
                                                    : 'Expiring soon. Renew early to extend your validity.'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenRenewDialog(card)}
                                                data-testid={`renew-access-btn-${card.id}`}
                                                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation cursor-pointer shadow-xs shrink-0"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                <span>Renew Access</span>
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            <CourseCheckoutDialog
                isOpen={Boolean(renewalSeries)}
                onClose={() => setRenewalSeries(null)}
                series={renewalSeries}
                studentId={profile?.student_id ?? null}
                userId={userId}
                isRenewal
                onRequestSubmitted={() => void loadPurchaseHistory(true)}
            />
        </div>
    );
};
