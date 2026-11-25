import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkCheck,
  ChevronRight,
  Crown,
  Layers,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { triggerHaptic } from '@/lib/haptics';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import {
  PublishedMockSeriesCatalogItem,
  fetchAllPublishedMockSeriesCatalog,
  getCachedAllPublishedMockSeriesCatalogSnapshot,
  getSavedMockTestIds,
  readAllPublishedMockSeriesCatalogIndexedDBCache,
  readSavedMockTestsIndexedDB,
} from '../api/mockTestsApi';

interface PaymentRow {
  id: string;
  plan_purchased: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
}

const formatCurrency = (amount: number | null, currency: string | null): string => {
  if (amount === null || !Number.isFinite(amount)) return '—';
  const cur = (currency || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount}`;
  }
};

const formatShortDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(ms));
  } catch {
    return iso;
  }
};

export const PurchasedCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const initialCatalog = useMemo(() => getCachedAllPublishedMockSeriesCatalogSnapshot(), []);
  const [savedTestIds, setSavedTestIds] = useState<string[]>(() =>
    user?.id ? getSavedMockTestIds(user.id) : []
  );
  const [catalogSeries, setCatalogSeries] = useState<PublishedMockSeriesCatalogItem[]>(
    () => initialCatalog?.series ?? []
  );
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadHubData = async () => {
      setLoading(true);
      try {
        const [idbSaved, idbCatalog] = await Promise.all([
          user?.id ? readSavedMockTestsIndexedDB(user.id) : Promise.resolve([]),
          !initialCatalog ? readAllPublishedMockSeriesCatalogIndexedDBCache() : Promise.resolve(null),
        ]);

        if (!isMounted) return;
        if (user?.id) {
          setSavedTestIds(idbSaved);
        }
        if (idbCatalog?.series) {
          setCatalogSeries(idbCatalog.series);
        }

        const [freshCatalog, paymentsRes] = await Promise.allSettled([
          fetchAllPublishedMockSeriesCatalog(),
          user?.id
            ? supabase
                .from('payments')
                .select('id, plan_purchased, amount, currency, status, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (!isMounted) return;
        if (freshCatalog.status === 'fulfilled' && freshCatalog.value?.series) {
          setCatalogSeries(freshCatalog.value.series);
        }

        if (paymentsRes.status === 'fulfilled' && !paymentsRes.value.error && Array.isArray(paymentsRes.value.data)) {
          setPayments(paymentsRes.value.data as PaymentRow[]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadHubData();
    return () => {
      isMounted = false;
    };
  }, [initialCatalog, user?.id]);

  const subscriptionStatus = String(profile?.subscription_status ?? 'free').trim().toLowerCase();
  const isPaidPass = subscriptionStatus === 'pro' || subscriptionStatus === 'spark';
  const planLabel =
    subscriptionStatus === 'pro'
      ? 'MindFlow Pro'
      : subscriptionStatus === 'spark'
        ? 'MindFlow Spark'
        : 'Free Plan';
  const expiryText = profile?.plan_expiry_date ? formatShortDate(profile.plan_expiry_date) : null;

  const unlockedSeries = useMemo(() => {
    if (!isPaidPass) return [];
    return catalogSeries.filter((s) => s.is_premium).slice(0, 6);
  }, [catalogSeries, isPaidPass]);

  const handleNavigate = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 pb-28 scroll-mb-28 overflow-x-clip">
      <DedicatedPageHeader
        title="Purchased Courses"
        subtitle="Your unlocked Pro passes, series & saved tests"
        onBack={() => navigate(ROUTES.DASHBOARD)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Section 1: Active Pass & Purchased Courses */}
        <section aria-labelledby="purchased-pass-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="purchased-pass-heading"
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <Crown className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
              <span>Active Pass &amp; Purchased Courses</span>
            </h2>
            <span
              className={
                isPaidPass
                  ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }
            >
              {isPaidPass ? <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> : null}
              {planLabel}
            </span>
          </div>

          {isPaidPass ? (
            <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-white dark:bg-slate-800/70 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{planLabel} Active</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {expiryText ? `Valid until ${expiryText}` : 'All premium mock test series unlocked'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate(ROUTES.TEST_SERIES.ROOT)}
                  className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 active:scale-95 touch-manipulation transition-colors cursor-pointer"
                >
                  <span>Explore Mock Test Series</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {unlockedSeries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {unlockedSeries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(ROUTES.TEST_SERIES.SERIES(item.id))}
                      className="min-h-[44px] w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center justify-between gap-2 active:scale-95 touch-manipulation transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.category_name} • {item.published_test_count} tests
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No active Pro pass yet</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Unlock full-length mock series &amp; previous year papers or start with free tests.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate(ROUTES.TEST_SERIES.ROOT)}
                      className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 active:scale-95 touch-manipulation transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4" aria-hidden="true" />
                      <span>Explore Mock Test Series</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate(ROUTES.PROFILE.SUBSCRIPTION)}
                      className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 active:scale-95 touch-manipulation transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                      <span>View Pro Plans</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {payments.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 divide-y divide-slate-100 dark:divide-slate-700/60">
              {payments.map((payment) => (
                <div key={payment.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Receipt className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {payment.plan_purchased || 'MindFlow Pass'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatShortDate(payment.created_at)} • {payment.status || 'recorded'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Section 2: Saved Mock Tests */}
        <section aria-labelledby="saved-tests-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="saved-tests-heading"
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <BookmarkCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
              <span>Saved Mock Tests</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {savedTestIds.length}
            </span>
          </div>

          {savedTestIds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedTestIds.map((testId, index) => (
                <button
                  key={testId}
                  type="button"
                  onClick={() => handleNavigate(ROUTES.TEST_SERIES.TEST(testId))}
                  className="min-h-[44px] w-full text-left p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center justify-between gap-3 active:scale-95 touch-manipulation transition-colors shadow-sm cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      Saved Mock Test #{index + 1}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      ID: {testId}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 shrink-0">
                    Open
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {loading ? 'Checking saved mock tests…' : 'No saved mock tests yet'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bookmark any mock test from Test Series to access it quickly offline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate(ROUTES.TEST_SERIES.ROOT)}
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 active:scale-95 touch-manipulation transition-colors cursor-pointer"
              >
                <span>Browse Tests</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
