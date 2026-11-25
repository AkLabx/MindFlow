import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles } from 'lucide-react';
import {
    MOCK_CACHE_INVALIDATED_EVENT,
    MOCK_CACHE_VERSION_KEY,
    PublishedMockSeriesCatalogItem,
    fetchAllPublishedMockSeriesCatalog,
    getCachedAllPublishedMockSeriesCatalogSnapshot,
    readAllPublishedMockSeriesCatalogIndexedDBCache,
} from '../api/mockTestsApi';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { EmptyState } from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';

const MY_ATTEMPTS_TAB = 'my_attempts';
const ALL_TAB = 'all';

export const ExamCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const initialSnapshot = useMemo(() => getCachedAllPublishedMockSeriesCatalogSnapshot(), []);

    const [categories, setCategories] = useState<any[]>(() => initialSnapshot?.categories || []);
    const [series, setSeries] = useState<PublishedMockSeriesCatalogItem[]>(
        () => initialSnapshot?.series || []
    );
    const [loading, setLoading] = useState<boolean>(() => !initialSnapshot);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

    const hasHydratedRef = useRef<boolean>(Boolean(initialSnapshot));
    const isMountedRef = useRef<boolean>(true);

    const loadCatalog = useCallback(async (forceRefresh: boolean = false) => {
        if (!hasHydratedRef.current) {
            setLoading(true);
        }
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

    const handleSelectTab = (tabId: string, buttonEl?: HTMLButtonElement | null) => {
        triggerHaptic('light');
        setActiveTab(tabId);
        if (buttonEl && typeof buttonEl.scrollIntoView === 'function') {
            buttonEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    };

    const navToSeries = (seriesId: string) => {
        triggerHaptic('light');
        navigate(ROUTES.TEST_SERIES.SERIES(seriesId), {
            state: { returnTo: ROUTES.TEST_SERIES.ROOT },
        });
    };

    const visibleSeries = useMemo(() => {
        if (activeTab === ALL_TAB || activeTab === MY_ATTEMPTS_TAB) {
            return series;
        }
        return series.filter((s) => s.category_id === activeTab);
    }, [series, activeTab]);

    const tabs = useMemo(
        () => [
            { id: ALL_TAB, label: 'All' },
            ...categories.map((c) => ({ id: String(c.id), label: String(c.name || 'Category') })),
            { id: MY_ATTEMPTS_TAB, label: 'My Attempts' },
        ],
        [categories]
    );

    return (
        <div className="flex flex-col min-h-[100dvh] w-full pb-28 scroll-mb-28 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="flex-1 w-full max-w-7xl mx-auto">
                {/* Clean Compact Header */}
                <header className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                                Mock Test Series
                            </h1>
                            <InfoHintPopover
                                title="Mock Test Series"
                                purpose="Explore official timed mock exams organized by exam category. Free series are open to all aspirants, while PRO series unlock premium full-length & sectional papers."
                                studentVisibility="All published series appear in All and their exam category tab. Your paused and completed mock attempts live under My Attempts."
                                example="Tap any series card to open its timed CBT mock tests, negative marking rules, and live leaderboard."
                                align="end"
                            />
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Official timed CBT mock exams and previous year series curated by MindFlow.
                    </p>
                </header>

                {/* Single-Row Horizontally Scrollable Tablist */}
                <div
                    role="tablist"
                    aria-label="Mock test series categories"
                    className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 mb-6"
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
                                className={`min-h-[44px] min-w-[44px] scroll-mb-28 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
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

                {/* Tab Panel */}
                <div
                    id={`series-panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`series-tab-${activeTab}`}
                >
                    {activeTab === MY_ATTEMPTS_TAB ? (
                        <ContinueLearningSection
                            variant="grid"
                            returnTo={ROUTES.TEST_SERIES.ROOT}
                            onBrowseFallback={() => setActiveTab(ALL_TAB)}
                        />
                    ) : loading ? (
                        <GridSkeleton count={6} />
                    ) : loadError && series.length === 0 ? (
                        <EmptyState
                            title="Could Not Load Mock Series"
                            description="Please check your internet connection and retry syncing the mock test catalog."
                            icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                            actionLabel="Retry Sync"
                            onAction={() => void loadCatalog(true)}
                        />
                    ) : visibleSeries.length === 0 ? (
                        <EmptyState
                            title="No Mock Series Available"
                            description={
                                activeTab === ALL_TAB
                                    ? 'No published mock test series are available right now.'
                                    : 'No published series found in this category yet.'
                            }
                            icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                            actionLabel={activeTab !== ALL_TAB ? 'View All Series' : undefined}
                            onAction={activeTab !== ALL_TAB ? () => setActiveTab(ALL_TAB) : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {visibleSeries.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => navToSeries(s.id)}
                                    className="group text-left w-full min-h-[44px] min-w-[44px] scroll-mb-28 touch-manipulation active:scale-[0.98] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all duration-200 flex flex-col h-full cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
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
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
                                                {s.category_name}
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
