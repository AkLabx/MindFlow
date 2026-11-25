import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, BookOpen, Layers, CheckSquare, RotateCcw, Info } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { useNotification } from '@/stores/useNotificationStore';
import {
    KPICard, SearchBar, SkeletonList, EmptyState, ConfirmDialog,
    CategoryCard, CategoryDrawer,
    SeriesCard, SeriesDrawer,
    TestCard, AdminTestAnalyticsDrawer
} from '../components';
import { useCategories, useSeries, useTests } from '../hooks';
import { validateTestForPublish, invalidateMockTestAnalyticsCache } from '../api/adminTestSeriesApi';
import { QuestionPreviewDrawer } from '../../question-builder/components/QuestionPreviewDrawer';

type DashboardTab = 'categories' | 'series' | 'tests';
type StatusFilter = 'all' | 'published' | 'draft';

const parseTabParam = (value: string | null): DashboardTab => {
    if (value === 'series' || value === 'tests') return value;
    return 'categories';
};

const parseStatusParam = (value: string | null): StatusFilter => {
    if (value === 'published' || value === 'draft') return value;
    return 'all';
};

export const AdminTestSeriesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useNotification();

    const activeTab = parseTabParam(searchParams.get('tab'));
    const selectedCategoryId = searchParams.get('category') || '';
    const selectedSeriesId = searchParams.get('series') || '';
    const statusFilter = parseStatusParam(searchParams.get('status'));

    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [isCatDrawerOpen, setCatDrawerOpen] = useState(false);
    const [isSeriesDrawerOpen, setSeriesDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [insightsTest, setInsightsTest] = useState<any | null>(null);
    const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        id: string;
        type: DashboardTab | '';
        title: string;
        message: string;
    }>({ isOpen: false, id: '', type: '', title: '', message: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const busyTestIdsRef = useRef<Set<string>>(new Set());
    const [busyActionByTestId, setBusyActionByTestId] = useState<Record<string, 'publish' | 'clone'>>({});
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Data Hooks
    const { categories, loading: catLoading, addCategory, editCategory, removeCategory } = useCategories();
    const { series, loading: seriesLoading, addSeries, editSeries, removeSeries, refresh: refreshSeries } = useSeries();
    const { tests, loading: testsLoading, removeTest, duplicateTest, toggleTestPublish, refresh: refreshTests } = useTests();

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

    // Single-pass O(C + S + T) lookup and aggregation maps
    const { categoryStats, seriesTestCounts, seriesById, seriesToCategory } = useMemo(() => {
        const catStats = new Map<string, { seriesCount: number; testsCount: number }>();
        const sTestCounts = new Map<string, number>();
        const sById = new Map<string, any>();
        const sToCat = new Map<string, string>();

        for (const cat of categories || []) {
            if (cat?.id) {
                catStats.set(cat.id, { seriesCount: 0, testsCount: 0 });
            }
        }

        for (const s of series || []) {
            if (!s?.id) continue;
            sById.set(s.id, s);
            sTestCounts.set(s.id, 0);
            if (s.category_id) {
                sToCat.set(s.id, s.category_id);
                const entry = catStats.get(s.category_id) ?? { seriesCount: 0, testsCount: 0 };
                entry.seriesCount += 1;
                catStats.set(s.category_id, entry);
            }
        }

        for (const t of tests || []) {
            if (!t?.series_id) continue;
            sTestCounts.set(t.series_id, (sTestCounts.get(t.series_id) ?? 0) + 1);
            const catId = sToCat.get(t.series_id) ?? (t?.mock_series ?? t?.test_series)?.category_id;
            if (catId) {
                const entry = catStats.get(catId) ?? { seriesCount: 0, testsCount: 0 };
                entry.testsCount += 1;
                catStats.set(catId, entry);
            }
        }

        return {
            categoryStats: catStats,
            seriesTestCounts: sTestCounts,
            seriesById: sById,
            seriesToCategory: sToCat,
        };
    }, [categories, series, tests]);

    // Post-hydration reconciliation for stale or mismatched URL params
    useEffect(() => {
        if (catLoading || seriesLoading) return;
        const rawCategory = searchParams.get('category') || '';
        const rawSeries = searchParams.get('series') || '';
        if (!rawCategory && !rawSeries) return;

        const validCategoryIds = new Set((categories || []).map(c => c?.id).filter(Boolean));
        const isCategoryValid = !rawCategory || validCategoryIds.has(rawCategory);
        const effectiveCategory = isCategoryValid ? rawCategory : '';

        const matchedSeries = rawSeries ? seriesById.get(rawSeries) : undefined;
        const isSeriesValid =
            !rawSeries ||
            (Boolean(matchedSeries) && (!effectiveCategory || matchedSeries.category_id === effectiveCategory));

        if (!isCategoryValid || !isSeriesValid) {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (!isCategoryValid) next.delete('category');
                if (!isSeriesValid) next.delete('series');
                return next;
            }, { replace: true });
        }
    }, [catLoading, seriesLoading, categories, seriesById, searchParams, setSearchParams]);

    const scopedSeriesOptions = useMemo(() => {
        if (!selectedCategoryId) return series || [];
        return (series || []).filter(s => s?.category_id === selectedCategoryId);
    }, [series, selectedCategoryId]);

    const handleTabChange = useCallback((tab: DashboardTab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            if (tab === 'categories') {
                next.delete('category');
            }
            if (tab !== 'tests') {
                next.delete('series');
                next.delete('status');
            }
            return next;
        }, { replace: true });
        setSearchQuery('');
    }, [setSearchParams]);

    const handleCategoryFilterChange = useCallback((nextCategoryId: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (nextCategoryId) {
                next.set('category', nextCategoryId);
                const currentSeriesId = next.get('series') || '';
                if (currentSeriesId && seriesById.get(currentSeriesId)?.category_id !== nextCategoryId) {
                    next.delete('series');
                }
            } else {
                next.delete('category');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams, seriesById]);

    const handleSeriesFilterChange = useCallback((nextSeriesId: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (nextSeriesId) next.set('series', nextSeriesId);
            else next.delete('series');
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const handleStatusFilterChange = useCallback((nextStatus: StatusFilter) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (nextStatus === 'all') next.delete('status');
            else next.set('status', nextStatus);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('category');
            next.delete('series');
            next.delete('status');
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    // Filtering logic
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredCategories = useMemo(() => {
        if (!normalizedSearch) return categories || [];
        return (categories || []).filter(c =>
            (c?.name || '').toLowerCase().includes(normalizedSearch)
        );
    }, [categories, normalizedSearch]);

    const filteredSeries = useMemo(() => {
        return (series || []).filter(s => {
            if (selectedCategoryId && s?.category_id !== selectedCategoryId) return false;
            if (normalizedSearch && !(s?.name || '').toLowerCase().includes(normalizedSearch)) return false;
            return true;
        });
    }, [series, selectedCategoryId, normalizedSearch]);

    const filteredTests = useMemo(() => {
        return (tests || []).filter(t => {
            if (selectedCategoryId) {
                const testCatId = seriesToCategory.get(t?.series_id) ?? (t?.mock_series ?? t?.test_series)?.category_id;
                if (testCatId !== selectedCategoryId) return false;
            }
            if (selectedSeriesId && t?.series_id !== selectedSeriesId) return false;
            if (statusFilter === 'published' && !t?.is_published) return false;
            if (statusFilter === 'draft' && Boolean(t?.is_published)) return false;
            if (normalizedSearch && !(t?.name || '').toLowerCase().includes(normalizedSearch)) return false;
            return true;
        });
    }, [tests, selectedCategoryId, selectedSeriesId, statusFilter, normalizedSearch, seriesToCategory]);

    const hasActiveFilters = useMemo(() => {
        if (normalizedSearch) return true;
        if (activeTab === 'series') return Boolean(selectedCategoryId);
        if (activeTab === 'tests') {
            return Boolean(selectedCategoryId || selectedSeriesId || statusFilter !== 'all');
        }
        return false;
    }, [activeTab, normalizedSearch, selectedCategoryId, selectedSeriesId, statusFilter]);

    const resultSummary = useMemo(() => {
        if (activeTab === 'categories') {
            return `Showing ${filteredCategories.length} of ${(categories || []).length} categories`;
        }
        if (activeTab === 'series') {
            return `Showing ${filteredSeries.length} of ${(series || []).length} series`;
        }
        return `Showing ${filteredTests.length} of ${(tests || []).length} tests`;
    }, [
        activeTab,
        filteredCategories.length,
        categories,
        filteredSeries.length,
        series,
        filteredTests.length,
        tests,
    ]);

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

    const handleTogglePublish = useCallback(async (test: any) => {
        if (!test?.id || busyTestIdsRef.current.has(test.id)) return;

        const nextPublished = !test.is_published;
        if (nextPublished) {
            const { canPublish, reasons } = validateTestForPublish(test);
            if (!canPublish) {
                showToast({
                    variant: 'warning',
                    title: 'Test Not Ready to Publish',
                    message: reasons.join(' '),
                });
                return;
            }
        }

        busyTestIdsRef.current.add(test.id);
        setBusyActionByTestId(prev => ({ ...prev, [test.id]: 'publish' }));

        try {
            const updated = await toggleTestPublish(test.id, nextPublished, { silent: true });
            if (nextPublished) {
                const parentSeriesPublished =
                    (updated?.mock_series ?? updated?.test_series)?.is_published ??
                    (test?.mock_series ?? test?.test_series)?.is_published ??
                    seriesById.get(test.series_id)?.is_published;

                if (parentSeriesPublished === false) {
                    showToast({
                        variant: 'warning',
                        title: 'Test Published (Parent Series is Draft)',
                        message: `"${updated?.name || test.name}" is published, but its parent series is still in Draft so students cannot see it yet.`,
                    });
                } else {
                    showToast({
                        variant: 'success',
                        title: 'Test Published',
                        message: `"${updated?.name || test.name}" is now live to students.`,
                    });
                }
            } else {
                showToast({
                    variant: 'success',
                    title: 'Test Moved to Draft',
                    message: `"${updated?.name || test.name}" is now hidden from students.`,
                });
            }
        } catch {
            // Error toast handled in useTests
        } finally {
            busyTestIdsRef.current.delete(test.id);
            if (isMountedRef.current) {
                setBusyActionByTestId(prev => {
                    const next = { ...prev };
                    delete next[test.id];
                    return next;
                });
            }
        }
    }, [toggleTestPublish, showToast, seriesById]);

    const handleCloneTest = useCallback(async (test: any) => {
        if (!test?.id || busyTestIdsRef.current.has(test.id)) return;

        busyTestIdsRef.current.add(test.id);
        setBusyActionByTestId(prev => ({ ...prev, [test.id]: 'clone' }));

        try {
            const cloned = await duplicateTest(test, { silent: true });
            if (statusFilter === 'published') {
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('status');
                    return next;
                }, { replace: true });
                showToast({
                    variant: 'success',
                    title: 'Test Cloned as Draft',
                    message: `Created "${cloned?.name || 'Draft copy'}" and switched status filter to All so it stays visible.`,
                });
            } else {
                showToast({
                    variant: 'success',
                    title: 'Test Cloned as Draft',
                    message: `Created "${cloned?.name || 'Draft copy'}".`,
                });
            }
        } catch {
            // Error toast handled in useTests
        } finally {
            busyTestIdsRef.current.delete(test.id);
            if (isMountedRef.current) {
                setBusyActionByTestId(prev => {
                    const next = { ...prev };
                    delete next[test.id];
                    return next;
                });
            }
        }
    }, [duplicateTest, statusFilter, setSearchParams, showToast]);

    const handleDeleteClick = (id: string) => {
        if (
            (activeTab === 'categories' && (seriesLoading || testsLoading)) ||
            (activeTab === 'series' && testsLoading)
        ) {
            showToast({
                variant: 'info',
                title: 'Loading Related Items',
                message: 'Still loading child items. Please try again in a moment.',
            });
            return;
        }

        if (activeTab === 'categories') {
            const cat = (categories || []).find(c => c.id === id);
            const stats = categoryStats.get(id) ?? { seriesCount: 0, testsCount: 0 };
            setConfirmDialog({
                isOpen: true,
                id,
                type: 'categories',
                title: 'Delete Exam Category?',
                message: `Deleting "${cat?.name || 'this category'}" will permanently cascade-delete ${stats.seriesCount} test series and ${stats.testsCount} mock tests, along with all associated student attempts. This action cannot be undone.`,
            });
            return;
        }

        if (activeTab === 'series') {
            const ser = seriesById.get(id) ?? (series || []).find(s => s.id === id);
            const testsCount = seriesTestCounts.get(id) ?? 0;
            setConfirmDialog({
                isOpen: true,
                id,
                type: 'series',
                title: 'Delete Test Series?',
                message: `Deleting "${ser?.name || 'this test series'}" will permanently cascade-delete ${testsCount} mock tests and all associated student attempts. This action cannot be undone.`,
            });
            return;
        }

        const test = (tests || []).find(t => t.id === id);
        const qCount = Array.isArray(test?.question_ids) ? test.question_ids.length : 0;
        const statusLabel = test?.is_published ? 'Published (live to students)' : 'Draft';
        setConfirmDialog({
            isOpen: true,
            id,
            type: 'tests',
            title: 'Delete Mock Test?',
            message: `Deleting "${test?.name || 'this mock test'}" (${statusLabel}, ${qCount} questions) will permanently remove the test and all associated student attempts. This action cannot be undone.`,
        });
    };

    const confirmDelete = async () => {
        if (!confirmDialog.id || !confirmDialog.type || isDeleting) return;
        setIsDeleting(true);
        try {
            if (confirmDialog.type === 'categories') {
                await removeCategory(confirmDialog.id);
                invalidateMockTestAnalyticsCache();
                await Promise.all([refreshSeries(), refreshTests()]);
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (next.get('category') === confirmDialog.id) {
                        next.delete('category');
                        next.delete('series');
                    } else {
                        const currentSeriesId = next.get('series');
                        if (currentSeriesId && seriesToCategory.get(currentSeriesId) === confirmDialog.id) {
                            next.delete('series');
                        }
                    }
                    return next;
                }, { replace: true });
            } else if (confirmDialog.type === 'series') {
                await removeSeries(confirmDialog.id);
                invalidateMockTestAnalyticsCache();
                await refreshTests();
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (next.get('series') === confirmDialog.id) {
                        next.delete('series');
                    }
                    return next;
                }, { replace: true });
            } else if (confirmDialog.type === 'tests') {
                await removeTest(confirmDialog.id);
                invalidateMockTestAnalyticsCache(confirmDialog.id);
                if (insightsTest?.id === confirmDialog.id) {
                    setInsightsTest(null);
                    setPreviewQuestionId(null);
                }
            }
        } finally {
            if (isMountedRef.current) {
                setIsDeleting(false);
                setConfirmDialog({ isOpen: false, id: '', type: '', title: '', message: '' });
            }
        }
    };

    const handleSaveCategory = async (payload: any) => {
        if (selectedItem) await editCategory(selectedItem.id, payload);
        else await addCategory(payload);
        await Promise.all([refreshSeries(), refreshTests()]);
    };

    const handleSaveSeries = async (payload: any) => {
        if (selectedItem) await editSeries(selectedItem.id, payload);
        else await addSeries(payload);
        await refreshTests();
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
                <div className="flex items-center gap-1 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex items-center justify-center gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation scroll-mb-28 shadow-md shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4" aria-hidden="true" /> Create New
                    </button>
                    <InfoHintPopover
                        title="Create New"
                        purpose="Creates a new item matching your active tab: a Category drawer on Categories, a Series drawer on Series, or the 4-step Test Builder on Tests."
                        studentVisibility="New Categories and Series appear in student Mock Hub once active/published; new Tests start as Draft until published."
                        example="Switch to Tests tab and tap Create New to build a 150-question BPSC mock test."
                        align="end"
                    />
                </div>
            </header>

            {/* How Mock Test Hierarchy Works Guide Strip */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 shrink-0">
                    <Info className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white">
                        How Mock Test Hierarchy Works: Exam Category → Test Series → Mock Test
                    </p>
                    <p className="mt-0.5">
                        Students see a Mock Test only when its <strong>Category is Active</strong>, its{' '}
                        <strong>Parent Series is Published</strong>, the <strong>Test is Published</strong>, and the{' '}
                        <strong>Release/Expiry schedule window</strong> is open. Drafts stay hidden in CMS.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="space-y-2 mb-8">
                <div className="flex items-center gap-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Catalog Summary (Published vs Draft)
                    </h2>
                    <InfoHintPopover
                        title="Published vs Draft KPIs"
                        purpose="Tracks how many Mock Tests are marked Published versus still in Draft across all series."
                        studentVisibility="Only Published tests inside Published Series and Active Categories are visible to students."
                        example="A Published test inside a Draft series stays hidden until you publish the parent series."
                        align="start"
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <KPICard title="Categories" value={kpis.totalCategories} icon={BookOpen} color="indigo" />
                    <KPICard title="Series" value={kpis.totalSeries} icon={Layers} color="blue" />
                    <KPICard title="Tests" value={kpis.totalTests} icon={CheckSquare} color="purple" />
                    <KPICard title="Published" value={kpis.publishedTests} icon={CheckSquare} color="emerald" />
                    <KPICard title="Draft" value={kpis.draftTests} icon={CheckSquare} color="amber" />
                </div>
            </div>

            {/* Tabs & Semantic Filter Controls */}
            <div className="space-y-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm w-fit border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => handleTabChange('categories')}
                                className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28 ${activeTab === 'categories' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                            >
                                <BookOpen className="w-4 h-4" aria-hidden="true" /> Categories
                            </button>
                            <InfoHintPopover
                                title="Exam Categories Tab"
                                purpose="Top-level exam buckets (e.g., BPSC, SSC, UPSC) that group Test Series."
                                studentVisibility="Displayed as the main category cards on the student Mock Tests Hub."
                                example="Create 'BPSC' first, set it Active, then add series under it."
                                align="start"
                            />
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => handleTabChange('series')}
                                className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28 ${activeTab === 'series' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                            >
                                <Layers className="w-4 h-4" aria-hidden="true" /> Series
                            </button>
                            <InfoHintPopover
                                title="Test Series Tab"
                                purpose="Collections of mock tests inside a category, with Free vs PRO access and Published vs Draft visibility."
                                studentVisibility="Appears inside the selected Exam Category for students once Published."
                                example="Create '70th BPSC Prelims Series' under BPSC and publish when tests are ready."
                                align="center"
                            />
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => handleTabChange('tests')}
                                className={`min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28 ${activeTab === 'tests' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                            >
                                <CheckSquare className="w-4 h-4" aria-hidden="true" /> Tests
                            </button>
                            <InfoHintPopover
                                title="Mock Tests Tab"
                                purpose="Individual timed exams belonging to a Test Series, containing up to 300 curated questions, marking rules, and schedule windows."
                                studentVisibility="Shown in the Series detail page when Test + Parent Series + Category are all live."
                                example="Filter by Category, Series, or Draft/Published status to manage tests."
                                align="end"
                            />
                        </div>
                    </div>
                </div>

                <search
                    aria-label="Filter CMS content"
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3"
                >
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 flex-wrap">
                        <div className="w-full lg:flex-1 lg:min-w-[220px]">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search content..."
                                ariaLabel="Search CMS content"
                            />
                        </div>

                        {(activeTab === 'series' || activeTab === 'tests') && (
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label
                                    htmlFor="cms-category-filter"
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                                >
                                    Category
                                </label>
                                <select
                                    id="cms-category-filter"
                                    value={selectedCategoryId}
                                    onChange={(e) => handleCategoryFilterChange(e.target.value)}
                                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    {(categories || []).map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === 'tests' && (
                            <div className="flex flex-col gap-1 min-w-[180px]">
                                <label
                                    htmlFor="cms-series-filter"
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                                >
                                    Test Series
                                </label>
                                <select
                                    id="cms-series-filter"
                                    value={selectedSeriesId}
                                    onChange={(e) => handleSeriesFilterChange(e.target.value)}
                                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Series</option>
                                    {scopedSeriesOptions.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === 'tests' && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        Status
                                    </span>
                                    <InfoHintPopover
                                        title="Test Status Filter"
                                        purpose="Filters the Tests list by All, Published, or Draft state, synced to the URL."
                                        example="Switch to Draft to finish incomplete tests before publishing."
                                        align="end"
                                    />
                                </div>
                                <div
                                    role="group"
                                    aria-label="Filter tests by status"
                                    className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
                                >
                                    {([
                                        { value: 'all', label: 'All' },
                                        { value: 'published', label: 'Published' },
                                        { value: 'draft', label: 'Draft' },
                                    ] as const).map(opt => {
                                        const isPressed = statusFilter === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                aria-pressed={isPressed}
                                                onClick={() => handleStatusFilterChange(opt.value)}
                                                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 touch-manipulation scroll-mb-28 ${
                                                    isPressed
                                                        ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <p
                            role="status"
                            aria-live="polite"
                            className="text-xs font-medium text-slate-500 dark:text-slate-400"
                        >
                            {resultSummary}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 inline-flex items-center gap-1.5 transition-all active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </search>
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
                            icon={BookOpen}
                            title={hasActiveFilters ? "No Matching Categories" : "No Categories Found"}
                            message={hasActiveFilters ? "Try adjusting your search criteria." : "Get started by creating your first exam category."}
                            actionLabel={hasActiveFilters ? "Reset Filters" : "Create Category"}
                            onAction={hasActiveFilters ? handleResetFilters : openCreate}
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
                                    testsCount={seriesTestCounts.get(s.id) ?? 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Layers}
                            title={hasActiveFilters ? "No Matching Test Series" : "No Test Series Found"}
                            message={hasActiveFilters ? "Try adjusting your category or search filter." : "Create test series to organize your mock tests."}
                            actionLabel={hasActiveFilters ? "Reset Filters" : "Create Series"}
                            onAction={hasActiveFilters ? handleResetFilters : openCreate}
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
                                    onTogglePublish={handleTogglePublish}
                                    onClone={handleCloneTest}
                                    onViewInsights={setInsightsTest}
                                    busyAction={busyActionByTestId[t.id] ?? null}
                                    isDeleteDisabled={isDeleting}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CheckSquare}
                            title={hasActiveFilters ? "No Matching Mock Tests" : "No Tests Found"}
                            message={hasActiveFilters ? "Try adjusting your category, series, status, or search filters." : "Build your first mock test and publish it to students."}
                            actionLabel={hasActiveFilters ? "Reset Filters" : "Create Test"}
                            onAction={hasActiveFilters ? handleResetFilters : openCreate}
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

            <AdminTestAnalyticsDrawer
                isOpen={Boolean(insightsTest)}
                onClose={() => {
                    setInsightsTest(null);
                    setPreviewQuestionId(null);
                }}
                test={insightsTest}
                onPreviewQuestion={(qId) => setPreviewQuestionId(qId)}
            />

            <QuestionPreviewDrawer
                isOpen={Boolean(previewQuestionId)}
                onClose={() => setPreviewQuestionId(null)}
                questionId={previewQuestionId}
            />

            {/* Confirmation */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setConfirmDialog({ isOpen: false, id: '', type: '', title: '', message: '' });
                    }
                }}
                onConfirm={confirmDelete}
                title={confirmDialog.title || 'Delete Confirmation'}
                message={confirmDialog.message || 'Are you sure you want to delete this item? This action cannot be undone.'}
                confirmText="Delete Permanently"
                isLoading={isDeleting}
            />
        </div>
    );
};
