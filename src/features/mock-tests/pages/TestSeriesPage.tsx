import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Filter } from 'lucide-react';
import { fetchCategoryDetails, fetchPublishedTestSeries } from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton, GridSkeleton } from '../components/Skeletons';

export const TestSeriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { categoryId } = useParams<{ categoryId: string }>();
    const [category, setCategory] = useState<any>(null);
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

    useEffect(() => {
        if (categoryId) loadCategoryData(categoryId);
    }, [categoryId]);

    const loadCategoryData = async (id: string) => {
        try {
            const [catData, seriesData] = await Promise.all([
                fetchCategoryDetails(id),
                fetchPublishedTestSeries(id)
            ]);
            setCategory(catData);
            setSeries(seriesData || []);
        } catch (error) {
            console.error('Error fetching category data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSeries = series.filter(s => {
        if (filter === 'free') return !s.is_premium;
        if (filter === 'premium') return s.is_premium;
        return true;
    });

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-700">
            <div className="flex-1 w-full max-w-7xl mx-auto pb-20">

                <Breadcrumbs items={[
                    { label: 'Mock Tests', path: '/mcqs/test-series' },
                    { label: category?.name || 'Category' }
                ]} />

                {loading ? (
                    <>
                        <HeroSkeleton />
                        <GridSkeleton count={4} />
                    </>
                ) : !category ? (
                    <EmptyState
                        title="Category Not Found"
                        description="The category you are looking for does not exist or has been removed."
                        actionLabel="Go Back"
                        onAction={() => navigate('/mcqs/test-series')}
                    />
                ) : (
                    <>
                        {/* Category Banner */}
                        <div className="w-full bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-10 mb-10 sm:mb-12 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row gap-8 items-center md:items-stretch overflow-hidden relative">
                            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-[24px] overflow-hidden shrink-0 shadow-lg">
                                <BrandedThumbnail title={category.name} type="category" imageUrl={category.thumbnail_url} className="w-full h-full" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center text-center md:text-left z-10">
                                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{category.name}</h1>
                                {category.description && (
                                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-6 max-w-2xl font-medium">
                                        {category.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-center md:justify-start gap-6 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{series.length}</span>
                                        <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Series Available</span>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative background element */}
                            <BookOpen className="absolute -right-20 -bottom-20 w-96 h-96 text-slate-100 dark:text-slate-800/50 -rotate-12 pointer-events-none" />
                        </div>

                        {/* Filters & Series List */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Available Series</h2>

                            {series.length > 0 && (
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    {(['all', 'free', 'premium'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                                                filter === f
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {filteredSeries.length === 0 ? (
                            <EmptyState
                                title="No Series Available"
                                description={filter === 'all' ? "There are no test series in this category yet." : `There are no ${filter} series in this category.`}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {filteredSeries.map((s) => (
                                    <motion.div
                                        key={s.id}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        onClick={() => navigate(`/mcqs/test-series/series/${s.id}`)}
                                        className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 flex flex-col"
                                    >
                                        <div className="aspect-video w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                            <BrandedThumbnail title={s.name} type="series" imageUrl={s.thumbnail_url} className="w-full h-full" />
                                            {s.is_premium && (
                                                <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide shadow-md">
                                                    PRO
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {s.name}
                                            </h3>
                                            {s.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                    {s.description}
                                                </p>
                                            )}
                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">View Tests</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
