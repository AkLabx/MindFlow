import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, BookOpen, Layers, CheckSquare } from 'lucide-react';
import {
    KPICard, SearchBar, SkeletonList, EmptyState, ConfirmDialog,
    CategoryCard, CategoryDrawer,
    SeriesCard, SeriesDrawer,
    TestCard, TestDrawer
} from '../components';
import { useCategories, useSeries, useTests } from '../hooks';

export const AdminTestSeriesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'categories' | 'series' | 'tests'>('categories');
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [isCatDrawerOpen, setCatDrawerOpen] = useState(false);
    const [isSeriesDrawerOpen, setSeriesDrawerOpen] = useState(false);
    const [isTestDrawerOpen, setTestDrawerOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: '', type: '' });

    // Data Hooks
    const { categories, loading: catLoading, addCategory, editCategory, removeCategory } = useCategories();
    const { series, loading: seriesLoading, addSeries, editSeries, removeSeries } = useSeries();
    const { tests, loading: testsLoading, addTest, editTest, removeTest } = useTests();

    // Derived KPIs
    const kpis = useMemo(() => {
        const publishedTests = tests.filter(t => t.is_published).length;
        const draftTests = tests.length - publishedTests;
        return {
            totalCategories: categories.length,
            totalSeries: series.length,
            totalTests: tests.length,
            publishedTests,
            draftTests
        };
    }, [categories, series, tests]);

    // Filtering logic based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [categories, searchQuery]);

    const filteredSeries = useMemo(() => {
        if (!searchQuery) return series;
        return series.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [series, searchQuery]);

    const filteredTests = useMemo(() => {
        if (!searchQuery) return tests;
        return tests.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tests, searchQuery]);

    // Handlers
    const openCreate = () => {
        setSelectedItem(null);
        if (activeTab === 'categories') setCatDrawerOpen(true);
        if (activeTab === 'series') setSeriesDrawerOpen(true);
        if (activeTab === 'tests') setTestDrawerOpen(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        if (activeTab === 'categories') setCatDrawerOpen(true);
        if (activeTab === 'series') setSeriesDrawerOpen(true);
        if (activeTab === 'tests') setTestDrawerOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDialog({ isOpen: true, id, type: activeTab });
    };

    const confirmDelete = async () => {
        try {
            if (confirmDialog.type === 'categories') await removeCategory(confirmDialog.id);
            if (confirmDialog.type === 'series') await removeSeries(confirmDialog.id);
            if (confirmDialog.type === 'tests') await removeTest(confirmDialog.id);
        } finally {
            setConfirmDialog({ isOpen: false, id: '', type: '' });
        }
    };

    const handleSaveCategory = async (payload: any) => {
        if (selectedItem) await editCategory(selectedItem.id, payload);
        else await addCategory(payload);
    };

    const handleSaveSeries = async (payload: any) => {
        if (selectedItem) await editSeries(selectedItem.id, payload);
        else await addSeries(payload);
    };

    const handleSaveTest = async (payload: any) => {
        if (selectedItem) await editTest(selectedItem.id, payload);
        else await addTest(payload);
    };

    return (
        <MainLayout activeTab="tools" onTabChange={() => {}} onOpenSettings={() => {}}>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                        Back to Admin Home
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">MindFlow CMS</h1>
                            <p className="text-slate-500 mt-1">Manage Mock Tests, Categories, and Series.</p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> Create New
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <KPICard title="Categories" value={kpis.totalCategories} icon={BookOpen} color="indigo" />
                    <KPICard title="Series" value={kpis.totalSeries} icon={Layers} color="blue" />
                    <KPICard title="Tests" value={kpis.totalTests} icon={CheckSquare} color="purple" />
                    <KPICard title="Published" value={kpis.publishedTests} icon={CheckSquare} color="emerald" />
                    <KPICard title="Draft" value={kpis.draftTests} icon={CheckSquare} color="amber" />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm w-fit border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'categories' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            <BookOpen className="w-4 h-4" /> Categories
                        </button>
                        <button
                            onClick={() => { setActiveTab('series'); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'series' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            <Layers className="w-4 h-4" /> Series
                        </button>
                        <button
                            onClick={() => { setActiveTab('tests'); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'tests' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            <CheckSquare className="w-4 h-4" /> Tests
                        </button>
                    </div>

                    <div className="w-full md:w-auto">
                        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search content..." />
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        catLoading ? <SkeletonList count={3} /> :
                        filteredCategories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCategories.map(cat => (
                                    <CategoryCard
                                        key={cat.id}
                                        category={cat}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteClick}
                                        seriesCount={series.filter(s => s.category_id === cat.id).length}
                                        testsCount={tests.filter(t => series.find(s => s.category_id === cat.id)?.id === t.series_id).length}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={BookOpen} title="No Categories Found"
                                message={searchQuery ? "Try a different search term." : "Get started by creating your first exam category."}
                                actionLabel={!searchQuery ? "Create Category" : undefined}
                                onAction={openCreate}
                            />
                        )
                    )}

                    {/* Series Tab */}
                    {activeTab === 'series' && (
                        seriesLoading ? <SkeletonList count={3} /> :
                        filteredSeries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSeries.map(s => (
                                    <SeriesCard
                                        key={s.id}
                                        series={s}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteClick}
                                        testsCount={tests.filter(t => t.series_id === s.id).length}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Layers} title="No Test Series Found"
                                message={searchQuery ? "Try a different search term." : "Create test series to organize your mock tests."}
                                actionLabel={!searchQuery ? "Create Series" : undefined}
                                onAction={openCreate}
                            />
                        )
                    )}

                    {/* Tests Tab */}
                    {activeTab === 'tests' && (
                        testsLoading ? <SkeletonList count={3} /> :
                        filteredTests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTests.map(t => (
                                    <TestCard
                                        key={t.id}
                                        test={t}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CheckSquare} title="No Tests Found"
                                message={searchQuery ? "Try a different search term." : "Build your first mock test and publish it to students."}
                                actionLabel={!searchQuery ? "Create Test" : undefined}
                                onAction={openCreate}
                            />
                        )
                    )}
                </div>

                {/* Drawers */}
                <CategoryDrawer
                    isOpen={isCatDrawerOpen}
                    onClose={() => setCatDrawerOpen(false)}
                    category={selectedItem}
                    onSave={handleSaveCategory}
                />

                <SeriesDrawer
                    isOpen={isSeriesDrawerOpen}
                    onClose={() => setSeriesDrawerOpen(false)}
                    series={selectedItem}
                    categories={categories}
                    onSave={handleSaveSeries}
                />

                <TestDrawer
                    isOpen={isTestDrawerOpen}
                    onClose={() => setTestDrawerOpen(false)}
                    test={selectedItem}
                    series={series}
                    onSave={handleSaveTest}
                />

                {/* Confirmation */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog({ isOpen: false, id: '', type: '' })}
                    onConfirm={confirmDelete}
                    title="Delete Confirmation"
                    message="Are you sure you want to delete this item? This action cannot be undone."
                    confirmText="Delete Permanently"
                />
            </div>
        </MainLayout>
    );
};
