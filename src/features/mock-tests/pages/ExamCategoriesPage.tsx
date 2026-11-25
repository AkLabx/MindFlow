import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    History,
    Layers,
    Lock,
    Radio,
    RefreshCw,
    Sparkles,
    X,
} from 'lucide-react';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    PreparedMockTestItem,
    PublishedMockSeriesCatalogItem,
    UserCourseEntitlementItem,
    fetchAllPublishedMockSeriesCatalog,
    fetchLiveMockTests,
    fetchUserCourseEntitlements,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    getCachedLiveMockTestsSnapshot,
    getCachedUserCourseEntitlementsSnapshot,
    isMockSeriesPaid,
    readAllPublishedMockSeriesCatalogIndexedDBCache,
    readLiveMockTestsIndexedDBCache,
    readUserCourseEntitlementsIndexedDBCache,
} from '../api/mockTestsApi';
import { useAuth } from '@/features/auth';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { SwipeableTabViewport } from '@/components/ui/SwipeableTabViewport';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { EmptyState } from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';

const ALL_TAB = 'all';

const resolveSafeReturnTarget = (locationState: unknown): string => {
    const candidate =
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.returnTo ??
        (locationState as { returnTo?: unknown; from?: unknown } | null)?.from;

    if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }
    return ROUTES.DASHBOARD;
};

interface CategoryGroup {
    categoryId: string;
    categoryName: string;
    items: PublishedMockSeriesCatalogItem[];
}

interface CategorySeriesRailProps {
    group: CategoryGroup;
    showSeeAll?: boolean;
    onSeeAll?: (categoryId: string) => void;
    renderCard: (series: PublishedMockSeriesCatalogItem, cardClassName?: string) => React.ReactNode;
}

const CategorySeriesRail: React.FC<CategorySeriesRailProps> = ({
    group,
    showSeeAll = true,
    onSeeAll,
    renderCard,
}) => {
    const railRef = useRef<HTMLDivElement>(null);

    const scrollRail = (direction: -1 | 1) => {
        const rail = railRef.current;
        if (!rail) return;
        triggerHaptic('light');
        if (typeof rail.scrollBy === 'function') {
            rail.scrollBy({ left: direction * 320, behavior: 'smooth' });
        } else {
            rail.scrollLeft += direction * 320;
        }
    };

    return (
        <section className="space-y-2.5" aria-label={group.categoryName}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                        {group.categoryName}
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {group.items.length}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => scrollRail(-1)}
                        aria-label={`Scroll ${group.categoryName} left`}
                        className="hidden md:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:border-indigo-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollRail(1)}
                        aria-label={`Scroll ${group.categoryName} right`}
                        className="hidden md:inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:border-indigo-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {showSeeAll && onSeeAll && (
                        <button
                            type="button"
                            onClick={() => onSeeAll(group.categoryId)}
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 active:scale-95 transition-all touch-manipulation cursor-pointer inline-flex items-center justify-center"
                        >
                            See All
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={railRef}
                data-h-rail="true"
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="mf-h-rail gap-3.5 sm:gap-4 py-1 pr-4"
            >
                {group.items.map((item) =>
                    renderCard(item, 'w-[78vw] max-w-[300px] sm:w-[304px] shrink-0 snap-start')
                )}
            </div>
        </section>
    );
};

export const ExamCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile } = useAuth();
    const userId = user?.id ?? null;

    const initialSnapshot = useMemo(() => getCachedAllPublishedMockSeriesCatalogSnapshot(), []);

    const [categories, setCategories] = useState<any[]>(() => initialSnapshot?.categories || []);
    const [series, setSeries] = useState<PublishedMockSeriesCatalogItem[]>(
        () => initialSnapshot?.series || []
    );
    const [entitlements, setEntitlements] = useState<UserCourseEntitlementItem[]>(() =>
        userId ? getCachedUserCourseEntitlementsSnapshot(userId) ?? [] : []
    );
    const [liveTests, setLiveTests] = useState<PreparedMockTestItem[]>(
        () => getCachedLiveMockTestsSnapshot() ?? []
    );
    const [loading, setLoading] = useState<boolean>(() => !initialSnapshot);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
    const [isMyAttemptsOpen, setIsMyAttemptsOpen] = useState<boolean>(false);
    const [isLiveTestsOpen, setIsLiveTestsOpen] = useState<boolean>(false);

    const hasHydratedRef = useRef<boolean>(Boolean(initialSnapshot));
    const isMountedRef = useRef<boolean>(true);

    const loadCatalog = useCallback(
        async (forceRefresh: boolean = false) => {
            if (!hasHydratedRef.current) {
                setLoading(true);
            }
            setIsRefreshing(true);
            setLoadError(false);

            try {
                if (!hasHydratedRef.current && !forceRefresh) {
                    const [idbSnapshot, idbLive, idbEnt] = await Promise.all([
                        readAllPublishedMockSeriesCatalogIndexedDBCache(),
                        readLiveMockTestsIndexedDBCache(),
                        userId
                            ? readUserCourseEntitlementsIndexedDBCache(userId)
                            : Promise.resolve(null),
                    ]);
                    if (!isMountedRef.current) return;
                    if (idbLive) setLiveTests(idbLive);
                    if (idbEnt) setEntitlements(idbEnt);
                    if (idbSnapshot) {
                        setCategories(idbSnapshot.categories);
                        setSeries(idbSnapshot.series);
                        hasHydratedRef.current = true;
                        setLoading(false);
                    }
                }

                const [freshCatalog, freshLive, freshEnt] = await Promise.all([
                    fetchAllPublishedMockSeriesCatalog({ forceRefresh }),
                    fetchLiveMockTests({ userId, forceRefresh }).catch(() => null),
                    userId
                        ? fetchUserCourseEntitlements(userId, { forceRefresh }).catch(() => null)
                        : Promise.resolve(null),
                ]);

                if (!isMountedRef.current) return;
                setCategories(freshCatalog.categories);
                setSeries(freshCatalog.series);
                if (freshLive) setLiveTests(freshLive);
                if (freshEnt) setEntitlements(freshEnt);
                hasHydratedRef.current = true;
                setLoadError(false);
            } catch (error) {
                console.error('Error fetching mock test series catalog:', error);
                if (!isMountedRef.current) return;
                if (!hasHydratedRef.current) {
                    setLoadError(true);
                }
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                    setIsRefreshing(false);
                }
            }
        },
        [userId]
    );

    useEffect(() => {
        isMountedRef.current = true;
        void loadCatalog(false);

        const handleInvalidate = () => {
            void loadCatalog(true);
        };
        const handleStorage = (e: StorageEvent) => {
            if (e.key === MOCK_CACHE_VERSION_KEY) {
                void loadCatalog(true);
            }
        };

        window.addEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);
        window.addEventListener('storage', handleStorage);

        let channel: BroadcastChannel | null = null;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel('mindflow-mock-cache');
                channel.onmessage = () => handleInvalidate();
            } catch {
                channel = null;
            }
        }

        return () => {
            isMountedRef.current = false;
            window.removeEventListener(MOCK_CACHE_INVALIDATED_EVENT, handleInvalidate);
            window.removeEventListener('storage', handleStorage);
            if (channel) {
                channel.close();
            }
        };
    }, [loadCatalog]);

    useEffect(() => {
        if (
            activeTab !== ALL_TAB &&
            categories.length > 0 &&
            !categories.some((c) => c.id === activeTab)
        ) {
            setActiveTab(ALL_TAB);
        }
    }, [activeTab, categories]);

    const activeEntitledSeriesIds = useMemo(() => {
        const nowMs = Date.now();
        const set = new Set<string>();
        for (const ent of entitlements) {
            if (ent?.status !== 'active') continue;
            const validMs = Date.parse(String(ent.valid_until ?? ''));
            if (Number.isFinite(validMs) && validMs > nowMs && ent.series_id) {
                set.add(String(ent.series_id));
            }
        }
        return set;
    }, [entitlements]);

    const handleBack = () => {
        navigate(resolveSafeReturnTarget(location.state));
    };

    const handleSelectTab = useCallback((tabId: string, buttonEl?: HTMLButtonElement | null) => {
        triggerHaptic('light');
        setActiveTab(tabId);
        if (buttonEl && typeof buttonEl.scrollIntoView === 'function') {
            buttonEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }, []);

    const navToSeries = useCallback(
        (seriesId: string) => {
            triggerHaptic('light');
            navigate(ROUTES.TEST_SERIES.SERIES(seriesId), {
                state: { returnTo: ROUTES.TEST_SERIES.ROOT },
            });
        },
        [navigate]
    );

    const categoryGroups = useMemo<CategoryGroup[]>(() => {
        const grouped = new Map<string, CategoryGroup>();

        for (const cat of categories) {
            const catId = String(cat?.id ?? '');
            if (!catId) continue;
            grouped.set(catId, {
                categoryId: catId,
                categoryName: String(cat?.name || 'Category'),
                items: [],
            });
        }

        for (const s of series) {
            const catId = String(s.category_id || 'other');
            const existing = grouped.get(catId);
            if (existing) {
                existing.items.push(s);
            } else {
                grouped.set(catId, {
                    categoryId: catId,
                    categoryName: s.category_name || 'Mock Series',
                    items: [s],
                });
            }
        }

        return Array.from(grouped.values()).filter((g) => g.items.length > 0);
    }, [categories, series]);

    const tabs = useMemo(
        () => [
            { id: ALL_TAB, label: 'All' },
            ...categories.map((c) => ({ id: String(c.id), label: String(c.name || 'Category') })),
        ],
        [categories]
    );

    const renderSeriesCard = useCallback(
        (s: PublishedMockSeriesCatalogItem, extraClassName = '') => {
            const isPyq = s.series_type === 'PYQ';
            const isPaid = isMockSeriesPaid(s);
            const isUnlocked = activeEntitledSeriesIds.has(s.id);
            const priceInr = Math.max(0, Number(s.price_inr ?? 0));
            const mrpInr = s.mrp_inr != null ? Number(s.mrp_inr) : null;

            return (
                <button
                    key={s.id}
                    type="button"
                    onClick={() => navToSeries(s.id)}
                    className={`group text-left w-full min-h-[44px] min-w-[44px] scroll-mb-44 touch-manipulation active:scale-[0.98] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all duration-200 flex flex-col cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 ${extraClassName}`}
                >
                    <span className="aspect-video w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900 block">
                        <BrandedThumbnail
                            title={s.name}
                            type="series"
                            imageUrl={s.thumbnail_url}
                            className="w-full h-full"
                        />
                        {!isPaid ? (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                Free
                            </span>
                        ) : isUnlocked ? (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                Unlocked
                            </span>
                        ) : (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                {priceInr > 0 ? (
                                    <>
                                        <Lock className="w-3 h-3" aria-hidden="true" />
                                        <span>₹{priceInr}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                                        <span>PRO</span>
                                    </>
                                )}
                            </span>
                        )}
                    </span>

                    <span className="p-4 flex-1 flex flex-col w-full min-w-0">
                        <span className="flex items-center justify-between gap-2 mb-1.5 w-full">
                            <span className="flex items-center gap-1.5 min-w-0">
                                <span
                                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                        isPyq
                                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60'
                                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                                    }`}
                                >
                                    {isPyq ? 'PYQ Paper' : 'Expert Mock'}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                                    {s.category_name}
                                </span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-md shrink-0">
                                {s.published_test_count}{' '}
                                {s.published_test_count === 1 ? 'Test' : 'Tests'}
                            </span>
                        </span>

                        <span className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                            {s.name}
                        </span>

                        {s.description && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed block">
                                {s.description}
                            </span>
                        )}

                        {isPaid && !isUnlocked && priceInr > 0 && (
                            <span className="mt-auto pt-2.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                                <span>
                                    ₹{priceInr}{' '}
                                    {mrpInr && mrpInr > priceInr && (
                                        <span className="line-through text-slate-400 ml-1 font-normal">
                                            ₹{mrpInr}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                    {s.free_demo_count > 0
                                        ? `${s.free_demo_count} Free Demo`
                                        : `${s.validity_days}d Access`}
                                </span>
                            </span>
                        )}
                    </span>
                </button>
            );
        },
        [activeEntitledSeriesIds, navToSeries]
    );

    const refreshBtn = (
        <div className="flex items-center gap-2">
            {profile?.student_id && (
                <span
                    data-testid="series-header-student-id"
                    className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300"
                >
                    {profile.student_id}
                </span>
            )}
            <button
                type="button"
                onClick={() => {
                    triggerHaptic('light');
                    void loadCatalog(true);
                }}
                disabled={isRefreshing}
                aria-label="Refresh mock test series"
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation cursor-pointer disabled:opacity-60"
            >
                <RefreshCw
                    className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
                    aria-hidden="true"
                />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing' : 'Refresh'}</span>
            </button>
        </div>
    );

    const infoPopover = (
        <InfoHintPopover
            title="Mock Test Series"
            purpose="Explore timed CBT mock exams and previous year question (PYQ) courses curated by MindFlow."
            studentVisibility="Swipe any category rail horizontally to browse series cards. Filter PYQ Papers vs Expert Mocks inside a series, or open My Attempts and Live Test from the bottom bar."
            example="Tap any series card to view free demos, CBT pattern options, and course unlock details."
            align="end"
        />
    );

    const renderTabPanel = (tabId: string) => {
        if (loading) {
            return <GridSkeleton count={6} />;
        }

        if (loadError && series.length === 0) {
            return (
                <EmptyState
                    title="Could Not Load Mock Series"
                    description="Please check your internet connection and retry syncing the mock test catalog."
                    icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                    actionLabel="Retry Sync"
                    onAction={() => void loadCatalog(true)}
                />
            );
        }

        if (tabId === ALL_TAB) {
            if (categoryGroups.length === 0) {
                return (
                    <EmptyState
                        title="No Mock Series Available"
                        description="No published mock test series are available right now."
                        icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                    />
                );
            }

            return (
                <div className="space-y-6">
                    {categoryGroups.map((group) => (
                        <CategorySeriesRail
                            key={group.categoryId}
                            group={group}
                            showSeeAll
                            onSeeAll={(catId) => handleSelectTab(catId)}
                            renderCard={renderSeriesCard}
                        />
                    ))}
                </div>
            );
        }

        const matchedCategory = categories.find((c) => String(c.id) === tabId);
        const tabSeries = series.filter((s) => s.category_id === tabId);
        if (tabSeries.length === 0) {
            return (
                <EmptyState
                    title="No Mock Series Available"
                    description="No published series found in this category yet."
                    icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                    actionLabel="View All Series"
                    onAction={() => setActiveTab(ALL_TAB)}
                />
            );
        }

        return (
            <CategorySeriesRail
                group={{
                    categoryId: tabId,
                    categoryName: String(matchedCategory?.name ?? tabSeries[0]?.category_name ?? 'Series'),
                    items: tabSeries,
                }}
                showSeeAll={false}
                renderCard={renderSeriesCard}
            />
        );
    };

    return (
        <div className="flex flex-col min-h-[100dvh] w-full pb-44 scroll-mb-44 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-clip">
            <DedicatedPageHeader
                title="Mock Test Series"
                onBack={handleBack}
                backLabel="Back"
                infoPopover={infoPopover}
                rightActions={refreshBtn}
            >
                <div
                    role="tablist"
                    aria-label="Mock test series categories"
                    className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain border-t border-slate-100 dark:border-slate-800/80 pt-1"
                >
                    {tabs.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`series-tab-${tab.id}`}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                aria-controls={`series-panel-${tab.id}`}
                                onClick={(e) => handleSelectTab(tab.id, e.currentTarget)}
                                className={`min-h-[44px] min-w-[44px] scroll-mb-44 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                    isSelected
                                        ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </DedicatedPageHeader>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
                <SwipeableTabViewport
                    tabs={tabs}
                    activeTabId={activeTab}
                    onTabChange={setActiveTab}
                    ariaLabel="Mock Test Series Views"
                    tabIdPrefix="series-tab"
                    panelIdPrefix="series-panel"
                    renderPanel={(tabId) => renderTabPanel(tabId)}
                />
            </div>

            {/* Bottom-Docked Horizontally Scrollable Action Bar above MainLayout Nav */}
            <div
                aria-label="Test Series Quick Actions"
                data-testid="test-series-bottom-action-strip"
                className="fixed left-0 right-0 z-40 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pointer-events-none px-4"
            >
                <div className="max-w-3xl mx-auto flex justify-center">
                    <div
                        data-h-rail="true"
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="pointer-events-auto mf-h-rail items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-lg px-2 py-1.5 max-w-full"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsMyAttemptsOpen(true);
                            }}
                            data-testid="bottom-strip-my-attempts-btn"
                            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-200 font-black text-xs sm:text-sm whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <History className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>My Attempts</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsLiveTestsOpen(true);
                            }}
                            data-testid="bottom-strip-live-test-btn"
                            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 font-black text-xs sm:text-sm whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                        >
                            <Radio
                                className={`w-4 h-4 shrink-0 ${liveTests.length > 0 ? 'animate-pulse text-rose-600 dark:text-rose-400' : ''}`}
                                aria-hidden="true"
                            />
                            <span>Live Test</span>
                            {liveTests.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black leading-none">
                                    {liveTests.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* My Attempts Bottom Sheet */}
            <NativeDialog
                isOpen={isMyAttemptsOpen}
                onClose={() => setIsMyAttemptsOpen(false)}
                variant="bottom-sheet"
                ariaLabelledBy="my-attempts-sheet-title"
                dataTestId="my-attempts-sheet"
                className="sm:max-w-3xl sm:mx-auto"
                panelClassName="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl max-h-[85dvh] flex flex-col"
            >
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2
                            id="my-attempts-sheet-title"
                            className="text-lg font-black text-slate-900 dark:text-white"
                        >
                            My Attempts
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Resume paused mock tests or inspect previous scorecards
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsMyAttemptsOpen(false)}
                        aria-label="Close My Attempts"
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pt-4">
                    <ContinueLearningSection
                        variant="grid"
                        returnTo={ROUTES.TEST_SERIES.ROOT}
                        onBrowseFallback={() => setIsMyAttemptsOpen(false)}
                    />
                </div>
            </NativeDialog>

            {/* Live Tests Bottom Sheet */}
            <NativeDialog
                isOpen={isLiveTestsOpen}
                onClose={() => setIsLiveTestsOpen(false)}
                variant="bottom-sheet"
                ariaLabelledBy="live-tests-sheet-title"
                dataTestId="live-tests-sheet"
                className="sm:max-w-2xl sm:mx-auto"
                panelClassName="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl max-h-[85dvh] flex flex-col"
            >
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Radio className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2
                                id="live-tests-sheet-title"
                                className="text-lg font-black text-slate-900 dark:text-white"
                            >
                                Live Mock Tests
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Active and upcoming scheduled All-India mock tests
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsLiveTestsOpen(false)}
                        aria-label="Close Live Tests"
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pt-4 space-y-3">
                    {liveTests.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <p className="text-base font-black text-slate-900 dark:text-white">
                                No Live Tests Scheduled
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Check back soon for upcoming All-India live tests, or start any test from the series catalog.
                            </p>
                        </div>
                    ) : (
                        liveTests.map((t) => {
                            const nowMs = Date.now();
                            const startsAtMs = t.live_start_at ? Date.parse(t.live_start_at) : null;
                            const isUpcoming =
                                startsAtMs !== null && Number.isFinite(startsAtMs) && startsAtMs > nowMs;

                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setIsLiveTestsOpen(false);
                                        navigate(ROUTES.TEST_SERIES.TEST(t.id), {
                                            state: { returnTo: ROUTES.TEST_SERIES.ROOT },
                                        });
                                    }}
                                    className="w-full text-left rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-rose-400 p-4 flex items-center justify-between gap-3 transition-all active:scale-[0.99] touch-manipulation cursor-pointer"
                                >
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isUpcoming
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-rose-600 text-white'
                                                }`}
                                            >
                                                {isUpcoming ? 'Upcoming' : 'Live Now'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                                {t.series_name}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                            {t.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                                {t.duration_minutes} mins
                                            </span>
                                            <span>{t.question_count} Qs</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                                </button>
                            );
                        })
                    )}
                </div>
            </NativeDialog>
        </div>
    );
};
