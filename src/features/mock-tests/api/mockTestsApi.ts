import { supabase } from '@/lib/supabase';
import { DB_TABLES, DB_RPCS } from '@/config/dbTables';
import { db } from '@/lib/db';
import type { Question } from '@/types/models';
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
    const trimmedId = String(testId ?? '').trim();
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.TESTS)
        .select(`*, ${DB_TABLES.MOCK.SERIES}!inner(id, name, is_premium, is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active))`)
        .eq('id', trimmedId)
        .eq('is_published', true)
        .eq(`${DB_TABLES.MOCK.SERIES}.is_published`, true)
        .eq(`${DB_TABLES.MOCK.SERIES}.${DB_TABLES.MOCK.CATEGORIES}.is_active`, true)
        .maybeSingle();
    if (error) throw error;
    if (!data || !isTestWithinScheduleWindow(data, nowMs) || !isCachedTestDetailVisible(data, nowMs)) {
        memoryTestDetailCache.delete(trimmedId);
        safeRemoveLocalStorage(`${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedId}`);
        throw new Error('This mock test is not currently available outside its scheduled window.');
    }
    const payload = { test: data, fetchedAt: Date.now() };
    memoryTestDetailCache.set(trimmedId, payload);
    safeWriteLocalStorage(`${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedId}`, payload);
    db.setCacheEntry(`${MOCK_TEST_DETAIL_IDB_PREFIX}${trimmedId}`, payload).catch(() => {});
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
const MOCK_TEST_DETAIL_STORAGE_PREFIX = 'mindflow_mock_test_detail_v1_';
const MOCK_TEST_DETAIL_IDB_PREFIX = 'mock_test_detail_v1_';
const MOCK_TEST_ATTEMPTS_STORAGE_PREFIX = 'mindflow_mock_test_attempts_v1_';
const MOCK_TEST_ATTEMPTS_IDB_PREFIX = 'mock_test_attempts_v1_';
const MOCK_SAVED_TESTS_STORAGE_PREFIX = 'mindflow_saved_mock_tests_v1_';
const MOCK_SAVED_TESTS_IDB_PREFIX = 'saved_mock_tests_v1_';
const MOCK_TEST_QUESTIONS_STORAGE_PREFIX = 'mindflow_mock_test_questions_v1_';
const MOCK_TEST_QUESTIONS_IDB_PREFIX = 'mock_test_questions_v1_';
const MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX = 'mindflow_mock_active_attempt_v1_';
const MOCK_ACTIVE_ATTEMPT_IDB_PREFIX = 'mock_active_attempt_v1_';
const UUID_CHUNK_SIZE = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let memoryCatalogCache: MockCatalogCachePayload | null = null;
let memoryHomeCache: MockHomeCachePayload | null = null;
const memoryAttemptsCache = new Map<string, { ids: string[]; fetchedAt: number }>();
const memoryTestDetailCache = new Map<string, { test: any; fetchedAt: number }>();
const memoryTestAttemptsCache = new Map<string, { attempts: UserTestAttemptItem[]; fetchedAt: number }>();
const memorySavedTestsCache = new Map<string, string[]>();
const memoryTestQuestionsCache = new Map<
    string,
    { questions: Question[]; questionIdsKey: string; fetchedAt: number }
>();
const memoryActiveAttemptCache = new Map<string, PreparedMockActiveAttemptState>();

export interface UserTestAttemptItem {
    id: string;
    test_id: string;
    start_time: string | null;
    end_time: string | null;
    time_taken_seconds: number | null;
    score: number;
    accuracy: number;
    status: 'in_progress' | 'completed' | 'abandoned';
    created_at: string | null;
}

/**
 * Normalizes a `mock_test_attempts` row and strips any sensitive `answers` JSONB payload.
 */
export const sanitizeUserTestAttempt = (row: any): UserTestAttemptItem => {
    const rawStatus = String(row?.status ?? '').trim();
    const status: UserTestAttemptItem['status'] =
        rawStatus === 'completed' || rawStatus === 'abandoned' || rawStatus === 'in_progress'
            ? rawStatus
            : 'in_progress';
    const rawScore = Number(row?.score ?? 0);
    const rawAccuracy = Number(row?.accuracy ?? 0);
    const rawDuration = row?.time_taken_seconds != null ? Number(row.time_taken_seconds) : null;

    return {
        id: String(row?.id ?? ''),
        test_id: String(row?.test_id ?? ''),
        start_time: row?.start_time ? String(row.start_time) : null,
        end_time: row?.end_time ? String(row.end_time) : null,
        time_taken_seconds: rawDuration != null && Number.isFinite(rawDuration) ? rawDuration : null,
        score: Number.isFinite(rawScore) ? rawScore : 0,
        accuracy: Number.isFinite(rawAccuracy) ? rawAccuracy : 0,
        status,
        created_at: row?.created_at ? String(row.created_at) : null,
    };
};

const isCachedTestDetailVisible = (test: any, nowMs: number = Date.now()): boolean => {
    if (!test || test.is_published === false || !isTestWithinScheduleWindow(test, nowMs)) {
        return false;
    }
    const series = test[DB_TABLES.MOCK.SERIES] ?? test.mock_series ?? test.test_series;
    if (series && series.is_published === false) {
        return false;
    }
    const category =
        series?.[DB_TABLES.MOCK.CATEGORIES] ??
        series?.mock_categories ??
        series?.exam_categories;
    if (category && category.is_active === false) {
        return false;
    }
    return true;
};

/**
 * Synchronous 0ms cache lookup for a single mock test detail page (Memory -> `localStorage` -> prepared catalog snapshot),
 * always validating `DEC-0017` schedule window and active/published parent status.
 */
export const getCachedTestDetailsSnapshot = (
    testId: string,
    nowMs: number = Date.now()
): any | null => {
    const trimmedId = String(testId ?? '').trim();
    if (!trimmedId) return null;

    const mem = memoryTestDetailCache.get(trimmedId);
    if (mem?.test && isCachedTestDetailVisible(mem.test, nowMs)) {
        return mem.test;
    }

    const stored = safeReadLocalStorage<{ test: any; fetchedAt: number }>(
        `${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedId}`
    );
    if (stored?.test && isCachedTestDetailVisible(stored.test, nowMs)) {
        memoryTestDetailCache.set(trimmedId, stored);
        return stored.test;
    }

    const catalogTest = readCatalogFromSyncCache()?.tests.find((t) => t?.id === trimmedId);
    if (catalogTest && isCachedTestDetailVisible(catalogTest, nowMs)) {
        return catalogTest;
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for single mock test details (`MindFlowDB.sync_metadata`).
 */
export const readTestDetailsIndexedDBCache = async (
    testId: string,
    nowMs: number = Date.now()
): Promise<any | null> => {
    const trimmedId = String(testId ?? '').trim();
    if (!trimmedId) return null;

    const syncSnapshot = getCachedTestDetailsSnapshot(trimmedId, nowMs);
    if (syncSnapshot) return syncSnapshot;

    try {
        const entry = await db.getCacheEntry<{ test: any; fetchedAt: number }>(
            `${MOCK_TEST_DETAIL_IDB_PREFIX}${trimmedId}`
        );
        if (entry?.data?.test && isCachedTestDetailVisible(entry.data.test, nowMs)) {
            memoryTestDetailCache.set(trimmedId, entry.data);
            safeWriteLocalStorage(`${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedId}`, entry.data);
            return entry.data.test;
        }

        const catalogEntry = await db.getCacheEntry<MockCatalogCachePayload>(MOCK_CATALOG_IDB_KEY);
        const catalogTest = catalogEntry?.data?.tests?.find((t) => t?.id === trimmedId);
        if (catalogTest && isCachedTestDetailVisible(catalogTest, nowMs)) {
            return catalogTest;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

/**
 * Synchronous 0ms cache lookup for user-scoped attempt history on a specific mock test (`DEC-0004`).
 */
export const getCachedUserTestAttemptsSnapshot = (
    testId: string,
    userId?: string | null
): UserTestAttemptItem[] | null => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return null;

    const cacheKey = `${trimmedUserId}_${trimmedTestId}`;
    const mem = memoryTestAttemptsCache.get(cacheKey);
    if (mem) return mem.attempts;

    const stored = safeReadLocalStorage<{ attempts: any[]; fetchedAt: number }>(
        `${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`
    );
    if (stored && Array.isArray(stored.attempts)) {
        const sanitized = stored.attempts.map(sanitizeUserTestAttempt);
        memoryTestAttemptsCache.set(cacheKey, {
            attempts: sanitized,
            fetchedAt: stored.fetchedAt ?? Date.now(),
        });
        return sanitized;
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for user-scoped attempt history (`MindFlowDB.sync_metadata`).
 */
export const readUserTestAttemptsIndexedDBCache = async (
    testId: string,
    userId?: string | null
): Promise<UserTestAttemptItem[] | null> => {
    const syncSnapshot = getCachedUserTestAttemptsSnapshot(testId, userId);
    if (syncSnapshot !== null) return syncSnapshot;

    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return null;

    const cacheKey = `${trimmedUserId}_${trimmedTestId}`;
    try {
        const entry = await db.getCacheEntry<{ attempts: any[]; fetchedAt: number }>(
            `${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${cacheKey}`
        );
        if (entry?.data && Array.isArray(entry.data.attempts)) {
            const sanitized = entry.data.attempts.map(sanitizeUserTestAttempt);
            const payload = { attempts: sanitized, fetchedAt: entry.data.fetchedAt ?? Date.now() };
            memoryTestAttemptsCache.set(cacheKey, payload);
            safeWriteLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
            return sanitized;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

/**
 * Fetches real `mock_test_attempts` history for the authenticated student (`DEC-0018`),
 * stripping `answers` JSONB and hydrating 0ms local caches (`DEC-0004`).
 */
export const fetchUserTestAttempts = async (
    testId: string,
    userId?: string | null
): Promise<UserTestAttemptItem[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return [];

    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.ATTEMPTS)
        .select('id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, created_at')
        .eq('test_id', trimmedTestId)
        .eq('user_id', trimmedUserId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const attempts = (Array.isArray(data) ? data : []).map(sanitizeUserTestAttempt);
    const cacheKey = `${trimmedUserId}_${trimmedTestId}`;
    const payload = { attempts, fetchedAt: Date.now() };
    memoryTestAttemptsCache.set(cacheKey, payload);
    safeWriteLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
    db.setCacheEntry(`${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${cacheKey}`, payload).catch(() => {});

    return attempts;
};

const normalizeSavedTestIds = (raw: unknown): string[] => {
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as { ids?: unknown }).ids)
          ? (raw as { ids: unknown[] }).ids
          : [];
    const unique = new Set<string>();
    for (const item of list) {
        const id = String(item ?? '').trim();
        if (id) unique.add(id);
    }
    return Array.from(unique);
};

/**
 * Synchronous 0ms read of user-scoped saved/bookmarked mock test IDs (Memory -> `localStorage`).
 */
export const getSavedMockTestIds = (userId?: string | null): string[] => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return [];

    const mem = memorySavedTestsCache.get(trimmedUserId);
    if (mem) return [...mem];

    const stored = safeReadLocalStorage<unknown>(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`);
    if (stored !== null) {
        const ids = normalizeSavedTestIds(stored);
        memorySavedTestsCache.set(trimmedUserId, ids);
        return [...ids];
    }

    return [];
};

export const isMockTestSaved = (testId: string, userId?: string | null): boolean => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId || !userId) return false;
    return getSavedMockTestIds(userId).includes(trimmedTestId);
};

/**
 * Async IndexedDB fallback hydration for user-scoped saved/bookmarked mock test IDs.
 */
export const readSavedMockTestsIndexedDB = async (userId?: string | null): Promise<string[]> => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return [];

    const hasSync =
        memorySavedTestsCache.has(trimmedUserId) ||
        safeReadLocalStorage<unknown>(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`) !== null;
    if (hasSync) {
        return getSavedMockTestIds(trimmedUserId);
    }

    try {
        const entry = await db.getCacheEntry<unknown>(`${MOCK_SAVED_TESTS_IDB_PREFIX}${trimmedUserId}`);
        if (entry?.data !== undefined && entry?.data !== null) {
            const ids = normalizeSavedTestIds(entry.data);
            memorySavedTestsCache.set(trimmedUserId, ids);
            safeWriteLocalStorage(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`, ids);
            return [...ids];
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return [];
};

/**
 * Toggles a mock test's saved/bookmarked status across Memory, `localStorage`, and `MindFlowDB.sync_metadata`.
 */
export const toggleSavedMockTest = (
    testId: string,
    userId: string
): { saved: boolean; ids: string[] } => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) {
        return { saved: false, ids: [] };
    }

    const currentIds = getSavedMockTestIds(trimmedUserId);
    const exists = currentIds.includes(trimmedTestId);
    const nextIds = exists
        ? currentIds.filter((id) => id !== trimmedTestId)
        : Array.from(new Set([trimmedTestId, ...currentIds]));

    memorySavedTestsCache.set(trimmedUserId, nextIds);
    safeWriteLocalStorage(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`, nextIds);
    db.setCacheEntry(`${MOCK_SAVED_TESTS_IDB_PREFIX}${trimmedUserId}`, nextIds).catch(() => {});

    return { saved: !exists, ids: nextIds };
};

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
    memoryTestDetailCache.clear();
    memoryTestQuestionsCache.clear();
    if (userId) {
        const trimmedUserId = String(userId).trim();
        memoryAttemptsCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${trimmedUserId}`);
        memorySavedTestsCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`);
        for (const key of Array.from(memoryTestAttemptsCache.keys())) {
            if (key.startsWith(`${trimmedUserId}_`)) {
                memoryTestAttemptsCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${key}`);
            }
        }
        for (const key of Array.from(memoryActiveAttemptCache.keys())) {
            if (key.startsWith(`${trimmedUserId}_`)) {
                memoryActiveAttemptCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${key}`);
            }
        }
    } else {
        memoryAttemptsCache.clear();
        memoryTestAttemptsCache.clear();
        memorySavedTestsCache.clear();
        memoryActiveAttemptCache.clear();
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
                    const storageKey = window.localStorage.key(i);
                    if (
                        storageKey &&
                        (storageKey.startsWith(MOCK_TEST_DETAIL_STORAGE_PREFIX) ||
                            storageKey.startsWith(MOCK_TEST_ATTEMPTS_STORAGE_PREFIX) ||
                            storageKey.startsWith(MOCK_SAVED_TESTS_STORAGE_PREFIX) ||
                            storageKey.startsWith(MOCK_ATTEMPTS_STORAGE_PREFIX) ||
                            storageKey.startsWith(MOCK_TEST_QUESTIONS_STORAGE_PREFIX) ||
                            storageKey.startsWith(MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX))
                    ) {
                        window.localStorage.removeItem(storageKey);
                    }
                }
            }
        } catch {
            // Ignore localStorage enumeration errors
        }
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

// ============================================================================
// LIVE TIMED CBT MOCK RUNNER: CHUNKED HYDRATION & CRASH-SAFE ATTEMPTS (v1.0.373)
// ============================================================================

export type PreparedMockPaletteStatus =
    | 'not_visited'
    | 'not_answered'
    | 'answered'
    | 'marked_for_review'
    | 'answered_and_marked';

export interface PreparedMockActiveAttemptState {
    attemptId: string;
    testId: string;
    userId: string;
    status: 'in_progress' | 'completed' | 'abandoned';
    startedAt: string;
    updatedAt: string;
    totalDurationSeconds: number;
    remainingSeconds: number;
    elapsedSeconds: number;
    currentIndex: number;
    answers: Record<string, string>;
    markedForReview: string[];
    visitedQuestionIds: string[];
    timeSpentByQuestion: Record<string, number>;
    remotePersisted: boolean;
}

export interface PreparedMockScoreSummary {
    score: number;
    accuracy: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    attemptedCount: number;
    totalQuestions: number;
    totalMarks: number;
    passingMarks: number;
    negativeMarks: number;
    marksPerQuestion: number;
    passed: boolean;
}

export interface PreparedMockSubmitResult {
    attempt: UserTestAttemptItem;
    summary: PreparedMockScoreSummary;
    remoteSynced: boolean;
}

interface ActiveAttemptCbtMeta {
    markedForReview?: unknown[];
    visitedQuestionIds?: unknown[];
    currentIndex?: unknown;
    remainingSeconds?: unknown;
    timeSpentByQuestion?: Record<string, unknown>;
    updatedAt?: unknown;
}

const generateAttemptUuid = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-8${hex().slice(1)}-${hex()}${hex()}${hex()}`;
};

export const normalizePreparedMockQuestion = (row: any, index: number = 0): Question => {
    const options = Array.isArray(row?.options)
        ? row.options.map((opt: unknown) => String(opt ?? ''))
        : [];
    const optionsHi = Array.isArray(row?.options_hi)
        ? row.options_hi.map((opt: unknown) => String(opt ?? ''))
        : undefined;
    const subject = String(row?.subject ?? row?.classification?.subject ?? 'General Studies');
    const topic = String(row?.topic ?? row?.classification?.topic ?? 'General');
    const subTopic = row?.subTopic ?? row?.classification?.subTopic ?? undefined;
    const examName = String(row?.examName ?? row?.sourceInfo?.examName ?? 'BPSC');
    const parsedYear = Number(row?.examYear ?? row?.sourceInfo?.examYear ?? 0);
    const examYear = Number.isFinite(parsedYear) ? parsedYear : 0;
    const examDateShift = row?.examDateShift ?? row?.sourceInfo?.examDateShift ?? undefined;
    const difficulty = String(row?.properties?.difficulty ?? row?.difficulty ?? 'Medium');
    const questionType = String(row?.properties?.questionType ?? row?.questionType ?? 'MCQ');

    return {
        id: String(row?.id ?? `q-${index + 1}`),
        v1_id: row?.v1_id ? String(row.v1_id) : undefined,
        subject,
        topic,
        subTopic: subTopic ? String(subTopic) : undefined,
        examName,
        examYear,
        examDateShift: examDateShift ? String(examDateShift) : undefined,
        question: String(row?.question ?? ''),
        question_hi: row?.question_hi ? String(row.question_hi) : undefined,
        options,
        options_hi: optionsHi,
        correct: String(row?.correct ?? ''),
        explanation:
            row?.explanation && typeof row.explanation === 'object' ? row.explanation : {},
        question_image_url: row?.question_image_url ? String(row.question_image_url) : undefined,
        explanation_image_url: row?.explanation_image_url
            ? String(row.explanation_image_url)
            : undefined,
        tags: Array.isArray(row?.tags) ? row.tags.map((tag: unknown) => String(tag)) : [],
        sourceInfo: {
            examName,
            examYear,
            examDateShift: examDateShift ? String(examDateShift) : undefined,
        },
        classification: {
            subject,
            topic,
            subTopic: subTopic ? String(subTopic) : undefined,
        },
        properties: {
            difficulty,
            questionType,
        },
    };
};

const normalizeQuestionIdsList = (questionIds: unknown): string[] => {
    if (!Array.isArray(questionIds)) return [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const raw of questionIds) {
        const id = String(raw ?? '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ordered.push(id);
    }
    return ordered;
};

/**
 * Synchronous 0ms cache lookup for hydrated prepared mock-test questions (`DEC-0004`).
 */
export const getCachedPreparedTestQuestionsSnapshot = (
    testId: string,
    expectedQuestionIds?: string[]
): Question[] | null => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    const normalizedExpected = normalizeQuestionIdsList(expectedQuestionIds);
    const expectedKey = normalizedExpected.join(',');

    const mem = memoryTestQuestionsCache.get(trimmedTestId);
    if (
        mem &&
        Array.isArray(mem.questions) &&
        mem.questions.length > 0 &&
        (!expectedKey || mem.questionIdsKey === expectedKey)
    ) {
        return mem.questions;
    }

    const stored = safeReadLocalStorage<{
        questions: any[];
        questionIdsKey: string;
        fetchedAt: number;
    }>(`${MOCK_TEST_QUESTIONS_STORAGE_PREFIX}${trimmedTestId}`);
    if (
        stored &&
        Array.isArray(stored.questions) &&
        stored.questions.length > 0 &&
        (!expectedKey || stored.questionIdsKey === expectedKey)
    ) {
        const normalized = stored.questions.map((q, idx) => normalizePreparedMockQuestion(q, idx));
        const entry = {
            questions: normalized,
            questionIdsKey: stored.questionIdsKey || expectedKey,
            fetchedAt: stored.fetchedAt ?? Date.now(),
        };
        memoryTestQuestionsCache.set(trimmedTestId, entry);
        return normalized;
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for prepared mock-test questions (`MindFlowDB.sync_metadata`).
 */
export const readPreparedTestQuestionsIndexedDBCache = async (
    testId: string,
    expectedQuestionIds?: string[]
): Promise<Question[] | null> => {
    const syncSnapshot = getCachedPreparedTestQuestionsSnapshot(testId, expectedQuestionIds);
    if (syncSnapshot) return syncSnapshot;

    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    const normalizedExpected = normalizeQuestionIdsList(expectedQuestionIds);
    const expectedKey = normalizedExpected.join(',');

    try {
        const entry = await db.getCacheEntry<{
            questions: any[];
            questionIdsKey: string;
            fetchedAt: number;
        }>(`${MOCK_TEST_QUESTIONS_IDB_PREFIX}${trimmedTestId}`);
        if (
            entry?.data &&
            Array.isArray(entry.data.questions) &&
            entry.data.questions.length > 0 &&
            (!expectedKey || entry.data.questionIdsKey === expectedKey)
        ) {
            const normalized = entry.data.questions.map((q, idx) =>
                normalizePreparedMockQuestion(q, idx)
            );
            const payload = {
                questions: normalized,
                questionIdsKey: entry.data.questionIdsKey || expectedKey,
                fetchedAt: entry.data.fetchedAt ?? Date.now(),
            };
            memoryTestQuestionsCache.set(trimmedTestId, payload);
            safeWriteLocalStorage(`${MOCK_TEST_QUESTIONS_STORAGE_PREFIX}${trimmedTestId}`, payload);
            return normalized;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

/**
 * Fetches ordered questions for a prepared mock test in 100-UUID chunks (`DB_TABLES.BANK.QUESTIONS`,
 * `.is('deleted_at', null)`), supporting >100-question BPSC mocks (e.g., 103 or 150 Qs) without
 * truncation and updating 0ms Memory/`localStorage`/IndexedDB caches (`DEC-0004`).
 */
export const fetchPreparedMockTestQuestions = async (
    testId: string,
    questionIds: string[]
): Promise<Question[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    const orderedIds = normalizeQuestionIdsList(questionIds);
    if (!trimmedTestId || orderedIds.length === 0) return [];

    const uuidIds = orderedIds.filter((id) => UUID_PATTERN.test(id));
    const legacyIds = orderedIds.filter((id) => !UUID_PATTERN.test(id));

    const chunkList = (ids: string[]): string[][] => {
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += UUID_CHUNK_SIZE) {
            chunks.push(ids.slice(i, i + UUID_CHUNK_SIZE));
        }
        return chunks;
    };

    try {
        const chunkPromises: Promise<any[]>[] = [];

        for (const chunk of chunkList(uuidIds)) {
            chunkPromises.push(
                (async () => {
                    const { data, error } = await supabase
                        .from(DB_TABLES.BANK.QUESTIONS)
                        .select('*')
                        .in('id', chunk)
                        .is('deleted_at', null);
                    if (error) throw error;
                    return Array.isArray(data) ? data : [];
                })()
            );
        }

        for (const chunk of chunkList(legacyIds)) {
            chunkPromises.push(
                (async () => {
                    const { data, error } = await supabase
                        .from(DB_TABLES.BANK.QUESTIONS)
                        .select('*')
                        .in('v1_id', chunk)
                        .is('deleted_at', null);
                    if (error) throw error;
                    return Array.isArray(data) ? data : [];
                })()
            );
        }

        const chunkResults = await Promise.all(chunkPromises);
        const byIdMap = new Map<string, Question>();
        const byLegacyIdMap = new Map<string, Question>();

        chunkResults.flat().forEach((row, idx) => {
            const normalized = normalizePreparedMockQuestion(row, idx);
            if (normalized.id) {
                byIdMap.set(normalized.id, normalized);
            }
            if (normalized.v1_id) {
                byLegacyIdMap.set(normalized.v1_id, normalized);
            }
        });

        const orderedQuestions: Question[] = [];
        for (const reqId of orderedIds) {
            const found = byIdMap.get(reqId) ?? byLegacyIdMap.get(reqId);
            if (found) {
                orderedQuestions.push(found);
            }
        }

        if (orderedQuestions.length > 0) {
            const payload = {
                questions: orderedQuestions,
                questionIdsKey: orderedIds.join(','),
                fetchedAt: Date.now(),
            };
            memoryTestQuestionsCache.set(trimmedTestId, payload);
            safeWriteLocalStorage(`${MOCK_TEST_QUESTIONS_STORAGE_PREFIX}${trimmedTestId}`, payload);
            db.setCacheEntry(`${MOCK_TEST_QUESTIONS_IDB_PREFIX}${trimmedTestId}`, payload).catch(
                () => {}
            );
        }

        return orderedQuestions;
    } catch (err) {
        const cached = await readPreparedTestQuestionsIndexedDBCache(trimmedTestId, orderedIds);
        if (cached && cached.length > 0) {
            return cached;
        }
        throw err;
    }
};

/**
 * Pure palette state projection for CBT question tiles.
 */
export const resolveQuestionPaletteStatus = (
    questionId: string,
    state: Pick<
        PreparedMockActiveAttemptState,
        'answers' | 'markedForReview' | 'visitedQuestionIds'
    >
): PreparedMockPaletteStatus => {
    const selected = state.answers[questionId];
    const hasAnswer = selected !== undefined && selected !== null && String(selected).trim() !== '';
    const isMarked = state.markedForReview.includes(questionId);
    const isVisited = state.visitedQuestionIds.includes(questionId);

    if (hasAnswer && isMarked) return 'answered_and_marked';
    if (hasAnswer) return 'answered';
    if (isMarked) return 'marked_for_review';
    if (isVisited) return 'not_answered';
    return 'not_visited';
};

/**
 * Separates clean question-UUID answers from embedded `__cbt_meta` crash-recovery metadata
 * stored on `in_progress` `mock_test_attempts.answers` JSONB rows.
 */
export const extractAttemptAnswersAndMeta = (
    rawAnswers: unknown
): {
    answers: Record<string, string>;
    meta: {
        markedForReview: string[];
        visitedQuestionIds: string[];
        currentIndex: number;
        remainingSeconds: number | null;
        timeSpentByQuestion: Record<string, number>;
        updatedAt: string | null;
    };
} => {
    const cleanAnswers: Record<string, string> = {};
    let rawMeta: ActiveAttemptCbtMeta = {};

    if (rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers)) {
        for (const [key, value] of Object.entries(rawAnswers as Record<string, unknown>)) {
            if (key === '__cbt_meta' && value && typeof value === 'object') {
                rawMeta = value as ActiveAttemptCbtMeta;
                continue;
            }
            if (typeof value === 'string' && value.trim() !== '') {
                cleanAnswers[key] = value;
            }
        }
    }

    const markedForReview = Array.isArray(rawMeta.markedForReview)
        ? Array.from(new Set(rawMeta.markedForReview.map((id) => String(id).trim()).filter(Boolean)))
        : [];
    const visitedQuestionIds = Array.isArray(rawMeta.visitedQuestionIds)
        ? Array.from(
              new Set(rawMeta.visitedQuestionIds.map((id) => String(id).trim()).filter(Boolean))
          )
        : [];
    const parsedIndex = Number(rawMeta.currentIndex);
    const currentIndex = Number.isFinite(parsedIndex) && parsedIndex >= 0 ? Math.trunc(parsedIndex) : 0;
    const parsedRemaining =
        rawMeta.remainingSeconds !== undefined && rawMeta.remainingSeconds !== null
            ? Number(rawMeta.remainingSeconds)
            : NaN;
    const remainingSeconds =
        Number.isFinite(parsedRemaining) && parsedRemaining >= 0
            ? Math.trunc(parsedRemaining)
            : null;

    const timeSpentByQuestion: Record<string, number> = {};
    if (rawMeta.timeSpentByQuestion && typeof rawMeta.timeSpentByQuestion === 'object') {
        for (const [qId, secs] of Object.entries(rawMeta.timeSpentByQuestion)) {
            const num = Number(secs);
            if (Number.isFinite(num) && num >= 0) {
                timeSpentByQuestion[qId] = Math.trunc(num);
            }
        }
    }

    return {
        answers: cleanAnswers,
        meta: {
            markedForReview,
            visitedQuestionIds,
            currentIndex,
            remainingSeconds,
            timeSpentByQuestion,
            updatedAt: rawMeta.updatedAt ? String(rawMeta.updatedAt) : null,
        },
    };
};

const normalizeActiveAttemptState = (
    raw: any,
    fallback?: { testId?: string; userId?: string; totalDurationSeconds?: number }
): PreparedMockActiveAttemptState | null => {
    if (!raw || typeof raw !== 'object') return null;
    const attemptId = String(raw.attemptId ?? '').trim();
    const testId = String(raw.testId ?? fallback?.testId ?? '').trim();
    const userId = String(raw.userId ?? fallback?.userId ?? '').trim();
    if (!attemptId || !testId || !userId) return null;

    const totalDurationSeconds = Math.max(
        60,
        Number.isFinite(Number(raw.totalDurationSeconds))
            ? Math.trunc(Number(raw.totalDurationSeconds))
            : Number(fallback?.totalDurationSeconds ?? 3600)
    );
    const remainingRaw = Number(raw.remainingSeconds);
    const remainingSeconds = Number.isFinite(remainingRaw)
        ? Math.max(0, Math.min(totalDurationSeconds, Math.trunc(remainingRaw)))
        : totalDurationSeconds;
    const elapsedRaw = Number(raw.elapsedSeconds);
    const elapsedSeconds = Number.isFinite(elapsedRaw) && elapsedRaw >= 0
        ? Math.trunc(elapsedRaw)
        : Math.max(0, totalDurationSeconds - remainingSeconds);
    const currentIndexRaw = Number(raw.currentIndex);
    const currentIndex =
        Number.isFinite(currentIndexRaw) && currentIndexRaw >= 0 ? Math.trunc(currentIndexRaw) : 0;

    const cleanAnswers: Record<string, string> = {};
    if (raw.answers && typeof raw.answers === 'object') {
        for (const [qId, opt] of Object.entries(raw.answers)) {
            if (qId !== '__cbt_meta' && typeof opt === 'string' && opt.trim() !== '') {
                cleanAnswers[qId] = opt;
            }
        }
    }

    const timeSpentByQuestion: Record<string, number> = {};
    if (raw.timeSpentByQuestion && typeof raw.timeSpentByQuestion === 'object') {
        for (const [qId, secs] of Object.entries(raw.timeSpentByQuestion)) {
            const num = Number(secs);
            if (Number.isFinite(num) && num >= 0) {
                timeSpentByQuestion[qId] = Math.trunc(num);
            }
        }
    }

    const status =
        raw.status === 'completed' || raw.status === 'abandoned' || raw.status === 'in_progress'
            ? raw.status
            : 'in_progress';

    return {
        attemptId,
        testId,
        userId,
        status,
        startedAt: String(raw.startedAt ?? new Date().toISOString()),
        updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
        totalDurationSeconds,
        remainingSeconds,
        elapsedSeconds,
        currentIndex,
        answers: cleanAnswers,
        markedForReview: Array.isArray(raw.markedForReview)
            ? Array.from(new Set(raw.markedForReview.map((id: unknown) => String(id).trim()).filter(Boolean)))
            : [],
        visitedQuestionIds: Array.isArray(raw.visitedQuestionIds)
            ? Array.from(
                  new Set(raw.visitedQuestionIds.map((id: unknown) => String(id).trim()).filter(Boolean))
              )
            : [],
        timeSpentByQuestion,
        remotePersisted: Boolean(raw.remotePersisted),
    };
};

const buildActiveAttemptCacheKey = (testId: string, userId: string): string =>
    `${userId.trim()}_${testId.trim()}`;

const upsertCachedUserAttemptSummary = (
    userId: string,
    testId: string,
    item: UserTestAttemptItem
): void => {
    const cacheKey = `${userId}_${testId}`;
    const existing = getCachedUserTestAttemptsSnapshot(testId, userId) ?? [];
    const filtered = existing.filter((a) => a.id !== item.id);
    const nextList = [item, ...filtered];
    const payload = { attempts: nextList, fetchedAt: Date.now() };
    memoryTestAttemptsCache.set(cacheKey, payload);
    safeWriteLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
    db.setCacheEntry(`${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${cacheKey}`, payload).catch(() => {});

    const existingAttemptedIds = readAttemptsFromSyncCache(userId);
    if (!existingAttemptedIds.includes(testId)) {
        writeAttemptsToCache(userId, [testId, ...existingAttemptedIds]);
    }
};

/**
 * Synchronous 0ms cache lookup for an active `in_progress` mock-test session (`DEC-0004`).
 */
export const getCachedActivePreparedMockAttempt = (
    testId: string,
    userId?: string | null,
    resumeAttemptId?: string | null
): PreparedMockActiveAttemptState | null => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return null;

    const cacheKey = buildActiveAttemptCacheKey(trimmedTestId, trimmedUserId);
    const matchesResume = (candidate: PreparedMockActiveAttemptState | null): boolean => {
        if (!candidate || candidate.status !== 'in_progress') return false;
        if (resumeAttemptId && candidate.attemptId !== resumeAttemptId) return false;
        return true;
    };

    const mem = memoryActiveAttemptCache.get(cacheKey) ?? null;
    if (matchesResume(mem)) return mem;

    const stored = normalizeActiveAttemptState(
        safeReadLocalStorage<unknown>(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`),
        { testId: trimmedTestId, userId: trimmedUserId }
    );
    if (matchesResume(stored) && stored) {
        memoryActiveAttemptCache.set(cacheKey, stored);
        return stored;
    }

    return null;
};

/**
 * Async IndexedDB fallback lookup for an active `in_progress` mock-test session.
 */
export const readActivePreparedMockAttemptIndexedDB = async (
    testId: string,
    userId?: string | null,
    resumeAttemptId?: string | null
): Promise<PreparedMockActiveAttemptState | null> => {
    const syncSnapshot = getCachedActivePreparedMockAttempt(testId, userId, resumeAttemptId);
    if (syncSnapshot) return syncSnapshot;

    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return null;

    const cacheKey = buildActiveAttemptCacheKey(trimmedTestId, trimmedUserId);

    try {
        const activeSessionRaw = await db.getActiveSession?.(`mock_exam_${cacheKey}`);
        const fromActiveStore = normalizeActiveAttemptState(activeSessionRaw, {
            testId: trimmedTestId,
            userId: trimmedUserId,
        });
        if (
            fromActiveStore &&
            fromActiveStore.status === 'in_progress' &&
            (!resumeAttemptId || fromActiveStore.attemptId === resumeAttemptId)
        ) {
            memoryActiveAttemptCache.set(cacheKey, fromActiveStore);
            safeWriteLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`, fromActiveStore);
            return fromActiveStore;
        }
    } catch {
        // Ignore active_test_session lookup errors
    }

    try {
        const idbEntry = await db.getCacheEntry<unknown>(`${MOCK_ACTIVE_ATTEMPT_IDB_PREFIX}${cacheKey}`);
        const fromCacheStore = normalizeActiveAttemptState(idbEntry?.data, {
            testId: trimmedTestId,
            userId: trimmedUserId,
        });
        if (
            fromCacheStore &&
            fromCacheStore.status === 'in_progress' &&
            (!resumeAttemptId || fromCacheStore.attemptId === resumeAttemptId)
        ) {
            memoryActiveAttemptCache.set(cacheKey, fromCacheStore);
            safeWriteLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`, fromCacheStore);
            return fromCacheStore;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

const clearActivePreparedMockAttemptCache = async (
    testId: string,
    userId: string
): Promise<void> => {
    const cacheKey = buildActiveAttemptCacheKey(testId, userId);
    memoryActiveAttemptCache.delete(cacheKey);
    safeRemoveLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`);
    await Promise.allSettled([
        db.clearActiveSession?.(`mock_exam_${cacheKey}`) ?? Promise.resolve(),
        db.setCacheEntry(`${MOCK_ACTIVE_ATTEMPT_IDB_PREFIX}${cacheKey}`, null),
    ]);
};

const buildRemoteAttemptPayloadAnswers = (state: PreparedMockActiveAttemptState) => ({
    ...state.answers,
    __cbt_meta: {
        markedForReview: state.markedForReview,
        visitedQuestionIds: state.visitedQuestionIds,
        currentIndex: state.currentIndex,
        remainingSeconds: state.remainingSeconds,
        timeSpentByQuestion: state.timeSpentByQuestion,
        updatedAt: state.updatedAt,
    },
});

/**
 * Crash-safely persists active CBT attempt progress to Memory, `localStorage`, IndexedDB
 * (`active_test_session` + `sync_metadata`), and optionally Supabase `DB_TABLES.MOCK.ATTEMPTS`.
 */
export const savePreparedMockAttemptProgress = async (
    state: PreparedMockActiveAttemptState,
    options?: { syncRemote?: boolean }
): Promise<PreparedMockActiveAttemptState> => {
    const nextState: PreparedMockActiveAttemptState = {
        ...state,
        updatedAt: new Date().toISOString(),
    };

    const cacheKey = buildActiveAttemptCacheKey(nextState.testId, nextState.userId);
    memoryActiveAttemptCache.set(cacheKey, nextState);
    safeWriteLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`, nextState);

    db.saveActiveSession?.(`mock_exam_${cacheKey}`, nextState).catch(() => {});
    db.setCacheEntry(`${MOCK_ACTIVE_ATTEMPT_IDB_PREFIX}${cacheKey}`, nextState).catch(() => {});

    upsertCachedUserAttemptSummary(nextState.userId, nextState.testId, {
        id: nextState.attemptId,
        test_id: nextState.testId,
        start_time: nextState.startedAt,
        end_time: null,
        time_taken_seconds: nextState.elapsedSeconds,
        score: 0,
        accuracy: 0,
        status: 'in_progress',
        created_at: nextState.startedAt,
    });

    if (
        options?.syncRemote &&
        (typeof navigator === 'undefined' || navigator.onLine !== false)
    ) {
        try {
            const payloadAnswers = buildRemoteAttemptPayloadAnswers(nextState);
            if (nextState.remotePersisted) {
                const { error } = await supabase
                    .from(DB_TABLES.MOCK.ATTEMPTS)
                    .update({
                        time_taken_seconds: nextState.elapsedSeconds,
                        status: 'in_progress',
                        answers: payloadAnswers,
                    })
                    .eq('id', nextState.attemptId)
                    .eq('user_id', nextState.userId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(DB_TABLES.MOCK.ATTEMPTS).upsert(
                    {
                        id: nextState.attemptId,
                        user_id: nextState.userId,
                        test_id: nextState.testId,
                        start_time: nextState.startedAt,
                        time_taken_seconds: nextState.elapsedSeconds,
                        score: 0,
                        accuracy: 0,
                        status: 'in_progress',
                        answers: payloadAnswers,
                    },
                    { onConflict: 'id' }
                );
                if (!error) {
                    nextState.remotePersisted = true;
                    memoryActiveAttemptCache.set(cacheKey, nextState);
                    safeWriteLocalStorage(
                        `${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${cacheKey}`,
                        nextState
                    );
                }
            }
        } catch {
            // Keep local crash-safe snapshot intact when offline or network drops
        }
    }

    return nextState;
};

/**
 * Starts a fresh `in_progress` attempt or resumes an existing crash-saved / `resumeAttemptId`
 * attempt, reconciling local IndexedDB and remote `DB_TABLES.MOCK.ATTEMPTS`.
 */
export const startOrResumePreparedMockAttempt = async (params: {
    test: any;
    questions: Question[];
    userId: string;
    resumeAttemptId?: string | null;
}): Promise<PreparedMockActiveAttemptState> => {
    const testId = String(params.test?.id ?? '').trim();
    const userId = String(params.userId ?? '').trim();
    if (!testId || !userId) {
        throw new Error('Authenticated user and valid test ID are required to launch the exam.');
    }

    const totalDurationSeconds = Math.max(60, Math.round(Number(params.test?.duration_minutes ?? 60) * 60));
    const maxQuestionIndex = Math.max(0, params.questions.length - 1);
    const firstQuestionId = params.questions[0]?.id;
    const requestedResumeId = params.resumeAttemptId ? String(params.resumeAttemptId).trim() : null;

    const localCandidate = await readActivePreparedMockAttemptIndexedDB(
        testId,
        userId,
        requestedResumeId
    );

    let remoteRow: any = null;
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        try {
            if (requestedResumeId) {
                const { data, error } = await supabase
                    .from(DB_TABLES.MOCK.ATTEMPTS)
                    .select('id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, answers, created_at')
                    .eq('id', requestedResumeId)
                    .eq('user_id', userId)
                    .maybeSingle();
                if (!error && data) {
                    if (data.status === 'in_progress') {
                        remoteRow = data;
                    } else if (localCandidate?.attemptId === requestedResumeId) {
                        await clearActivePreparedMockAttemptCache(testId, userId);
                    }
                }
            } else {
                const { data, error } = await supabase
                    .from(DB_TABLES.MOCK.ATTEMPTS)
                    .select('id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, answers, created_at')
                    .eq('test_id', testId)
                    .eq('user_id', userId)
                    .eq('status', 'in_progress')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (!error && data) {
                    remoteRow = data;
                }
            }
        } catch {
            // Network unavailable; rely on local IndexedDB candidate if present
        }
    }

    let remoteCandidate: PreparedMockActiveAttemptState | null = null;
    if (remoteRow) {
        const extracted = extractAttemptAnswersAndMeta(remoteRow.answers);
        const remoteElapsed = Math.max(0, Number(remoteRow.time_taken_seconds ?? 0));
        const derivedRemaining =
            extracted.meta.remainingSeconds !== null
                ? Math.max(0, Math.min(totalDurationSeconds, extracted.meta.remainingSeconds))
                : Math.max(1, totalDurationSeconds - remoteElapsed);

        remoteCandidate = {
            attemptId: String(remoteRow.id),
            testId,
            userId,
            status: 'in_progress',
            startedAt: String(remoteRow.start_time ?? remoteRow.created_at ?? new Date().toISOString()),
            updatedAt: String(
                extracted.meta.updatedAt ??
                    remoteRow.created_at ??
                    remoteRow.start_time ??
                    new Date().toISOString()
            ),
            totalDurationSeconds,
            remainingSeconds: derivedRemaining,
            elapsedSeconds: remoteElapsed,
            currentIndex: Math.min(maxQuestionIndex, Math.max(0, extracted.meta.currentIndex)),
            answers: extracted.answers,
            markedForReview: extracted.meta.markedForReview,
            visitedQuestionIds: extracted.meta.visitedQuestionIds,
            timeSpentByQuestion: extracted.meta.timeSpentByQuestion,
            remotePersisted: true,
        };
    }

    let resolved: PreparedMockActiveAttemptState | null = null;
    if (localCandidate && remoteCandidate) {
        const localUpdatedMs = Date.parse(localCandidate.updatedAt) || 0;
        const remoteUpdatedMs = Date.parse(remoteCandidate.updatedAt) || 0;
        const primary =
            localCandidate.attemptId === remoteCandidate.attemptId && localUpdatedMs >= remoteUpdatedMs
                ? localCandidate
                : remoteUpdatedMs > localUpdatedMs
                  ? remoteCandidate
                  : localCandidate;
        const secondary = primary === localCandidate ? remoteCandidate : localCandidate;

        resolved = {
            ...primary,
            remotePersisted: true,
            currentIndex: Math.min(maxQuestionIndex, Math.max(0, primary.currentIndex)),
            remainingSeconds:
                primary.attemptId === secondary.attemptId
                    ? Math.min(primary.remainingSeconds, secondary.remainingSeconds)
                    : primary.remainingSeconds,
            elapsedSeconds:
                primary.attemptId === secondary.attemptId
                    ? Math.max(primary.elapsedSeconds, secondary.elapsedSeconds)
                    : primary.elapsedSeconds,
            visitedQuestionIds: Array.from(
                new Set([
                    ...primary.visitedQuestionIds,
                    ...(primary.attemptId === secondary.attemptId
                        ? secondary.visitedQuestionIds
                        : []),
                ])
            ),
        };
    } else if (localCandidate) {
        resolved = {
            ...localCandidate,
            currentIndex: Math.min(maxQuestionIndex, Math.max(0, localCandidate.currentIndex)),
        };
    } else if (remoteCandidate) {
        resolved = remoteCandidate;
    }

    if (resolved) {
        const activeQId = params.questions[resolved.currentIndex]?.id;
        if (activeQId && !resolved.visitedQuestionIds.includes(activeQId)) {
            resolved.visitedQuestionIds = [...resolved.visitedQuestionIds, activeQId];
        }
        return savePreparedMockAttemptProgress(resolved, { syncRemote: false });
    }

    const nowIso = new Date().toISOString();
    const freshAttemptId = generateAttemptUuid();
    let remotePersisted = false;

    const initialMeta = {
        markedForReview: [],
        visitedQuestionIds: firstQuestionId ? [firstQuestionId] : [],
        currentIndex: 0,
        remainingSeconds: totalDurationSeconds,
        timeSpentByQuestion: {},
        updatedAt: nowIso,
    };

    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.MOCK.ATTEMPTS)
                .insert({
                    id: freshAttemptId,
                    user_id: userId,
                    test_id: testId,
                    start_time: nowIso,
                    time_taken_seconds: 0,
                    score: 0,
                    accuracy: 0,
                    status: 'in_progress',
                    answers: { __cbt_meta: initialMeta },
                })
                .select('id, start_time')
                .maybeSingle();

            if (!error && data?.id) {
                remotePersisted = true;
            }
        } catch {
            // Offline fallback keeps generated UUID in local IndexedDB
        }
    }

    const created: PreparedMockActiveAttemptState = {
        attemptId: freshAttemptId,
        testId,
        userId,
        status: 'in_progress',
        startedAt: nowIso,
        updatedAt: nowIso,
        totalDurationSeconds,
        remainingSeconds: totalDurationSeconds,
        elapsedSeconds: 0,
        currentIndex: 0,
        answers: {},
        markedForReview: [],
        visitedQuestionIds: firstQuestionId ? [firstQuestionId] : [],
        timeSpentByQuestion: {},
        remotePersisted,
    };

    return savePreparedMockAttemptProgress(created, { syncRemote: false });
};

/**
 * Pure scoring helper supporting positive marks per question and negative marking (e.g. BPSC -0.33).
 */
export const computePreparedMockScore = (params: {
    questions: Question[];
    answers: Record<string, string>;
    totalMarks: number;
    negativeMarks: number;
    passingMarks: number;
}): PreparedMockScoreSummary => {
    const totalQuestions = params.questions.length;
    const totalMarks = Number(params.totalMarks ?? 0);
    const passingMarks = Number(params.passingMarks ?? 0);
    const negativeMarks = Math.abs(Number(params.negativeMarks ?? 0));
    const marksPerQuestion =
        totalQuestions > 0 && totalMarks > 0 ? totalMarks / totalQuestions : 1;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    for (const q of params.questions) {
        const selected = params.answers[q.id];
        if (!selected || String(selected).trim() === '') {
            unansweredCount += 1;
            continue;
        }
        if (String(selected).trim() === String(q.correct ?? '').trim()) {
            correctCount += 1;
        } else {
            wrongCount += 1;
        }
    }

    const attemptedCount = correctCount + wrongCount;
    const rawScore = correctCount * marksPerQuestion - wrongCount * negativeMarks;
    const score = Number(rawScore.toFixed(2));
    const accuracy =
        attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;
    const passed = passingMarks > 0 ? score >= passingMarks : true;

    return {
        score,
        accuracy,
        correctCount,
        wrongCount,
        unansweredCount,
        attemptedCount,
        totalQuestions,
        totalMarks,
        passingMarks,
        negativeMarks,
        marksPerQuestion,
        passed,
    };
};

/**
 * Finalizes and submits an active prepared mock attempt to `DB_TABLES.MOCK.ATTEMPTS` (`status = 'completed'`),
 * clears the in-flight crash-recovery snapshot, and updates `userId`-scoped attempt history caches (`DEC-0020`).
 */
export const submitPreparedMockAttempt = async (params: {
    state: PreparedMockActiveAttemptState;
    test: any;
    questions: Question[];
}): Promise<PreparedMockSubmitResult> => {
    const { state, test, questions } = params;
    const summary = computePreparedMockScore({
        questions,
        answers: state.answers,
        totalMarks: Number(test?.total_marks ?? questions.length),
        negativeMarks: Number(test?.negative_marks ?? 0),
        passingMarks: Number(test?.passing_marks ?? 0),
    });

    const cleanAnswers: Record<string, string> = {};
    for (const [qId, opt] of Object.entries(state.answers)) {
        if (qId !== '__cbt_meta' && typeof opt === 'string' && opt.trim() !== '') {
            cleanAnswers[qId] = opt;
        }
    }

    const nowIso = new Date().toISOString();
    const timeTakenSeconds = Math.max(1, Math.trunc(state.elapsedSeconds));
    let remoteSynced = false;

    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        try {
            if (state.remotePersisted) {
                const { error } = await supabase
                    .from(DB_TABLES.MOCK.ATTEMPTS)
                    .update({
                        status: 'completed',
                        score: summary.score,
                        accuracy: summary.accuracy,
                        time_taken_seconds: timeTakenSeconds,
                        end_time: nowIso,
                        answers: cleanAnswers,
                    })
                    .eq('id', state.attemptId)
                    .eq('user_id', state.userId);
                if (error) throw error;
                remoteSynced = true;
            } else {
                const { error } = await supabase.from(DB_TABLES.MOCK.ATTEMPTS).upsert(
                    {
                        id: state.attemptId,
                        user_id: state.userId,
                        test_id: state.testId,
                        start_time: state.startedAt,
                        end_time: nowIso,
                        time_taken_seconds: timeTakenSeconds,
                        score: summary.score,
                        accuracy: summary.accuracy,
                        status: 'completed',
                        answers: cleanAnswers,
                    },
                    { onConflict: 'id' }
                );
                if (error) throw error;
                remoteSynced = true;
            }
        } catch {
            remoteSynced = false;
        }
    }

    await clearActivePreparedMockAttemptCache(state.testId, state.userId);

    const completedAttempt: UserTestAttemptItem = {
        id: state.attemptId,
        test_id: state.testId,
        start_time: state.startedAt,
        end_time: nowIso,
        time_taken_seconds: timeTakenSeconds,
        score: summary.score,
        accuracy: summary.accuracy,
        status: 'completed',
        created_at: state.startedAt,
    };

    upsertCachedUserAttemptSummary(state.userId, state.testId, completedAttempt);

    return {
        attempt: completedAttempt,
        summary,
        remoteSynced,
    };
};
