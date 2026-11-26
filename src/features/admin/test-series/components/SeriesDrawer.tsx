import { Crown, Search, Layers, Route } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { RightDrawer } from './RightDrawer';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { normalizeIncludedSeriesIds } from '@/features/mock-tests/api/mockTestsApi';
import { fetchTestSeries } from '../api/adminTestSeriesApi';

interface SeriesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    series?: any;
    categories: any[];
    allSeries?: any[];
    onSave: (payload: any) => Promise<void>;
}

interface SeriesFormState {
    category_id: string;
    name: string;
    slug: string;
    description: string;
    series_type: 'MOCK' | 'PYQ';
    course_type: 'mock_series' | 'bundle' | 'video' | 'pdf';
    target_route: string;
    included_series_ids: string[];
    is_premium: boolean;
    is_published: boolean;
    price_inr: string;
    mrp_inr: string;
    validity_days: string;
    free_demo_count: string;
}

const buildInitialSeriesForm = (series: any, categories: any[]): SeriesFormState => ({
    category_id: series?.category_id || categories[0]?.id || '',
    name: series?.name || '',
    slug: series?.slug || '',
    description: series?.description || '',
    series_type: series?.series_type === 'PYQ' ? 'PYQ' : 'MOCK',
    course_type:
        series?.course_type === 'bundle' ||
        series?.course_type === 'video' ||
        series?.course_type === 'pdf'
            ? series.course_type
            : 'mock_series',
    target_route: typeof series?.target_route === 'string' ? series.target_route : '',
    included_series_ids: normalizeIncludedSeriesIds(series),
    is_premium: Boolean(series?.is_premium) || Number(series?.price_inr ?? 0) > 0,
    is_published: series?.is_published ?? false,
    price_inr: String(series?.price_inr ?? 0),
    mrp_inr: series?.mrp_inr != null ? String(series.mrp_inr) : '',
    validity_days: String(series?.validity_days ?? 365),
    free_demo_count: String(series?.free_demo_count ?? 1),
});

export const SeriesDrawer: React.FC<SeriesDrawerProps> = ({
    isOpen,
    onClose,
    series,
    categories,
    allSeries,
    onSave,
}) => {
    const [initialData, setInitialData] = useState<SeriesFormState>(() =>
        buildInitialSeriesForm(series, categories)
    );
    const [formData, setFormData] = useState<SeriesFormState>(() =>
        buildInitialSeriesForm(series, categories)
    );
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [bundleSearch, setBundleSearch] = useState('');
    const [fetchedSeries, setFetchedSeries] = useState<any[]>([]);
    const [loadingSeriesList, setLoadingSeriesList] = useState(false);

    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

    const prevOpenRef = React.useRef<boolean>(isOpen);
    const prevSeriesIdRef = React.useRef<string | undefined>(series?.id);

    useEffect(() => {
        const currentSeriesId = series?.id;
        const justOpened = isOpen && !prevOpenRef.current;
        const switchedSeries = currentSeriesId !== prevSeriesIdRef.current;
        prevOpenRef.current = isOpen;
        prevSeriesIdRef.current = currentSeriesId;

        if (!isOpen || justOpened || switchedSeries) {
            const data = buildInitialSeriesForm(series, categories);
            setInitialData(data);
            setFormData(data);
            setFormError(null);
            setBundleSearch('');
        }
    }, [series, isOpen]);

    useEffect(() => {
        if (!isOpen || !categories?.length) return;
        const defaultCatId = String(categories[0]?.id ?? '');
        if (!defaultCatId) return;
        setFormData((prev) => (prev.category_id ? prev : { ...prev, category_id: defaultCatId }));
        setInitialData((prev) => (prev.category_id ? prev : { ...prev, category_id: defaultCatId }));
    }, [isOpen, categories]);

    useEffect(() => {
        if (!isOpen || formData.course_type !== 'bundle' || (allSeries && allSeries.length > 0)) {
            return;
        }
        let cancelled = false;
        setLoadingSeriesList(true);
        fetchTestSeries()
            .then((rows) => {
                if (!cancelled) {
                    setFetchedSeries(Array.isArray(rows) ? rows : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFetchedSeries([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingSeriesList(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, formData.course_type, allSeries]);

    const availableBundleCandidates = useMemo(() => {
        const source = allSeries && allSeries.length > 0 ? allSeries : fetchedSeries;
        const selfId = series?.id ? String(series.id) : '';
        const q = bundleSearch.trim().toLowerCase();
        return source
            .filter((item) => {
                const itemId = String(item?.id ?? '').trim();
                if (!itemId || (selfId && itemId === selfId)) return false;
                const itemType = item?.course_type ?? 'mock_series';
                if (itemType !== 'mock_series') return false;
                if (!q) return true;
                const nameMatch = String(item?.name ?? '').toLowerCase().includes(q);
                const catName = String(item?.mock_categories?.name ?? item?.category_name ?? '').toLowerCase();
                return nameMatch || catName.includes(q);
            })
            .sort((a, b) => String(a?.name ?? '').localeCompare(String(b?.name ?? '')));
    }, [allSeries, fetchedSeries, series?.id, bundleSearch]);

    const toggleBundleSeries = (childSeriesId: string) => {
        setFormData((prev) => {
            const exists = prev.included_series_ids.includes(childSeriesId);
            const nextIds = exists
                ? prev.included_series_ids.filter((id) => id !== childSeriesId)
                : [...prev.included_series_ids, childSeriesId];
            return { ...prev, included_series_ids: nextIds };
        });
    };

    const handleNameChange = (name: string) => {
        if (!series) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setFormData({ ...formData, name, slug });
        } else {
            setFormData({ ...formData, name });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const parsedPrice = formData.is_premium
            ? Math.max(0, Math.round(Number(formData.price_inr || 0)))
            : 0;
        const parsedMrpRaw = formData.mrp_inr.trim();
        const parsedMrp =
            formData.is_premium && parsedMrpRaw !== ''
                ? Math.round(Number(parsedMrpRaw))
                : null;
        const parsedValidity = Math.min(3650, Math.max(1, Math.round(Number(formData.validity_days || 365))));
        const parsedDemo = Math.min(50, Math.max(0, Math.round(Number(formData.free_demo_count || 1))));

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setFormError('Enter a valid INR price.');
            return;
        }
        if (parsedMrp !== null && (Number.isNaN(parsedMrp) || parsedMrp < parsedPrice)) {
            setFormError('MRP must be greater than or equal to the Selling Price.');
            return;
        }

        const isRouteTarget = formData.course_type === 'video' || formData.course_type === 'pdf';
        const trimmedRoute = formData.target_route.trim();
        if (isRouteTarget && trimmedRoute && (!trimmedRoute.startsWith('/') || trimmedRoute.startsWith('//'))) {
            setFormError('Target App Route must start with "/" and cannot start with "//".');
            return;
        }

        setLoading(true);
        try {
            await onSave({
                category_id: formData.category_id,
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                series_type: formData.series_type,
                course_type: formData.course_type,
                target_route: isRouteTarget ? (trimmedRoute || null) : null,
                included_series_ids: formData.course_type === 'bundle' ? formData.included_series_ids : [],
                is_premium: formData.is_premium || parsedPrice > 0,
                is_published: formData.is_published,
                price_inr: parsedPrice,
                mrp_inr: parsedMrp,
                validity_days: parsedValidity,
                free_demo_count: parsedDemo,
            });
            onClose();
        } catch (err: any) {
            console.error(err);
            setFormError(err?.message || 'Could not save series.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <RightDrawer
            isOpen={isOpen}
            onClose={onClose}
            isDirty={isDirty}
            title={series ? 'Edit Test Series' : 'New Test Series'}
            footer={(requestClose) => (
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={requestClose}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 touch-manipulation"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="series-form"
                        disabled={loading || !formData.name || !formData.slug || !formData.category_id}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/20 transition-all active:scale-95 touch-manipulation"
                    >
                        {loading ? 'Saving...' : 'Save Series'}
                    </button>
                </div>
            )}
        >
            <form id="series-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Exam Category *</label>
                        <select
                            required
                            value={formData.category_id}
                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        >
                            <option value="" disabled>Select category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Series Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => handleNameChange(e.target.value)}
                            placeholder="e.g. SSC CGL 2026"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL Slug *</label>
                            <InfoHintPopover
                                title="URL Slug"
                                purpose="Clean web-address identifier for this test series. Auto-generated from title when creating."
                                studentVisibility="Appears in links shared with students."
                                example="ssc-cgl-tier-1-full-mocks"
                                align="start"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="e.g., ssc-cgl-tier-1-full-mocks"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Overview of syllabus, pattern, and included tests..."
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Series Type *</label>
                            <InfoHintPopover
                                title="Series Type (MOCK vs PYQ)"
                                purpose="Classifies whether this series holds newly authored Expert Curated Mocks or Previous Year Papers (PYQ)."
                                studentVisibility="Students can filter PYQ Papers vs Expert Mocks inside each series."
                                example="Choose Previous Year Paper (PYQ) for official past-year BPSC or SSC papers."
                                align="start"
                            />
                        </div>
                        <div
                            role="group"
                            aria-label="Series Type"
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                        >
                            {(
                                [
                                    { value: 'MOCK', label: 'Expert Curated Mock' },
                                    { value: 'PYQ', label: 'Previous Year Paper (PYQ)' },
                                ] as const
                            ).map(opt => {
                                const isSelected = formData.series_type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setFormData({ ...formData, series_type: opt.value })}
                                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 touch-manipulation scroll-mb-28 text-center ${
                                            isSelected
                                                ? opt.value === 'PYQ'
                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                                                    : 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Course Packaging *
                            </label>
                            <InfoHintPopover
                                title="Course Packaging (course_type)"
                                purpose="Choose whether this item is a standard Test Series, a multi-series Course Bundle, a Video Course, or PDF Notes."
                                studentVisibility="Course Bundles automatically unlock all included Test Series upon purchase or Student ID activation."
                                align="start"
                            />
                        </div>
                        <div
                            role="group"
                            aria-label="Course Packaging"
                            className="grid grid-cols-2 gap-2"
                        >
                            {(
                                [
                                    { value: 'mock_series', label: 'Test Series' },
                                    { value: 'bundle', label: 'Course Bundle' },
                                    { value: 'video', label: 'Video Course' },
                                    { value: 'pdf', label: 'PDF Notes' },
                                ] as const
                            ).map(opt => {
                                const isSelected = formData.course_type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setFormData({ ...formData, course_type: opt.value })}
                                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 touch-manipulation scroll-mb-28 text-center ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {formData.course_type === 'bundle' && (
                        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Included Test Series
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                    {formData.included_series_ids.length} selected
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="search"
                                    value={bundleSearch}
                                    onChange={(e) => setBundleSearch(e.target.value)}
                                    placeholder="Search mock series to include..."
                                    aria-label="Search mock series to include in bundle"
                                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                {loadingSeriesList ? (
                                    <p className="text-xs text-slate-500 py-3 text-center">
                                        Loading available test series...
                                    </p>
                                ) : availableBundleCandidates.length === 0 ? (
                                    <p className="text-xs text-slate-500 py-3 text-center">
                                        No matching Test Series available.
                                    </p>
                                ) : (
                                    availableBundleCandidates.map((candidate) => {
                                        const cid = String(candidate.id);
                                        const isChecked = formData.included_series_ids.includes(cid);
                                        const catLabel = candidate?.mock_categories?.name || candidate?.category_name;
                                        return (
                                            <label
                                                key={cid}
                                                className={`min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                                                    isChecked
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleBundleSeries(cid)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {candidate.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                        {[
                                                            catLabel,
                                                            candidate.is_published ? 'Published' : 'Draft',
                                                            Number(candidate.price_inr ?? 0) > 0
                                                                ? `₹${candidate.price_inr}`
                                                                : 'Free',
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {(formData.course_type === 'video' || formData.course_type === 'pdf') && (
                        <div>
                            <div className="flex items-center gap-1 mb-1.5">
                                <label
                                    htmlFor="series-target-route"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                                >
                                    <Route className="w-4 h-4 text-indigo-500" />
                                    Target App Route
                                </label>
                                <InfoHintPopover
                                    title="Target App Route"
                                    purpose="Internal app path opened when an enrolled student taps this Video Course or PDF Notes item."
                                    studentVisibility="Must be an internal relative route starting with '/' (never '//' or external URLs)."
                                    example="/materials/ssc-cgl-notes"
                                    align="start"
                                />
                            </div>
                            <input
                                id="series-target-route"
                                type="text"
                                value={formData.target_route}
                                onChange={(e) => setFormData({ ...formData, target_route: e.target.value })}
                                placeholder={
                                    formData.course_type === 'video'
                                        ? 'e.g. /courses/ssc-cgl-videos'
                                        : 'e.g. /materials/ssc-cgl-notes'
                                }
                                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Optional internal route starting with <code>/</code> (leave blank for default series page).
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                        <Crown className="w-4 h-4" /> Paid Course Series
                                    </p>
                                    <InfoHintPopover
                                        title="Free vs Paid Course (is_premium + INR)"
                                        purpose="Controls whether this course requires purchase or Student ID activation by Admin."
                                        studentVisibility="Paid courses unlock first Free Demo tests and lock remaining tests behind UPI / Admin activation."
                                        align="start"
                                    />
                                </div>
                                <p className="text-sm text-slate-500">Charge INR fee &amp; track validity?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_premium}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            is_premium: e.target.checked,
                                            price_inr: e.target.checked
                                                ? formData.price_inr === '0' || !formData.price_inr
                                                    ? '299'
                                                    : formData.price_inr
                                                : '0',
                                        })
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        {formData.is_premium && (
                            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Selling Price (₹ INR) *
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={1000000}
                                            value={formData.price_inr}
                                            onChange={e => setFormData({ ...formData, price_inr: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            MRP (₹ Optional)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={1000000}
                                            placeholder="e.g. 599"
                                            value={formData.mrp_inr}
                                            onChange={e => setFormData({ ...formData, mrp_inr: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Validity (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={formData.validity_days}
                                            onChange={e => setFormData({ ...formData, validity_days: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Free Demo Tests
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={formData.free_demo_count}
                                            onChange={e => setFormData({ ...formData, free_demo_count: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-slate-900 dark:text-white">Publish Status</p>
                                    <InfoHintPopover
                                        title="Series Publish Status (is_published)"
                                        purpose="Controls whether this Test Series and its published tests are visible to students."
                                        studentVisibility="If OFF (Draft), even Published mock tests inside this series remain hidden from students."
                                        example="Turn ON after adding at least one published mock test."
                                        align="start"
                                    />
                                </div>
                                <p className="text-sm text-slate-500">Visible to students?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_published}
                                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    {formError && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formError}</p>
                    )}
                </div>
            </form>
        </RightDrawer>
    );
};
