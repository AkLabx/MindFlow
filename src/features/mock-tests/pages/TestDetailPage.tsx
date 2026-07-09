import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, Award, AlertTriangle, Share2, BookmarkPlus, PlayCircle, BookOpen } from 'lucide-react';
import { fetchTestDetails } from '../api/mockTestsApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { HeroSkeleton } from '../components/Skeletons';

export const TestDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { testId } = useParams<{ testId: string }>();
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (testId) loadTestData(testId);
    }, [testId]);

    const loadTestData = async (id: string) => {
        try {
            const data = await fetchTestDetails(id);
            setTest(data);
        } catch (error) {
            console.error('Error fetching test data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto min-h-screen">
                <HeroSkeleton />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto min-h-screen flex items-center justify-center">
                <EmptyState
                    title="Test Not Found"
                    description="This test does not exist or has been removed."
                    actionLabel="Go Back"
                    onAction={() => navigate(-1)}
                />
            </div>
        );
    }

    const series = test.test_series;
    const category = series?.exam_categories;

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-700">
            <div className="flex-1 w-full max-w-4xl mx-auto pb-24">

                <Breadcrumbs items={[
                    { label: 'Mock Tests', path: '/mcqs/test-series' },
                    { label: category?.name || 'Category', path: category?.id ? `/mcqs/test-series/category/${category.id}` : undefined },
                    { label: series?.name || 'Series', path: series?.id ? `/mcqs/test-series/series/${series.id}` : undefined },
                    { label: test.name }
                ]} />

                {/* Hero / Decision Card */}
                <div className="w-full bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-700/60 mt-6 relative isolate">

                    {/* Decorative Header Banner */}
                    <div className="h-32 sm:h-40 bg-gradient-to-br from-indigo-600 to-purple-700 w-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <BookOpen className="absolute -bottom-8 -right-8 w-40 h-40 text-white opacity-10 -rotate-12" />
                    </div>

                    <div className="px-6 sm:px-10 pb-10 relative z-10 -mt-12 sm:-mt-16">

                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-[24px] shadow-lg border border-slate-100 dark:border-slate-700 inline-block shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[16px] flex items-center justify-center">
                                    <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>

                            <div className="flex-1 pt-4 md:pt-0">
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">
                                    {test.name}
                                </h1>
                                {series?.is_premium && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                                        Premium Test
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Facts Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <Clock className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{test.duration_minutes}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Minutes</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <CheckSquare className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{test.question_ids?.length || 0}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Questions</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <Award className="w-6 h-6 text-slate-400 mb-2" />
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{test.total_marks}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Marks</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700/50">
                                <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                    {test.negative_marks_per_question > 0 ? `-${test.negative_marks_per_question}` : 'No'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Negative Marking</span>
                            </div>
                        </div>

                        {/* Instructions Preview */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-5 sm:p-6 mb-10 border border-indigo-100 dark:border-indigo-900/30">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Before you begin</h3>
                            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                                    <span>Ensure you have a stable internet connection for the duration of the test.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                                    <span>Do not refresh or navigate away from the exam page once started.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                                    <span>The test will auto-submit when the timer reaches zero.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Attempt History (Empty State / Placeholder) */}
                        <div className="mb-10 border-t border-slate-100 dark:border-slate-700/50 pt-8">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Attempt History</h3>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">You haven't attempted this test yet.</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-8">
                            <button
                                onClick={() => navigate(`/exam/${test.id}`)}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-indigo-500/25 shrink-0"
                            >
                                <PlayCircle className="w-6 h-6" /> Start Test
                            </button>

                            <div className="flex w-full sm:w-auto gap-4">
                                <button className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                    <BookmarkPlus className="w-5 h-5" /> <span className="hidden sm:inline">Save</span>
                                </button>
                                <button className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                    <Share2 className="w-5 h-5" /> <span className="hidden sm:inline">Share</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
