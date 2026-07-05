import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, Layers, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPublishedTestSeries } from '../api/mockTestsApi';

export const TestSeriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { categoryId } = useParams<{ categoryId: string }>();
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (categoryId) loadSeries(categoryId);
    }, [categoryId]);

    const loadSeries = async (id: string) => {
        try {
            const data = await fetchPublishedTestSeries(id);
            setSeries(data || []);
        } catch (error) {
            console.error('Error fetching series:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 w-full max-w-7xl mx-auto">
                    <header className="relative text-left w-full mt-2 flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/mcqs/test-series')}
                            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                            Back to Categories
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                                Available Test Series
                            </h1>
                            <p className="text-base text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                                Choose a specific test series to see available mocks and PYQs.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {series.map((s) => (
                                <motion.div
                                    key={s.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/mcqs/test-series/series/${s.id}`)}
                                    className="cursor-pointer bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-md border border-slate-200 dark:border-slate-700 hover:border-amber-400 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                                            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        {s.is_premium && (
                                            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
                                                <Crown className="w-3 h-3" /> PRO
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.name}</h3>
                                    {s.description && (
                                        <p className="text-sm text-slate-500 line-clamp-3">{s.description}</p>
                                    )}
                                </motion.div>
                            ))}
                            {series.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    No test series available for this category yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
