import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import {
    KPICard, SearchBar, SkeletonList, EmptyState, ConfirmDialog,
    CategoryCard, CategoryDrawer,
    SeriesCard, SeriesDrawer,
    TestCard
} from '../components';
import { useCategories, useSeries, useTests } from '../hooks';

type DashboardTab = 'categories' | 'series' | 'tests';

const parseTabParam = (value: string | null): DashboardTab => {
    if (value === 'series' || value === 'tests') return value;
    return 'categories';
};

export const AdminTestSeriesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = parseTabParam(searchParams.get('tab'));
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [isCatDrawerOpen, setCatDrawerOpen] = useState(false);
    const [isSeriesDrawerOpen, setSeriesDrawerOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: '', type: '' });

    // Data Hooks
    const { categories, loading: catLoading, addCategory, editCategory, removeCategory } = useCategories();
    const { series, loading: seriesLoading, addSeries, editSeries, removeSeries } = useSeries();
    const { tests, loading: testsLoading, removeTest } = useTests();

    const handleTabChange = useCallback((tab: DashboardTab) => {
        setSearchParams({ tab }, { replace: true });
        setSearchQuery('');
    }, [setSearchParams]);

    // Derived KPIs
    const kpis = useMemo(() => {
        const publishedTests = (tests || []).filter(t => t?.is_published).length;
        const draftTests = Math.max(0, (tests || []).length - publishedTests);
        return {
            totalCategories: (categories || []).length,
            totalSeries: (series || []).length,
            totalTests: (tests || []).length,
            publishedTests,
            draftTests
        };
    }, [categories, series, tests]);

    // Precompute category stats in O(C + S + T) time
    const categoryStats = useMemo(() => {
        const stats = new Map<string, { seriesCount: number; testsCount: number }>();
        const seriesToCategory = new Map<string, string>();

        for (const cat of categories || []) {
            if (cat?.id) {
                stats.set(cat.id, { seriesCount: 0, testsCount: 0 });
            }
        }

        for (const s of series || []) {
            if (!s?.category_id) continue;
            seriesToCategory.set(s.id, s.category_id);
            const entry = stats.get(s.category_id) ?? { seriesCount: 0, testsCount: 0 };
            entry.seriesCount += 1;
            stats.set(s.category_id, entry);
        }

        for (const t of tests || []) {
            const catId = t?.series_id ? seriesToCategory.get(t.series_id) : undefined;
            if (!catId) continue;
            const entry = stats.get(catId) ?? { seriesCount: 0, testsCount: 0 };
            entry.testsCount += 1;
            stats.set(catId, entry);
        }

        return stats;
    }, [categories, series, tests]);

    // Filtering logic based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return (categories || []).filter(c => (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }, [categories, searchQuery]);

    const filteredSeries = useMemo(() => {
        if (!searchQuery) return series;
        return (series || []).filter(s => (s?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }, [series, searchQuery]);

    const filteredTests = useMemo(() => {
        if (!searchQuery) return tests;
        return (tests || []).filter(t => (t?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tests, searchQuery]);

    // Handlers
    const openCreate = () => {
        if (activeTab === 'tests') {
            navigate(ROUTES.ADMIN.TEST_NEW);
            return;
        }
        setSelectedItem(null);
        if (activeTab === 'categories') setCatDrawerOpen(true);
        if (activeTab === 'series') setSeriesDrawerOpen(true);
    };

    const handleEdit = (item: any) => {
        if (activeTab === 'tests') {
            navigate(ROUTES.ADMIN.TEST_EDIT_PATH(item.id), { state: { test: item } });
            return;
        }
        setSelectedItem(item);
        if (activeTab === 'categories') setCatDrawerOpen(true);
        if (activeTab === 'series') setSeriesDrawerOpen(true);
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

    return (
        <div className="space-y-6 pb-12">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
                        Mock Tests & Exam CMS
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Curate exam categories, test series collections, and published mock tests.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4" /> Create New
                </button>
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
                            type="button"
                            onClick={() => handleTabChange('categories')}
                            className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 ${activeTab === 'categories' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            <BookOpen className="w-4 h-4" /> Categories
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('series')}
                            className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 ${activeTab === 'series' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            <Layers className="w-4 h-4" /> Series
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('tests')}
                            className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 ${activeTab === 'tests' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
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
                                {filteredCategories.map(cat => {
                                    const stats = categoryStats.get(cat.id) ?? { seriesCount: 0, testsCount: 0 };
                                    return (
                                        <CategoryCard
                                            key={cat.id}
                                            category={cat}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                            seriesCount={stats.seriesCount}
                                            testsCount={stats.testsCount}
                                        />
                                    );
                                })}
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
                    onClose={() => { setCatDrawerOpen(false); setSelectedItem(null); }}
                    category={activeTab === 'categories' ? selectedItem : null}
                    onSave={handleSaveCategory}
                />

                <SeriesDrawer
                    isOpen={isSeriesDrawerOpen}
                    onClose={() => { setSeriesDrawerOpen(false); setSelectedItem(null); }}
                    series={activeTab === 'series' ? selectedItem : null}
                    categories={categories}
                    onSave={handleSaveSeries}
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
    );
};
