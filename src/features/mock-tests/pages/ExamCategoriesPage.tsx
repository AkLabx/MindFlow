import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchActiveExamCategories } from '../api/mockTestsApi';

export const ExamCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await fetchActiveExamCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 },
        },
    };

    return (
        <>
            <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 w-full max-w-7xl mx-auto">
                    <header className="relative text-left w-full mt-2 flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/mcqs')}
                            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                            Back to MCQs
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                                Mock Test Series
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                                Select an Exam Category to begin your preparation.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-24 h-24 mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Categories Yet</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                There are currently no active exam categories available. Please check back later.
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {categories.map((category) => (
                                <motion.div
                                    key={category.id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/mcqs/test-series/category/${category.id}`)}
                                    className="cursor-pointer bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors duration-300 flex flex-col items-center justify-center aspect-square"
                                >
                                    <div className="w-20 h-20 mb-4 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-center text-slate-500 line-clamp-2">{category.description}</p>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};
