import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Clock, FileText, CheckSquare, Award } from 'lucide-react';
import { fetchSeriesDetails, fetchPublishedTests } from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton, ListSkeleton } from '../components/Skeletons';

export const TestsListPage: React.FC = () => {
    const navigate = useNavigate();
    const { seriesId } = useParams<{ seriesId: string }>();
    const [series, setSeries] = useState<any>(null);
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (seriesId) loadSeriesData(seriesId);
    }, [seriesId]);

    const loadSeriesData = async (id: string) => {
        try {
            const [seriesData, testsData] = await Promise.all([
                fetchSeriesDetails(id),
                fetchPublishedTests(id)
            ]);
            setSeries(seriesData);
            setTests(testsData || []);
        } catch (error) {
            console.error('Error fetching series data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-700">
            <div className="flex-1 w-full max-w-7xl mx-auto pb-20">

                <Breadcrumbs items={[
                    { label: 'Mock Tests', path: '/mcqs/test-series' },
                    { label: series?.exam_categories?.name || 'Category', path: series?.exam_categories?.id ? `/mcqs/test-series/category/${series.exam_categories.id}` : undefined },
                    { label: series?.name || 'Series' }
                ]} />

                {loading ? (
                    <>
                        <HeroSkeleton />
                        <ListSkeleton count={4} />
                    </>
                ) : !series ? (
                    <EmptyState
                        title="Series Not Found"
                        description="This test series does not exist or is currently unavailable."
                        actionLabel="Back to Categories"
                        onAction={() => navigate('/mcqs/test-series')}
                    />
                ) : (
                    <>
                        {/* Series Hero Banner */}
                        <div className="w-full bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-10 mb-10 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row gap-8 items-center md:items-stretch overflow-hidden relative">
                            <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-[24px] overflow-hidden shrink-0 shadow-lg relative">
                                <BrandedThumbnail title={series.name} type="series" imageUrl={series.thumbnail_url} className="w-full h-full" />
                                {series.is_premium && (
                                    <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wide shadow-xl">
                                        PRO SERIES
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-center text-center md:text-left z-10 w-full">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">{series.name}</h1>

                                {series.description && (
                                    <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed mb-6 font-medium line-clamp-3">
                                        {series.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8 mt-auto pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">{tests.length}</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Total Tests</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Layers className="absolute -right-20 -top-20 w-96 h-96 text-slate-100 dark:text-slate-800/50 rotate-12 pointer-events-none" />
                        </div>

                        {/* Two Column Layout for Desktop */}
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Left Column: Test List */}
                            <div className="flex-1 order-2 lg:order-1">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">Tests in this Series</h2>

                                {tests.length === 0 ? (
                                    <EmptyState
                                        title="No Tests Uploaded"
                                        description="Tests for this series will be available soon."
                                        icon={<FileText className="w-8 h-8" />}
                                    />
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {tests.map((t, index) => (
                                            <motion.div
                                                key={t.id}
                                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                                onClick={() => navigate(`/mcqs/test-series/test/${t.id}`)}
                                                className="group cursor-pointer bg-white dark:bg-slate-800 rounded-[20px] p-5 shadow-sm hover:shadow-md border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                            >
                                                <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                                        <span className="text-lg font-bold text-slate-400">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{t.name}</h3>
                                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-slate-500">
                                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {t.duration_minutes}m
                                                            </span>
                                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                                                                <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> {t.question_ids?.length || 0} Qs
                                                            </span>
                                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                                                                <Award className="w-3.5 h-3.5" /> {t.total_marks} Marks
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-auto mt-4 sm:mt-0 flex shrink-0">
                                                    <button className="w-full sm:w-auto bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                                                        View Details
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Sidebar / Progress */}
                            <div className="w-full lg:w-80 shrink-0 order-1 lg:order-2 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Progress</h3>
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                            <Award className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Attempt tests to track progress</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Leaderboard</h3>
                                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coming Soon</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
