import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { db } from '@/lib/db';
import {
    MOCK_SWR_STALE_TIMES_MS,
    isMockCacheFresh,
    invalidateMockTestsCatalogCaches,
} from '@/features/mock-tests/api/mockTestsApi';

export const SERIES_SELECT_QUERY = `*, ${DB_TABLES.MOCK.CATEGORIES}(id, name)` as const;
export const TEST_SELECT_QUERY = `*, ${DB_TABLES.MOCK.SERIES}(id, name, category_id, is_published, ${DB_TABLES.MOCK.CATEGORIES}(id, name))` as const;

export const ADMIN_CMS_STALE_TIME_MS = MOCK_SWR_STALE_TIMES_MS.ATTEMPTS; // 2 * 60 * 1000 (non-PII CMS catalog metadata only, DEC-0024)
export const ADMIN_CMS_CATEGORIES_STORAGE_PREFIX = 'ADMIN_CMS_CATEGORIES_';
export const ADMIN_CMS_SERIES_STORAGE_PREFIX = 'ADMIN_CMS_SERIES_';
export const ADMIN_CMS_TESTS_STORAGE_PREFIX = 'ADMIN_CMS_TESTS_';
export const ADMIN_CMS_CATEGORIES_IDB_PREFIX = 'ADMIN_CMS_CATEGORIES_';
export const ADMIN_CMS_SERIES_IDB_PREFIX = 'ADMIN_CMS_SERIES_';
export const ADMIN_CMS_TESTS_IDB_PREFIX = 'ADMIN_CMS_TESTS_';

const ADMIN_CMS_ALL_SCOPE_KEY = 'all';

interface AdminCmsListCachePayload {
    items: any[];
    fetchedAt: number;
}

const memoryAdminCategoriesCache = new Map<string, AdminCmsListCachePayload>();
const memoryAdminSeriesCache = new Map<string, AdminCmsListCachePayload>();
const memoryAdminTestsCache = new Map<string, AdminCmsListCachePayload>();

const normalizeCmsScopeKey = (scopeId?: string): string => {
    const trimmed = typeof scopeId === 'string' ? scopeId.trim() : '';
    return trimmed || ADMIN_CMS_ALL_SCOPE_KEY;
};

const safeReadCmsStorage = (key: string): unknown => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const safeWriteCmsStorage = (key: string, value: AdminCmsListCachePayload): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage quota or private-browsing errors
    }
};

const safeRemoveCmsStorage = (key: string): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.removeItem(key);
    } catch {
        // Ignore storage removal errors
    }
};

const sanitizeAdminCmsListPayload = (raw: unknown): AdminCmsListCachePayload | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    if (hasForbiddenPiiKeys(obj)) return null;
    if (!Array.isArray(obj.items)) return null;
    if (typeof obj.fetchedAt !== 'number' || !Number.isFinite(obj.fetchedAt) || obj.fetchedAt <= 0) {
        return null;
    }
    for (const item of obj.items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        if (hasForbiddenPiiKeys(item as Record<string, unknown>)) return null;
    }
    return {
        items: obj.items,
        fetchedAt: obj.fetchedAt,
    };
};

const readAdminCmsListSync = (
    memoryCache: Map<string, AdminCmsListCachePayload>,
    scopeKey: string,
    storagePrefix: string
): AdminCmsListCachePayload | null => {
    const mem = memoryCache.get(scopeKey);
    if (mem) {
        const sanitized = sanitizeAdminCmsListPayload(mem);
        if (sanitized) return sanitized;
        memoryCache.delete(scopeKey);
    }

    const storageKey = `${storagePrefix}${scopeKey}`;
    const stored = safeReadCmsStorage(storageKey);
    if (stored !== null) {
        const sanitized = sanitizeAdminCmsListPayload(stored);
        if (sanitized) {
            memoryCache.set(scopeKey, sanitized);
            return sanitized;
        }
        safeRemoveCmsStorage(storageKey);
    }

    return null;
};

const readAdminCmsListIdb = async (
    memoryCache: Map<string, AdminCmsListCachePayload>,
    scopeKey: string,
    storagePrefix: string,
    idbPrefix: string
): Promise<AdminCmsListCachePayload | null> => {
    const syncEntry = readAdminCmsListSync(memoryCache, scopeKey, storagePrefix);
    if (syncEntry) return syncEntry;

    try {
        if (typeof db?.getCacheEntry !== 'function') return null;
        const entry = await db.getCacheEntry<unknown>(`${idbPrefix}${scopeKey}`);
        const sanitized = sanitizeAdminCmsListPayload(entry?.data);
        if (sanitized) {
            memoryCache.set(scopeKey, sanitized);
            safeWriteCmsStorage(`${storagePrefix}${scopeKey}`, sanitized);
            return sanitized;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

const writeAdminCmsListCache = (
    memoryCache: Map<string, AdminCmsListCachePayload>,
    scopeKey: string,
    storagePrefix: string,
    idbPrefix: string,
    items: any[]
): void => {
    const payload: AdminCmsListCachePayload = {
        items: Array.isArray(items) ? items : [],
        fetchedAt: Date.now(),
    };
    const sanitized = sanitizeAdminCmsListPayload(payload);
    if (!sanitized) return;
    memoryCache.set(scopeKey, sanitized);
    safeWriteCmsStorage(`${storagePrefix}${scopeKey}`, sanitized);
    if (typeof db?.setCacheEntry === 'function') {
        db.setCacheEntry(`${idbPrefix}${scopeKey}`, sanitized).catch(() => {});
    }
};

/**
 * Synchronous 0ms cache lookup for Admin exam categories (`DEC-0004`, `DEC-0024`).
 */
export const getCachedAdminCategoriesSnapshot = (): any[] | null => {
    const entry = readAdminCmsListSync(
        memoryAdminCategoriesCache,
        ADMIN_CMS_ALL_SCOPE_KEY,
        ADMIN_CMS_CATEGORIES_STORAGE_PREFIX
    );
    return entry ? [...entry.items] : null;
};

/**
 * Synchronous 0ms cache lookup for Admin test series (`DEC-0004`, `DEC-0024`).
 */
export const getCachedAdminSeriesSnapshot = (categoryId?: string): any[] | null => {
    const scopeKey = normalizeCmsScopeKey(categoryId);
    const exact = readAdminCmsListSync(
        memoryAdminSeriesCache,
        scopeKey,
        ADMIN_CMS_SERIES_STORAGE_PREFIX
    );
    if (exact) return [...exact.items];

    if (scopeKey !== ADMIN_CMS_ALL_SCOPE_KEY) {
        const allSeries = readAdminCmsListSync(
            memoryAdminSeriesCache,
            ADMIN_CMS_ALL_SCOPE_KEY,
            ADMIN_CMS_SERIES_STORAGE_PREFIX
        );
        if (allSeries) {
            return allSeries.items.filter(
                (item) => String(item?.category_id ?? '').trim() === scopeKey
            );
        }
    }

    return null;
};

/**
 * Synchronous 0ms cache lookup for Admin mock tests (`DEC-0004`, `DEC-0024`).
 */
export const getCachedAdminTestsSnapshot = (seriesId?: string): any[] | null => {
    const scopeKey = normalizeCmsScopeKey(seriesId);
    const exact = readAdminCmsListSync(
        memoryAdminTestsCache,
        scopeKey,
        ADMIN_CMS_TESTS_STORAGE_PREFIX
    );
    if (exact) return [...exact.items];

    if (scopeKey !== ADMIN_CMS_ALL_SCOPE_KEY) {
        const allTests = readAdminCmsListSync(
            memoryAdminTestsCache,
            ADMIN_CMS_ALL_SCOPE_KEY,
            ADMIN_CMS_TESTS_STORAGE_PREFIX
        );
        if (allTests) {
            return allTests.items.filter(
                (item) => String(item?.series_id ?? '').trim() === scopeKey
            );
        }
    }

    return null;
};

/**
 * Invalidates Admin CMS Memory, `localStorage`, and `MindFlowDB.sync_metadata` caches,
 * and propagates cross-feature invalidation to test analytics and student mock test catalog caches.
 */
export const invalidateAdminCmsCatalogCaches = (options?: {
    testId?: string;
    seriesId?: string;
    includeAnalytics?: boolean;
}): void => {
    const knownIdbKeys = new Set<string>([
        `${ADMIN_CMS_CATEGORIES_IDB_PREFIX}${ADMIN_CMS_ALL_SCOPE_KEY}`,
        `${ADMIN_CMS_SERIES_IDB_PREFIX}${ADMIN_CMS_ALL_SCOPE_KEY}`,
        `${ADMIN_CMS_TESTS_IDB_PREFIX}${ADMIN_CMS_ALL_SCOPE_KEY}`,
    ]);

    for (const key of memoryAdminCategoriesCache.keys()) {
        knownIdbKeys.add(`${ADMIN_CMS_CATEGORIES_IDB_PREFIX}${key}`);
    }
    for (const key of memoryAdminSeriesCache.keys()) {
        knownIdbKeys.add(`${ADMIN_CMS_SERIES_IDB_PREFIX}${key}`);
    }
    for (const key of memoryAdminTestsCache.keys()) {
        knownIdbKeys.add(`${ADMIN_CMS_TESTS_IDB_PREFIX}${key}`);
    }

    memoryAdminCategoriesCache.clear();
    memoryAdminSeriesCache.clear();
    memoryAdminTestsCache.clear();

    const adminStoragePrefixes = [
        ADMIN_CMS_CATEGORIES_STORAGE_PREFIX,
        ADMIN_CMS_SERIES_STORAGE_PREFIX,
        ADMIN_CMS_TESTS_STORAGE_PREFIX,
    ];

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
                const storageKey = window.localStorage.key(i);
                if (
                    storageKey &&
                    adminStoragePrefixes.some((prefix) => storageKey.startsWith(prefix))
                ) {
                    knownIdbKeys.add(storageKey);
                    window.localStorage.removeItem(storageKey);
                }
            }
        }
    } catch {
        // Ignore storage enumeration errors
    }

    const adminIdbPrefixes = [
        ADMIN_CMS_CATEGORIES_IDB_PREFIX,
        ADMIN_CMS_SERIES_IDB_PREFIX,
        ADMIN_CMS_TESTS_IDB_PREFIX,
    ];

    if (typeof db?.deleteCacheEntriesByPrefix === 'function') {
        db.deleteCacheEntriesByPrefix(adminIdbPrefixes).catch(() => {});
    } else if (typeof db?.setCacheEntry === 'function') {
        for (const idbKey of knownIdbKeys) {
            db.setCacheEntry(idbKey, null).catch(() => {});
        }
    }

    if (options?.includeAnalytics !== false) {
        invalidateMockTestAnalyticsCache(options?.testId);
    }

    invalidateMockTestsCatalogCaches({
        testId: options?.testId,
        seriesId: options?.seriesId,
        includeLeaderboards: true,
    });
};

export interface TestMutationPayload {
    series_id: string;
    name: string;
    description?: string;
    test_type?: 'MOCK' | 'PYQ';
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    negative_marks: number;
    question_ids: string[];
    is_published?: boolean;
    is_free_demo?: boolean;
    is_live?: boolean;
    live_start_at?: string | null;
    live_end_at?: string | null;
    display_order?: number;
    release_date?: string | null;
    expiry_date?: string | null;
}

// EXAM CATEGORIES

export const fetchExamCategories = async (options?: { forceRefresh?: boolean }) => {
    if (!options?.forceRefresh) {
        const syncCached = readAdminCmsListSync(
            memoryAdminCategoriesCache,
            ADMIN_CMS_ALL_SCOPE_KEY,
            ADMIN_CMS_CATEGORIES_STORAGE_PREFIX
        );
        if (syncCached && isMockCacheFresh(syncCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...syncCached.items];
        }

        const idbCached = await readAdminCmsListIdb(
            memoryAdminCategoriesCache,
            ADMIN_CMS_ALL_SCOPE_KEY,
            ADMIN_CMS_CATEGORIES_STORAGE_PREFIX,
            ADMIN_CMS_CATEGORIES_IDB_PREFIX
        );
        if (idbCached && isMockCacheFresh(idbCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...idbCached.items];
        }
    }

    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    writeAdminCmsListCache(
        memoryAdminCategoriesCache,
        ADMIN_CMS_ALL_SCOPE_KEY,
        ADMIN_CMS_CATEGORIES_STORAGE_PREFIX,
        ADMIN_CMS_CATEGORIES_IDB_PREFIX,
        rows
    );
    return rows;
};

export const createExamCategory = async (payload: { name: string; description?: string; image_url?: string; is_active?: boolean; display_order?: number }) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ includeAnalytics: true });
    return data;
};

export const updateExamCategory = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ includeAnalytics: true });
    return data;
};

export const deleteExamCategory = async (id: string) => {
    const { error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .delete()
        .eq('id', id);

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ includeAnalytics: true });
};

// TEST SERIES

export const fetchTestSeries = async (
    categoryId?: string,
    options?: { forceRefresh?: boolean }
) => {
    const trimmedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : '';
    const scopeKey = normalizeCmsScopeKey(trimmedCategoryId);

    if (!options?.forceRefresh) {
        const syncCached = readAdminCmsListSync(
            memoryAdminSeriesCache,
            scopeKey,
            ADMIN_CMS_SERIES_STORAGE_PREFIX
        );
        if (syncCached && isMockCacheFresh(syncCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...syncCached.items];
        }

        const idbCached = await readAdminCmsListIdb(
            memoryAdminSeriesCache,
            scopeKey,
            ADMIN_CMS_SERIES_STORAGE_PREFIX,
            ADMIN_CMS_SERIES_IDB_PREFIX
        );
        if (idbCached && isMockCacheFresh(idbCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...idbCached.items];
        }
    }

    let query = supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(SERIES_SELECT_QUERY)
        .order('created_at', { ascending: false });

    if (trimmedCategoryId) {
        query = query.eq('category_id', trimmedCategoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    writeAdminCmsListCache(
        memoryAdminSeriesCache,
        scopeKey,
        ADMIN_CMS_SERIES_STORAGE_PREFIX,
        ADMIN_CMS_SERIES_IDB_PREFIX,
        rows
    );
    return rows;
};

export const createTestSeries = async (payload: {
    category_id: string;
    name: string;
    slug: string;
    description?: string;
    thumbnail_url?: string;
    series_type?: 'MOCK' | 'PYQ';
    is_premium?: boolean;
    is_published?: boolean;
    price_inr?: number;
    mrp_inr?: number | null;
    validity_days?: number;
    free_demo_count?: number;
    course_type?: 'mock_series' | 'bundle' | 'video' | 'pdf';
}) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .insert([payload])
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ seriesId: data?.id, includeAnalytics: true });
    return data;
};

export const updateTestSeries = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .update(payload)
        .eq('id', id)
        .select(SERIES_SELECT_QUERY)
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ seriesId: id, includeAnalytics: true });
    return data;
};

export const deleteTestSeries = async (id: string) => {
    const { error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .delete()
        .eq('id', id);

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ seriesId: id, includeAnalytics: true });
};

// TESTS

export const fetchTests = async (
    seriesId?: string,
    options?: { forceRefresh?: boolean }
) => {
    const trimmedSeriesId = typeof seriesId === 'string' ? seriesId.trim() : '';
    const scopeKey = normalizeCmsScopeKey(trimmedSeriesId);

    if (!options?.forceRefresh) {
        const syncCached = readAdminCmsListSync(
            memoryAdminTestsCache,
            scopeKey,
            ADMIN_CMS_TESTS_STORAGE_PREFIX
        );
        if (syncCached && isMockCacheFresh(syncCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...syncCached.items];
        }

        const idbCached = await readAdminCmsListIdb(
            memoryAdminTestsCache,
            scopeKey,
            ADMIN_CMS_TESTS_STORAGE_PREFIX,
            ADMIN_CMS_TESTS_IDB_PREFIX
        );
        if (idbCached && isMockCacheFresh(idbCached.fetchedAt, ADMIN_CMS_STALE_TIME_MS)) {
            return [...idbCached.items];
        }
    }

    let query = supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(TEST_SELECT_QUERY)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (trimmedSeriesId) {
        query = query.eq('series_id', trimmedSeriesId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    writeAdminCmsListCache(
        memoryAdminTestsCache,
        scopeKey,
        ADMIN_CMS_TESTS_STORAGE_PREFIX,
        ADMIN_CMS_TESTS_IDB_PREFIX,
        rows
    );
    return rows;
};

export const fetchTestById = async (id: string) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
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
        .from(DB_TABLES.MOCK.TESTS)
        .insert([payload])
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({
        testId: data?.id,
        seriesId: data?.series_id ?? payload.series_id,
        includeAnalytics: true,
    });
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

    const rel = payload.release_date ? new Date(payload.release_date) : null;
    const exp = payload.expiry_date ? new Date(payload.expiry_date) : null;
    if (rel && Number.isNaN(rel.getTime())) {
        throw new Error('Release date is invalid.');
    }
    if (exp && Number.isNaN(exp.getTime())) {
        throw new Error('Expiry date is invalid.');
    }
    if (rel && exp && exp <= rel) {
        throw new Error('Expiry date must be after Release date.');
    }

    if (payload.is_published === true) {
        if (payload.name !== undefined && !String(payload.name ?? '').trim()) {
            throw new Error('Test name is required before publishing.');
        }
        if (payload.series_id !== undefined && !payload.series_id) {
            throw new Error('Assign a Test Series before publishing.');
        }
        if (payload.duration_minutes !== undefined) {
            const duration = Number(payload.duration_minutes);
            if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration <= 0) {
                throw new Error('Duration must be a whole number greater than 0 minutes.');
            }
        }
        if (payload.total_marks !== undefined) {
            const totalMarks = Number(payload.total_marks);
            if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
                throw new Error('Total marks must be greater than 0.');
            }
        }
        if (payload.passing_marks !== undefined) {
            const passingMarks = Number(payload.passing_marks);
            const totalMarks = payload.total_marks !== undefined ? Number(payload.total_marks) : undefined;
            if (
                !Number.isFinite(passingMarks) ||
                passingMarks < 0 ||
                (totalMarks !== undefined && Number.isFinite(totalMarks) && passingMarks > totalMarks)
            ) {
                throw new Error('Passing marks must be between 0 and Total Marks.');
            }
        }
        if (payload.negative_marks !== undefined) {
            const negativeMarks = Number(payload.negative_marks);
            if (!Number.isFinite(negativeMarks) || negativeMarks < 0) {
                throw new Error('Negative marks must be 0 or greater.');
            }
        }

        if (
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
    }

    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .update(payload)
        .eq('id', id)
        .select(TEST_SELECT_QUERY)
        .single();

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({
        testId: id,
        seriesId: data?.series_id ?? payload.series_id,
        includeAnalytics: true,
    });
    return data;
};

export const deleteTest = async (id: string) => {
    const { error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .delete()
        .eq('id', id);

    if (error) throw error;
    invalidateAdminCmsCatalogCaches({ testId: id, includeAnalytics: true });
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

export const validateQuestionIds = async (
    ids: string[],
    options?: { throwOnError?: boolean }
) => {
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

    if (options?.throwOnError && typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error('You appear to be offline. Connect to verify question bank availability.');
    }

    const existingIdSet = new Set<string>();
    for (let i = 0; i < formatValidIds.length; i += QUESTION_ID_CHUNK_SIZE) {
        const chunk = formatValidIds.slice(i, i + QUESTION_ID_CHUNK_SIZE);
        const { data, error } = await supabase
            .from(DB_TABLES.BANK.QUESTIONS)
            .select('id')
            .is('deleted_at', null)
            .in('id', chunk);

        if (error) {
            console.error("Error validating questions:", error);
            if (options?.throwOnError) {
                throw error;
            }
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

// ADMIN MOCK TEST ANALYTICS & QUESTION QUALITY INSPECTOR (v1.0.376)

export const ADMIN_TEST_ANALYTICS_STORAGE_PREFIX = 'mindflow_admin_test_analytics_v1_';
export const ADMIN_TEST_ANALYTICS_IDB_PREFIX = 'admin_mock_test_analytics_v1:';
export const ATTEMPTS_PAGE_SIZE = 500;
export const MAX_ANALYTICS_ATTEMPTS = 5000;

export interface ScoreDistributionBucket {
    key: 'under_40' | '40_to_59' | '60_to_79' | '80_plus';
    label: string;
    count: number;
    percentage: number;
    tone: 'rose' | 'amber' | 'indigo' | 'emerald';
}

export interface MockTestQuestionDiagnostic {
    questionId: string;
    orderIndex: number;
    v1Id: string | null;
    questionText: string;
    subject: string | null;
    difficulty: string | null;
    correctOption: string | null;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    attemptedCount: number;
    totalEvaluated: number;
    accuracyPct: number;
    incorrectRatePct: number;
    skipRatePct: number;
    isMissingFromBank: boolean;
}

export interface MockTestAnalytics {
    testId: string;
    testName: string;
    seriesName: string;
    categoryName: string | null;
    isPublished: boolean;
    totalQuestions: number;
    totalMarks: number;
    passingMarks: number;
    negativeMarks: number;
    durationMinutes: number;
    totalAttempts: number;
    completedAttempts: number;
    inProgressAttempts: number;
    abandonedAttempts: number;
    uniqueStudents: number;
    completionRatePct: number;
    averageScore: number | null;
    medianScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    averageAccuracyPct: number | null;
    averageTimeSeconds: number | null;
    hasPassCutoff: boolean;
    passedCount: number;
    failedCount: number;
    passRatePct: number | null;
    scoreDistribution: ScoreDistributionBucket[];
    hardestQuestions: MockTestQuestionDiagnostic[];
    mostSkippedQuestions: MockTestQuestionDiagnostic[];
    allQuestionDiagnostics: MockTestQuestionDiagnostic[];
    computedAt: number;
    isSampled: boolean;
    sampledLimit: number;
}

export const memoryTestAnalyticsCache = new Map<string, MockTestAnalytics>();

const FORBIDDEN_ANALYTICS_PII_KEYS = new Set([
    'user_id',
    'userid',
    'email',
    'display_name',
    'displayname',
    'full_name',
    'fullname',
    'avatar_url',
    'answers',
    'attempts',
    'students',
    'profiles',
]);

const nowMs = (): number =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

/**
 * MWG `break-up-long-tasks` cooperative yield helper for long analytics loops.
 */
const yieldToMain = async (): Promise<void> => {
    if (
        typeof globalThis !== 'undefined' &&
        'scheduler' in globalThis &&
        typeof (globalThis as any).scheduler?.yield === 'function'
    ) {
        await (globalThis as any).scheduler.yield();
        return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

/**
 * Strips HTML tags, decodes common HTML entities, and collapses whitespace into a plain-text snippet.
 */
export const stripHtmlToSnippet = (raw: unknown, maxLen = 180): string => {
    if (raw === null || raw === undefined) return '';
    const stripped = String(raw).replace(/<[^>]*>/g, ' ');
    const decoded = stripped
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");
    const collapsed = decoded.replace(/\s+/g, ' ').trim();
    if (!collapsed || maxLen <= 0 || collapsed.length <= maxLen) {
        return collapsed;
    }
    return `${collapsed.slice(0, Math.max(1, maxLen - 1)).trimEnd()}…`;
};

const toRounded = (value: number, decimals: number): number =>
    Number(value.toFixed(decimals));

const safeReadAnalyticsStorage = (key: string): unknown => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const safeWriteAnalyticsStorage = (key: string, value: MockTestAnalytics): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage quota or private browsing errors
    }
};

const safeRemoveAnalyticsStorage = (key: string): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.removeItem(key);
    } catch {
        // Ignore storage removal errors
    }
};

const hasForbiddenPiiKeys = (record: Record<string, unknown>): boolean =>
    Object.keys(record).some((key) => FORBIDDEN_ANALYTICS_PII_KEYS.has(key.toLowerCase()));

const sanitizeScoreDistributionBucket = (raw: unknown): ScoreDistributionBucket | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    if (hasForbiddenPiiKeys(obj)) return null;

    const validKeys = new Set(['under_40', '40_to_59', '60_to_79', '80_plus']);
    const validTones = new Set(['rose', 'amber', 'indigo', 'emerald']);
    if (
        typeof obj.key !== 'string' ||
        !validKeys.has(obj.key) ||
        typeof obj.label !== 'string' ||
        typeof obj.count !== 'number' ||
        !Number.isFinite(obj.count) ||
        typeof obj.percentage !== 'number' ||
        !Number.isFinite(obj.percentage) ||
        typeof obj.tone !== 'string' ||
        !validTones.has(obj.tone)
    ) {
        return null;
    }

    return {
        key: obj.key as ScoreDistributionBucket['key'],
        label: obj.label,
        count: obj.count,
        percentage: obj.percentage,
        tone: obj.tone as ScoreDistributionBucket['tone'],
    };
};

const sanitizeQuestionDiagnostic = (raw: unknown): MockTestQuestionDiagnostic | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    if (hasForbiddenPiiKeys(obj)) return null;

    if (
        typeof obj.questionId !== 'string' ||
        !obj.questionId.trim() ||
        typeof obj.orderIndex !== 'number' ||
        !Number.isFinite(obj.orderIndex) ||
        typeof obj.questionText !== 'string' ||
        typeof obj.correctCount !== 'number' ||
        typeof obj.incorrectCount !== 'number' ||
        typeof obj.skippedCount !== 'number' ||
        typeof obj.attemptedCount !== 'number' ||
        typeof obj.totalEvaluated !== 'number' ||
        typeof obj.accuracyPct !== 'number' ||
        typeof obj.incorrectRatePct !== 'number' ||
        typeof obj.skipRatePct !== 'number'
    ) {
        return null;
    }

    return {
        questionId: obj.questionId,
        orderIndex: obj.orderIndex,
        v1Id: typeof obj.v1Id === 'string' ? obj.v1Id : null,
        questionText: obj.questionText,
        subject: typeof obj.subject === 'string' ? obj.subject : null,
        difficulty: typeof obj.difficulty === 'string' ? obj.difficulty : null,
        correctOption: typeof obj.correctOption === 'string' ? obj.correctOption : null,
        correctCount: obj.correctCount,
        incorrectCount: obj.incorrectCount,
        skippedCount: obj.skippedCount,
        attemptedCount: obj.attemptedCount,
        totalEvaluated: obj.totalEvaluated,
        accuracyPct: obj.accuracyPct,
        incorrectRatePct: obj.incorrectRatePct,
        skipRatePct: obj.skipRatePct,
        isMissingFromBank: Boolean(obj.isMissingFromBank),
    };
};

const toNullableFiniteNumber = (val: unknown): number | null => {
    if (val === null) return null;
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    return null;
};

const sanitizeCachedMockTestAnalytics = (raw: unknown): MockTestAnalytics | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    if (hasForbiddenPiiKeys(obj)) return null;

    if (
        typeof obj.testId !== 'string' ||
        !obj.testId.trim() ||
        typeof obj.testName !== 'string' ||
        typeof obj.seriesName !== 'string' ||
        typeof obj.totalQuestions !== 'number' ||
        typeof obj.totalMarks !== 'number' ||
        typeof obj.passingMarks !== 'number' ||
        typeof obj.negativeMarks !== 'number' ||
        typeof obj.durationMinutes !== 'number' ||
        typeof obj.totalAttempts !== 'number' ||
        typeof obj.completedAttempts !== 'number' ||
        typeof obj.inProgressAttempts !== 'number' ||
        typeof obj.abandonedAttempts !== 'number' ||
        typeof obj.uniqueStudents !== 'number' ||
        typeof obj.completionRatePct !== 'number' ||
        typeof obj.passedCount !== 'number' ||
        typeof obj.failedCount !== 'number' ||
        typeof obj.computedAt !== 'number' ||
        !Number.isFinite(obj.computedAt) ||
        !Array.isArray(obj.scoreDistribution) ||
        !Array.isArray(obj.hardestQuestions) ||
        !Array.isArray(obj.mostSkippedQuestions) ||
        !Array.isArray(obj.allQuestionDiagnostics)
    ) {
        return null;
    }

    const scoreDistribution: ScoreDistributionBucket[] = [];
    for (const item of obj.scoreDistribution) {
        const clean = sanitizeScoreDistributionBucket(item);
        if (!clean) return null;
        scoreDistribution.push(clean);
    }

    const sanitizeDiagArray = (arr: unknown[]): MockTestQuestionDiagnostic[] | null => {
        const out: MockTestQuestionDiagnostic[] = [];
        for (const item of arr) {
            const clean = sanitizeQuestionDiagnostic(item);
            if (!clean) return null;
            out.push(clean);
        }
        return out;
    };

    const hardestQuestions = sanitizeDiagArray(obj.hardestQuestions);
    const mostSkippedQuestions = sanitizeDiagArray(obj.mostSkippedQuestions);
    const allQuestionDiagnostics = sanitizeDiagArray(obj.allQuestionDiagnostics);
    if (!hardestQuestions || !mostSkippedQuestions || !allQuestionDiagnostics) {
        return null;
    }

    return {
        testId: obj.testId.trim(),
        testName: obj.testName,
        seriesName: obj.seriesName,
        categoryName: typeof obj.categoryName === 'string' ? obj.categoryName : null,
        isPublished: Boolean(obj.isPublished),
        totalQuestions: obj.totalQuestions,
        totalMarks: obj.totalMarks,
        passingMarks: obj.passingMarks,
        negativeMarks: obj.negativeMarks,
        durationMinutes: obj.durationMinutes,
        totalAttempts: obj.totalAttempts,
        completedAttempts: obj.completedAttempts,
        inProgressAttempts: obj.inProgressAttempts,
        abandonedAttempts: obj.abandonedAttempts,
        uniqueStudents: obj.uniqueStudents,
        completionRatePct: obj.completionRatePct,
        averageScore: toNullableFiniteNumber(obj.averageScore),
        medianScore: toNullableFiniteNumber(obj.medianScore),
        highestScore: toNullableFiniteNumber(obj.highestScore),
        lowestScore: toNullableFiniteNumber(obj.lowestScore),
        averageAccuracyPct: toNullableFiniteNumber(obj.averageAccuracyPct),
        averageTimeSeconds: toNullableFiniteNumber(obj.averageTimeSeconds),
        hasPassCutoff: Boolean(obj.hasPassCutoff),
        passedCount: obj.passedCount,
        failedCount: obj.failedCount,
        passRatePct: toNullableFiniteNumber(obj.passRatePct),
        scoreDistribution,
        hardestQuestions,
        mostSkippedQuestions,
        allQuestionDiagnostics,
        computedAt: obj.computedAt,
        isSampled: Boolean(obj.isSampled),
        sampledLimit:
            typeof obj.sampledLimit === 'number' && Number.isFinite(obj.sampledLimit)
                ? obj.sampledLimit
                : MAX_ANALYTICS_ATTEMPTS,
    };
};

/**
 * Pure async analytics aggregator converting raw mock test metadata, attempts, and hydrated questions
 * into a strictly PII-free `MockTestAnalytics` DTO with cooperative 50ms main-thread yielding.
 */
export const computeMockTestAnalytics = async ({
    test,
    attempts,
    questions,
    isSampled = false,
    sampledLimit = MAX_ANALYTICS_ATTEMPTS,
    computedAt = Date.now(),
}: {
    test: any;
    attempts: any[];
    questions: any[];
    isSampled?: boolean;
    sampledLimit?: number;
    computedAt?: number;
}): Promise<MockTestAnalytics> => {
    const testId = String(test?.id ?? '').trim();
    const testName = String(test?.name ?? '').trim() || 'Untitled Test';
    const parentSeries = test?.mock_series ?? test?.test_series;
    const parentCategory = parentSeries?.mock_categories ?? parentSeries?.exam_categories;
    const seriesName = String(parentSeries?.name ?? '').trim() || 'Unassigned Series';
    const categoryName = parentCategory?.name ? String(parentCategory.name).trim() : null;

    const totalMarks = Number.isFinite(Number(test?.total_marks)) ? Number(test.total_marks) : 0;
    const passingMarks = Number.isFinite(Number(test?.passing_marks)) ? Number(test.passing_marks) : 0;
    const negativeMarks = Number.isFinite(Number(test?.negative_marks)) ? Number(test.negative_marks) : 0;
    const durationMinutes = Number.isFinite(Number(test?.duration_minutes)) ? Number(test.duration_minutes) : 0;

    // Deduplicate ordered question_ids while guarding against synthetic metadata keys
    const rawQuestionIds = Array.isArray(test?.question_ids) ? test.question_ids : [];
    const orderedQuestionIds: string[] = [];
    const seenQIds = new Set<string>();
    for (const rawId of rawQuestionIds) {
        const qid = typeof rawId === 'string' ? rawId.trim() : String(rawId ?? '').trim();
        if (!qid || qid === '__cbt_meta' || seenQIds.has(qid)) continue;
        seenQIds.add(qid);
        orderedQuestionIds.push(qid);
    }

    const safeAttempts = Array.isArray(attempts) ? attempts : [];
    const safeQuestions = Array.isArray(questions) ? questions : [];

    const questionMap = new Map<string, any>();
    for (const q of safeQuestions) {
        const qid = typeof q?.id === 'string' ? q.id.trim() : String(q?.id ?? '').trim();
        if (qid) {
            questionMap.set(qid, q);
        }
    }

    // Ephemeral student ID set — never retained in the returned DTO
    const uniqueStudentSet = new Set<string>();
    const completedRows: any[] = [];
    let totalAttempts = 0;
    let completedAttempts = 0;
    let inProgressAttempts = 0;
    let abandonedAttempts = 0;

    const scores: number[] = [];
    let scoreSum = 0;
    let accuracySum = 0;
    let accuracyCount = 0;
    let timeSum = 0;
    let timeCount = 0;

    const hasPassCutoff = passingMarks > 0;
    let passedCount = 0;

    let bucketUnder40 = 0;
    let bucket40To59 = 0;
    let bucket60To79 = 0;
    let bucket80Plus = 0;

    let deadline = nowMs() + 50;

    for (let i = 0; i < safeAttempts.length; i++) {
        if (nowMs() >= deadline) {
            await yieldToMain();
            deadline = nowMs() + 50;
        }

        const attempt = safeAttempts[i];
        if (!attempt || typeof attempt !== 'object') continue;
        totalAttempts += 1;

        const uid = typeof attempt.user_id === 'string' ? attempt.user_id.trim() : String(attempt.user_id ?? '').trim();
        if (uid) {
            uniqueStudentSet.add(uid);
        }

        const status = typeof attempt.status === 'string' ? attempt.status.trim() : '';
        if (status === 'in_progress') {
            inProgressAttempts += 1;
            continue;
        }
        if (status === 'abandoned') {
            abandonedAttempts += 1;
            continue;
        }
        if (status !== 'completed') {
            continue;
        }

        completedAttempts += 1;
        completedRows.push(attempt);

        const rawScore = attempt.score;
        const parsedScore =
            rawScore !== null && rawScore !== undefined && rawScore !== '' ? Number(rawScore) : NaN;
        if (Number.isFinite(parsedScore)) {
            scores.push(parsedScore);
            scoreSum += parsedScore;
            if (hasPassCutoff && parsedScore >= passingMarks) {
                passedCount += 1;
            }
            if (totalMarks > 0) {
                const scorePct = (parsedScore / totalMarks) * 100;
                if (scorePct < 40) bucketUnder40 += 1;
                else if (scorePct < 60) bucket40To59 += 1;
                else if (scorePct < 80) bucket60To79 += 1;
                else bucket80Plus += 1;
            }
        }

        const rawAcc = attempt.accuracy;
        const parsedAcc =
            rawAcc !== null && rawAcc !== undefined && rawAcc !== '' ? Number(rawAcc) : NaN;
        if (Number.isFinite(parsedAcc)) {
            accuracySum += parsedAcc;
            accuracyCount += 1;
        }

        const rawTime = attempt.time_taken_seconds;
        const parsedTime =
            rawTime !== null && rawTime !== undefined && rawTime !== '' ? Number(rawTime) : NaN;
        if (Number.isFinite(parsedTime) && parsedTime > 0) {
            timeSum += parsedTime;
            timeCount += 1;
        }
    }

    const uniqueStudents = uniqueStudentSet.size;
    const completionRatePct =
        totalAttempts > 0 ? toRounded((completedAttempts / totalAttempts) * 100, 1) : 0;

    let averageScore: number | null = null;
    let medianScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    if (scores.length > 0) {
        const sortedScores = [...scores].sort((a, b) => a - b);
        averageScore = toRounded(scoreSum / scores.length, 2);
        lowestScore = sortedScores[0];
        highestScore = sortedScores[sortedScores.length - 1];
        const mid = Math.floor(sortedScores.length / 2);
        const rawMedian =
            sortedScores.length % 2 === 1
                ? sortedScores[mid]
                : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
        medianScore = toRounded(rawMedian, 2);
    }

    const averageAccuracyPct = accuracyCount > 0 ? toRounded(accuracySum / accuracyCount, 1) : null;
    const averageTimeSeconds = timeCount > 0 ? toRounded(timeSum / timeCount, 1) : null;

    const finalPassedCount = hasPassCutoff ? passedCount : completedAttempts;
    const failedCount = hasPassCutoff ? Math.max(0, completedAttempts - passedCount) : 0;
    const passRatePct =
        hasPassCutoff && completedAttempts > 0
            ? toRounded((finalPassedCount / completedAttempts) * 100, 1)
            : null;

    const pctForBucket = (count: number): number =>
        completedAttempts > 0 ? toRounded((count / completedAttempts) * 100, 1) : 0;

    const scoreDistribution: ScoreDistributionBucket[] = [
        {
            key: 'under_40',
            label: '< 40%',
            count: bucketUnder40,
            percentage: pctForBucket(bucketUnder40),
            tone: 'rose',
        },
        {
            key: '40_to_59',
            label: '40% – 59%',
            count: bucket40To59,
            percentage: pctForBucket(bucket40To59),
            tone: 'amber',
        },
        {
            key: '60_to_79',
            label: '60% – 79%',
            count: bucket60To79,
            percentage: pctForBucket(bucket60To79),
            tone: 'indigo',
        },
        {
            key: '80_plus',
            label: '80%+',
            count: bucket80Plus,
            percentage: pctForBucket(bucket80Plus),
            tone: 'emerald',
        },
    ];

    // Per-question diagnostics across completed attempts
    const questionStats = orderedQuestionIds.map(() => ({
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
    }));

    const questionMetaList = orderedQuestionIds.map((qid) => {
        const q = questionMap.get(qid);
        const isMissingFromBank = !q || Boolean(q.deleted_at);
        const correctOption =
            !isMissingFromBank && q?.correct !== null && q?.correct !== undefined
                ? String(q.correct).trim() || null
                : null;
        return { qid, q, isMissingFromBank, correctOption };
    });

    for (let aIdx = 0; aIdx < completedRows.length; aIdx++) {
        if (nowMs() >= deadline) {
            await yieldToMain();
            deadline = nowMs() + 50;
        }

        const rawAnswers = completedRows[aIdx]?.answers;
        const answersObj =
            rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers)
                ? (rawAnswers as Record<string, unknown>)
                : null;

        for (let qIdx = 0; qIdx < orderedQuestionIds.length; qIdx++) {
            const { qid, correctOption } = questionMetaList[qIdx];
            if (qid === '__cbt_meta') continue;

            const rawSelection = answersObj ? answersObj[qid] : undefined;
            const selected =
                typeof rawSelection === 'string'
                    ? rawSelection.trim()
                    : rawSelection !== null && rawSelection !== undefined && typeof rawSelection !== 'object'
                      ? String(rawSelection).trim()
                      : '';

            if (!selected) {
                questionStats[qIdx].skippedCount += 1;
            } else if (correctOption !== null && selected === correctOption) {
                questionStats[qIdx].correctCount += 1;
            } else {
                questionStats[qIdx].incorrectCount += 1;
            }
        }
    }

    const allQuestionDiagnostics: MockTestQuestionDiagnostic[] = [];
    for (let qIdx = 0; qIdx < orderedQuestionIds.length; qIdx++) {
        if (nowMs() >= deadline) {
            await yieldToMain();
            deadline = nowMs() + 50;
        }

        const { qid, q, isMissingFromBank, correctOption } = questionMetaList[qIdx];
        const { correctCount, incorrectCount, skippedCount } = questionStats[qIdx];
        const attemptedCount = correctCount + incorrectCount;
        const totalEvaluated = completedAttempts;

        allQuestionDiagnostics.push({
            questionId: qid,
            orderIndex: qIdx,
            v1Id: !isMissingFromBank && q?.v1_id ? String(q.v1_id).trim() : null,
            questionText: isMissingFromBank
                ? 'Question unavailable or archived in question bank'
                : stripHtmlToSnippet(q?.question) || 'Untitled question',
            subject: !isMissingFromBank && q?.subject ? String(q.subject).trim() : null,
            difficulty: !isMissingFromBank && q?.difficulty ? String(q.difficulty).trim() : null,
            correctOption,
            correctCount,
            incorrectCount,
            skippedCount,
            attemptedCount,
            totalEvaluated,
            accuracyPct: attemptedCount > 0 ? toRounded((correctCount / attemptedCount) * 100, 1) : 0,
            incorrectRatePct: totalEvaluated > 0 ? toRounded((incorrectCount / totalEvaluated) * 100, 1) : 0,
            skipRatePct: totalEvaluated > 0 ? toRounded((skippedCount / totalEvaluated) * 100, 1) : 0,
            isMissingFromBank,
        });
    }

    const hardestQuestions = allQuestionDiagnostics
        .filter((item) => item.attemptedCount > 0)
        .sort((a, b) => {
            if (a.accuracyPct !== b.accuracyPct) return a.accuracyPct - b.accuracyPct;
            if (a.incorrectCount !== b.incorrectCount) return b.incorrectCount - a.incorrectCount;
            return a.orderIndex - b.orderIndex;
        })
        .slice(0, 5);

    const mostSkippedQuestions = allQuestionDiagnostics
        .filter((item) => item.skippedCount > 0)
        .sort((a, b) => {
            if (a.skipRatePct !== b.skipRatePct) return b.skipRatePct - a.skipRatePct;
            if (a.skippedCount !== b.skippedCount) return b.skippedCount - a.skippedCount;
            return a.orderIndex - b.orderIndex;
        })
        .slice(0, 5);

    return {
        testId,
        testName,
        seriesName,
        categoryName,
        isPublished: Boolean(test?.is_published),
        totalQuestions: orderedQuestionIds.length,
        totalMarks,
        passingMarks,
        negativeMarks,
        durationMinutes,
        totalAttempts,
        completedAttempts,
        inProgressAttempts,
        abandonedAttempts,
        uniqueStudents,
        completionRatePct,
        averageScore,
        medianScore,
        highestScore,
        lowestScore,
        averageAccuracyPct,
        averageTimeSeconds,
        hasPassCutoff,
        passedCount: finalPassedCount,
        failedCount,
        passRatePct,
        scoreDistribution,
        hardestQuestions,
        mostSkippedQuestions,
        allQuestionDiagnostics,
        computedAt,
        isSampled,
        sampledLimit,
    };
};

/**
 * Synchronous 0ms cache lookup for PII-free mock test analytics (`DEC-0004`).
 */
export const getCachedMockTestAnalyticsSnapshot = (testId: string): MockTestAnalytics | null => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    const mem = memoryTestAnalyticsCache.get(trimmedTestId);
    if (mem) {
        const sanitizedMem = sanitizeCachedMockTestAnalytics(mem);
        if (sanitizedMem) return sanitizedMem;
        memoryTestAnalyticsCache.delete(trimmedTestId);
    }

    const storageKey = `${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}${trimmedTestId}`;
    const stored = safeReadAnalyticsStorage(storageKey);
    if (stored !== null) {
        const sanitized = sanitizeCachedMockTestAnalytics(stored);
        if (sanitized) {
            memoryTestAnalyticsCache.set(trimmedTestId, sanitized);
            return sanitized;
        }
        safeRemoveAnalyticsStorage(storageKey);
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for PII-free mock test analytics (`MindFlowDB.sync_metadata`).
 */
export const readMockTestAnalyticsIndexedDBCache = async (
    testId: string
): Promise<MockTestAnalytics | null> => {
    const syncSnapshot = getCachedMockTestAnalyticsSnapshot(testId);
    if (syncSnapshot !== null) return syncSnapshot;

    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    try {
        if (typeof db?.getCacheEntry !== 'function') return null;
        const entry = await db.getCacheEntry<unknown>(`${ADMIN_TEST_ANALYTICS_IDB_PREFIX}${trimmedTestId}`);
        const sanitized = sanitizeCachedMockTestAnalytics(entry?.data);
        if (sanitized) {
            memoryTestAnalyticsCache.set(trimmedTestId, sanitized);
            safeWriteAnalyticsStorage(`${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}${trimmedTestId}`, sanitized);
            return sanitized;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

/**
 * Invalidates cached mock test analytics across memory, localStorage, and IndexedDB.
 */
export const invalidateMockTestAnalyticsCache = (testId?: string): void => {
    const trimmedTestId = typeof testId === 'string' ? testId.trim() : '';
    if (trimmedTestId) {
        memoryTestAnalyticsCache.delete(trimmedTestId);
        safeRemoveAnalyticsStorage(`${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}${trimmedTestId}`);
        if (typeof db?.setCacheEntry === 'function') {
            db.setCacheEntry(`${ADMIN_TEST_ANALYTICS_IDB_PREFIX}${trimmedTestId}`, null).catch(() => {});
        }
        return;
    }

    const knownIds = new Set<string>(memoryTestAnalyticsCache.keys());
    memoryTestAnalyticsCache.clear();

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith(ADMIN_TEST_ANALYTICS_STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                    const idPart = key.slice(ADMIN_TEST_ANALYTICS_STORAGE_PREFIX.length);
                    if (idPart) knownIds.add(idPart);
                }
            }
            for (const key of keysToRemove) {
                window.localStorage.removeItem(key);
            }
        }
    } catch {
        // Ignore storage errors
    }

    if (typeof db?.setCacheEntry === 'function') {
        for (const id of knownIds) {
            db.setCacheEntry(`${ADMIN_TEST_ANALYTICS_IDB_PREFIX}${id}`, null).catch(() => {});
        }
    }
};

/**
 * Fetches paginated mock test attempts and chunk-hydrated bank questions, computes a strictly PII-free
 * `MockTestAnalytics` DTO, and writes it across the 3-tier SWR cache (Memory + localStorage + IndexedDB).
 */
export const fetchMockTestAnalytics = async (
    testId: string,
    options?: { testSnapshot?: any }
): Promise<MockTestAnalytics> => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) {
        throw new Error('Test ID is required to load analytics.');
    }

    const snap = options?.testSnapshot;
    const hasUsableSnapshot =
        snap &&
        typeof snap === 'object' &&
        String(snap.id ?? '').trim() === trimmedTestId &&
        typeof snap.name === 'string' &&
        Array.isArray(snap.question_ids);

    const test = hasUsableSnapshot ? snap : await fetchTestById(trimmedTestId);
    if (!test) {
        throw new Error('Mock test not found.');
    }

    const allAttempts: any[] = [];
    let offset = 0;
    let isSampled = false;

    while (allAttempts.length < MAX_ANALYTICS_ATTEMPTS) {
        const remaining = MAX_ANALYTICS_ATTEMPTS - allAttempts.length;
        const pageLimit = Math.min(ATTEMPTS_PAGE_SIZE, remaining);
        const { data, error } = await supabase
            .from(DB_TABLES.MOCK.ATTEMPTS)
            .select('id, user_id, status, score, accuracy, time_taken_seconds, answers, end_time, created_at')
            .eq('test_id', trimmedTestId)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageLimit - 1);

        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];
        allAttempts.push(...rows);

        if (rows.length < pageLimit) {
            break;
        }

        offset += rows.length;
        if (allAttempts.length >= MAX_ANALYTICS_ATTEMPTS) {
            isSampled = true;
            break;
        }
    }

    const rawQIds = Array.isArray(test?.question_ids) ? test.question_ids : [];
    const uniqueQuestionIds = Array.from(
        new Set(
            rawQIds
                .map((id: unknown) => (typeof id === 'string' ? id.trim() : String(id ?? '').trim()))
                .filter((id: string) => Boolean(id) && id !== '__cbt_meta')
        )
    );

    const hydratedQuestions: any[] = [];
    for (let i = 0; i < uniqueQuestionIds.length; i += QUESTION_ID_CHUNK_SIZE) {
        const chunk = uniqueQuestionIds.slice(i, i + QUESTION_ID_CHUNK_SIZE);
        const { data: qRows, error: qError } = await supabase
            .from(DB_TABLES.BANK.QUESTIONS)
            .select('id, v1_id, question, subject, difficulty, correct')
            .is('deleted_at', null)
            .in('id', chunk);

        if (qError) throw qError;
        if (Array.isArray(qRows)) {
            hydratedQuestions.push(...qRows);
        }
    }

    const analytics = await computeMockTestAnalytics({
        test,
        attempts: allAttempts,
        questions: hydratedQuestions,
        isSampled,
        sampledLimit: MAX_ANALYTICS_ATTEMPTS,
    });

    memoryTestAnalyticsCache.set(trimmedTestId, analytics);
    safeWriteAnalyticsStorage(`${ADMIN_TEST_ANALYTICS_STORAGE_PREFIX}${trimmedTestId}`, analytics);
    if (typeof db?.setCacheEntry === 'function') {
        db.setCacheEntry(`${ADMIN_TEST_ANALYTICS_IDB_PREFIX}${trimmedTestId}`, analytics).catch(() => {});
    }

    return analytics;
};
