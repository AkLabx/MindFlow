import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RightDrawer } from './RightDrawer';
import { QuestionBuilder } from '../../question-builder/components';
import { TestMutationPayload } from '../api/adminTestSeriesApi';
import { useNotification } from '@/stores/useNotificationStore';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Sparkles, Calendar } from 'lucide-react';

interface TestDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    test?: any;
    series: any[];
    onSave: (payload: any) => Promise<void>;
}

interface TestFormState {
    series_id: string;
    name: string;
    description: string;
    duration_minutes: string;
    total_marks: string;
    passing_marks: string;
    negative_marks: string;
    display_order: string;
    release_date: string;
    expiry_date: string;
    question_ids: string[];
    is_published: boolean;
}

type FieldKey =
    | 'name'
    | 'series_id'
    | 'duration_minutes'
    | 'total_marks'
    | 'passing_marks'
    | 'negative_marks'
    | 'display_order'
    | 'release_date'
    | 'expiry_date';

interface ExamPreset {
    id: string;
    label: string;
    summary: string;
    duration_minutes: string;
    total_marks: string;
    passing_marks: string;
    negative_marks: string;
}

const EXAM_PRESETS: ExamPreset[] = [
    {
        id: 'bpsc-prelims',
        label: 'BPSC Prelims',
        summary: '120m · 150M · Pass 95 · -0.33',
        duration_minutes: '120',
        total_marks: '150',
        passing_marks: '95',
        negative_marks: '0.33',
    },
    {
        id: 'bpsc-sectional',
        label: 'BPSC Sectional',
        summary: '45m · 50M · Pass 30 · -0.33',
        duration_minutes: '45',
        total_marks: '50',
        passing_marks: '30',
        negative_marks: '0.33',
    },
    {
        id: 'general-ssc',
        label: 'General / SSC',
        summary: '60m · 100M · Pass 33 · -0.25',
        duration_minutes: '60',
        total_marks: '100',
        passing_marks: '33',
        negative_marks: '0.25',
    },
];

const FOCUS_ORDER: FieldKey[] = [
    'name',
    'series_id',
    'duration_minutes',
    'total_marks',
    'passing_marks',
    'negative_marks',
    'display_order',
    'expiry_date',
];

const toLocalDateTimeInput = (iso?: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalDateTimeInput = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const parseStrictNumber = (raw: string): number => {
    const trimmed = raw.trim();
    if (!trimmed) return Number.NaN;
    return Number(trimmed);
};

const buildFormState = (test: any | undefined, defaultSeriesId: string): TestFormState => ({
    series_id: test?.series_id ?? defaultSeriesId,
    name: test?.name ?? '',
    description: test?.description ?? '',
    duration_minutes: String(test?.duration_minutes ?? 60),
    total_marks: String(test?.total_marks ?? 100),
    passing_marks: String(test?.passing_marks ?? 33),
    negative_marks: String(test?.negative_marks ?? 0.25),
    display_order: String(test?.display_order ?? 0),
    release_date: toLocalDateTimeInput(test?.release_date),
    expiry_date: toLocalDateTimeInput(test?.expiry_date),
    question_ids: Array.isArray(test?.question_ids) ? [...test.question_ids] : [],
    is_published: Boolean(test?.is_published),
});

export const TestDrawer: React.FC<TestDrawerProps> = ({ isOpen, onClose, test, series, onSave }) => {
    const { showToast } = useNotification();
    const [initialData, setInitialData] = useState<TestFormState>(() => buildFormState(undefined, ''));
    const [formData, setFormData] = useState<TestFormState>(() => buildFormState(undefined, ''));
    const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [builderSessionKey, setBuilderSessionKey] = useState(0);

    const isMountedRef = useRef(true);
    const wasOpenRef = useRef(false);
    const lastTestIdRef = useRef<string | null>(null);
    const errorSummaryRef = useRef<HTMLDivElement | null>(null);
    const fieldRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLSelectElement | null>>>({});

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Safe initialization: only reset when drawer transitions closed -> open or switches target test
    useEffect(() => {
        if (!isOpen) {
            wasOpenRef.current = false;
            lastTestIdRef.current = null;
            return;
        }

        const currentTestId = test?.id ?? null;
        const isOpening = !wasOpenRef.current;
        const isSwitchingTest = currentTestId !== lastTestIdRef.current;

        if (isOpening || isSwitchingTest) {
            const nextState = buildFormState(test, series[0]?.id || '');
            setInitialData(nextState);
            setFormData(nextState);
            setTouched({});
            setSubmitAttempted(false);
            setSubmitError(null);
            setBuilderSessionKey(prev => prev + 1);
            wasOpenRef.current = true;
            lastTestIdRef.current = currentTestId;
        }
    }, [isOpen, test, series]);

    // Backfill default series_id if series finishes loading after drawer opens in Create mode
    useEffect(() => {
        if (isOpen && !test && series.length > 0 && formData.series_id === '' && !touched.series_id) {
            const defaultId = series[0].id;
            setFormData(prev => (prev.series_id === '' ? { ...prev, series_id: defaultId } : prev));
            setInitialData(prev => (prev.series_id === '' ? { ...prev, series_id: defaultId } : prev));
        }
    }, [isOpen, test, series, formData.series_id, touched.series_id]);

    const isDirty = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(initialData),
        [formData, initialData]
    );

    const groupedSeries = useMemo(() => {
        const groups = new Map<string, any[]>();
        for (const s of series || []) {
            const catName = (s?.mock_categories ?? s?.exam_categories)?.name || 'Uncategorized';
            const list = groups.get(catName) ?? [];
            list.push(s);
            groups.set(catName, list);
        }
        return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [series]);

    const markTouched = useCallback((key: FieldKey) => {
        setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }));
    }, []);

    const handleQuestionIdsChange = useCallback((newIds: string[]) => {
        queueMicrotask(() => {
            if (!isMountedRef.current) return;
            setFormData(prev => ({ ...prev, question_ids: newIds }));
        });
    }, []);

    const applyPreset = useCallback((preset: ExamPreset) => {
        setFormData(prev => ({
            ...prev,
            duration_minutes: preset.duration_minutes,
            total_marks: preset.total_marks,
            passing_marks: preset.passing_marks,
            negative_marks: preset.negative_marks,
        }));
        showToast({
            title: 'Preset Applied',
            message: `${preset.label} (${preset.summary})`,
            variant: 'success',
        });
    }, [showToast]);

    const validation = useMemo(() => {
        const fieldErrors: Partial<Record<FieldKey, string>> = {};

        const durationMinutes = parseStrictNumber(formData.duration_minutes);
        const totalMarks = parseStrictNumber(formData.total_marks);
        const passingMarks = parseStrictNumber(formData.passing_marks);
        const negativeMarks = parseStrictNumber(formData.negative_marks);
        const displayOrder = parseStrictNumber(formData.display_order);

        if (!formData.name.trim()) {
            fieldErrors.name = 'Test Name is required.';
        }
        if (!formData.series_id) {
            fieldErrors.series_id = 'Select a Test Series before saving.';
        }
        if (!Number.isFinite(durationMinutes) || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            fieldErrors.duration_minutes = 'Duration must be a whole number greater than 0 minutes.';
        }
        if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
            fieldErrors.total_marks = 'Total marks must be greater than 0.';
        }
        if (
            !Number.isFinite(passingMarks) ||
            passingMarks < 0 ||
            (Number.isFinite(totalMarks) && passingMarks > totalMarks)
        ) {
            fieldErrors.passing_marks = 'Passing marks must be between 0 and Total Marks.';
        }
        if (!Number.isFinite(negativeMarks) || negativeMarks < 0) {
            fieldErrors.negative_marks = 'Negative marks must be 0 or greater.';
        }
        if (!Number.isFinite(displayOrder) || !Number.isInteger(displayOrder) || displayOrder < 0) {
            fieldErrors.display_order = 'Display order must be a whole number (0 or greater).';
        }
        if (formData.release_date.trim() && formData.expiry_date.trim()) {
            const rel = new Date(formData.release_date);
            const exp = new Date(formData.expiry_date);
            if (!Number.isNaN(rel.getTime()) && !Number.isNaN(exp.getTime()) && exp <= rel) {
                fieldErrors.expiry_date = 'Expiry date must be after Release date.';
            }
        }

        const publishErrors: string[] = [];
        if (formData.question_ids.length === 0) {
            publishErrors.push('At least one question must be added before publishing.');
        } else {
            const dupCount = formData.question_ids.length - new Set(formData.question_ids).size;
            if (dupCount > 0) {
                publishErrors.push(`Found ${dupCount} duplicate question(s). Remove duplicates before publishing.`);
            }
        }

        const warnings: string[] = [];
        if (!formData.description.trim()) {
            warnings.push('Test description is empty — students see this on the test detail screen.');
        }

        const hasFieldErrors = Object.keys(fieldErrors).length > 0;
        const canPublish = !hasFieldErrors && publishErrors.length === 0;

        return {
            fieldErrors,
            publishErrors,
            warnings,
            hasFieldErrors,
            canPublish,
            parsed: {
                durationMinutes,
                totalMarks,
                passingMarks,
                negativeMarks,
                displayOrder,
            },
        };
    }, [formData]);

    const showFieldError = (key: FieldKey) =>
        Boolean(validation.fieldErrors[key]) && (Boolean(touched[key]) || submitAttempted);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setSubmitError(null);

        if (validation.hasFieldErrors) {
            const firstInvalid = FOCUS_ORDER.find(key => Boolean(validation.fieldErrors[key]));
            if (firstInvalid) {
                fieldRefs.current[firstInvalid]?.focus();
            }
            showToast({
                title: 'Validation Error',
                message: 'Please fix the highlighted fields before saving.',
                variant: 'error',
            });
            return;
        }

        if (formData.is_published && !validation.canPublish) {
            errorSummaryRef.current?.focus();
            showToast({
                title: 'Publish Blocked',
                message: 'Resolve publish readiness issues or switch off Publish Test to save as a Draft.',
                variant: 'error',
            });
            return;
        }

        const payload: TestMutationPayload = {
            series_id: formData.series_id,
            name: formData.name.trim(),
            description: formData.description.trim(),
            duration_minutes: Math.round(validation.parsed.durationMinutes),
            total_marks: validation.parsed.totalMarks,
            passing_marks: validation.parsed.passingMarks,
            negative_marks: validation.parsed.negativeMarks,
            display_order: validation.parsed.displayOrder,
            question_ids: formData.question_ids,
            is_published: formData.is_published,
            release_date: fromLocalDateTimeInput(formData.release_date),
            expiry_date: fromLocalDateTimeInput(formData.expiry_date),
        };

        setLoading(true);
        try {
            await onSave(payload);
            onClose();
        } catch (error: any) {
            setSubmitError(error?.message || 'Failed to save mock test. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const showErrorBanner =
        (submitAttempted &&
            (validation.hasFieldErrors || (formData.is_published && !validation.canPublish))) ||
        Boolean(submitError);

    const drawerFooter = (requestClose: () => void) => (
        <div className="flex items-center justify-end gap-3">
            <button
                type="button"
                onClick={requestClose}
                className="min-h-[44px] px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="test-form"
                disabled={loading}
                className="min-h-[44px] px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-indigo-600/20"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{formData.is_published ? 'Publish Test' : 'Save Draft'}</span>
            </button>
        </div>
    );

    const inputBaseClass =
        'w-full min-h-[44px] px-4 py-2.5 text-base sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 focus:ring-indigo-500 user-invalid:border-red-500';
    const validBorderClass = 'border-slate-200 dark:border-slate-700';
    const errorBorderClass = 'border-red-500 dark:border-red-500 focus:ring-red-500';

    return (
        <RightDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={test ? 'Edit Mock Test' : 'Create Mock Test'}
            width="xl"
            isDirty={isDirty}
            footer={drawerFooter}
        >
            <div className="space-y-8 flex flex-col pb-6">
                <form id="test-form" noValidate onSubmit={handleSubmit} className="space-y-8 flex flex-col">
                {showErrorBanner && (
                    <div
                        ref={errorSummaryRef}
                        tabIndex={-1}
                        role="alert"
                        className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm space-y-1 outline-none"
                    >
                        <div className="flex items-center gap-2 font-semibold">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>{submitError || 'Please resolve the following before saving:'}</span>
                        </div>
                        {submitAttempted && (
                            <ul className="list-disc list-inside text-xs space-y-0.5 pl-1">
                                {Object.values(validation.fieldErrors).map((err, i) => (
                                    <li key={`fe-${i}`}>{err}</li>
                                ))}
                                {formData.is_published &&
                                    validation.publishErrors.map((err, i) => <li key={`pe-${i}`}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Fieldset 1: Basic Details */}
                <fieldset className="space-y-4">
                    <legend className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">
                        Basic Details
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="test-name"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Test Name *
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.name = el;
                                }}
                                id="test-name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                onBlur={() => markTouched('name')}
                                aria-invalid={showFieldError('name') ? 'true' : 'false'}
                                aria-describedby={showFieldError('name') ? 'test-name-error' : undefined}
                                placeholder="e.g. 70th BPSC Full Length Mock 01"
                                className={`${inputBaseClass} ${showFieldError('name') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('name') && (
                                <p id="test-name-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.name}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="test-series"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Series *
                            </label>
                            <select
                                ref={el => {
                                    fieldRefs.current.series_id = el;
                                }}
                                id="test-series"
                                name="series_id"
                                required
                                value={formData.series_id}
                                onChange={e => setFormData(prev => ({ ...prev, series_id: e.target.value }))}
                                onBlur={() => markTouched('series_id')}
                                aria-invalid={showFieldError('series_id') ? 'true' : 'false'}
                                aria-describedby={showFieldError('series_id') ? 'test-series-error' : undefined}
                                className={`${inputBaseClass} ${showFieldError('series_id') ? errorBorderClass : validBorderClass}`}
                            >
                                <option value="" disabled>
                                    Select a test series
                                </option>
                                {groupedSeries.map(([categoryName, items]) => (
                                    <optgroup key={categoryName} label={categoryName}>
                                        {items.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {series.length === 0 && (
                                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>No Test Series found. Create a Test Series in the Series tab first.</span>
                                </p>
                            )}
                            {showFieldError('series_id') && (
                                <p id="test-series-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.series_id}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="test-description"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Description
                        </label>
                        <textarea
                            id="test-description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Syllabus coverage, instructions, or difficulty note shown to students..."
                            className={`${inputBaseClass} ${validBorderClass}`}
                        />
                    </div>
                </fieldset>

                {/* Fieldset 2: Timing & Marking Scheme */}
                <fieldset className="space-y-4">
                    <legend className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">
                        Timing &amp; Marking Scheme
                    </legend>

                    {/* Preset Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets:
                        </span>
                        {EXAM_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-left transition-all active:scale-95"
                            >
                                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {preset.label}
                                </span>
                                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                    {preset.summary}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label
                                htmlFor="test-duration"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Duration (mins) *
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.duration_minutes = el;
                                }}
                                id="test-duration"
                                name="duration_minutes"
                                type="number"
                                inputMode="numeric"
                                min="1"
                                step="1"
                                required
                                value={formData.duration_minutes}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))
                                }
                                onBlur={() => markTouched('duration_minutes')}
                                aria-invalid={showFieldError('duration_minutes') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('duration_minutes') ? 'test-duration-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('duration_minutes') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('duration_minutes') && (
                                <p id="test-duration-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.duration_minutes}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="test-total-marks"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Total Marks *
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.total_marks = el;
                                }}
                                id="test-total-marks"
                                name="total_marks"
                                type="number"
                                inputMode="decimal"
                                min="0.01"
                                step="any"
                                required
                                value={formData.total_marks}
                                onChange={e => setFormData(prev => ({ ...prev, total_marks: e.target.value }))}
                                onBlur={() => markTouched('total_marks')}
                                aria-invalid={showFieldError('total_marks') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('total_marks') ? 'test-total-marks-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('total_marks') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('total_marks') && (
                                <p id="test-total-marks-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.total_marks}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="test-passing-marks"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Passing Marks *
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.passing_marks = el;
                                }}
                                id="test-passing-marks"
                                name="passing_marks"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="any"
                                required
                                value={formData.passing_marks}
                                onChange={e => setFormData(prev => ({ ...prev, passing_marks: e.target.value }))}
                                onBlur={() => markTouched('passing_marks')}
                                aria-invalid={showFieldError('passing_marks') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('passing_marks') ? 'test-passing-marks-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('passing_marks') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('passing_marks') && (
                                <p id="test-passing-marks-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.passing_marks}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="test-negative-marks"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Negative Marks *
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.negative_marks = el;
                                }}
                                id="test-negative-marks"
                                name="negative_marks"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                required
                                value={formData.negative_marks}
                                onChange={e => setFormData(prev => ({ ...prev, negative_marks: e.target.value }))}
                                onBlur={() => markTouched('negative_marks')}
                                aria-invalid={showFieldError('negative_marks') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('negative_marks') ? 'test-negative-marks-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('negative_marks') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('negative_marks') && (
                                <p id="test-negative-marks-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.negative_marks}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="test-display-order"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Display Order
                            </label>
                            <input
                                ref={el => {
                                    fieldRefs.current.display_order = el;
                                }}
                                id="test-display-order"
                                name="display_order"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={formData.display_order}
                                onChange={e => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
                                onBlur={() => markTouched('display_order')}
                                aria-invalid={showFieldError('display_order') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('display_order') ? 'test-display-order-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('display_order') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('display_order') && (
                                <p id="test-display-order-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.display_order}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Fieldset 3: Schedule Window (Optional) */}
                <fieldset className="space-y-4">
                    <legend className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>Schedule Window (Optional)</span>
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label
                                    htmlFor="test-release-date"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Release Date
                                </label>
                                {formData.release_date && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, release_date: '' }))}
                                        className="min-h-[44px] px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <input
                                ref={el => {
                                    fieldRefs.current.release_date = el;
                                }}
                                id="test-release-date"
                                name="release_date"
                                type="datetime-local"
                                value={formData.release_date}
                                onChange={e => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                                onBlur={() => markTouched('release_date')}
                                aria-invalid={showFieldError('release_date') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('release_date') ? 'test-release-date-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('release_date') ? errorBorderClass : validBorderClass}`}
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Leave blank to make available immediately once published.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label
                                    htmlFor="test-expiry-date"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Expiry Date
                                </label>
                                {formData.expiry_date && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, expiry_date: '' }))}
                                        className="min-h-[44px] px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <input
                                ref={el => {
                                    fieldRefs.current.expiry_date = el;
                                }}
                                id="test-expiry-date"
                                name="expiry_date"
                                type="datetime-local"
                                value={formData.expiry_date}
                                onChange={e => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                                onBlur={() => markTouched('expiry_date')}
                                aria-invalid={showFieldError('expiry_date') ? 'true' : 'false'}
                                aria-describedby={
                                    showFieldError('expiry_date') ? 'test-expiry-date-error' : undefined
                                }
                                className={`${inputBaseClass} ${showFieldError('expiry_date') ? errorBorderClass : validBorderClass}`}
                            />
                            {showFieldError('expiry_date') ? (
                                <p id="test-expiry-date-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{validation.fieldErrors.expiry_date}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Optional cutoff after which new attempts are closed.
                                </p>
                            )}
                        </div>
                    </div>
                </fieldset>
                </form>

                {/* Question Builder (isolated outside <form> so internal buttons cannot submit) */}
                <section className="space-y-4 flex-1 flex flex-col min-h-[600px]">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                        Questions
                    </h3>
                    {isOpen && (
                        <QuestionBuilder
                            key={`${test?.id ?? 'new'}-${builderSessionKey}`}
                            initialQuestionIds={formData.question_ids}
                            onChange={handleQuestionIdsChange}
                        />
                    )}
                </section>

                {/* Publish Readiness Panel */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                        Publish Readiness
                    </h3>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    {!validation.fieldErrors.name && !validation.fieldErrors.series_id ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    )}
                                    <span>Test Information</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    {!validation.fieldErrors.duration_minutes ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    )}
                                    <span>
                                        Duration (
                                        {Number.isFinite(validation.parsed.durationMinutes)
                                            ? `${validation.parsed.durationMinutes}m`
                                            : '—'}
                                        )
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    {!validation.fieldErrors.total_marks &&
                                    !validation.fieldErrors.passing_marks &&
                                    !validation.fieldErrors.negative_marks ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    )}
                                    <span>
                                        Marking (
                                        {Number.isFinite(validation.parsed.totalMarks)
                                            ? validation.parsed.totalMarks
                                            : '—'}
                                        M · Pass{' '}
                                        {Number.isFinite(validation.parsed.passingMarks)
                                            ? validation.parsed.passingMarks
                                            : '—'}
                                        )
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    {validation.publishErrors.length === 0 ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    )}
                                    <span>Questions ({formData.question_ids.length})</span>
                                </div>
                            </div>
                        </div>

                        {(validation.hasFieldErrors ||
                            validation.publishErrors.length > 0 ||
                            validation.warnings.length > 0) && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                {Object.values(validation.fieldErrors).map((msg, i) => (
                                    <div
                                        key={`crit-field-${i}`}
                                        className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 font-medium"
                                    >
                                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{msg}</span>
                                    </div>
                                ))}
                                {validation.publishErrors.map((msg, i) => (
                                    <div
                                        key={`crit-pub-${i}`}
                                        className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 font-medium"
                                    >
                                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{msg}</span>
                                    </div>
                                ))}
                                {validation.warnings.map((msg, i) => (
                                    <div
                                        key={`warn-${i}`}
                                        className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400"
                                    >
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{msg}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                            formData.is_published
                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                        }`}
                    >
                        <div>
                            <label
                                htmlFor="test-publish-toggle"
                                className="font-medium text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer"
                            >
                                <span>Publish Test</span>
                                {!validation.canPublish && <AlertCircle className="w-4 h-4 text-amber-500" />}
                            </label>
                            <p className="text-xs text-slate-500 mt-1">
                                {!validation.canPublish
                                    ? 'Cannot publish until all critical issues are resolved. You can still save as a Draft.'
                                    : 'Ready to be visible to students.'}
                            </p>
                        </div>
                        <label
                            className={`relative inline-flex items-center min-h-[44px] min-w-[44px] justify-center ${
                                validation.canPublish || formData.is_published
                                    ? 'cursor-pointer'
                                    : 'cursor-not-allowed opacity-50'
                            }`}
                        >
                            <input
                                id="test-publish-toggle"
                                name="is_published"
                                form="test-form"
                                type="checkbox"
                                disabled={!validation.canPublish && !formData.is_published}
                                checked={formData.is_published}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, is_published: e.target.checked }))
                                }
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
                        </label>
                    </div>
                </section>
            </div>
        </RightDrawer>
    );
};
