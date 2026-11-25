import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Sparkles,
    Calendar,
    Edit2,
    Save,
    FileText,
    Clock,
    ListChecks,
    Send,
    AlertTriangle,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useNotification } from '@/stores/useNotificationStore';
import { telemetry } from '@/lib/telemetry';
import {
    fetchTestSeries,
    fetchTestById,
    createTest,
    updateTest,
    validateQuestionIds,
    invalidateMockTestAnalyticsCache,
    TestMutationPayload,
} from '../api/adminTestSeriesApi';
import { invalidatePreparedMockQuestionCaches } from '@/features/mock-tests/api/mockTestsApi';
import { QuestionBuilder } from '../../question-builder/components';
import { ConfirmDialog, StatusBadge } from '../components';
import { InfoHintPopover } from '@/components/ui/InfoHintPopover';
import { MAX_PREPARED_MOCK_QUESTIONS } from '@/features/quiz/services/quizCreationService';

type StepNumber = 1 | 2 | 3 | 4;

interface TestFormState {
    series_id: string;
    name: string;
    description: string;
    test_type: 'MOCK' | 'PYQ';
    duration_minutes: string;
    total_marks: string;
    passing_marks: string;
    negative_marks: string;
    display_order: string;
    release_date: string;
    expiry_date: string;
    question_ids: string[];
    is_published: boolean;
    is_free_demo: boolean;
    is_live: boolean;
    live_start_at: string;
    live_end_at: string;
}

type FieldKey =
    | 'name'
    | 'series_id'
    | 'display_order'
    | 'duration_minutes'
    | 'total_marks'
    | 'passing_marks'
    | 'negative_marks'
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

const STEP_1_FIELDS: FieldKey[] = ['name', 'series_id', 'display_order'];
const STEP_2_FIELDS: FieldKey[] = [
    'duration_minutes',
    'total_marks',
    'passing_marks',
    'negative_marks',
    'expiry_date',
];

const STEPS: { number: StepNumber; label: string; shortLabel: string; nextLabel?: string }[] = [
    { number: 1, label: 'Basic Details', shortLabel: 'Basics', nextLabel: 'Timing & Schedule' },
    { number: 2, label: 'Timing & Schedule', shortLabel: 'Timing', nextLabel: 'Select Questions' },
    { number: 3, label: 'Select Questions', shortLabel: 'Questions', nextLabel: 'Review & Publish' },
    { number: 4, label: 'Review & Publish', shortLabel: 'Publish' },
];

const parseStepParam = (raw: string | null): StepNumber => {
    const num = Number(raw);
    if (!Number.isFinite(num) || raw === null || raw.trim() === '') return 1;
    const clamped = Math.min(4, Math.max(1, Math.trunc(num)));
    return clamped as StepNumber;
};

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
    test_type: test?.test_type === 'PYQ' ? 'PYQ' : 'MOCK',
    duration_minutes: String(test?.duration_minutes ?? 60),
    total_marks: String(test?.total_marks ?? 100),
    passing_marks: String(test?.passing_marks ?? 33),
    negative_marks: String(test?.negative_marks ?? 0.25),
    display_order: String(test?.display_order ?? 0),
    release_date: toLocalDateTimeInput(test?.release_date),
    expiry_date: toLocalDateTimeInput(test?.expiry_date),
    question_ids: Array.isArray(test?.question_ids) ? [...test.question_ids] : [],
    is_published: Boolean(test?.is_published),
    is_free_demo: Boolean(test?.is_free_demo),
    is_live: Boolean(test?.is_live),
    live_start_at: toLocalDateTimeInput(test?.live_start_at),
    live_end_at: toLocalDateTimeInput(test?.live_end_at),
});

export const AdminTestBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { testId } = useParams<{ testId?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useNotification();

    const isEditMode = Boolean(testId);
    const currentStep = parseStepParam(searchParams.get('step'));
    const routeTestState = (location.state as { test?: any } | null)?.test;

    const [series, setSeries] = useState<any[]>([]);
    const [seriesLoading, setSeriesLoading] = useState(true);
    const [loadedTest, setLoadedTest] = useState<any | null>(() =>
        isEditMode && routeTestState?.id === testId ? routeTestState : null
    );
    const [hydratingTest, setHydratingTest] = useState<boolean>(() =>
        Boolean(isEditMode && (!routeTestState || routeTestState.id !== testId))
    );
    const [notFoundError, setNotFoundError] = useState<string | null>(null);

    const [initialData, setInitialData] = useState<TestFormState>(() =>
        buildFormState(isEditMode && routeTestState?.id === testId ? routeTestState : undefined, '')
    );
    const [formData, setFormData] = useState<TestFormState>(() =>
        buildFormState(isEditMode && routeTestState?.id === testId ? routeTestState : undefined, '')
    );
    const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
    const [stepSubmitted, setStepSubmitted] = useState<Partial<Record<StepNumber, boolean>>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [savingAction, setSavingAction] = useState<'draft' | 'publish' | null>(null);
    const saving = savingAction !== null;
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [builderSessionKey, setBuilderSessionKey] = useState(0);
    const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
    const [checkingMissingQuestions, setCheckingMissingQuestions] = useState(false);
    const [missingCheckError, setMissingCheckError] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const validationSeqRef = useRef(0);
    const hasMountedStepRef = useRef(false);
    const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
    const errorSummaryRef = useRef<HTMLDivElement | null>(null);
    const pendingFocusFieldRef = useRef<FieldKey | null>(null);
    const fieldRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLSelectElement | null>>>({});

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Load test series catalog
    useEffect(() => {
        let cancelled = false;
        const loadSeries = async () => {
            setSeriesLoading(true);
            try {
                const data = await fetchTestSeries();
                if (!cancelled && isMountedRef.current) {
                    setSeries(data || []);
                }
            } catch (error) {
                console.error('Error loading test series:', error);
                if (!cancelled && isMountedRef.current) {
                    showToast({
                        title: 'Failed to Load Series',
                        message: 'Could not load test series options.',
                        variant: 'error',
                    });
                }
            } finally {
                if (!cancelled && isMountedRef.current) {
                    setSeriesLoading(false);
                }
            }
        };
        loadSeries();
        return () => {
            cancelled = true;
        };
    }, [showToast]);

    // Hydrate test in Edit mode (supports deep-link reload via fetchTestById)
    useEffect(() => {
        let cancelled = false;

        if (!isEditMode || !testId) {
            const freshState = buildFormState(undefined, '');
            setLoadedTest(null);
            setNotFoundError(null);
            setHydratingTest(false);
            setInitialData(freshState);
            setFormData(freshState);
            setTouched({});
            setStepSubmitted({});
            setSubmitAttempted(false);
            setSubmitError(null);
            setBuilderSessionKey(k => k + 1);
            return;
        }

        if (routeTestState && routeTestState.id === testId) {
            const hydrated = buildFormState(routeTestState, '');
            setLoadedTest(routeTestState);
            setNotFoundError(null);
            setHydratingTest(false);
            setInitialData(hydrated);
            setFormData(hydrated);
            setTouched({});
            setStepSubmitted({});
            setSubmitAttempted(false);
            setSubmitError(null);
            setBuilderSessionKey(k => k + 1);
            return;
        }

        const hydrateFromApi = async () => {
            setHydratingTest(true);
            setNotFoundError(null);
            try {
                const fetched = await fetchTestById(testId);
                if (cancelled || !isMountedRef.current) return;
                if (!fetched) {
                    setNotFoundError('This mock test does not exist or may have been deleted.');
                    return;
                }
                const hydrated = buildFormState(fetched, '');
                setLoadedTest(fetched);
                setInitialData(hydrated);
                setFormData(hydrated);
                setTouched({});
                setStepSubmitted({});
                setSubmitAttempted(false);
                setSubmitError(null);
                setBuilderSessionKey(k => k + 1);
            } catch (error: any) {
                if (cancelled || !isMountedRef.current) return;
                setNotFoundError(error?.message || 'Unable to load this mock test.');
            } finally {
                if (!cancelled && isMountedRef.current) {
                    setHydratingTest(false);
                }
            }
        };

        hydrateFromApi();
        return () => {
            cancelled = true;
        };
    }, [isEditMode, testId, routeTestState]);

    // Backfill default series_id in Create mode without marking form dirty
    useEffect(() => {
        if (!isEditMode && series.length > 0 && formData.series_id === '' && !touched.series_id) {
            const firstSeries = series[0];
            const defaultId = firstSeries.id;
            const defaultType: 'MOCK' | 'PYQ' = firstSeries?.series_type === 'PYQ' ? 'PYQ' : 'MOCK';
            setFormData(prev => (prev.series_id === '' ? { ...prev, series_id: defaultId, test_type: defaultType } : prev));
            setInitialData(prev => (prev.series_id === '' ? { ...prev, series_id: defaultId, test_type: defaultType } : prev));
        }
    }, [isEditMode, series, formData.series_id, touched.series_id]);

    // MWG focus management on step change (after initial mount)
    useEffect(() => {
        if (!hasMountedStepRef.current) {
            hasMountedStepRef.current = true;
            return;
        }
        if (pendingFocusFieldRef.current) {
            const targetKey = pendingFocusFieldRef.current;
            pendingFocusFieldRef.current = null;
            requestAnimationFrame(() => {
                fieldRefs.current[targetKey]?.focus();
            });
            return;
        }
        stepHeadingRef.current?.focus();
    }, [currentStep]);

    const setStep = useCallback(
        (step: StepNumber) => {
            setSearchParams(
                prev => {
                    const next = new URLSearchParams(prev);
                    next.set('step', String(step));
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

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

    const selectedSeriesObj = useMemo(
        () => series.find(s => s.id === formData.series_id) ?? (loadedTest?.mock_series ?? loadedTest?.test_series) ?? null,
        [series, formData.series_id, loadedTest]
    );

    const markTouched = useCallback((key: FieldKey) => {
        setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }));
    }, []);

    const questionIdsKey = useMemo(
        () => formData.question_ids.map(id => String(id ?? '').trim()).join(','),
        [formData.question_ids]
    );

    const verifyMissingQuestions = useCallback(async (idsToVerify: string[]) => {
        const cleanIds = idsToVerify.map(id => String(id ?? '').trim()).filter(Boolean);
        const seq = ++validationSeqRef.current;

        if (cleanIds.length === 0) {
            if (isMountedRef.current && seq === validationSeqRef.current) {
                setMissingQuestionIds([]);
                setMissingCheckError(null);
                setCheckingMissingQuestions(false);
            }
            return;
        }

        setCheckingMissingQuestions(true);
        setMissingCheckError(null);
        try {
            const { invalid } = await validateQuestionIds(cleanIds, { throwOnError: true });
            if (!isMountedRef.current || seq !== validationSeqRef.current) return;
            setMissingQuestionIds(invalid);
        } catch (err: any) {
            if (!isMountedRef.current || seq !== validationSeqRef.current) return;
            setMissingQuestionIds([]);
            setMissingCheckError(err?.message || 'Unable to verify question bank availability.');
        } finally {
            if (isMountedRef.current && seq === validationSeqRef.current) {
                setCheckingMissingQuestions(false);
            }
        }
    }, []);

    useEffect(() => {
        if (hydratingTest || notFoundError) return;
        verifyMissingQuestions(formData.question_ids);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydratingTest, notFoundError, questionIdsKey, verifyMissingQuestions]);

    const handlePruneMissingQuestions = useCallback(() => {
        if (missingQuestionIds.length === 0) return;
        const missingSet = new Set(missingQuestionIds.map(id => id.trim()));
        const prunedCount =
            formData.question_ids.filter(rawId => missingSet.has(String(rawId ?? '').trim())).length ||
            missingQuestionIds.length;

        setFormData(prev => ({
            ...prev,
            question_ids: prev.question_ids.filter(rawId => !missingSet.has(String(rawId ?? '').trim())),
        }));

        setMissingQuestionIds([]);
        setMissingCheckError(null);
        setBuilderSessionKey(k => k + 1);

        try {
            telemetry.emit('recovery_action_clicked', {
                view: 'admin_test_builder',
                actionChosen: 'prune_missing_questions',
            });
        } catch {
            // Safe ignore
        }

        showToast({
            title: 'Missing Questions Pruned',
            message: `Removed ${prunedCount} missing or soft-deleted question(s). Save Draft or Publish to persist.`,
            variant: 'success',
        });
    }, [missingQuestionIds, formData.question_ids, showToast]);

    const handleQuestionIdsChange = useCallback((newIds: string[]) => {
        queueMicrotask(() => {
            if (!isMountedRef.current) return;
            setFormData(prev => ({ ...prev, question_ids: newIds }));
        });
    }, []);

    const applyPreset = useCallback(
        (preset: ExamPreset) => {
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
        },
        [showToast]
    );

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
        if (!Number.isFinite(displayOrder) || !Number.isInteger(displayOrder) || displayOrder < 0) {
            fieldErrors.display_order = 'Display order must be a whole number (0 or greater).';
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
        if (formData.release_date.trim() && formData.expiry_date.trim()) {
            const rel = new Date(formData.release_date);
            const exp = new Date(formData.expiry_date);
            if (!Number.isNaN(rel.getTime()) && !Number.isNaN(exp.getTime()) && exp <= rel) {
                fieldErrors.expiry_date = 'Expiry date must be after Release date.';
            }
        }

        const step1Invalid = STEP_1_FIELDS.filter(k => Boolean(fieldErrors[k]));
        const step2Invalid = STEP_2_FIELDS.filter(k => Boolean(fieldErrors[k]));

        const publishErrors: string[] = [];
        if (formData.question_ids.length === 0) {
            publishErrors.push('At least one question must be added before publishing.');
        } else {
            const dupCount = formData.question_ids.length - new Set(formData.question_ids).size;
            if (dupCount > 0) {
                publishErrors.push(`Found ${dupCount} duplicate question(s). Remove duplicates before publishing.`);
            }
            if (missingQuestionIds.length > 0) {
                publishErrors.push(
                    `Found ${missingQuestionIds.length} missing or soft-deleted question(s). Prune missing questions before publishing.`
                );
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
            step1Invalid,
            step2Invalid,
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
    }, [formData, missingQuestionIds.length]);

    const showFieldError = (key: FieldKey, step: StepNumber) =>
        Boolean(validation.fieldErrors[key]) &&
        (Boolean(touched[key]) || Boolean(stepSubmitted[step]) || submitAttempted);

    const navigateToBackList = useCallback(() => {
        navigate(`${ROUTES.ADMIN.TEST_SERIES}?tab=tests`);
    }, [navigate]);

    const handleRequestLeave = useCallback(() => {
        if (isDirty) {
            setShowLeaveDialog(true);
        } else {
            navigateToBackList();
        }
    }, [isDirty, navigateToBackList]);

    const confirmLeave = useCallback(() => {
        setShowLeaveDialog(false);
        navigateToBackList();
    }, [navigateToBackList]);

    const focusFieldOnStep = useCallback(
        (key: FieldKey, targetStep: StepNumber) => {
            if (currentStep === targetStep) {
                fieldRefs.current[key]?.focus();
            } else {
                pendingFocusFieldRef.current = key;
                setStep(targetStep);
            }
        },
        [currentStep, setStep]
    );

    const validateStep = useCallback(
        (step: StepNumber): boolean => {
            if (step === 1 && validation.step1Invalid.length > 0) {
                setStepSubmitted(prev => ({ ...prev, 1: true }));
                const firstInvalid = validation.step1Invalid[0];
                focusFieldOnStep(firstInvalid, 1);
                showToast({
                    title: 'Basic Details Required',
                    message: 'Please fix the highlighted fields in Step 1 before continuing.',
                    variant: 'error',
                });
                return false;
            }
            if (step === 2 && validation.step2Invalid.length > 0) {
                setStepSubmitted(prev => ({ ...prev, 2: true }));
                const firstInvalid = validation.step2Invalid[0];
                focusFieldOnStep(firstInvalid, 2);
                showToast({
                    title: 'Invalid Timing or Marks',
                    message: 'Please fix the highlighted fields in Step 2 before continuing.',
                    variant: 'error',
                });
                return false;
            }
            return true;
        },
        [validation.step1Invalid, validation.step2Invalid, focusFieldOnStep, showToast]
    );

    const handleStepSelect = useCallback(
        (targetStep: StepNumber) => {
            if (targetStep === currentStep) return;

            if (targetStep < currentStep) {
                setStep(targetStep);
                return;
            }

            // Moving forward: validate Step 1 basics if currently on Step 1 or missing basics
            if (validation.fieldErrors.name || validation.fieldErrors.series_id || (currentStep === 1 && validation.step1Invalid.length > 0)) {
                validateStep(1);
                return;
            }

            if (currentStep === 2 && validation.step2Invalid.length > 0) {
                validateStep(2);
                return;
            }

            setStep(targetStep);
        },
        [currentStep, setStep, validation.fieldErrors.name, validation.fieldErrors.series_id, validation.step1Invalid.length, validation.step2Invalid.length, validateStep]
    );

    const handleNextStep = useCallback(() => {
        if (!validateStep(currentStep)) return;
        if (currentStep < 4) {
            setStep((currentStep + 1) as StepNumber);
        }
    }, [currentStep, validateStep, setStep]);

    const handlePrevStep = useCallback(() => {
        if (currentStep > 1) {
            setStep((currentStep - 1) as StepNumber);
        }
    }, [currentStep, setStep]);

    const performSave = useCallback(
        async (publishFlag: boolean) => {
            setSubmitAttempted(true);
            setSubmitError(null);

            if (validation.step1Invalid.length > 0) {
                setStepSubmitted(prev => ({ ...prev, 1: true }));
                focusFieldOnStep(validation.step1Invalid[0], 1);
                showToast({
                    title: 'Validation Error',
                    message: 'Please fix the highlighted fields before saving.',
                    variant: 'error',
                });
                return;
            }

            if (validation.step2Invalid.length > 0) {
                setStepSubmitted(prev => ({ ...prev, 2: true }));
                focusFieldOnStep(validation.step2Invalid[0], 2);
                showToast({
                    title: 'Validation Error',
                    message: 'Please fix the highlighted fields before saving.',
                    variant: 'error',
                });
                return;
            }

            if (publishFlag && !validation.canPublish) {
                if (currentStep !== 4) {
                    setStep(4);
                }
                requestAnimationFrame(() => errorSummaryRef.current?.focus());
                showToast({
                    title: 'Publish Blocked',
                    message: 'Resolve publish readiness issues or save as a Draft.',
                    variant: 'error',
                });
                return;
            }

            const payload: TestMutationPayload = {
                series_id: formData.series_id,
                name: formData.name.trim(),
                description: formData.description.trim(),
                test_type: formData.test_type,
                duration_minutes: Math.round(validation.parsed.durationMinutes),
                total_marks: validation.parsed.totalMarks,
                passing_marks: validation.parsed.passingMarks,
                negative_marks: validation.parsed.negativeMarks,
                display_order: Math.round(validation.parsed.displayOrder),
                question_ids: formData.question_ids,
                is_published: publishFlag,
                is_free_demo: formData.is_free_demo,
                is_live: formData.is_live,
                live_start_at: formData.is_live ? fromLocalDateTimeInput(formData.live_start_at) : null,
                live_end_at: formData.is_live ? fromLocalDateTimeInput(formData.live_end_at) : null,
                release_date: fromLocalDateTimeInput(formData.release_date),
                expiry_date: fromLocalDateTimeInput(formData.expiry_date),
            };

            setSavingAction(publishFlag ? 'publish' : 'draft');
            try {
                const saved =
                    isEditMode && testId
                        ? await updateTest(testId, payload)
                        : await createTest(payload);

                const savedId = saved?.id ?? testId;
                if (savedId) {
                    invalidateMockTestAnalyticsCache(savedId);
                }
                invalidatePreparedMockQuestionCaches();

                showToast({
                    title: publishFlag ? 'Test Published' : 'Draft Saved',
                    message: `"${saved?.name || payload.name}" saved successfully.`,
                    variant: 'success',
                });
                navigate(`${ROUTES.ADMIN.TEST_SERIES}?tab=tests`);
            } catch (error: any) {
                const errMsg = error?.message || 'Failed to save mock test. Please try again.';
                setSubmitError(errMsg);
                showToast({
                    title: 'Save Failed',
                    message: errMsg,
                    variant: 'error',
                });
                if (currentStep === 4) {
                    requestAnimationFrame(() => errorSummaryRef.current?.focus());
                }
            } finally {
                if (isMountedRef.current) {
                    setSavingAction(null);
                }
            }
        },
        [
            validation,
            formData,
            isEditMode,
            testId,
            currentStep,
            focusFieldOnStep,
            setStep,
            showToast,
            navigate,
        ]
    );

    const inputBaseClass =
        'w-full min-h-[44px] px-4 py-2.5 text-base sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 focus:ring-indigo-500 user-invalid:border-red-500';
    const validBorderClass = 'border-slate-200 dark:border-slate-700';
    const errorBorderClass = 'border-red-500 dark:border-red-500 focus:ring-red-500';

    if (hydratingTest) {
        return (
            <div className="space-y-6 pb-12">
                <div className="h-11 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (notFoundError) {
        return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <XCircle className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mock Test Not Found</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{notFoundError}</p>
                <button
                    type="button"
                    onClick={navigateToBackList}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Mock Tests</span>
                </button>
            </div>
        );
    }

    const activeStepMeta = STEPS.find(s => s.number === currentStep) ?? STEPS[0];
    const selectedCategoryName = (selectedSeriesObj?.mock_categories ?? selectedSeriesObj?.exam_categories)?.name;
    const seriesLabel = selectedCategoryName
        ? `${selectedCategoryName} · ${selectedSeriesObj.name}`
        : selectedSeriesObj?.name || 'Not selected';

    const renderMissingQuestionsBanner = () => {
        if (missingCheckError) {
            return (
                <div
                    role="status"
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200"
                >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="font-bold">Could not verify question bank status</p>
                            <p className="mt-0.5 text-amber-800 dark:text-amber-300">{missingCheckError}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={checkingMissingQuestions}
                        onClick={() => {
                            try {
                                telemetry.emit('recovery_action_clicked', {
                                    view: 'admin_test_builder',
                                    actionChosen: 'retry_question_validation',
                                });
                            } catch {
                                // Safe ignore
                            }
                            verifyMissingQuestions(formData.question_ids);
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingMissingQuestions ? 'animate-spin' : ''}`} aria-hidden="true" />
                        <span>Retry Check</span>
                    </button>
                </div>
            );
        }

        if (missingQuestionIds.length === 0) return null;

        const previewSample = missingQuestionIds
            .slice(0, 3)
            .map(id => (id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id))
            .join(', ');

        return (
            <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200"
            >
                <div className="flex items-start gap-3 min-w-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1 min-w-0">
                        <p className="text-sm font-bold text-rose-950 dark:text-rose-100">
                            {missingQuestionIds.length} missing or soft-deleted question
                            {missingQuestionIds.length === 1 ? '' : 's'} detected
                        </p>
                        <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
                            These question IDs are archived or missing from the Question Bank ({previewSample}
                            {missingQuestionIds.length > 3 ? ` +${missingQuestionIds.length - 3} more` : ''}). Prune them so students never hit skipped items.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePruneMissingQuestions}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-600/20 inline-flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
                >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Prune Missing Questions</span>
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-[calc(100dvh-5rem)] pb-6">
            {/* Top Header */}
            <header className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleRequestLeave}
                        className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Mock Tests</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                Unsaved changes
                            </span>
                        )}
                        <StatusBadge status={formData.is_published ? 'published' : 'draft'} />
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                        {isEditMode ? 'Edit Mock Test' : 'Create Customized Mock Test'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {formData.name.trim()
                            ? `Configuring "${formData.name.trim()}"`
                            : 'Configure exam metadata, marking rules, schedule window, and curated questions.'}
                    </p>
                </div>

                {/* Accessible 4-Step Stepper */}
                <nav aria-label="Mock test creation steps">
                    <ol className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {STEPS.map(step => {
                            const isActive = step.number === currentStep;
                            const isCompleted = step.number < currentStep;
                            const hasStepErrors =
                                (step.number === 1 && stepSubmitted[1] && validation.step1Invalid.length > 0) ||
                                (step.number === 2 && stepSubmitted[2] && validation.step2Invalid.length > 0);

                            return (
                                <li key={step.number}>
                                    <button
                                        type="button"
                                        onClick={() => handleStepSelect(step.number)}
                                        aria-current={isActive ? 'step' : undefined}
                                        className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all active:scale-95 ${
                                            isActive
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                                : hasStepErrors
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                                                : isCompleted
                                                ? 'bg-emerald-50/70 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                                                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span
                                                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : isCompleted
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {step.number}
                                            </span>
                                            <span className="text-xs sm:text-sm font-semibold truncate">
                                                {step.label}
                                            </span>
                                        </span>
                                        {step.number === 3 && (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {formData.question_ids.length}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </header>

            {/* Active Step Workspace */}
            <main className="flex-1 py-6">
                {/* Step 1: Basic Details & Classification */}
                {currentStep === 1 && (
                    <section className="max-w-4xl mx-auto bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2
                                ref={stepHeadingRef}
                                tabIndex={-1}
                                className="text-xl font-bold text-slate-900 dark:text-white outline-none"
                            >
                                1. Basic Details &amp; Classification
                            </h2>
                        </div>

                        <form
                            id="step-1-form"
                            noValidate
                            onSubmit={e => {
                                e.preventDefault();
                                handleNextStep();
                            }}
                            className="space-y-6"
                        >
                            <fieldset className="space-y-5">
                                <legend className="sr-only">Basic Details &amp; Classification</legend>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-name"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Test Name *
                                            </label>
                                            <InfoHintPopover
                                                title="Test Name"
                                                purpose="Official title of this mock test."
                                                studentVisibility="Shown on Test Series cards, CBT Exam Runner header, and Scorecards."
                                                example="70th BPSC Full Length Mock 01"
                                                align="start"
                                            />
                                        </div>
                                        <input
                                            ref={el => {
                                                fieldRefs.current.name = el;
                                            }}
                                            id="test-name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e =>
                                                setFormData(prev => ({ ...prev, name: e.target.value }))
                                            }
                                            onBlur={() => markTouched('name')}
                                            aria-invalid={showFieldError('name', 1) ? 'true' : 'false'}
                                            aria-describedby={
                                                showFieldError('name', 1) ? 'test-name-error' : undefined
                                            }
                                            placeholder="e.g. 70th BPSC Full Length Mock 01"
                                            className={`${inputBaseClass} ${
                                                showFieldError('name', 1) ? errorBorderClass : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('name', 1) && (
                                            <p
                                                id="test-name-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.name}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-series"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Series *
                                            </label>
                                            <InfoHintPopover
                                                title="Parent Test Series"
                                                purpose="Places this mock test inside a specific Test Series (grouped by Exam Category)."
                                                studentVisibility="The test appears inside this Series detail page once both Series and Test are published."
                                                example="Choose 'BPSC -> 70th BPSC Prelims Series'."
                                                align="start"
                                            />
                                        </div>
                                        <select
                                            ref={el => {
                                                fieldRefs.current.series_id = el;
                                            }}
                                            id="test-series"
                                            name="series_id"
                                            required
                                            disabled={seriesLoading}
                                            value={formData.series_id}
                                            onChange={e => {
                                                const nextSeriesId = e.target.value;
                                                const matchedSeries = series.find(s => s.id === nextSeriesId);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    series_id: nextSeriesId,
                                                    ...(!isEditMode && matchedSeries
                                                        ? { test_type: matchedSeries.series_type === 'PYQ' ? 'PYQ' : 'MOCK' }
                                                        : {}),
                                                }));
                                            }}
                                            onBlur={() => markTouched('series_id')}
                                            aria-invalid={showFieldError('series_id', 1) ? 'true' : 'false'}
                                            aria-describedby={
                                                showFieldError('series_id', 1) ? 'test-series-error' : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('series_id', 1) ? errorBorderClass : validBorderClass
                                            }`}
                                        >
                                            <option value="" disabled>
                                                {seriesLoading ? 'Loading test series...' : 'Select a test series'}
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
                                        {!seriesLoading && series.length === 0 && (
                                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>
                                                    No Test Series found. Create a Test Series in the Series tab first.
                                                </span>
                                            </p>
                                        )}
                                        {showFieldError('series_id', 1) && (
                                            <p
                                                id="test-series-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.series_id}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="test-description"
                                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="test-description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, description: e.target.value }))
                                        }
                                        placeholder="Syllabus coverage, instructions, or difficulty note shown to students..."
                                        className={`${inputBaseClass} ${validBorderClass}`}
                                    />
                                </div>

                                    <div className="max-w-xs">
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-display-order"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Display Order
                                            </label>
                                            <InfoHintPopover
                                                title="Display Order"
                                                purpose="Sort position of this test within its Test Series (whole number 0 or higher)."
                                                studentVisibility="Lower numbers appear higher in the student's series test list."
                                                example="Use 1 for Mock 01, 2 for Mock 02."
                                                align="start"
                                            />
                                        </div>
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
                                            onChange={e =>
                                                setFormData(prev => ({ ...prev, display_order: e.target.value }))
                                            }
                                            onBlur={() => markTouched('display_order')}
                                            aria-invalid={showFieldError('display_order', 1) ? 'true' : 'false'}
                                            aria-describedby={
                                                showFieldError('display_order', 1)
                                                    ? 'test-display-order-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('display_order', 1)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('display_order', 1) && (
                                            <p
                                                id="test-display-order-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.display_order}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Test Source Type
                                            </span>
                                            <InfoHintPopover
                                                title="Test Source Type (Expert Mock vs PYQ)"
                                                purpose="Identifies whether this paper is an Expert Curated Mock or a Previous Year Paper (PYQ). Automatically defaults from the parent Test Series when creating a new test."
                                                studentVisibility="Displays a PYQ Paper or Expert Mock badge on test cards and routes the test into the matching hub section."
                                                example="Select Previous Year Paper (PYQ) for an authentic 69th BPSC Prelims paper."
                                                align="start"
                                            />
                                        </div>
                                        <div
                                            role="group"
                                            aria-label="Test Source Type"
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                        >
                                            {(
                                                [
                                                    { value: 'MOCK', label: 'Expert Mock' },
                                                    { value: 'PYQ', label: 'Previous Year Paper (PYQ)' },
                                                ] as const
                                            ).map(opt => {
                                                const isSelected = formData.test_type === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        onClick={() =>
                                                            setFormData(prev => ({ ...prev, test_type: opt.value }))
                                                        }
                                                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 touch-manipulation scroll-mb-28 text-center ${
                                                            isSelected
                                                                ? opt.value === 'PYQ'
                                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                                                                    : 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                            </fieldset>
                        </form>
                    </section>
                )}

                {/* Step 2: Timing, Marking & Schedule */}
                {currentStep === 2 && (
                    <section className="max-w-4xl mx-auto bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2
                                ref={stepHeadingRef}
                                tabIndex={-1}
                                className="text-xl font-bold text-slate-900 dark:text-white outline-none"
                            >
                                2. Timing, Marking &amp; Schedule
                            </h2>
                        </div>

                        <form
                            id="step-2-form"
                            noValidate
                            onSubmit={e => {
                                e.preventDefault();
                                handleNextStep();
                            }}
                            className="space-y-8"
                        >
                            {/* Preset Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Exam Presets:
                                    <InfoHintPopover
                                        title="Exam Presets"
                                        purpose="One-tap fills Duration, Total Marks, Passing Marks, and Negative Marking to match standard exam blueprints."
                                        example="Tap BPSC Prelims for 120m · 150M · Pass 95 · -0.33."
                                        align="start"
                                    />
                                </span>
                                {EXAM_PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 text-left transition-all active:scale-95 touch-manipulation scroll-mb-28"
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

                            <fieldset className="space-y-4">
                                <legend className="text-base font-bold text-slate-800 dark:text-slate-200 pb-1">
                                    Timing &amp; Marking Scheme
                                </legend>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-duration"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Duration (mins) *
                                            </label>
                                            <InfoHintPopover
                                                title="Duration (Minutes)"
                                                purpose="Total countdown time allowed for the CBT exam runner before auto-submission."
                                                studentVisibility="Shown on test instructions and the live CBT countdown timer."
                                                example="120 for a 2-hour BPSC full mock."
                                                align="start"
                                            />
                                        </div>
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
                                                setFormData(prev => ({
                                                    ...prev,
                                                    duration_minutes: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('duration_minutes')}
                                            aria-invalid={
                                                showFieldError('duration_minutes', 2) ? 'true' : 'false'
                                            }
                                            aria-describedby={
                                                showFieldError('duration_minutes', 2)
                                                    ? 'test-duration-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('duration_minutes', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('duration_minutes', 2) && (
                                            <p
                                                id="test-duration-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.duration_minutes}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-total-marks"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Total Marks *
                                            </label>
                                            <InfoHintPopover
                                                title="Total Marks"
                                                purpose="Maximum possible score for the test. Marks per question = Total Marks ÷ Question Count."
                                                studentVisibility="Shown on test card, instructions, and final Scorecard."
                                                example="150 marks for 150 questions (1 mark each)."
                                                align="start"
                                            />
                                        </div>
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
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    total_marks: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('total_marks')}
                                            aria-invalid={showFieldError('total_marks', 2) ? 'true' : 'false'}
                                            aria-describedby={
                                                showFieldError('total_marks', 2)
                                                    ? 'test-total-marks-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('total_marks', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('total_marks', 2) && (
                                            <p
                                                id="test-total-marks-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.total_marks}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-passing-marks"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Passing Marks *
                                            </label>
                                            <InfoHintPopover
                                                title="Passing Marks"
                                                purpose="Cutoff score (between 0 and Total Marks) used to mark Pass/Fail status on student scorecards."
                                                studentVisibility="Displayed on the test overview and result verdict."
                                                example="95 out of 150 for BPSC Prelims."
                                                align="center"
                                            />
                                        </div>
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
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    passing_marks: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('passing_marks')}
                                            aria-invalid={
                                                showFieldError('passing_marks', 2) ? 'true' : 'false'
                                            }
                                            aria-describedby={
                                                showFieldError('passing_marks', 2)
                                                    ? 'test-passing-marks-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('passing_marks', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('passing_marks', 2) && (
                                            <p
                                                id="test-passing-marks-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.passing_marks}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label
                                                htmlFor="test-negative-marks"
                                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                Negative Marks *
                                            </label>
                                            <InfoHintPopover
                                                title="Negative Marking"
                                                purpose="Marks deducted per wrong answer (set 0 for no negative marking)."
                                                studentVisibility="Displayed on test details and deducted automatically during scoring."
                                                example="0.33 for 1/3rd penalty or 0.25 for 1/4th penalty."
                                                align="end"
                                            />
                                        </div>
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
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    negative_marks: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('negative_marks')}
                                            aria-invalid={
                                                showFieldError('negative_marks', 2) ? 'true' : 'false'
                                            }
                                            aria-describedby={
                                                showFieldError('negative_marks', 2)
                                                    ? 'test-negative-marks-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('negative_marks', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('negative_marks', 2) && (
                                            <p
                                                id="test-negative-marks-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{validation.fieldErrors.negative_marks}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <legend className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span>Schedule Window (Optional)</span>
                                </legend>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                                <label
                                                    htmlFor="test-release-date"
                                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Release Date
                                                </label>
                                                <InfoHintPopover
                                                    title="Release Date (Schedule Window)"
                                                    purpose="Optional date/time when a Published test opens to students. Leave blank for immediate access."
                                                    studentVisibility="Before Release Date, published tests are locked/hidden outside their schedule window."
                                                    align="start"
                                                />
                                            </div>
                                            {formData.release_date && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData(prev => ({ ...prev, release_date: '' }))
                                                    }
                                                    className="min-h-[44px] px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95 touch-manipulation scroll-mb-28"
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
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    release_date: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('release_date')}
                                            aria-invalid={
                                                showFieldError('release_date', 2) ? 'true' : 'false'
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('release_date', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Leave blank to make available immediately once published.
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                                <label
                                                    htmlFor="test-expiry-date"
                                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Expiry Date
                                                </label>
                                                <InfoHintPopover
                                                    title="Expiry Date"
                                                    purpose="Optional cutoff timestamp (must be after Release Date) when new student attempts close."
                                                    studentVisibility="After Expiry Date, students can no longer start new attempts."
                                                    align="end"
                                                />
                                            </div>
                                            {formData.expiry_date && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData(prev => ({ ...prev, expiry_date: '' }))
                                                    }
                                                    className="min-h-[44px] px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95 touch-manipulation scroll-mb-28"
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
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    expiry_date: e.target.value,
                                                }))
                                            }
                                            onBlur={() => markTouched('expiry_date')}
                                            aria-invalid={showFieldError('expiry_date', 2) ? 'true' : 'false'}
                                            aria-describedby={
                                                showFieldError('expiry_date', 2)
                                                    ? 'test-expiry-date-error'
                                                    : undefined
                                            }
                                            className={`${inputBaseClass} ${
                                                showFieldError('expiry_date', 2)
                                                    ? errorBorderClass
                                                    : validBorderClass
                                            }`}
                                        />
                                        {showFieldError('expiry_date', 2) ? (
                                            <p
                                                id="test-expiry-date-error"
                                                className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                            >
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

                                {/* Demo Access & Live Test Strip Controls */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50">
                                            <div>
                                                <label
                                                    htmlFor="test-free-demo-toggle"
                                                    className="font-bold text-sm text-slate-900 dark:text-white cursor-pointer"
                                                >
                                                    Free Demo Test
                                                </label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Always unlocked in paid series for previewing.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center min-h-[44px] min-w-[44px] justify-center cursor-pointer">
                                                <input
                                                    id="test-free-demo-toggle"
                                                    name="is_free_demo"
                                                    type="checkbox"
                                                    checked={formData.is_free_demo}
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            is_free_demo: e.target.checked,
                                                        }))
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600" />
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/50">
                                            <div>
                                                <label
                                                    htmlFor="test-live-toggle"
                                                    className="font-bold text-sm text-slate-900 dark:text-white cursor-pointer"
                                                >
                                                    Feature in Live Test Strip
                                                </label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Highlights test inside the bottom Live Test drawer.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center min-h-[44px] min-w-[44px] justify-center cursor-pointer">
                                                <input
                                                    id="test-live-toggle"
                                                    name="is_live"
                                                    type="checkbox"
                                                    checked={formData.is_live}
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            is_live: e.target.checked,
                                                        }))
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-rose-600" />
                                            </label>
                                        </div>
                                    </div>

                                    {formData.is_live && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200/60 dark:border-rose-800/40">
                                            <div>
                                                <label
                                                    htmlFor="test-live-start-at"
                                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                                >
                                                    Live Window Start (Optional)
                                                </label>
                                                <input
                                                    id="test-live-start-at"
                                                    type="datetime-local"
                                                    value={formData.live_start_at}
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            live_start_at: e.target.value,
                                                        }))
                                                    }
                                                    className={`${inputBaseClass} ${validBorderClass}`}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="test-live-end-at"
                                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                                >
                                                    Live Window End (Optional)
                                                </label>
                                                <input
                                                    id="test-live-end-at"
                                                    type="datetime-local"
                                                    value={formData.live_end_at}
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            live_end_at: e.target.value,
                                                        }))
                                                    }
                                                    className={`${inputBaseClass} ${validBorderClass}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </fieldset>
                        </form>
                    </section>
                )}

                {/* Step 3: Question Selection & Ordering (Full-Width Workspace, OUTSIDE any <form>) */}
                {currentStep === 3 && (
                    <section className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:px-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2
                                    ref={stepHeadingRef}
                                    tabIndex={-1}
                                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white outline-none"
                                >
                                    3. Select &amp; Order Questions
                                </h2>
                                <InfoHintPopover
                                    title={`Question Selection (Up to ${MAX_PREPARED_MOCK_QUESTIONS} Qs)`}
                                    purpose={`Pick individual questions, use Quick Pick (1–${MAX_PREPARED_MOCK_QUESTIONS}) on the left, or paste UUIDs. Student CBT runner supports up to ${MAX_PREPARED_MOCK_QUESTIONS} questions per prepared mock test.`}
                                    example="Filter by BPSC and use Quick Pick 150 to populate a full Prelims paper in seconds."
                                    align="start"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                {checkingMissingQuestions && (
                                    <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                        <span>Verifying bank...</span>
                                    </span>
                                )}
                                <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {formData.question_ids.length} / {MAX_PREPARED_MOCK_QUESTIONS} Selected
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {formData.duration_minutes || '—'}m · {formData.total_marks || '—'} Marks
                                </span>
                            </div>
                        </div>

                        {renderMissingQuestionsBanner()}

                        <div className="min-h-[620px]">
                            <QuestionBuilder
                                key={`${testId ?? 'new'}-${builderSessionKey}`}
                                initialQuestionIds={formData.question_ids}
                                onChange={handleQuestionIdsChange}
                            />
                        </div>
                    </section>
                )}

                {/* Step 4: Review & Publish */}
                {currentStep === 4 && (
                    <section className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2
                                ref={stepHeadingRef}
                                tabIndex={-1}
                                className="text-xl font-bold text-slate-900 dark:text-white outline-none"
                            >
                                4. Review &amp; Publish
                            </h2>
                        </div>

                        {renderMissingQuestionsBanner()}

                        {((submitAttempted &&
                            (validation.hasFieldErrors || (formData.is_published && !validation.canPublish))) ||
                            submitError) && (
                            <div
                                ref={errorSummaryRef}
                                tabIndex={-1}
                                role="alert"
                                className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm space-y-1 outline-none"
                            >
                                <div className="flex items-center gap-2 font-semibold">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    <span>{submitError || 'Please resolve the following before saving:'}</span>
                                </div>
                                {submitAttempted && (
                                    <ul className="list-disc list-inside text-xs space-y-0.5 pl-1">
                                        {Object.values(validation.fieldErrors).map((err, i) => (
                                            <li key={`s4-fe-${i}`}>{err}</li>
                                        ))}
                                        {formData.is_published &&
                                            validation.publishErrors.map((err, i) => (
                                                <li key={`s4-pe-${i}`}>{err}</li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Basic Details */}
                            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Basic Details
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="min-h-[44px] px-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                </div>
                                <dl className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                    <div>
                                        <dt className="text-slate-400">Name</dt>
                                        <dd className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                                            {formData.name.trim() || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Category · Series</dt>
                                        <dd className="font-medium">{seriesLabel}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Description</dt>
                                        <dd className="line-clamp-2">
                                            {formData.description.trim() || 'No description'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Source Type</dt>
                                        <dd className="font-semibold">
                                            {formData.test_type === 'PYQ' ? 'Previous Year Paper (PYQ)' : 'Expert Mock'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Display Order</dt>
                                        <dd className="font-medium">{formData.display_order || '0'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Card 2: Timing & Schedule */}
                            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Timing &amp; Schedule
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="min-h-[44px] px-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                </div>
                                <dl className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <dt className="text-slate-400">Duration</dt>
                                            <dd className="font-semibold text-slate-900 dark:text-white">
                                                {formData.duration_minutes} mins
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400">Total Marks</dt>
                                            <dd className="font-semibold text-slate-900 dark:text-white">
                                                {formData.total_marks}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400">Passing Marks</dt>
                                            <dd className="font-semibold text-slate-900 dark:text-white">
                                                {formData.passing_marks}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400">Negative Marks</dt>
                                            <dd className="font-semibold text-slate-900 dark:text-white">
                                                {Number(formData.negative_marks) > 0
                                                    ? `-${formData.negative_marks}`
                                                    : '0 (None)'}
                                            </dd>
                                        </div>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Release Window</dt>
                                        <dd className="font-medium">
                                            {formData.release_date
                                                ? new Date(formData.release_date).toLocaleString()
                                                : 'Immediate'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-400">Expiry Window</dt>
                                        <dd className="font-medium">
                                            {formData.expiry_date
                                                ? new Date(formData.expiry_date).toLocaleString()
                                                : 'No expiry'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Card 3: Selected Questions */}
                            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Questions
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="min-h-[44px] px-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                </div>
                                <div className="py-2">
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {formData.question_ids.length}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Questions ordered and ready for exam delivery.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Publish Readiness Panel */}
                        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Publish Readiness
                                </h3>
                                <InfoHintPopover
                                    title="Publish Readiness & Save Draft vs Publish"
                                    purpose="Save Draft stores your test safely without showing it to students. Publish makes the test live—students see it ONLY when Category is Active + Parent Series is Published + Test is Published + Schedule Window is active."
                                    studentVisibility="Draft tests stay hidden in CMS; live tests appear inside the Series page for students."
                                    example="Save Draft while curating questions, then toggle Publish Test when all checks pass."
                                    align="start"
                                />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
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
                                                key={`r-fe-${i}`}
                                                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 font-medium"
                                            >
                                                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>{msg}</span>
                                            </div>
                                        ))}
                                        {validation.publishErrors.map((msg, i) => (
                                            <div
                                                key={`r-pe-${i}`}
                                                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 font-medium"
                                            >
                                                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>{msg}</span>
                                            </div>
                                        ))}
                                        {validation.warnings.map((msg, i) => (
                                            <div
                                                key={`r-warn-${i}`}
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
                                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'
                                }`}
                            >
                                <div>
                                    <label
                                        htmlFor="test-publish-toggle"
                                        className="font-medium text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer"
                                    >
                                        <span>Publish Test</span>
                                        {!validation.canPublish && (
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                        )}
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                                        type="checkbox"
                                        disabled={!validation.canPublish && !formData.is_published}
                                        checked={formData.is_published}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                is_published: e.target.checked,
                                            }))
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
                                </label>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Sticky Bottom Action Bar */}
            <footer className="sticky bottom-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-[calc(1rem_+_env(safe-area-inset-bottom))] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                    {currentStep === 1 ? (
                        <button
                            type="button"
                            onClick={handleRequestLeave}
                            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 touch-manipulation scroll-mb-28"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                    {(currentStep < 4 || formData.is_published) && (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => performSave(false)}
                            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28"
                        >
                            {savingAction === 'draft' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>Save Draft</span>
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28"
                        >
                            <span>Next: {activeStepMeta.nextLabel}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => performSave(formData.is_published)}
                            className="min-h-[44px] px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 disabled:opacity-60 inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation scroll-mb-28"
                        >
                            {(savingAction === 'publish' || (savingAction === 'draft' && !formData.is_published)) && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <span>{formData.is_published ? 'Publish Test' : 'Save Draft'}</span>
                        </button>
                    )}
                </div>
            </footer>

            {/* Unsaved Changes Guard */}
            <ConfirmDialog
                isOpen={showLeaveDialog}
                onClose={() => setShowLeaveDialog(false)}
                onConfirm={confirmLeave}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to leave and discard them?"
                confirmText="Discard & Leave"
            />
        </div>
    );
};
