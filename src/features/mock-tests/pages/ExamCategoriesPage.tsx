import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers, RefreshCw, Sparkles } from 'lucide-react';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    MockSeriesType,
    PublishedMockSeriesCatalogItem,
    fetchAllPublishedMockSeriesCatalog,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    readAllPublishedMockSeriesCatalogIndexedDBCache,
} from '../api/mockTestsApi';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { SwipeableTabViewport } from '@/components/ui/SwipeableTabViewport';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { EmptyState } from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';

const MY_ATTEMPTS_TAB = 'my_attempts';
const ALL_TAB = 'all';

type SourceTypeFilter = 'all' | MockSeriesType;

const SOURCE_TYPE_OPTIONS: Array<{ id: SourceTypeFilter; label: string }> = [
    { id: 'all', label: 'All Types' },
    { id: 'PYQ', label: 'PYQ Papers' },
    { id: 'MOCK', label: 'Expert Mocks' },
];

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
    onSeeAll: (categoryId: string) => void;
    renderCard: (series: PublishedMockSeriesCatalogItem, cardClassName?: string) => React.ReactNode;
}

const CategorySeriesRail: React.FC<CategorySeriesRailProps> = ({
    group,
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
                    <button
                        type="button"
                        onClick={() => onSeeAll(group.categoryId)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 active:scale-95 transition-all touch-manipulation cursor-pointer inline-flex items-center justify-center"
                    >
                        See All
                    </button>
                </div>
            </div>

            <div ref={railRef} className="mf-h-rail gap-4 py-1">
                {group.items.map((item) =>
                    renderCard(item, 'w-[276px] sm:w-[304px] shrink-0 snap-start')
                )}
            </div>
        </section>
    );
};

export const ExamCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialSnapshot = useMemo(() => getCachedAllPublishedMockSeriesCatalogSnapshot(), []);

    const [categories, setCategories] = useState<any[]>(() => initialSnapshot?.categories || []);
    const [series, setSeries] = useState<PublishedMockSeriesCatalogItem[]>(
        () => initialSnapshot?.series || []
    );
    const [loading, setLoading] = useState<boolean>(() => !initialSnapshot);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
    const [sourceFilter, setSourceFilter] = useState<SourceTypeFilter>('all');

    const hasHydratedRef = useRef<boolean>(Boolean(initialSnapshot));
    const isMountedRef = useRef<boolean>(true);

    const loadCatalog = useCallback(async (forceRefresh: boolean = false) => {
        if (!hasHydratedRef.current) {
            setLoading(true);
        }
        setIsRefreshing(true);
        setLoadError(false);

        try {
            if (!hasHydratedRef.current && !forceRefresh) {
                const idbSnapshot = await readAllPublishedMockSeriesCatalogIndexedDBCache();
                if (!isMountedRef.current) return;
                if (idbSnapshot) {
                    setCategories(idbSnapshot.categories);
                    setSeries(idbSnapshot.series);
                    hasHydratedRef.current = true;
                    setLoading(false);
                }
            }

            const fresh = await fetchAllPublishedMockSeriesCatalog({ forceRefresh });
            if (!isMountedRef.current) return;
            setCategories(fresh.categories);
            setSeries(fresh.series);
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
    }, []);

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
            activeTab !== MY_ATTEMPTS_TAB &&
            categories.length > 0 &&
            !categories.some((c) => c.id === activeTab)
        ) {
            setActiveTab(ALL_TAB);
        }
    }, [activeTab, categories]);

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

    const sourceFilteredSeries = useMemo(() => {
        if (sourceFilter === 'all') return series;
        return series.filter((s) => s.series_type === sourceFilter);
    }, [series, sourceFilter]);

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

        for (const s of sourceFilteredSeries) {
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
    }, [categories, sourceFilteredSeries]);

    const tabs = useMemo(
        () => [
            { id: ALL_TAB, label: 'All' },
            ...categories.map((c) => ({ id: String(c.id), label: String(c.name || 'Category') })),
            { id: MY_ATTEMPTS_TAB, label: 'My Attempts' },
        ],
        [categories]
    );

    const renderSeriesCard = useCallback(
        (s: PublishedMockSeriesCatalogItem, extraClassName = '') => {
            const isPyq = s.series_type === 'PYQ';
            return (
                <button
                    key={s.id}
                    type="button"
                    onClick={() => navToSeries(s.id)}
                    className={`group text-left w-full min-h-[44px] min-w-[44px] scroll-mb-28 touch-manipulation active:scale-[0.98] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all duration-200 flex flex-col cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 ${extraClassName}`}
                >
                    <span className="aspect-video w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900 block">
                        <BrandedThumbnail
                            title={s.name}
                            type="series"
                            imageUrl={s.thumbnail_url}
                            className="w-full h-full"
                        />
                        {s.is_premium ? (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                <Sparkles className="w-3 h-3" aria-hidden="true" />
                                PRO
                            </span>
                        ) : (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                Free
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
                    </span>
                </button>
            );
        },
        [navToSeries]
    );

    const refreshBtn = (
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
    );

    const infoPopover = (
        <InfoHintPopover
            title="Mock Test Series"
            purpose="Explore timed CBT mock exams and previous year question (PYQ) series curated by MindFlow."
            studentVisibility="Browse all categories via horizontal rails or swipe across tabs. Track paused and completed mocks under My Attempts."
            example="Tap any series card to inspect individual tests, marking rules, and live leaderboards."
            align="end"
        />
    );

    const renderTabPanel = (tabId: string) => {
        if (tabId === MY_ATTEMPTS_TAB) {
            return (
                <ContinueLearningSection
                    variant="grid"
                    returnTo={ROUTES.TEST_SERIES.ROOT}
                    onBrowseFallback={() => setActiveTab(ALL_TAB)}
                />
            );
        }

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
                        description={
                            sourceFilter === 'all'
                                ? 'No published mock test series are available right now.'
                                : `No ${sourceFilter === 'PYQ' ? 'PYQ paper' : 'expert mock'} series match this filter.`
                        }
                        icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                        actionLabel={sourceFilter !== 'all' ? 'Show All Types' : undefined}
                        onAction={sourceFilter !== 'all' ? () => setSourceFilter('all') : undefined}
                    />
                );
            }

            return (
                <div className="space-y-6">
                    {categoryGroups.map((group) => (
                        <CategorySeriesRail
                            key={group.categoryId}
                            group={group}
                            onSeeAll={(catId) => handleSelectTab(catId)}
                            renderCard={renderSeriesCard}
                        />
                    ))}
                </div>
            );
        }

        const tabSeries = sourceFilteredSeries.filter((s) => s.category_id === tabId);
        if (tabSeries.length === 0) {
            return (
                <EmptyState
                    title="No Mock Series Available"
                    description={
                        sourceFilter === 'all'
                            ? 'No published series found in this category yet.'
                            : `No ${sourceFilter === 'PYQ' ? 'PYQ paper' : 'expert mock'} series found in this category.`
                    }
                    icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                    actionLabel={sourceFilter !== 'all' ? 'Show All Types' : 'View All Series'}
                    onAction={
                        sourceFilter !== 'all'
                            ? () => setSourceFilter('all')
                            : () => setActiveTab(ALL_TAB)
                    }
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabSeries.map((item) => renderSeriesCard(item))}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-[100dvh] w-full pb-28 scroll-mb-28 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-clip">
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
                                className={`min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
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
                {activeTab !== MY_ATTEMPTS_TAB && (
                    <div
                        role="group"
                        aria-label="Series source type filter"
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain"
                    >
                        {SOURCE_TYPE_OPTIONS.map((opt) => {
                            const isSelected = sourceFilter === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSourceFilter(opt.id);
                                    }}
                                    className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                )}

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
        </div>
    );
};
