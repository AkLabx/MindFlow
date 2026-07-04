import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, CheckSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPublishedTests } from '../api/mockTestsApi';

export const TestsListPage: React.FC = () => {
    const navigate = useNavigate();
    const { seriesId } = useParams<{ seriesId: string }>();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (seriesId) loadTests(seriesId);
    }, [seriesId]);

    const loadTests = async (id: string) => {
        try {
            const data = await fetchPublishedTests(id);
            setTests(data || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout activeTab="quiz" onTabChange={() => {}} onOpenSettings={() => {}}>
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 w-full max-w-7xl mx-auto">
                    <header className="relative text-left w-full mt-2 flex flex-col gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                            Back to Series
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                                Available Tests
                            </h1>
                            <p className="text-base text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                                Select a test to begin your attempt.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {tests.map((t) => (
                                <motion.div
                                    key={t.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="bg-white dark:bg-slate-800 rounded-[20px] p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-amber-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                                    onClick={() => alert('Test taking interface coming in next phase!')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center shrink-0">
                                            <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {t.duration_minutes} Mins</span>
                                                <span>•</span>
                                                <span>{t.question_ids?.length || 0} Questions</span>
                                                <span>•</span>
                                                <span>{t.total_marks} Marks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold w-full sm:w-auto hover:opacity-90 transition-opacity">
                                        Attempt Now
                                    </button>
                                </motion.div>
                            ))}
                            {tests.length === 0 && (
                                <div className="py-12 text-center text-slate-500">
                                    No tests available yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
