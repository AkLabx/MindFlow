import { supabase } from '@/lib/supabase';

const SERIES_SELECT_QUERY = '*, exam_categories(id, name)';
const TEST_SELECT_QUERY = '*, test_series(id, name, category_id, is_published, exam_categories(id, name))';

export interface TestMutationPayload {
    series_id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    negative_marks: number;
    question_ids: string[];
    is_published?: boolean;
    display_order?: number;
    release_date?: string | null;
    expiry_date?: string | null;
}

// EXAM CATEGORIES

export const fetchExamCategories = async () => {
    const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const createExamCategory = async (payload: { name: string; description?: string; image_url?: string; is_active?: boolean; display_order?: number }) => {
    const { data, error } = await supabase
        .from('exam_categories')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateExamCategory = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from('exam_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteExamCategory = async (id: string) => {
    const { error } = await supabase
        .from('exam_categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// TEST SERIES

export const fetchTestSeries = async (categoryId?: string) => {
    let query = supabase
        .from('test_series')
        .select(SERIES_SELECT_QUERY)
        .order('created_at', { ascending: false });

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const createTestSeries = async (payload: { category_id: string; name: string; slug: string; description?: string; thumbnail_url?: string; is_premium?: boolean; is_published?: boolean }) => {
    const { data, error } = await supabase
        .from('test_series')
        .insert([payload])
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const updateTestSeries = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from('test_series')
        .update(payload)
        .eq('id', id)
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const deleteTestSeries = async (id: string) => {
    const { error } = await supabase
        .from('test_series')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// TESTS

export const fetchTests = async (seriesId?: string) => {
    let query = supabase
        .from('tests')
        .select(TEST_SELECT_QUERY)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (seriesId) {
        query = query.eq('series_id', seriesId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const fetchTestById = async (id: string) => {
    const { data, error } = await supabase
        .from('tests')
        .select(TEST_SELECT_QUERY)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const createTest = async (payload: TestMutationPayload) => {
    if (payload.is_published === true) {
        const validation = validateTestForPublish(payload);
        if (!validation.canPublish) {
            throw new Error(validation.reasons[0] || 'Test does not meet publish integrity requirements.');
        }
    }

    const { data, error } = await supabase
        .from('tests')
        .insert([payload])
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const updateTest = async (id: string, payload: Partial<TestMutationPayload>) => {
    if (payload.question_ids !== undefined) {
        if (payload.is_published === true && (!Array.isArray(payload.question_ids) || payload.question_ids.length === 0)) {
            throw new Error('Add at least one question before publishing.');
        }
        if (Array.isArray(payload.question_ids) && payload.question_ids.length > 0) {
            if (payload.question_ids.some((q) => typeof q !== 'string' || !q.trim())) {
                throw new Error('All question IDs must be valid non-empty strings.');
            }
            if (new Set(payload.question_ids.map((q) => q.trim())).size < payload.question_ids.length) {
                throw new Error('Remove duplicate questions before publishing.');
            }
        }
    }

    if (payload.release_date && payload.expiry_date) {
        const rel = new Date(payload.release_date);
        const exp = new Date(payload.expiry_date);
        if (Number.isNaN(rel.getTime())) {
            throw new Error('Release date is invalid.');
        }
        if (Number.isNaN(exp.getTime())) {
            throw new Error('Expiry date is invalid.');
        }
        if (exp <= rel) {
            throw new Error('Expiry date must be after Release date.');
        }
    }

    if (
        payload.is_published === true &&
        payload.name !== undefined &&
        payload.series_id !== undefined &&
        payload.question_ids !== undefined &&
        payload.duration_minutes !== undefined &&
        payload.total_marks !== undefined
    ) {
        const validation = validateTestForPublish(payload);
        if (!validation.canPublish) {
            throw new Error(validation.reasons[0] || 'Test does not meet publish integrity requirements.');
        }
    }

    const { data, error } = await supabase
        .from('tests')
        .update(payload)
        .eq('id', id)
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    return data;
};

export const deleteTest = async (id: string) => {
    const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

/**
 * Builds a collision-free cloned test name using `(Copy)` / `(Copy N)` suffixes.
 */
export const buildClonedTestName = (sourceName: string, existingNames?: string[]): string => {
    const trimmed = String(sourceName ?? '').trim() || 'Untitled Test';
    const copyMatch = trimmed.match(/\s+\(Copy(?:\s+(\d+))?\)$/i);
    const baseName = copyMatch
        ? trimmed.slice(0, copyMatch.index).trim() || 'Untitled Test'
        : trimmed;

    if (existingNames !== undefined) {
        const normalizedExisting = new Set(
            existingNames.map((n) => String(n ?? '').trim().toLowerCase()).filter(Boolean)
        );
        const firstCandidate = `${baseName} (Copy)`;
        if (!normalizedExisting.has(firstCandidate.toLowerCase())) {
            return firstCandidate;
        }
        let counter = 2;
        while (normalizedExisting.has(`${baseName} (Copy ${counter})`.toLowerCase())) {
            counter += 1;
        }
        return `${baseName} (Copy ${counter})`;
    }

    if (copyMatch) {
        const existingCopyNum = copyMatch[1] ? Number(copyMatch[1]) : null;
        return existingCopyNum !== null && Number.isFinite(existingCopyNum)
            ? `${baseName} (Copy ${existingCopyNum + 1})`
            : `${baseName} (Copy 2)`;
    }

    return `${baseName} (Copy)`;
};

/**
 * Validates whether a mock test meets all publish readiness rules matching AdminTestBuilderPage.
 */
export const validateTestForPublish = (test: any): { canPublish: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    if (!String(test?.name ?? '').trim()) {
        reasons.push('Test name is required before publishing.');
    }

    if (!test?.series_id) {
        reasons.push('Assign a Test Series before publishing.');
    }

    const qIds = Array.isArray(test?.question_ids) ? test.question_ids : [];
    if (qIds.length === 0) {
        reasons.push('Add at least one question before publishing.');
    } else {
        if (qIds.some((id: unknown) => typeof id !== 'string' || !id.trim())) {
            reasons.push('All question IDs must be valid non-empty strings.');
        }
        const trimmedIds = qIds.map((id: unknown) => (typeof id === 'string' ? id.trim() : ''));
        if (new Set(trimmedIds).size < trimmedIds.length) {
            reasons.push('Remove duplicate questions before publishing.');
        }
    }

    const duration = Number(test?.duration_minutes);
    if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration <= 0) {
        reasons.push('Duration must be a whole number greater than 0 minutes.');
    }

    const totalMarks = Number(test?.total_marks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
        reasons.push('Total marks must be greater than 0.');
    }

    const passingMarks = Number(test?.passing_marks ?? 0);
    if (
        !Number.isFinite(passingMarks) ||
        passingMarks < 0 ||
        (Number.isFinite(totalMarks) && passingMarks > totalMarks)
    ) {
        reasons.push('Passing marks must be between 0 and Total Marks.');
    }

    const negativeMarks = Number(test?.negative_marks ?? 0);
    if (!Number.isFinite(negativeMarks) || negativeMarks < 0) {
        reasons.push('Negative marks must be 0 or greater.');
    }

    const rel = test?.release_date ? new Date(test.release_date) : null;
    const exp = test?.expiry_date ? new Date(test.expiry_date) : null;
    if (rel && Number.isNaN(rel.getTime())) {
        reasons.push('Release date is invalid.');
    }
    if (exp && Number.isNaN(exp.getTime())) {
        reasons.push('Expiry date is invalid.');
    }
    if (rel && exp && !Number.isNaN(rel.getTime()) && !Number.isNaN(exp.getTime()) && exp <= rel) {
        reasons.push('Expiry date must be after Release date.');
    }

    return { canPublish: reasons.length === 0, reasons };
};

/**
 * Clones an existing mock test as an unpublished Draft with a deduplicated `(Copy)` name.
 */
export const cloneTest = async (sourceTest: any, existingNames?: string[]) => {
    const questionIds = Array.isArray(sourceTest?.question_ids)
        ? [...sourceTest.question_ids]
        : [];

    const payload: TestMutationPayload = {
        series_id: sourceTest.series_id,
        name: buildClonedTestName(sourceTest?.name ?? '', existingNames),
        description: sourceTest?.description ?? '',
        duration_minutes: Number(sourceTest?.duration_minutes ?? 60),
        total_marks: Number(sourceTest?.total_marks ?? 0),
        passing_marks: Number(sourceTest?.passing_marks ?? 0),
        negative_marks: Number(sourceTest?.negative_marks ?? 0),
        question_ids: questionIds,
        is_published: false,
        display_order: (Number(sourceTest?.display_order) || 0) + 1,
        release_date: null,
        expiry_date: null,
    };

    return await createTest(payload);
};

// VALIDATION

const QUESTION_ID_CHUNK_SIZE = 100;

export const validateQuestionIds = async (ids: string[]) => {
    if (!ids || ids.length === 0) return { valid: [], invalid: [] };

    // Trim & deduplicate array
    const uniqueIds = Array.from(
        new Set(
            ids
                .map((id) => (typeof id === 'string' ? id.trim() : String(id ?? '').trim()))
                .filter(Boolean)
        )
    );
    if (uniqueIds.length === 0) return { valid: [], invalid: [] };

    // Check if they are valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const formatValidIds = uniqueIds.filter(id => uuidRegex.test(id));

    if (formatValidIds.length === 0) {
        return { valid: [], invalid: uniqueIds };
    }

    const existingIdSet = new Set<string>();
    for (let i = 0; i < formatValidIds.length; i += QUESTION_ID_CHUNK_SIZE) {
        const chunk = formatValidIds.slice(i, i + QUESTION_ID_CHUNK_SIZE);
        const { data, error } = await supabase
            .from('questions')
            .select('id')
            .is('deleted_at', null)
            .in('id', chunk);

        if (error) {
            console.error("Error validating questions:", error);
            return { valid: [], invalid: uniqueIds };
        }

        for (const row of data || []) {
            if (row?.id) existingIdSet.add(row.id);
        }
    }

    const valid = formatValidIds.filter(id => existingIdSet.has(id));
    const invalid = uniqueIds.filter(id => !existingIdSet.has(id));

    return { valid, invalid };
};
