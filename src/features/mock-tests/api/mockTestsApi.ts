import { supabase } from '@/lib/supabase';
import { DB_TABLES, DB_RPCS } from '@/config/dbTables';
import { db } from '@/lib/db';
import {
    CANONICAL_EXAMS,
    CanonicalExam,
    getCanonicalExamById,
    matchesCanonicalExam,
    resolveCanonicalExamNames,
} from '@/features/dashboard/constants/examRegistry';

export interface TestLeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    score: number;
    accuracy: number;
    time_taken_seconds: number | null;
    completed_at: string | null;
    is_current_user: boolean;
}

/**
 * Checks whether a mock test is visible within its configured release/expiry schedule window.
 * Unscheduled tests (`release_date` / `expiry_date` omitted or null) are treated as active.
 */
export const isTestWithinScheduleWindow = (
    test: { release_date?: string | null; expiry_date?: string | null } | null | undefined,
    nowMs: number = Date.now()
): boolean => {
    if (!test) return false;

    if (test.release_date !== undefined && test.release_date !== null && String(test.release_date).trim() !== '') {
        const relMs = Date.parse(String(test.release_date));
        if (Number.isNaN(relMs) || relMs > nowMs) {
            return false;
        }
    }

    if (test.expiry_date !== undefined && test.expiry_date !== null && String(test.expiry_date).trim() !== '') {
        const expMs = Date.parse(String(test.expiry_date));
        if (Number.isNaN(expMs) || expMs <= nowMs) {
            return false;
        }
    }

    return true;
};

/**
 * Projects a raw leaderboard RPC row onto a strict non-sensitive DTO, stripping extraneous payloads such as `answers`.
 */
export const sanitizeLeaderboardEntry = (row: any, index: number): TestLeaderboardEntry => ({
    rank: Number(row?.rank ?? index + 1),
    user_id: String(row?.user_id ?? ''),
    display_name: String(row?.display_name ?? '').trim() || 'MindFlow Aspirant',
    avatar_url: row?.avatar_url ? String(row.avatar_url) : null,
    score: Number(row?.score ?? 0),
    accuracy: Number(row?.accuracy ?? 0),
    time_taken_seconds:
        row?.time_taken_seconds !== null && row?.time_taken_seconds !== undefined
            ? Number(row.time_taken_seconds)
            : null,
    completed_at: row?.completed_at ? String(row.completed_at) : null,
    is_current_user: Boolean(row?.is_current_user),
});

/**
 * Fetches anonymized, privacy-safe rankings for a published mock test via `get_test_leaderboard`.
 */
export const fetchTestLeaderboard = async (
    testId: string,
    limit: number = 50
): Promise<TestLeaderboardEntry[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return [];

    const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 50, 100));
    const { data, error } = await supabase.rpc(DB_RPCS.MOCK_LEADERBOARD, {
        p_test_id: trimmedTestId,
        p_limit: safeLimit,
    });

    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row, idx) => sanitizeLeaderboardEntry(row, idx));
};

// EXPLICIT ENFORCEMENT OF VISIBILITY

export const fetchActiveExamCategories = async () => {
    // Only return active categories
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    cacheActiveExamCategoriesSnapshot(data || []);
    return data;
};

export const fetchPublishedTestSeries = async (categoryId: string) => {
    // Check that parent category is active AND series is published
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(`*, ${DB_TABLES.MOCK.CATEGORIES}!inner(is_active)`)
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchPublishedTests = async (seriesId: string, nowMs: number = Date.now()) => {
    // Check that parent category is active, parent series is published, test is published, and test is within schedule window
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(`*, ${DB_TABLES.MOCK.SERIES}!inner(is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(is_active))`)
        .eq('series_id', seriesId)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.SERIES}.is_published`, true)
        .eq(`${DB_TABLES.MOCK.SERIES}.${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).filter((test) => isTestWithinScheduleWindow(test, nowMs));
};


// FETCH SINGLE ENTITIES FOR DETAIL PAGES
export const fetchCategoryDetails = async (categoryId: string) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .select('*')
        .eq('id', categoryId)
        .eq('is_active', true)
        .single();
    if (error) throw error;
    return data;
};

export const fetchSeriesDetails = async (seriesId: string) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(`*, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active)`)
        .eq('id', seriesId)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .single();
    if (error) throw error;
    return data;
};

export const fetchTestDetails = async (testId: string, nowMs: number = Date.now()) => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(`*, ${DB_TABLES.MOCK.SERIES}!inner(id, name, is_premium, is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active))`)
        .eq('id', testId)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.SERIES}.is_published`, true)
        .eq(`${DB_TABLES.MOCK.SERIES}.${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .single();
    if (error) throw error;
    if (!isTestWithinScheduleWindow(data, nowMs)) {
        throw new Error('This mock test is not currently available outside its scheduled window.');
    }
    return data;
};

// CONTEXTUAL SEARCH APIs
export const searchCategoriesApi = async (query: string) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return data;
};

export const searchSeriesApi = async (query: string) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(`*, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active)`)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return data;
};

export const searchTestsApi = async (query: string, nowMs: number = Date.now()) => {
    if (!query) return [];
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(`*, ${DB_TABLES.MOCK.SERIES}!inner(id, name, is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active))`)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.SERIES}.is_published`, true)
        .eq(`${DB_TABLES.MOCK.SERIES}.${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    return (data || []).filter((test) => isTestWithinScheduleWindow(test, nowMs));
};

// FETCH RECOMMENDATIONS / RECENT
export const fetchRecommendedSeries = async () => {
    // For now, fetch top 4 recently published premium or popular series.
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(`*, ${DB_TABLES.MOCK.CATEGORIES}!inner(is_active)`)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .order('created_at', { ascending: false })
        .limit(4);
    if (error) throw error;
    writeHomeCacheSnapshot({ recommendedSeries: data || [] });
    return data;
};

// ============================================================================
// CANONICAL EXAM PREPARED MOCK TESTS & 0ms OFFLINE-FIRST CACHE (v1.0.371)
// ============================================================================

export interface PreparedMockSeriesItem {
    id: string;
    category_id: string;
    name: string;
    slug?: string;
    description?: string | null;
    thumbnail_url?: string | null;
    is_premium: boolean;
    is_published: boolean;
    category_name: string;
    test_count: number;
}

export interface PreparedMockTestItem {
    id: string;
    series_id: string;
    name: string;
    description?: string | null;
    display_order: number;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    negative_marks: number;
    question_ids: string[];
    question_count: number;
    is_published: boolean;
    release_date?: string | null;
    expiry_date?: string | null;
    created_at?: string | null;
    series_name: string;
    series_is_premium: boolean;
    category_id: string | null;
    category_name: string;
    is_full_length: boolean;
    is_free: boolean;
    is_attempted: boolean;
}

export interface PreparedMockTestsResult {
    exam: CanonicalExam;
    categories: any[];
    series: PreparedMockSeriesItem[];
    tests: PreparedMockTestItem[];
    attemptedTestIds: string[];
    fetchedAt: number;
    source: 'cache' | 'network';
}

interface MockCatalogCachePayload {
    categories: any[];
    series: any[];
    tests: any[];
    fetchedAt: number;
}

interface MockHomeCachePayload {
    categories?: any[];
    recommendedSeries?: any[];
    fetchedAt: number;
}

const MOCK_CATALOG_STORAGE_KEY = 'mindflow_prepared_mock_catalog_v1';
const MOCK_CATALOG_IDB_KEY = 'prepared_mock_catalog_v1';
const MOCK_HOME_STORAGE_KEY = 'mindflow_mock_home_cache_v1';
const MOCK_HOME_IDB_KEY = 'mock_home_cache_v1';
const MOCK_ATTEMPTS_STORAGE_PREFIX = 'mindflow_mock_attempts_v1_';
const MOCK_ATTEMPTS_IDB_PREFIX = 'mock_attempts_v1_';

let memoryCatalogCache: MockCatalogCachePayload | null = null;
let memoryHomeCache: MockHomeCachePayload | null = null;
const memoryAttemptsCache = new Map<string, { ids: string[]; fetchedAt: number }>();

const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const safeReadLocalStorage = <T>(key: string): T | null => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

const safeWriteLocalStorage = (key: string, value: unknown): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage quota or private-browsing errors
    }
};

const safeRemoveLocalStorage = (key: string): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.removeItem(key);
    } catch {
        // Ignore storage removal errors
    }
};

const writeHomeCacheSnapshot = (partial: { categories?: any[]; recommendedSeries?: any[] }): void => {
    const next: MockHomeCachePayload = {
        categories: partial.categories ?? memoryHomeCache?.categories,
        recommendedSeries: partial.recommendedSeries ?? memoryHomeCache?.recommendedSeries,
        fetchedAt: Date.now(),
    };
    memoryHomeCache = next;
    safeWriteLocalStorage(MOCK_HOME_STORAGE_KEY, next);
    db.setCacheEntry(MOCK_HOME_IDB_KEY, next).catch(() => {});
};

export const getCachedMockHomeSnapshot = (): { categories: any[] | null; recommendedSeries: any[] | null } => {
    if (memoryHomeCache) {
        return {
            categories: Array.isArray(memoryHomeCache.categories) ? memoryHomeCache.categories : null,
            recommendedSeries: Array.isArray(memoryHomeCache.recommendedSeries) ? memoryHomeCache.recommendedSeries : null,
        };
    }
    const stored = safeReadLocalStorage<MockHomeCachePayload>(MOCK_HOME_STORAGE_KEY);
    if (stored && typeof stored === 'object') {
        memoryHomeCache = stored;
        return {
            categories: Array.isArray(stored.categories) ? stored.categories : null,
            recommendedSeries: Array.isArray(stored.recommendedSeries) ? stored.recommendedSeries : null,
        };
    }
    return { categories: null, recommendedSeries: null };
};

export const hydrateMockHomeFromIndexedDB = async (): Promise<{ categories: any[] | null; recommendedSeries: any[] | null }> => {
    const syncSnapshot = getCachedMockHomeSnapshot();
    if (syncSnapshot.categories || syncSnapshot.recommendedSeries) {
        return syncSnapshot;
    }
    try {
        const entry = await db.getCacheEntry<MockHomeCachePayload>(MOCK_HOME_IDB_KEY);
        if (entry?.data && typeof entry.data === 'object') {
            memoryHomeCache = entry.data;
            safeWriteLocalStorage(MOCK_HOME_STORAGE_KEY, entry.data);
            return {
                categories: Array.isArray(entry.data.categories) ? entry.data.categories : null,
                recommendedSeries: Array.isArray(entry.data.recommendedSeries) ? entry.data.recommendedSeries : null,
            };
        }
    } catch {
        // Ignore IndexedDB unavailability
    }
    return { categories: null, recommendedSeries: null };
};

export const cacheActiveExamCategoriesSnapshot = (categories: any[]): void => {
    writeHomeCacheSnapshot({ categories });
};

/**
 * Resolves a canonical exam from an ID, URL slug (with `-` or `_`), display name, or short code.
 */
export const resolveCanonicalExamSlug = (rawExamSlug?: string | null): CanonicalExam | undefined => {
    const trimmed = String(rawExamSlug ?? '').trim().toLowerCase();
    if (!trimmed) return undefined;

    const direct = getCanonicalExamById(trimmed) || getCanonicalExamById(trimmed.replace(/-/g, '_'));
    if (direct) return direct;

    return CANONICAL_EXAMS.find((exam) => {
        const displayLower = exam.displayName.toLowerCase();
        const shortLower = exam.shortCode.toLowerCase();
        const slugHyphen = exam.id.toLowerCase().replace(/_/g, '-');
        return (
            trimmed === displayLower ||
            trimmed === shortLower ||
            trimmed === slugHyphen ||
            exam.dbExamNames.some((alias) => alias.toLowerCase() === trimmed)
        );
    });
};

/**
 * Checks whether a category/series/test title or slug belongs to a canonical exam using
 * `examRegistry.ts` (`DEC-0001`) plus word-boundary token matching (e.g. `"70th BPSC Prelims"`).
 */
export const doesTextMatchCanonicalExam = (
    exam: CanonicalExam,
    rawText: string | null | undefined
): boolean => {
    if (!rawText) return false;
    const trimmed = String(rawText).trim();
    if (!trimmed) return false;

    if (matchesCanonicalExam(exam, trimmed)) {
        return true;
    }

    const canonicalAliases = resolveCanonicalExamNames(exam);
    const lower = trimmed.toLowerCase();
    if (canonicalAliases.some((alias) => alias.toLowerCase() === lower)) {
        return true;
    }

    const tokenCandidates = [
        exam.shortCode,
        exam.displayName,
        exam.id.replace(/_/g, ' '),
        exam.id.replace(/_/g, '-'),
    ].filter((token) => Boolean(token && token.trim().length >= 2));

    for (const token of tokenCandidates) {
        const pattern = new RegExp(`\\b${escapeRegex(token.trim())}\\b`, 'i');
        if (pattern.test(trimmed)) {
            return true;
        }
    }

    if (exam.id === 'bpsc' && /\bbihar\s+psc\b/i.test(trimmed)) {
        return true;
    }

    return false;
};

/**
 * Classifies whether a prepared mock test is a full-length mock test based on its
 * duration, question count, or standard full-length naming conventions.
 */
export const isFullLengthMockTest = (test: {
    name?: string | null;
    duration_minutes?: number | null;
    question_ids?: unknown[] | null;
}): boolean => {
    const duration = Number(test?.duration_minutes ?? 0);
    const questionCount = Array.isArray(test?.question_ids) ? test.question_ids.length : 0;
    const name = String(test?.name ?? '');

    if (duration >= 90 || questionCount >= 100) {
        return true;
    }

    return /\b(full[\s-]*length|flt|prelims?\s*(mock|full)|grand\s*test)\b/i.test(name);
};

const readAttemptsFromSyncCache = (userId?: string | null): string[] => {
    if (!userId) return [];
    const mem = memoryAttemptsCache.get(userId);
    if (mem) return mem.ids;

    const stored = safeReadLocalStorage<{ ids: string[]; fetchedAt: number }>(
        `${MOCK_ATTEMPTS_STORAGE_PREFIX}${userId}`
    );
    if (stored && Array.isArray(stored.ids)) {
        memoryAttemptsCache.set(userId, stored);
        return stored.ids;
    }
    return [];
};

const writeAttemptsToCache = (userId: string, ids: string[]): void => {
    const payload = { ids, fetchedAt: Date.now() };
    memoryAttemptsCache.set(userId, payload);
    safeWriteLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${userId}`, payload);
    db.setCacheEntry(`${MOCK_ATTEMPTS_IDB_PREFIX}${userId}`, payload).catch(() => {});
};

const readAttemptsFromIndexedDB = async (userId?: string | null): Promise<string[]> => {
    if (!userId) return [];
    const syncIds = readAttemptsFromSyncCache(userId);
    if (syncIds.length > 0) return syncIds;
    try {
        const entry = await db.getCacheEntry<{ ids: string[]; fetchedAt: number }>(
            `${MOCK_ATTEMPTS_IDB_PREFIX}${userId}`
        );
        if (entry?.data && Array.isArray(entry.data.ids)) {
            memoryAttemptsCache.set(userId, entry.data);
            safeWriteLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${userId}`, entry.data);
            return entry.data.ids;
        }
    } catch {
        // Ignore IndexedDB failures
    }
    return [];
};

const readCatalogFromSyncCache = (): MockCatalogCachePayload | null => {
    if (memoryCatalogCache) return memoryCatalogCache;

    const stored = safeReadLocalStorage<MockCatalogCachePayload>(MOCK_CATALOG_STORAGE_KEY);
    if (
        stored &&
        Array.isArray(stored.categories) &&
        Array.isArray(stored.series) &&
        Array.isArray(stored.tests)
    ) {
        memoryCatalogCache = stored;
        return stored;
    }
    return null;
};

const writeCatalogToCache = (payload: MockCatalogCachePayload): void => {
    memoryCatalogCache = payload;
    safeWriteLocalStorage(MOCK_CATALOG_STORAGE_KEY, payload);
    db.setCacheEntry(MOCK_CATALOG_IDB_KEY, payload).catch(() => {});
};

/**
 * Pure projection helper shared by 0ms cached snapshots and live Supabase fetches so
 * canonical exam matching and `DEC-0017` schedule-window guards never diverge.
 */
export const materializePreparedMockTests = (
    exam: CanonicalExam,
    rawCategories: any[],
    rawSeries: any[],
    rawTests: any[],
    attemptedTestIds: string[],
    nowMs: number = Date.now(),
    source: 'cache' | 'network' = 'network',
    fetchedAt: number = nowMs
): PreparedMockTestsResult => {
    const activeCategories = (rawCategories || []).filter((c) => c && c.is_active !== false);
    const activeCategoryMap = new Map<string, any>();
    for (const cat of activeCategories) {
        activeCategoryMap.set(cat.id, cat);
    }

    const activePublishedSeries = (rawSeries || []).filter((s) => {
        if (!s || s.is_published === false) return false;
        const embeddedCat = s[DB_TABLES.MOCK.CATEGORIES] ?? s.mock_categories ?? s.exam_categories;
        if (embeddedCat && embeddedCat.is_active === false) return false;
        if (activeCategoryMap.size > 0 && s.category_id && !activeCategoryMap.has(s.category_id) && !embeddedCat) {
            return false;
        }
        return true;
    });

    const matchedCategoryIds = new Set(
        activeCategories
            .filter((c) => doesTextMatchCanonicalExam(exam, c.name))
            .map((c) => c.id)
    );

    const matchedSeriesMap = new Map<string, any>();
    for (const s of activePublishedSeries) {
        const embeddedCat = s[DB_TABLES.MOCK.CATEGORIES] ?? s.mock_categories ?? s.exam_categories;
        const catObj = embeddedCat ?? activeCategoryMap.get(s.category_id);
        const categoryName = catObj?.name ?? '';
        if (
            matchedCategoryIds.has(s.category_id) ||
            doesTextMatchCanonicalExam(exam, s.name) ||
            doesTextMatchCanonicalExam(exam, s.slug) ||
            doesTextMatchCanonicalExam(exam, categoryName)
        ) {
            matchedSeriesMap.set(s.id, { ...s, _categoryName: categoryName });
        }
    }

    const attemptedSet = new Set(attemptedTestIds);
    const seriesById = new Map<string, any>();
    for (const s of activePublishedSeries) {
        const embeddedCat = s[DB_TABLES.MOCK.CATEGORIES] ?? s.mock_categories ?? s.exam_categories;
        const catObj = embeddedCat ?? activeCategoryMap.get(s.category_id);
        seriesById.set(s.id, { ...s, _categoryName: catObj?.name ?? '' });
    }

    const matchedTests: PreparedMockTestItem[] = [];
    const testCountBySeries = new Map<string, number>();

    for (const t of rawTests || []) {
        if (!t || t.is_published === false) continue;
        if (!isTestWithinScheduleWindow(t, nowMs)) continue;

        const embeddedSeries = t[DB_TABLES.MOCK.SERIES] ?? t.mock_series ?? t.test_series;
        const seriesObj = embeddedSeries ?? seriesById.get(t.series_id);
        if (!seriesObj || seriesObj.is_published === false) continue;

        const embeddedCat =
            seriesObj[DB_TABLES.MOCK.CATEGORIES] ??
            seriesObj.mock_categories ??
            seriesObj.exam_categories ??
            activeCategoryMap.get(seriesObj.category_id);

        if (embeddedCat && embeddedCat.is_active === false) continue;

        const categoryName = embeddedCat?.name ?? seriesObj._categoryName ?? '';
        const seriesMatched = matchedSeriesMap.has(t.series_id);
        const testMatched =
            seriesMatched ||
            doesTextMatchCanonicalExam(exam, t.name) ||
            doesTextMatchCanonicalExam(exam, seriesObj.name) ||
            doesTextMatchCanonicalExam(exam, categoryName);

        if (!testMatched) continue;

        if (!matchedSeriesMap.has(t.series_id) && seriesObj?.id) {
            matchedSeriesMap.set(seriesObj.id, { ...seriesObj, _categoryName: categoryName });
        }

        const questionIds = Array.isArray(t.question_ids) ? t.question_ids : [];
        const isPremiumSeries = Boolean(seriesObj.is_premium);
        const isAttempted = attemptedSet.has(t.id);

        const projected: PreparedMockTestItem = {
            id: t.id,
            series_id: t.series_id,
            name: String(t.name ?? 'Untitled Mock Test'),
            description: t.description ?? null,
            display_order: Number(t.display_order ?? 0),
            duration_minutes: Number(t.duration_minutes ?? 0),
            total_marks: Number(t.total_marks ?? 0),
            passing_marks: Number(t.passing_marks ?? 0),
            negative_marks: Number(t.negative_marks ?? 0),
            question_ids: questionIds,
            question_count: questionIds.length,
            is_published: Boolean(t.is_published),
            release_date: t.release_date ?? null,
            expiry_date: t.expiry_date ?? null,
            created_at: t.created_at ?? null,
            series_name: String(seriesObj.name ?? 'Prepared Series'),
            series_is_premium: isPremiumSeries,
            category_id: embeddedCat?.id ?? seriesObj.category_id ?? null,
            category_name: String(categoryName || exam.displayName),
            is_full_length: isFullLengthMockTest(t),
            is_free: !isPremiumSeries,
            is_attempted: isAttempted,
        };

        matchedTests.push(projected);
        testCountBySeries.set(t.series_id, (testCountBySeries.get(t.series_id) || 0) + 1);
    }

    matchedTests.sort((a, b) => {
        const orderDiff = a.display_order - b.display_order;
        if (orderDiff !== 0) return orderDiff;
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });

    const matchedSeries: PreparedMockSeriesItem[] = Array.from(matchedSeriesMap.values()).map((s) => ({
        id: s.id,
        category_id: s.category_id,
        name: String(s.name ?? 'Prepared Series'),
        slug: s.slug,
        description: s.description ?? null,
        thumbnail_url: s.thumbnail_url ?? null,
        is_premium: Boolean(s.is_premium),
        is_published: Boolean(s.is_published),
        category_name: String(s._categoryName || exam.displayName),
        test_count: testCountBySeries.get(s.id) || 0,
    }));

    const matchedCategories = activeCategories.filter((c) => matchedCategoryIds.has(c.id));

    return {
        exam,
        categories: matchedCategories,
        series: matchedSeries,
        tests: matchedTests,
        attemptedTestIds,
        fetchedAt,
        source,
    };
};

/**
 * Synchronous 0ms cache read (Memory -> `localStorage`) for instant first paint,
 * re-evaluating `isTestWithinScheduleWindow` against current time on every read.
 */
export const getCachedPreparedMockTestsSnapshot = (
    examIdOrSlug: string,
    options?: { userId?: string | null; nowMs?: number }
): PreparedMockTestsResult | null => {
    const exam = resolveCanonicalExamSlug(examIdOrSlug);
    if (!exam) return null;

    const catalog = readCatalogFromSyncCache();
    if (!catalog) return null;

    const nowMs = options?.nowMs ?? Date.now();
    const attemptedIds = readAttemptsFromSyncCache(options?.userId);

    return materializePreparedMockTests(
        exam,
        catalog.categories,
        catalog.series,
        catalog.tests,
        attemptedIds,
        nowMs,
        'cache',
        catalog.fetchedAt
    );
};

/**
 * Asynchronous IndexedDB fallback hydration (`MindFlowDB.sync_metadata`) when synchronous
 * memory/`localStorage` caches are cold (e.g. fresh Android WebView process).
 */
export const readPreparedMockTestsIndexedDBCache = async (
    examIdOrSlug: string,
    options?: { userId?: string | null; nowMs?: number }
): Promise<PreparedMockTestsResult | null> => {
    const exam = resolveCanonicalExamSlug(examIdOrSlug);
    if (!exam) return null;

    const nowMs = options?.nowMs ?? Date.now();
    const syncSnapshot = getCachedPreparedMockTestsSnapshot(examIdOrSlug, options);
    if (syncSnapshot) return syncSnapshot;

    try {
        const [catalogEntry, attemptedIds] = await Promise.all([
            db.getCacheEntry<MockCatalogCachePayload>(MOCK_CATALOG_IDB_KEY),
            readAttemptsFromIndexedDB(options?.userId),
        ]);

        const catalog = catalogEntry?.data;
        if (
            !catalog ||
            !Array.isArray(catalog.categories) ||
            !Array.isArray(catalog.series) ||
            !Array.isArray(catalog.tests)
        ) {
            return null;
        }

        memoryCatalogCache = catalog;
        safeWriteLocalStorage(MOCK_CATALOG_STORAGE_KEY, catalog);

        return materializePreparedMockTests(
            exam,
            catalog.categories,
            catalog.series,
            catalog.tests,
            attemptedIds,
            nowMs,
            'cache',
            catalog.fetchedAt
        );
    } catch {
        return null;
    }
};

/**
 * Clears all in-memory, `localStorage`, and IndexedDB prepared mock-test caches.
 */
export const clearPreparedMockTestsCache = (userId?: string | null): void => {
    memoryCatalogCache = null;
    memoryHomeCache = null;
    if (userId) {
        memoryAttemptsCache.delete(userId);
        safeRemoveLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${userId}`);
    } else {
        memoryAttemptsCache.clear();
    }
    safeRemoveLocalStorage(MOCK_CATALOG_STORAGE_KEY);
    safeRemoveLocalStorage(MOCK_HOME_STORAGE_KEY);
};

/**
 * Fetches active categories, published series, schedule-valid published mock tests, and user
 * attempt statuses from `DB_TABLES.MOCK.*`, projecting matches for the given canonical exam
 * (`DEC-0001`, `DEC-0017`, `DEC-0018`) and updating 0ms SWR/IndexedDB caches (`DEC-0004`).
 */
export const fetchPreparedMockTestsByExam = async (
    examIdOrSlug: string,
    options?: { userId?: string | null; nowMs?: number }
): Promise<PreparedMockTestsResult> => {
    const exam = resolveCanonicalExamSlug(examIdOrSlug);
    if (!exam) {
        throw new Error(`Unknown exam identifier: ${examIdOrSlug}`);
    }

    const nowMs = options?.nowMs ?? Date.now();
    const userId = options?.userId ? String(options.userId).trim() : null;

    const categoriesPromise = supabase
        .from(DB_TABLES.MOCK.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    const seriesPromise = supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select(`*, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, description, image_url, is_active)`)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .order('created_at', { ascending: false });

    const testsPromise = supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(
            `*, ${DB_TABLES.MOCK.SERIES}!inner(id, category_id, name, slug, description, thumbnail_url, is_premium, is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active))`
        )
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.SERIES}.is_published`, true)
        .eq(`${DB_TABLES.MOCK.SERIES}.${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    const attemptsPromise = userId
        ? supabase
              .from(DB_TABLES.MOCK.ATTEMPTS)
              .select('test_id, status')
              .eq('user_id', userId)
        : Promise.resolve({ data: [] as any[], error: null });

    const [categoriesRes, seriesRes, testsRes] = await Promise.all([
        categoriesPromise,
        seriesPromise,
        testsPromise,
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (seriesRes.error) throw seriesRes.error;
    if (testsRes.error) throw testsRes.error;

    let attemptedIds: string[] = [];
    if (userId) {
        try {
            const attemptsRes = await attemptsPromise;
            if (!attemptsRes.error && Array.isArray(attemptsRes.data)) {
                const uniqueIds = new Set<string>();
                for (const row of attemptsRes.data) {
                    if (row?.test_id) {
                        uniqueIds.add(String(row.test_id));
                    }
                }
                attemptedIds = Array.from(uniqueIds);
                writeAttemptsToCache(userId, attemptedIds);
            } else {
                attemptedIds = readAttemptsFromSyncCache(userId);
            }
        } catch {
            attemptedIds = readAttemptsFromSyncCache(userId);
        }
    }

    const categoriesData = categoriesRes.data || [];
    const seriesData = seriesRes.data || [];
    const testsData = (testsRes.data || []).filter((t) => isTestWithinScheduleWindow(t, nowMs));

    const fetchedAt = Date.now();
    writeCatalogToCache({
        categories: categoriesData,
        series: seriesData,
        tests: testsData,
        fetchedAt,
    });
    writeHomeCacheSnapshot({ categories: categoriesData });

    return materializePreparedMockTests(
        exam,
        categoriesData,
        seriesData,
        testsData,
        attemptedIds,
        nowMs,
        'network',
        fetchedAt
    );
};
