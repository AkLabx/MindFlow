import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Plus, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { fetchExamCategories, fetchTestSeries, fetchTests } from '../api/adminTestSeriesApi';

export const AdminTestSeriesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'categories' | 'series' | 'tests'>('categories');
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<any[]>([]);
    const [series, setSeries] = useState<any[]>([]);
    const [tests, setTests] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'categories') setCategories(await fetchExamCategories());
            if (activeTab === 'series') setSeries(await fetchTestSeries());
            if (activeTab === 'tests') setTests(await fetchTests());
        } catch (error) {
            console.error('Error loading CMS data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout activeTab="tools" onTabChange={() => {}} onOpenSettings={() => {}}>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                        Back to Admin Home
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mock Tests CMS</h1>
                    <p className="text-slate-500 mt-1">Manage exam categories, test series, and individual tests.</p>
                </header>

                <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm mb-6 w-fit border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'categories' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                        <BookOpen className="w-4 h-4" /> Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'series' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                        <Layers className="w-4 h-4" /> Test Series
                    </button>
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'tests' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                        <CheckSquare className="w-4 h-4" /> Tests
                    </button>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">{activeTab} Management</h2>
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors text-sm">
                            <Plus className="w-4 h-4" /> Create New
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Name</th>
                                        {activeTab === 'categories' && <th className="px-4 py-3 font-semibold">Status</th>}
                                        {activeTab === 'series' && <th className="px-4 py-3 font-semibold">Category</th>}
                                        {activeTab === 'series' && <th className="px-4 py-3 font-semibold">Premium</th>}
                                        {activeTab === 'tests' && <th className="px-4 py-3 font-semibold">Series</th>}
                                        {activeTab === 'tests' && <th className="px-4 py-3 font-semibold">Duration</th>}
                                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeTab === 'categories' ? categories : activeTab === 'series' ? series : tests).map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                                            {activeTab === 'categories' && <td className="px-4 py-3">{item.is_active ? 'Active' : 'Hidden'}</td>}
                                            {activeTab === 'series' && <td className="px-4 py-3">{item.exam_categories?.name}</td>}
                                            {activeTab === 'series' && <td className="px-4 py-3">{item.is_premium ? 'Yes' : 'No'}</td>}
                                            {activeTab === 'tests' && <td className="px-4 py-3">{item.test_series?.name}</td>}
                                            {activeTab === 'tests' && <td className="px-4 py-3">{item.duration_minutes} min</td>}
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(activeTab === 'categories' ? categories : activeTab === 'series' ? series : tests).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                No records found. Click 'Create New' to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
