import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layers, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { triggerHaptic } from '@/lib/haptics';
import { DedicatedPageHeader } from '@/components/ui/DedicatedPageHeader';
import {
    MockSeriesType,
    fetchCategoryDetails,
    fetchPublishedTestSeries,
    normalizeMockSeriesType,
} from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { EmptyState } from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';

type TierFilter = 'all' | 'free' | 'premium';
type SourceFilter = 'all' | MockSeriesType;

export const TestSeriesPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { categoryId } = useParams<{ categoryId: string }>();
    const [category, setCategory] = useState<any>(null);
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<TierFilter>('all');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

    const handleBack = useCallback(() => {
        const state = location.state as { returnTo?: unknown; from?: unknown } | null;
        const candidate = state?.returnTo ?? state?.from;
        if (typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')) {
            navigate(candidate);
            return;
        }
        navigate(ROUTES.TEST_SERIES.ROOT);
    }, [location.state, navigate]);

    const loadCategoryData = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const [catData, seriesData] = await Promise.all([
                fetchCategoryDetails(id),
                fetchPublishedTestSeries(id),
            ]);
            setCategory(catData);
            setSeries(seriesData || []);
        } catch (error) {
            console.error('Error fetching category data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (categoryId) {
            void loadCategoryData(categoryId);
        }
    }, [categoryId, loadCategoryData]);

    const filteredSeries = useMemo(() => {
        return series.filter((s) => {
            if (filter === 'free' && s.is_premium) return false;
            if (filter === 'premium' && !s.is_premium) return false;
            const seriesType = normalizeMockSeriesType(s.series_type);
            if (sourceFilter !== 'all' && seriesType !== sourceFilter) return false;
            return true;
        });
    }, [series, filter, sourceFilter]);

    return (
        <div className="flex flex-col min-h-[100dvh] w-full pb-28 scroll-mb-28 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-clip">
            <DedicatedPageHeader
                title={category?.name || 'Exam Category'}
                subtitle={category?.description || `${series.length} series available`}
                onBack={handleBack}
                backLabel="Back"
            />

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-16 space-y-4">
                <Breadcrumbs
                    items={[
                        { label: 'Mock Tests', path: ROUTES.TEST_SERIES.ROOT },
                        { label: category?.name || 'Category' },
                    ]}
                />

                {loading ? (
                    <GridSkeleton count={4} />
                ) : !category ? (
                    <EmptyState
                        title="Category Not Found"
                        description="The category you are looking for does not exist or has been removed."
                        icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                        actionLabel="Go Back"
                        onAction={() => navigate(ROUTES.TEST_SERIES.ROOT)}
                    />
                ) : (
                    <>
                        {/* Compact Toolbar */}
                        {series.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div
                                    role="group"
                                    aria-label="Access tier filter"
                                    className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain"
                                >
                                    {(
                                        [
                                            { id: 'all', label: 'All' },
                                            { id: 'free', label: 'Free' },
                                            { id: 'premium', label: 'Premium' },
                                        ] as const
                                    ).map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            aria-pressed={filter === item.id}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setFilter(item.id);
                                            }}
                                            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                                filter === item.id
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                <div
                                    role="group"
                                    aria-label="Series type filter"
                                    className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain"
                                >
                                    {(
                                        [
                                            { id: 'all', label: 'All Types' },
                                            { id: 'PYQ', label: 'PYQ' },
                                            { id: 'MOCK', label: 'Expert' },
                                        ] as const
                                    ).map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            aria-pressed={sourceFilter === item.id}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setSourceFilter(item.id);
                                            }}
                                            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                                sourceFilter === item.id
                                                    ? 'bg-slate-900 dark:bg-indigo-500 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredSeries.length === 0 ? (
                            <EmptyState
                                title="No Series Available"
                                description={
                                    filter === 'all' && sourceFilter === 'all'
                                        ? 'There are no test series in this category yet.'
                                        : 'No test series match the selected filters in this category.'
                                }
                                icon={<Layers className="w-8 h-8" aria-hidden="true" />}
                                actionLabel={
                                    filter !== 'all' || sourceFilter !== 'all'
                                        ? 'Reset Filters'
                                        : undefined
                                }
                                onAction={
                                    filter !== 'all' || sourceFilter !== 'all'
                                        ? () => {
                                              setFilter('all');
                                              setSourceFilter('all');
                                          }
                                        : undefined
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                {filteredSeries.map((s) => {
                                    const isPyq = normalizeMockSeriesType(s.series_type) === 'PYQ';
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic('light');
                                                navigate(ROUTES.TEST_SERIES.SERIES(s.id), {
                                                    state: { returnTo: location.pathname },
                                                });
                                            }}
                                            className="group text-left w-full min-h-[44px] min-w-[44px] cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700/70 transition-all duration-200 flex flex-col active:scale-[0.98] touch-manipulation focus-visible:outline-2 focus-visible:outline-indigo-500 scroll-mb-28"
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
                                                <span className="flex items-center gap-1.5 mb-1.5">
                                                    <span
                                                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                            isPyq
                                                                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60'
                                                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                                                        }`}
                                                    >
                                                        {isPyq ? 'PYQ Paper' : 'Expert Mock'}
                                                    </span>
                                                </span>
                                                <span className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                                                    {s.name}
                                                </span>
                                                {s.description && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 block">
                                                        {s.description}
                                                    </span>
                                                )}
                                                <span className="mt-auto inline-flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 w-full">
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        View Tests
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
