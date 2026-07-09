import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, BookOpen } from 'lucide-react';
import { fetchActiveExamCategories, fetchRecommendedSeries } from '../api/mockTestsApi';
import { BrandedThumbnail } from '../components/BrandedThumbnail';
import { EmptyState } from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';

export const ExamCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [catData, recData] = await Promise.all([
                fetchActiveExamCategories(),
                fetchRecommendedSeries()
            ]);
            setCategories(catData || []);
            setRecommended(recData || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const navToCat = (id: string) => navigate(`/mcqs/test-series/category/${id}`);
    const navToSeries = (id: string) => navigate(`/mcqs/test-series/series/${id}`);

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-700">
            <div className="flex-1 w-full max-w-7xl mx-auto pb-20">

                {/* Hero Banner (Static, Premium) */}
                <div className="relative w-full rounded-[32px] overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 mb-10 sm:mb-16 p-8 sm:p-12 shadow-2xl isolate border border-indigo-500/20">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-fuchsia-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Premium Learning
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4">
                            Master Your Next <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-fuchsia-300">Examination.</span>
                        </h1>
                        <p className="text-indigo-100/80 text-lg sm:text-xl font-medium leading-relaxed mb-8 max-w-xl">
                            High-quality mock tests, previous year papers, and detailed analytics designed to elevate your score.
                        </p>
                        <button
                            onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            Explore Categories <BookOpen className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <GridSkeleton count={8} />
                ) : (
                    <div className="space-y-12 sm:space-y-16">

                        {/* Continue Learning (Empty State for now per requirements) */}
                        <section>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Continue Learning</h2>
                            <EmptyState
                                title="Welcome to Mock Tests"
                                description="Start your first mock test to track your progress here."
                                icon={<Play className="w-8 h-8" fill="currentColor" />}
                                actionLabel="Browse Categories"
                                onAction={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
                            />
                        </section>

                        {/* Recommended Series */}
                        {recommended.length > 0 && (
                            <section>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Popular Series</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {recommended.map(s => (
                                        <motion.div
                                            key={s.id}
                                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            onClick={() => navToSeries(s.id)}
                                            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 flex flex-col h-full"
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
                                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {s.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto font-medium">Test Series</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Categories */}
                        <section id="categories-section" className="scroll-mt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Browse Categories</h2>
                            </div>

                            {categories.length === 0 ? (
                                <EmptyState
                                    title="No Categories Available"
                                    description="Check back soon for new exam categories."
                                    icon={<BookOpen className="w-8 h-8" />}
                                />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {categories.map(c => (
                                        <motion.div
                                            key={c.id}
                                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            onClick={() => navToCat(c.id)}
                                            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-[28px] p-2 sm:p-3 shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 text-center"
                                        >
                                            <div className="aspect-square w-full rounded-[20px] overflow-hidden mb-4 bg-slate-50 dark:bg-slate-900">
                                                <BrandedThumbnail title={c.name} type="category" imageUrl={c.thumbnail_url} className="w-full h-full" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-2 px-2 line-clamp-2">{c.name}</h3>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>

                    </div>
                )}
            </div>
        </div>
    );
};
