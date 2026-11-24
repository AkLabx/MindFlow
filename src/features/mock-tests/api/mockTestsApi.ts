import { supabase } from '@/lib/supabase';
import { DB_TABLES, DB_RPCS } from '@/config/dbTables';
import { db } from '@/lib/db';
import { useSyncStore } from '@/features/quiz/stores/useSyncStore';
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
 * Synchronous 0ms cache lookup for privacy-safe mock test leaderboard entries (`DEC-0004`, `DEC-0018`),
 * always re-running `sanitizeLeaderboardEntry` to guarantee `answers` is never exposed.
 */
export const getCachedTestLeaderboardSnapshot = (testId: string): TestLeaderboardEntry[] | null => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    const mem = memoryLeaderboardCache.get(trimmedTestId);
    if (mem && Array.isArray(mem.entries)) {
        return mem.entries.map((row, idx) => sanitizeLeaderboardEntry(row, idx));
    }

    const stored = safeReadLocalStorage<{ entries: any[]; fetchedAt: number }>(
        `${MOCK_LEADERBOARD_STORAGE_PREFIX}${trimmedTestId}`
    );
    if (stored && Array.isArray(stored.entries)) {
        const sanitized = stored.entries.map((row, idx) => sanitizeLeaderboardEntry(row, idx));
        memoryLeaderboardCache.set(trimmedTestId, {
            entries: sanitized,
            fetchedAt: stored.fetchedAt ?? Date.now(),
        });
        return sanitized;
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for privacy-safe mock test leaderboard entries (`MindFlowDB.sync_metadata`).
 */
export const readTestLeaderboardIndexedDBCache = async (
    testId: string
): Promise<TestLeaderboardEntry[] | null> => {
    const syncSnapshot = getCachedTestLeaderboardSnapshot(testId);
    if (syncSnapshot !== null) return syncSnapshot;

    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return null;

    try {
        const entry = await db.getCacheEntry<{ entries: any[]; fetchedAt: number }>(
            `${MOCK_LEADERBOARD_IDB_PREFIX}${trimmedTestId}`
        );
        if (entry?.data && Array.isArray(entry.data.entries)) {
            const sanitized = entry.data.entries.map((row, idx) => sanitizeLeaderboardEntry(row, idx));
            const payload = {
                entries: sanitized,
                fetchedAt: entry.data.fetchedAt ?? Date.now(),
            };
            memoryLeaderboardCache.set(trimmedTestId, payload);
            safeWriteLocalStorage(`${MOCK_LEADERBOARD_STORAGE_PREFIX}${trimmedTestId}`, payload);
            return sanitized;
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

export const MOCK_SWR_STALE_TIMES_MS = {
    CATALOG: 5 * 60 * 1000,
    TEST_DETAILS: 5 * 60 * 1000,
    SERIES_BUNDLE: 5 * 60 * 1000,
    QUESTIONS: 15 * 60 * 1000,
    ATTEMPTS: 2 * 60 * 1000,
    LEADERBOARD: 60 * 1000,
} as const;

export const MOCK_CACHE_INVALIDATED_EVENT = 'mindflow:mock-cache-invalidated';
export const MOCK_CACHE_VERSION_KEY = 'mindflow_mock_cache_epoch_v1';

/**
 * Checks whether a cached payload timestamp (`fetchedAt`) is still within its SWR stale-time window.
 */
export const isMockCacheFresh = (
    fetchedAt: number | null | undefined,
    staleTimeMs: number,
    nowMs: number = Date.now()
): boolean => {
    if (
        typeof fetchedAt !== 'number' ||
        !Number.isFinite(fetchedAt) ||
        fetchedAt <= 0 ||
        fetchedAt > nowMs
    ) {
        return false;
    }
    if (!Number.isFinite(staleTimeMs) || staleTimeMs <= 0) {
        return false;
    }
    return nowMs - fetchedAt < staleTimeMs;
};

const emitMockCacheInvalidatedEvent = (detail?: {
    scope?: string;
    testId?: string;
    seriesId?: string;
}): void => {
    const epoch = String(Date.now());
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(MOCK_CACHE_VERSION_KEY, epoch);
        }
    } catch {
        // Ignore storage quota or private-browsing errors
    }

    try {
        if (
            typeof window !== 'undefined' &&
            typeof window.dispatchEvent === 'function' &&
            typeof CustomEvent === 'function'
        ) {
            window.dispatchEvent(
                new CustomEvent(MOCK_CACHE_INVALIDATED_EVENT, {
                    detail: detail ?? {},
                })
            );
        }
    } catch {
        // Ignore CustomEvent dispatch errors
    }

    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('mindflow-mock-cache');
            channel.postMessage({
                type: 'invalidated',
                ...(detail ?? {}),
                epoch,
            });
            channel.close();
        }
    } catch {
        // Ignore BroadcastChannel unavailability
    }
};

/**
 * Fetches anonymized, privacy-safe rankings for a published mock test via `get_test_leaderboard`.
 */
export const fetchTestLeaderboard = async (
    testId: string,
    limit: number = 50,
    options?: { forceRefresh?: boolean }
): Promise<TestLeaderboardEntry[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    if (!trimmedTestId) return [];

    const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 50, 100));

    if (!options?.forceRefresh) {
        const mem = memoryLeaderboardCache.get(trimmedTestId);
        const stored = !mem
            ? safeReadLocalStorage<{ entries: any[]; fetchedAt: number; limit?: number }>(
                  `${MOCK_LEADERBOARD_STORAGE_PREFIX}${trimmedTestId}`
              )
            : null;
        const candidate = mem ?? stored;
        if (
            candidate &&
            Array.isArray(candidate.entries) &&
            isMockCacheFresh(candidate.fetchedAt, MOCK_SWR_STALE_TIMES_MS.LEADERBOARD)
        ) {
            const cachedLimit = (candidate as { limit?: number }).limit;
            if (cachedLimit === undefined || cachedLimit >= safeLimit) {
                const sanitized = candidate.entries
                    .map((row, idx) => sanitizeLeaderboardEntry(row, idx))
                    .slice(0, safeLimit);
                if (!mem) {
                    memoryLeaderboardCache.set(trimmedTestId, {
                        entries: sanitized,
                        fetchedAt: candidate.fetchedAt,
                        limit: cachedLimit,
                    });
                }
                return sanitized;
            }
        }
    }

    if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') return [];

    const { data, error } = await supabase.rpc(DB_RPCS.MOCK_LEADERBOARD, {
        p_test_id: trimmedTestId,
        p_limit: safeLimit,
    });

    if (error) throw error;
    const entries = (Array.isArray(data) ? data : []).map((row, idx) =>
        sanitizeLeaderboardEntry(row, idx)
    );
    const payload = { entries, fetchedAt: Date.now(), limit: safeLimit };
    memoryLeaderboardCache.set(trimmedTestId, payload);
    safeWriteLocalStorage(`${MOCK_LEADERBOARD_STORAGE_PREFIX}${trimmedTestId}`, payload);
    db.setCacheEntry(`${MOCK_LEADERBOARD_IDB_PREFIX}${trimmedTestId}`, payload).catch(() => {});
    return entries;
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

const isCachedSeriesBundleVisible = (series: any): boolean => {
    if (!series || series.is_published === false) {
        return false;
    }
    const category =
        series[DB_TABLES.MOCK.CATEGORIES] ??
        series.mock_categories ??
        series.exam_categories;
    if (category && category.is_active === false) {
        return false;
    }
    return true;
};

const readSeriesBundleSyncRaw = (
    seriesId: string
): { series: any; tests: any[]; fetchedAt: number; testsLoaded?: boolean } | null => {
    const trimmedSeriesId = String(seriesId ?? '').trim();
    if (!trimmedSeriesId) return null;

    const mem = memorySeriesBundleCache.get(trimmedSeriesId);
    if (mem) return mem;

    const stored = safeReadLocalStorage<{
        series: any;
        tests: any[];
        fetchedAt: number;
        testsLoaded?: boolean;
    }>(`${MOCK_SERIES_BUNDLE_STORAGE_PREFIX}${trimmedSeriesId}`);
    if (stored && typeof stored === 'object') {
        memorySeriesBundleCache.set(trimmedSeriesId, stored);
        return stored;
    }

    return null;
};

const writeSeriesBundleCache = (
    seriesId: string,
    payload: { series: any; tests: any[]; fetchedAt: number; testsLoaded?: boolean }
): void => {
    const trimmedSeriesId = String(seriesId ?? '').trim();
    if (!trimmedSeriesId) return;
    memorySeriesBundleCache.set(trimmedSeriesId, payload);
    safeWriteLocalStorage(`${MOCK_SERIES_BUNDLE_STORAGE_PREFIX}${trimmedSeriesId}`, payload);
    db.setCacheEntry?.(`${MOCK_SERIES_BUNDLE_IDB_PREFIX}${trimmedSeriesId}`, payload)?.catch(() => {});
};

/**
 * Synchronous 0ms cache lookup for a mock test series bundle (`series` + `tests`),
 * always validating `is_published`, parent category `is_active`, and `DEC-0017` schedule window.
 */
export const getCachedSeriesBundleSnapshot = (
    seriesId: string,
    nowMs: number = Date.now()
): { series: any; tests: any[] } | null => {
    const raw = readSeriesBundleSyncRaw(seriesId);
    if (
        !raw ||
        !raw.series ||
        !isCachedSeriesBundleVisible(raw.series) ||
        raw.testsLoaded === false ||
        !Array.isArray(raw.tests)
    ) {
        return null;
    }

    const validTests = raw.tests.filter((test) => isCachedTestDetailVisible(test, nowMs));
    return {
        series: raw.series,
        tests: validTests,
    };
};

/**
 * Async IndexedDB fallback hydration for a mock test series bundle (`MindFlowDB.sync_metadata`).
 */
export const readSeriesBundleIndexedDBCache = async (
    seriesId: string,
    nowMs: number = Date.now()
): Promise<{ series: any; tests: any[] } | null> => {
    const syncSnapshot = getCachedSeriesBundleSnapshot(seriesId, nowMs);
    if (syncSnapshot) return syncSnapshot;

    const trimmedSeriesId = String(seriesId ?? '').trim();
    if (!trimmedSeriesId) return null;

    try {
        const entry = await db.getCacheEntry<{
            series: any;
            tests: any[];
            fetchedAt: number;
            testsLoaded?: boolean;
        }>(`${MOCK_SERIES_BUNDLE_IDB_PREFIX}${trimmedSeriesId}`);
        const data = entry?.data;
        if (
            data &&
            data.series &&
            isCachedSeriesBundleVisible(data.series) &&
            data.testsLoaded !== false &&
            Array.isArray(data.tests)
        ) {
            memorySeriesBundleCache.set(trimmedSeriesId, data);
            safeWriteLocalStorage(`${MOCK_SERIES_BUNDLE_STORAGE_PREFIX}${trimmedSeriesId}`, data);
            return {
                series: data.series,
                tests: data.tests.filter((test) => isCachedTestDetailVisible(test, nowMs)),
            };
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
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
    const filtered = (data || []).filter((test) => isTestWithinScheduleWindow(test, nowMs));
    const trimmedSeriesId = String(seriesId ?? '').trim();
    if (trimmedSeriesId) {
        const existing = readSeriesBundleSyncRaw(trimmedSeriesId);
        writeSeriesBundleCache(trimmedSeriesId, {
            series: existing?.series ?? null,
            tests: filtered,
            fetchedAt: Date.now(),
            testsLoaded: true,
        });
    }
    return filtered;
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
    const trimmedSeriesId = String(seriesId ?? '').trim();
    if (trimmedSeriesId && data && isCachedSeriesBundleVisible(data)) {
        const existing = readSeriesBundleSyncRaw(trimmedSeriesId);
        writeSeriesBundleCache(trimmedSeriesId, {
            series: data,
            tests: Array.isArray(existing?.tests) ? existing.tests : [],
            fetchedAt: Date.now(),
            testsLoaded: existing?.testsLoaded ?? false,
        });
    }
    return data;
};

export const fetchTestDetails = async (
    testId: string,
    nowMs: number = Date.now(),
    options?: { forceRefresh?: boolean }
) => {
    const trimmedId = String(testId ?? '').trim();
    if (!trimmedId) {
        throw new Error('This mock test is not currently available outside its scheduled window.');
    }

    if (!options?.forceRefresh) {
        const mem = memoryTestDetailCache.get(trimmedId);
        const stored = !mem
            ? safeReadLocalStorage<{ test: any; fetchedAt: number }>(
                  `${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedId}`
              )
            : null;
        const candidate = mem ?? stored;
        if (
            candidate?.test &&
            isMockCacheFresh(candidate.fetchedAt, MOCK_SWR_STALE_TIMES_MS.TEST_DETAILS) &&
            isCachedTestDetailVisible(candidate.test, nowMs)
        ) {
            if (!mem) {
                memoryTestDetailCache.set(trimmedId, candidate);
            }
            return candidate.test;
        }
    }

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
        db.deleteCacheEntriesByPrefix?.([`${MOCK_TEST_DETAIL_IDB_PREFIX}${trimmedId}`])?.catch(() => {});
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
const MOCK_CONTINUE_LEARNING_STORAGE_PREFIX = 'mindflow_mock_continue_learning_v1_';
const MOCK_CONTINUE_LEARNING_IDB_PREFIX = 'mock_continue_learning_v1_';
const MOCK_SERIES_BUNDLE_STORAGE_PREFIX = 'mindflow_mock_series_bundle_v1_';
const MOCK_SERIES_BUNDLE_IDB_PREFIX = 'mock_series_bundle_v1_';
const MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX = 'mindflow_mock_series_attempts_v1_';
const MOCK_SERIES_ATTEMPTS_IDB_PREFIX = 'mock_series_attempts_v1_';
const MOCK_LEADERBOARD_STORAGE_PREFIX = 'mindflow_mock_leaderboard_v1_';
const MOCK_LEADERBOARD_IDB_PREFIX = 'mock_leaderboard_v1_';
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
const memoryContinueLearningCache = new Map<
    string,
    { items: ContinueLearningItem[]; fetchedAt: number }
>();
const memorySeriesBundleCache = new Map<
    string,
    { series: any; tests: any[]; fetchedAt: number; testsLoaded?: boolean }
>();
const memorySeriesAttemptsCache = new Map<
    string,
    { attempts: UserTestAttemptItem[]; fetchedAt: number }
>();
const memoryLeaderboardCache = new Map<
    string,
    { entries: TestLeaderboardEntry[]; fetchedAt: number; limit?: number }
>();

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
    userId?: string | null,
    options?: { forceRefresh?: boolean }
): Promise<UserTestAttemptItem[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedTestId || !trimmedUserId) return [];

    const cacheKey = `${trimmedUserId}_${trimmedTestId}`;
    if (!options?.forceRefresh) {
        const mem = memoryTestAttemptsCache.get(cacheKey);
        const stored = !mem
            ? safeReadLocalStorage<{ attempts: any[]; fetchedAt: number }>(
                  `${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`
              )
            : null;
        const candidate = mem ?? stored;
        if (
            candidate &&
            Array.isArray(candidate.attempts) &&
            isMockCacheFresh(candidate.fetchedAt, MOCK_SWR_STALE_TIMES_MS.ATTEMPTS)
        ) {
            const sanitized = candidate.attempts.map(sanitizeUserTestAttempt);
            if (!mem) {
                memoryTestAttemptsCache.set(cacheKey, {
                    attempts: sanitized,
                    fetchedAt: candidate.fetchedAt,
                });
            }
            return sanitized;
        }
    }

    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.ATTEMPTS)
        .select('id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, created_at')
        .eq('test_id', trimmedTestId)
        .eq('user_id', trimmedUserId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const attempts = (Array.isArray(data) ? data : []).map(sanitizeUserTestAttempt);
    const payload = { attempts, fetchedAt: Date.now() };
    memoryTestAttemptsCache.set(cacheKey, payload);
    safeWriteLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
    db.setCacheEntry(`${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${cacheKey}`, payload).catch(() => {});

    return attempts;
};

export interface SeriesProgressStats {
    totalTests: number;
    completedTestsCount: number;
    inProgressTestIds: string[];
    completionPercent: number;
    bestScoreMarks: number | null;
    bestScoreTotalMarks: number | null;
    bestScorePercent: number | null;
    averageScorePercent: number | null;
    averageScoreMarks: number | null;
    uniformTotalMarks: number | null;
    overallAccuracyPercent: number | null;
    totalTimeSpentSeconds: number;
    latestCompletedTestId: string | null;
    activeInProgressAttempt: { testId: string; attemptId: string } | null;
    bestAttemptByTestId: Record<string, UserTestAttemptItem>;
}

const getAttemptSortTimestampMs = (attempt: UserTestAttemptItem): number => {
    const raw = attempt.end_time || attempt.created_at || attempt.start_time || '';
    const parsed = raw ? Date.parse(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
};

const isBetterCompletedAttempt = (
    candidate: UserTestAttemptItem,
    currentBest: UserTestAttemptItem
): boolean => {
    if (candidate.score !== currentBest.score) {
        return candidate.score > currentBest.score;
    }
    const candTime = candidate.time_taken_seconds;
    const currTime = currentBest.time_taken_seconds;
    if (candTime !== currTime) {
        if (candTime !== null && currTime === null) return true;
        if (candTime === null && currTime !== null) return false;
        if (candTime !== null && currTime !== null && candTime !== currTime) {
            return candTime < currTime;
        }
    }
    return getAttemptSortTimestampMs(candidate) > getAttemptSortTimestampMs(currentBest);
};

/**
 * Pure aggregation computing completion rate, best score, average score, accuracy,
 * time spent, and resume targets across a mock test series (`DEC-0018`).
 */
export const computeSeriesProgressStats = (
    tests: any[],
    attempts: UserTestAttemptItem[]
): SeriesProgressStats => {
    const validTests = Array.isArray(tests) ? tests.filter((t) => t && t.id) : [];
    const testById = new Map<string, any>();
    for (const test of validTests) {
        testById.set(String(test.id), test);
    }

    const totalTests = validTests.length;
    const seriesAttempts = (Array.isArray(attempts) ? attempts : []).filter(
        (attempt) => attempt && attempt.test_id && testById.has(String(attempt.test_id))
    );

    const bestAttemptByTestId: Record<string, UserTestAttemptItem> = {};
    const inProgressAttempts: UserTestAttemptItem[] = [];
    const completedAttempts: UserTestAttemptItem[] = [];
    let totalTimeSpentSeconds = 0;

    for (const attempt of seriesAttempts) {
        const rawTime = Number(attempt.time_taken_seconds ?? 0);
        if (Number.isFinite(rawTime) && rawTime > 0) {
            totalTimeSpentSeconds += rawTime;
        }

        if (attempt.status === 'completed') {
            completedAttempts.push(attempt);
            const testId = String(attempt.test_id);
            const currentBest = bestAttemptByTestId[testId];
            if (!currentBest || isBetterCompletedAttempt(attempt, currentBest)) {
                bestAttemptByTestId[testId] = attempt;
            }
        } else if (attempt.status === 'in_progress') {
            inProgressAttempts.push(attempt);
        }
    }

    inProgressAttempts.sort(
        (a, b) =>
            (Date.parse(b.created_at || b.start_time || '') || 0) -
            (Date.parse(a.created_at || a.start_time || '') || 0)
    );
    const inProgressTestIds = Array.from(
        new Set(inProgressAttempts.map((attempt) => String(attempt.test_id)))
    );
    const activeInProgressAttempt =
        inProgressAttempts.length > 0
            ? {
                  testId: String(inProgressAttempts[0].test_id),
                  attemptId: String(inProgressAttempts[0].id),
              }
            : null;

    completedAttempts.sort(
        (a, b) => getAttemptSortTimestampMs(b) - getAttemptSortTimestampMs(a)
    );
    const latestCompletedTestId =
        completedAttempts.length > 0 ? String(completedAttempts[0].test_id) : null;

    const completedTestIds = Object.keys(bestAttemptByTestId);
    const completedTestsCount = completedTestIds.length;
    const completionPercent =
        totalTests > 0 ? Math.round((completedTestsCount / totalTests) * 100) : 0;

    let bestScoreMarks: number | null = null;
    let bestScoreTotalMarks: number | null = null;
    let bestScorePercent: number | null = null;
    let averageScorePercent: number | null = null;
    let averageScoreMarks: number | null = null;
    let uniformTotalMarks: number | null = null;
    let overallAccuracyPercent: number | null = null;

    if (completedTestsCount > 0) {
        let sumPercent = 0;
        let sumAccuracy = 0;
        let sumScores = 0;
        let topPercent = -Infinity;
        let topBestAttempt: UserTestAttemptItem | null = null;
        let topTotalMarks = 0;
        const completedTotalMarksSet = new Set<number>();

        for (const testId of completedTestIds) {
            const best = bestAttemptByTestId[testId];
            const testMeta = testById.get(testId);
            const rawTotalMarks = Number(testMeta?.total_marks ?? 0);
            const totalMarks = Number.isFinite(rawTotalMarks) && rawTotalMarks > 0 ? rawTotalMarks : 0;
            completedTotalMarksSet.add(totalMarks);

            const normalizedPct =
                totalMarks > 0 ? (best.score / totalMarks) * 100 : best.accuracy;

            sumPercent += normalizedPct;
            sumAccuracy += best.accuracy;
            sumScores += best.score;

            if (
                !topBestAttempt ||
                normalizedPct > topPercent ||
                (normalizedPct === topPercent && isBetterCompletedAttempt(best, topBestAttempt))
            ) {
                topPercent = normalizedPct;
                topBestAttempt = best;
                topTotalMarks = totalMarks;
            }
        }

        if (topBestAttempt) {
            bestScoreMarks = topBestAttempt.score;
            bestScoreTotalMarks = topTotalMarks > 0 ? topTotalMarks : null;
            bestScorePercent = Number(topPercent.toFixed(1));
        }

        averageScorePercent = Number((sumPercent / completedTestsCount).toFixed(1));
        overallAccuracyPercent = Number((sumAccuracy / completedTestsCount).toFixed(1));

        if (completedTotalMarksSet.size === 1) {
            const [onlyTotalMarks] = Array.from(completedTotalMarksSet);
            if (onlyTotalMarks > 0) {
                uniformTotalMarks = onlyTotalMarks;
                averageScoreMarks = Number((sumScores / completedTestsCount).toFixed(2));
            }
        }
    }

    return {
        totalTests,
        completedTestsCount,
        inProgressTestIds,
        completionPercent,
        bestScoreMarks,
        bestScoreTotalMarks,
        bestScorePercent,
        averageScorePercent,
        averageScoreMarks,
        uniformTotalMarks,
        overallAccuracyPercent,
        totalTimeSpentSeconds,
        latestCompletedTestId,
        activeInProgressAttempt,
        bestAttemptByTestId,
    };
};

const mergeLocalTestAttemptsIntoSeriesList = (
    baseAttempts: UserTestAttemptItem[],
    testIds: string[],
    userId: string
): UserTestAttemptItem[] => {
    const trimmedUserId = String(userId ?? '').trim();
    const byAttemptId = new Map<string, UserTestAttemptItem>();

    for (const rawAttempt of baseAttempts || []) {
        const sanitized = sanitizeUserTestAttempt(rawAttempt);
        if (!sanitized.id || !sanitized.test_id) continue;
        byAttemptId.set(sanitized.id, sanitized);
    }

    const allKnownTestIds = Array.from(
        new Set([
            ...testIds.map((id) => String(id ?? '').trim()).filter(Boolean),
            ...Array.from(byAttemptId.values()).map((a) => a.test_id),
        ])
    );

    if (trimmedUserId) {
        for (const testId of allKnownTestIds) {
            const localAttempts = getCachedUserTestAttemptsSnapshot(testId, trimmedUserId) ?? [];
            for (const localItem of localAttempts) {
                if (!localItem.id) continue;
                const existing = byAttemptId.get(localItem.id);
                if (!existing) {
                    if (
                        localItem.status !== 'in_progress' ||
                        !isTestAttemptLocallyCompleted(testId, localItem.id, trimmedUserId)
                    ) {
                        byAttemptId.set(localItem.id, localItem);
                    }
                    continue;
                }
                if (localItem.status === 'completed' && existing.status !== 'completed') {
                    byAttemptId.set(localItem.id, localItem);
                    continue;
                }
                if (localItem.status === 'in_progress' && existing.status === 'in_progress') {
                    const localTime = localItem.time_taken_seconds ?? 0;
                    const existingTime = existing.time_taken_seconds ?? 0;
                    if (
                        localTime > existingTime ||
                        getAttemptSortTimestampMs(localItem) > getAttemptSortTimestampMs(existing)
                    ) {
                        byAttemptId.set(localItem.id, localItem);
                    }
                }
            }

            const localActive = getCachedActivePreparedMockAttempt(testId, trimmedUserId);
            if (
                localActive &&
                localActive.status === 'in_progress' &&
                !isTestAttemptLocallyCompleted(testId, localActive.attemptId, trimmedUserId)
            ) {
                const existing = byAttemptId.get(localActive.attemptId);
                const localUpdatedMs = Date.parse(localActive.updatedAt || localActive.startedAt || '') || 0;
                const existingMs = existing ? getAttemptSortTimestampMs(existing) : 0;
                if (
                    !existing ||
                    (existing.status === 'in_progress' &&
                        (localUpdatedMs >= existingMs ||
                            localActive.elapsedSeconds >= (existing.time_taken_seconds ?? 0)))
                ) {
                    byAttemptId.set(localActive.attemptId, {
                        id: localActive.attemptId,
                        test_id: localActive.testId,
                        start_time: localActive.startedAt,
                        end_time: null,
                        time_taken_seconds: localActive.elapsedSeconds,
                        score: 0,
                        accuracy: 0,
                        status: 'in_progress',
                        created_at: localActive.startedAt,
                    });
                }
            }
        }
    }

    return Array.from(byAttemptId.values()).sort(
        (a, b) =>
            (Date.parse(b.created_at || b.start_time || b.end_time || '') || 0) -
            (Date.parse(a.created_at || a.start_time || a.end_time || '') || 0)
    );
};

/**
 * Synchronous 0ms cache lookup for user-scoped attempt history across an entire mock series (`DEC-0004`, `DEC-0018`).
 */
export const getCachedUserSeriesAttemptsSnapshot = (
    seriesId: string,
    userId?: string | null
): UserTestAttemptItem[] | null => {
    const trimmedSeriesId = String(seriesId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedSeriesId || !trimmedUserId) return null;

    const cacheKey = `${trimmedUserId}_${trimmedSeriesId}`;
    const bundleTestIds =
        getCachedSeriesBundleSnapshot(trimmedSeriesId)?.tests.map((t) => String(t?.id ?? '')) ?? [];

    const mem = memorySeriesAttemptsCache.get(cacheKey);
    if (mem && Array.isArray(mem.attempts)) {
        return mergeLocalTestAttemptsIntoSeriesList(
            mem.attempts.map(sanitizeUserTestAttempt),
            bundleTestIds,
            trimmedUserId
        );
    }

    const stored = safeReadLocalStorage<{ attempts: any[]; fetchedAt: number }>(
        `${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`
    );
    if (stored && Array.isArray(stored.attempts)) {
        const sanitized = stored.attempts.map(sanitizeUserTestAttempt);
        memorySeriesAttemptsCache.set(cacheKey, {
            attempts: sanitized,
            fetchedAt: stored.fetchedAt ?? Date.now(),
        });
        return mergeLocalTestAttemptsIntoSeriesList(sanitized, bundleTestIds, trimmedUserId);
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for user-scoped series attempts (`MindFlowDB.sync_metadata`).
 */
export const readUserSeriesAttemptsIndexedDBCache = async (
    seriesId: string,
    userId?: string | null
): Promise<UserTestAttemptItem[] | null> => {
    const syncSnapshot = getCachedUserSeriesAttemptsSnapshot(seriesId, userId);
    if (syncSnapshot !== null) return syncSnapshot;

    const trimmedSeriesId = String(seriesId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedSeriesId || !trimmedUserId) return null;

    const cacheKey = `${trimmedUserId}_${trimmedSeriesId}`;
    const bundleTestIds =
        getCachedSeriesBundleSnapshot(trimmedSeriesId)?.tests.map((t) => String(t?.id ?? '')) ?? [];

    try {
        const entry = await db.getCacheEntry<{ attempts: any[]; fetchedAt: number }>(
            `${MOCK_SERIES_ATTEMPTS_IDB_PREFIX}${cacheKey}`
        );
        if (entry?.data && Array.isArray(entry.data.attempts)) {
            const sanitized = entry.data.attempts.map(sanitizeUserTestAttempt);
            const payload = {
                attempts: sanitized,
                fetchedAt: entry.data.fetchedAt ?? Date.now(),
            };
            memorySeriesAttemptsCache.set(cacheKey, payload);
            safeWriteLocalStorage(`${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
            return mergeLocalTestAttemptsIntoSeriesList(sanitized, bundleTestIds, trimmedUserId);
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return null;
};

/**
 * Fetches user-scoped attempt summaries across all tests in a series (`DEC-0018`: zero `answers` JSONB),
 * merging offline local attempts and hydrating 0ms Memory/localStorage/IDB caches (`DEC-0004`).
 */
export const fetchUserSeriesAttempts = async (
    seriesId: string,
    testIds: string[],
    userId?: string | null
): Promise<UserTestAttemptItem[]> => {
    const trimmedSeriesId = String(seriesId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    const cleanTestIds = Array.from(
        new Set((Array.isArray(testIds) ? testIds : []).map((id) => String(id ?? '').trim()).filter(Boolean))
    );
    if (!trimmedSeriesId || !trimmedUserId || cleanTestIds.length === 0) return [];

    let query: any = supabase
        .from(DB_TABLES.MOCK.ATTEMPTS)
        .select('id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, created_at')
        .eq('user_id', trimmedUserId);
    if (typeof query.in === 'function') {
        query = query.in('test_id', cleanTestIds);
    }
    if (typeof query.order === 'function') {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    const testIdSet = new Set(cleanTestIds);
    const remoteAttempts = (Array.isArray(data) ? data : [])
        .filter((row) => row?.test_id && testIdSet.has(String(row.test_id)))
        .map(sanitizeUserTestAttempt);

    const merged = mergeLocalTestAttemptsIntoSeriesList(
        remoteAttempts,
        cleanTestIds,
        trimmedUserId
    );
    const cacheKey = `${trimmedUserId}_${trimmedSeriesId}`;
    const payload = { attempts: merged, fetchedAt: Date.now() };
    memorySeriesAttemptsCache.set(cacheKey, payload);
    safeWriteLocalStorage(`${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${cacheKey}`, payload);
    db.setCacheEntry?.(`${MOCK_SERIES_ATTEMPTS_IDB_PREFIX}${cacheKey}`, payload)?.catch(() => {});

    return merged;
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

const removeLocalStorageKeysByPrefixes = (prefixes: string[]): void => {
    const cleanPrefixes = prefixes.map((p) => String(p ?? '').trim()).filter(Boolean);
    if (cleanPrefixes.length === 0) return;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
                const storageKey = window.localStorage.key(i);
                if (
                    storageKey &&
                    cleanPrefixes.some((prefix) => storageKey.startsWith(prefix))
                ) {
                    window.localStorage.removeItem(storageKey);
                }
            }
        }
    } catch {
        // Ignore localStorage enumeration errors
    }
};

const purgeCatalogAndQuestionCachesInternal = (options: {
    scope: 'catalog' | 'questions';
    testId?: string;
    seriesId?: string;
    includeLeaderboards: boolean;
}): void => {
    const trimmedTestId = options.testId ? String(options.testId).trim() : '';
    const trimmedSeriesId = options.seriesId ? String(options.seriesId).trim() : '';

    memoryCatalogCache = null;
    memoryHomeCache = null;
    safeRemoveLocalStorage(MOCK_CATALOG_STORAGE_KEY);
    safeRemoveLocalStorage(MOCK_HOME_STORAGE_KEY);

    const lsPrefixes: string[] = [];
    const idbPrefixes: string[] = [MOCK_CATALOG_IDB_KEY, MOCK_HOME_IDB_KEY];

    if (trimmedTestId) {
        memoryTestDetailCache.delete(trimmedTestId);
        memoryTestQuestionsCache.delete(trimmedTestId);
        safeRemoveLocalStorage(`${MOCK_TEST_DETAIL_STORAGE_PREFIX}${trimmedTestId}`);
        safeRemoveLocalStorage(`${MOCK_TEST_QUESTIONS_STORAGE_PREFIX}${trimmedTestId}`);
        idbPrefixes.push(
            `${MOCK_TEST_DETAIL_IDB_PREFIX}${trimmedTestId}`,
            `${MOCK_TEST_QUESTIONS_IDB_PREFIX}${trimmedTestId}`
        );
        if (options.includeLeaderboards) {
            memoryLeaderboardCache.delete(trimmedTestId);
            safeRemoveLocalStorage(`${MOCK_LEADERBOARD_STORAGE_PREFIX}${trimmedTestId}`);
            idbPrefixes.push(`${MOCK_LEADERBOARD_IDB_PREFIX}${trimmedTestId}`);
        }
    } else {
        memoryTestDetailCache.clear();
        memoryTestQuestionsCache.clear();
        lsPrefixes.push(MOCK_TEST_DETAIL_STORAGE_PREFIX, MOCK_TEST_QUESTIONS_STORAGE_PREFIX);
        idbPrefixes.push(MOCK_TEST_DETAIL_IDB_PREFIX, MOCK_TEST_QUESTIONS_IDB_PREFIX);
        if (options.includeLeaderboards) {
            memoryLeaderboardCache.clear();
            lsPrefixes.push(MOCK_LEADERBOARD_STORAGE_PREFIX);
            idbPrefixes.push(MOCK_LEADERBOARD_IDB_PREFIX);
        }
    }

    if (trimmedSeriesId) {
        memorySeriesBundleCache.delete(trimmedSeriesId);
        safeRemoveLocalStorage(`${MOCK_SERIES_BUNDLE_STORAGE_PREFIX}${trimmedSeriesId}`);
        idbPrefixes.push(`${MOCK_SERIES_BUNDLE_IDB_PREFIX}${trimmedSeriesId}`);
        if (trimmedTestId) {
            for (const [bundleSeriesId, bundle] of Array.from(memorySeriesBundleCache.entries())) {
                if (
                    Array.isArray(bundle?.tests) &&
                    bundle.tests.some((t) => String(t?.id ?? '') === trimmedTestId)
                ) {
                    memorySeriesBundleCache.delete(bundleSeriesId);
                    safeRemoveLocalStorage(`${MOCK_SERIES_BUNDLE_STORAGE_PREFIX}${bundleSeriesId}`);
                    idbPrefixes.push(`${MOCK_SERIES_BUNDLE_IDB_PREFIX}${bundleSeriesId}`);
                }
            }
        }
    } else {
        memorySeriesBundleCache.clear();
        lsPrefixes.push(MOCK_SERIES_BUNDLE_STORAGE_PREFIX);
        idbPrefixes.push(MOCK_SERIES_BUNDLE_IDB_PREFIX);
    }

    removeLocalStorageKeysByPrefixes(lsPrefixes);
    db.deleteCacheEntriesByPrefix?.(idbPrefixes)?.catch(() => {});

    emitMockCacheInvalidatedEvent({
        scope: options.scope,
        ...(trimmedTestId ? { testId: trimmedTestId } : {}),
        ...(trimmedSeriesId ? { seriesId: trimmedSeriesId } : {}),
    });
};

/**
 * Invalidates admin-controlled mock-test catalog, series-bundle, test-detail, question-payload,
 * and optional leaderboard caches across Memory, `localStorage`, and `MindFlowDB.sync_metadata`,
 * broadcasting an epoch/event notification without disturbing active student attempts or attempt history (`DEC-0004`).
 */
export const invalidateMockTestsCatalogCaches = (options?: {
    testId?: string;
    seriesId?: string;
    includeLeaderboards?: boolean;
}): void => {
    purgeCatalogAndQuestionCachesInternal({
        scope: 'catalog',
        testId: options?.testId,
        seriesId: options?.seriesId,
        includeLeaderboards: options?.includeLeaderboards !== false,
    });
};

/**
 * Invalidates question-payload, test-detail, series-bundle, and catalog caches across
 * Memory, `localStorage`, and `MindFlowDB.sync_metadata` without clearing active student
 * attempt answers or attempt history (`DEC-0004`).
 */
export const invalidatePreparedMockQuestionCaches = (): void => {
    purgeCatalogAndQuestionCachesInternal({
        scope: 'questions',
        includeLeaderboards: false,
    });
};

/**
 * Invalidates user-scoped attempt history, continue-learning, and global leaderboard caches
 * after offline submission queue replay completes, without clearing active attempt or attempt detail caches.
 */
export const invalidatePreparedMockPostReplayCaches = (userId: string): void => {
    const trimmedUserId = String(userId ?? '').trim();

    memoryLeaderboardCache.clear();
    const lsPrefixes: string[] = [MOCK_LEADERBOARD_STORAGE_PREFIX];
    const idbPrefixes: string[] = [MOCK_LEADERBOARD_IDB_PREFIX];

    if (trimmedUserId) {
        memoryAttemptsCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${trimmedUserId}`);

        memoryContinueLearningCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`);

        const userPrefix = `${trimmedUserId}_`;
        for (const key of Array.from(memoryTestAttemptsCache.keys())) {
            if (key.startsWith(userPrefix)) {
                memoryTestAttemptsCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${key}`);
            }
        }
        for (const key of Array.from(memorySeriesAttemptsCache.keys())) {
            if (key.startsWith(userPrefix)) {
                memorySeriesAttemptsCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${key}`);
            }
        }

        lsPrefixes.push(
            `${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${userPrefix}`,
            `${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${userPrefix}`
        );
        idbPrefixes.push(
            `${MOCK_ATTEMPTS_IDB_PREFIX}${trimmedUserId}`,
            `${MOCK_CONTINUE_LEARNING_IDB_PREFIX}${trimmedUserId}`,
            `${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${userPrefix}`,
            `${MOCK_SERIES_ATTEMPTS_IDB_PREFIX}${userPrefix}`
        );
    }

    removeLocalStorageKeysByPrefixes(lsPrefixes);
    db.deleteCacheEntriesByPrefix?.(idbPrefixes)?.catch(() => {});
    emitMockCacheInvalidatedEvent({ scope: 'attempt_replay' });
};

/**
 * Clears all in-memory, `localStorage`, and IndexedDB prepared mock-test caches.
 */
export const clearPreparedMockTestsCache = (userId?: string | null): void => {
    memoryCatalogCache = null;
    memoryHomeCache = null;
    memoryTestDetailCache.clear();
    memoryTestQuestionsCache.clear();
    memorySeriesBundleCache.clear();
    memoryLeaderboardCache.clear();

    const trimmedUserId = userId ? String(userId).trim() : '';
    if (trimmedUserId) {
        memoryAttemptsCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_ATTEMPTS_STORAGE_PREFIX}${trimmedUserId}`);
        memorySavedTestsCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_SAVED_TESTS_STORAGE_PREFIX}${trimmedUserId}`);
        memoryContinueLearningCache.delete(trimmedUserId);
        safeRemoveLocalStorage(`${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`);

        const userPrefix = `${trimmedUserId}_`;
        for (const key of Array.from(memoryTestAttemptsCache.keys())) {
            if (key.startsWith(userPrefix)) {
                memoryTestAttemptsCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${key}`);
            }
        }
        for (const key of Array.from(memoryActiveAttemptCache.keys())) {
            if (key.startsWith(userPrefix)) {
                memoryActiveAttemptCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${key}`);
            }
        }
        for (const key of Array.from(memorySeriesAttemptsCache.keys())) {
            if (key.startsWith(userPrefix)) {
                memorySeriesAttemptsCache.delete(key);
                safeRemoveLocalStorage(`${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${key}`);
            }
        }

        removeLocalStorageKeysByPrefixes([
            MOCK_TEST_DETAIL_STORAGE_PREFIX,
            MOCK_TEST_QUESTIONS_STORAGE_PREFIX,
            MOCK_SERIES_BUNDLE_STORAGE_PREFIX,
            MOCK_LEADERBOARD_STORAGE_PREFIX,
            `${MOCK_TEST_ATTEMPTS_STORAGE_PREFIX}${userPrefix}`,
            `${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${userPrefix}`,
            `${MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX}${userPrefix}`,
        ]);

        db.deleteCacheEntriesByPrefix?.([
            MOCK_CATALOG_IDB_KEY,
            MOCK_HOME_IDB_KEY,
            MOCK_TEST_DETAIL_IDB_PREFIX,
            MOCK_TEST_QUESTIONS_IDB_PREFIX,
            MOCK_SERIES_BUNDLE_IDB_PREFIX,
            `${MOCK_ATTEMPTS_IDB_PREFIX}${trimmedUserId}`,
            `${MOCK_SAVED_TESTS_IDB_PREFIX}${trimmedUserId}`,
            `${MOCK_CONTINUE_LEARNING_IDB_PREFIX}${trimmedUserId}`,
            `${MOCK_TEST_ATTEMPTS_IDB_PREFIX}${userPrefix}`,
            `${MOCK_ACTIVE_ATTEMPT_IDB_PREFIX}${userPrefix}`,
            `${MOCK_SERIES_ATTEMPTS_IDB_PREFIX}${userPrefix}`,
            MOCK_LEADERBOARD_IDB_PREFIX,
        ])?.catch(() => {});
    } else {
        memoryAttemptsCache.clear();
        memoryTestAttemptsCache.clear();
        memorySavedTestsCache.clear();
        memoryActiveAttemptCache.clear();
        memoryContinueLearningCache.clear();
        memorySeriesAttemptsCache.clear();
        memoryAttemptDetailCache.clear();

        removeLocalStorageKeysByPrefixes([
            MOCK_TEST_DETAIL_STORAGE_PREFIX,
            MOCK_TEST_ATTEMPTS_STORAGE_PREFIX,
            MOCK_SAVED_TESTS_STORAGE_PREFIX,
            MOCK_ATTEMPTS_STORAGE_PREFIX,
            MOCK_TEST_QUESTIONS_STORAGE_PREFIX,
            MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX,
            MOCK_CONTINUE_LEARNING_STORAGE_PREFIX,
            MOCK_SERIES_BUNDLE_STORAGE_PREFIX,
            MOCK_SERIES_ATTEMPTS_STORAGE_PREFIX,
            MOCK_LEADERBOARD_STORAGE_PREFIX,
            MOCK_ATTEMPT_DETAIL_STORAGE_PREFIX,
        ]);

        db.deleteCacheEntriesByPrefix?.([
            MOCK_CATALOG_IDB_KEY,
            MOCK_HOME_IDB_KEY,
            MOCK_TEST_DETAIL_IDB_PREFIX,
            MOCK_TEST_ATTEMPTS_IDB_PREFIX,
            MOCK_SAVED_TESTS_IDB_PREFIX,
            MOCK_ATTEMPTS_IDB_PREFIX,
            MOCK_TEST_QUESTIONS_IDB_PREFIX,
            MOCK_ACTIVE_ATTEMPT_IDB_PREFIX,
            MOCK_CONTINUE_LEARNING_IDB_PREFIX,
            MOCK_SERIES_BUNDLE_IDB_PREFIX,
            MOCK_SERIES_ATTEMPTS_IDB_PREFIX,
            MOCK_LEADERBOARD_IDB_PREFIX,
            MOCK_ATTEMPT_DETAIL_IDB_PREFIX,
        ])?.catch(() => {});
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
    options?: { userId?: string | null; nowMs?: number; forceRefresh?: boolean }
): Promise<PreparedMockTestsResult> => {
    const exam = resolveCanonicalExamSlug(examIdOrSlug);
    if (!exam) {
        throw new Error(`Unknown exam identifier: ${examIdOrSlug}`);
    }

    const nowMs = options?.nowMs ?? Date.now();
    const userId = options?.userId ? String(options.userId).trim() : null;

    if (!options?.forceRefresh) {
        const cachedCatalog = readCatalogFromSyncCache();
        if (
            cachedCatalog &&
            isMockCacheFresh(cachedCatalog.fetchedAt, MOCK_SWR_STALE_TIMES_MS.CATALOG)
        ) {
            let attemptsFresh = !userId;
            let cachedAttemptIds: string[] = [];

            if (userId) {
                const memAttempts = memoryAttemptsCache.get(userId);
                const syncAttempts =
                    memAttempts ??
                    safeReadLocalStorage<{ ids: string[]; fetchedAt: number }>(
                        `${MOCK_ATTEMPTS_STORAGE_PREFIX}${userId}`
                    );
                if (
                    syncAttempts &&
                    Array.isArray(syncAttempts.ids) &&
                    isMockCacheFresh(syncAttempts.fetchedAt, MOCK_SWR_STALE_TIMES_MS.ATTEMPTS)
                ) {
                    if (!memAttempts) {
                        memoryAttemptsCache.set(userId, syncAttempts);
                    }
                    cachedAttemptIds = syncAttempts.ids;
                    attemptsFresh = true;
                }
            }

            if (attemptsFresh) {
                return materializePreparedMockTests(
                    exam,
                    cachedCatalog.categories,
                    cachedCatalog.series,
                    cachedCatalog.tests,
                    cachedAttemptIds,
                    nowMs,
                    'cache',
                    cachedCatalog.fetchedAt
                );
            }
        }
    }

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
    questionIds: string[],
    options?: { forceRefresh?: boolean }
): Promise<Question[]> => {
    const trimmedTestId = String(testId ?? '').trim();
    const orderedIds = normalizeQuestionIdsList(questionIds);
    if (!trimmedTestId || orderedIds.length === 0) return [];

    if (!options?.forceRefresh) {
        const expectedKey = orderedIds.join(',');
        const mem = memoryTestQuestionsCache.get(trimmedTestId);
        const stored = !mem
            ? safeReadLocalStorage<{
                  questions: any[];
                  questionIdsKey: string;
                  fetchedAt: number;
              }>(`${MOCK_TEST_QUESTIONS_STORAGE_PREFIX}${trimmedTestId}`)
            : null;
        const candidate = mem ?? stored;
        if (
            candidate &&
            Array.isArray(candidate.questions) &&
            candidate.questions.length > 0 &&
            candidate.questionIdsKey === expectedKey &&
            isMockCacheFresh(candidate.fetchedAt, MOCK_SWR_STALE_TIMES_MS.QUESTIONS)
        ) {
            if (mem) {
                return mem.questions;
            }
            const normalized = candidate.questions.map((q, idx) =>
                normalizePreparedMockQuestion(q, idx)
            );
            memoryTestQuestionsCache.set(trimmedTestId, {
                questions: normalized,
                questionIdsKey: candidate.questionIdsKey,
                fetchedAt: candidate.fetchedAt,
            });
            return normalized;
        }
    }

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
        if (isTestAttemptLocallyCompleted(trimmedTestId, candidate.attemptId, trimmedUserId)) {
            return false;
        }
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
            !isTestAttemptLocallyCompleted(trimmedTestId, fromActiveStore.attemptId, trimmedUserId) &&
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
            !isTestAttemptLocallyCompleted(trimmedTestId, fromCacheStore.attemptId, trimmedUserId) &&
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
        db.deleteCacheEntriesByPrefix?.([`${MOCK_ACTIVE_ATTEMPT_IDB_PREFIX}${cacheKey}`]) ??
            Promise.resolve(),
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
                    .eq('user_id', nextState.userId)
                    .eq('status', 'in_progress');
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

    let localCandidate = await readActivePreparedMockAttemptIndexedDB(
        testId,
        userId,
        requestedResumeId
    );
    if (localCandidate && isTestAttemptLocallyCompleted(testId, localCandidate.attemptId, userId)) {
        await clearActivePreparedMockAttemptCache(testId, userId);
        localCandidate = null;
    }

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
                        localCandidate = null;
                    }
                }
            } else {
                if (localCandidate?.attemptId) {
                    const { data: localStatusRow, error: localStatusErr } = await supabase
                        .from(DB_TABLES.MOCK.ATTEMPTS)
                        .select('id, status')
                        .eq('id', localCandidate.attemptId)
                        .eq('user_id', userId)
                        .maybeSingle();
                    if (!localStatusErr && localStatusRow && localStatusRow.status !== 'in_progress') {
                        await clearActivePreparedMockAttemptCache(testId, userId);
                        localCandidate = null;
                    }
                }
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

    const upsertPayload = {
        id: state.attemptId,
        user_id: state.userId,
        test_id: state.testId,
        start_time: state.startedAt,
        end_time: nowIso,
        time_taken_seconds: timeTakenSeconds,
        score: summary.score,
        accuracy: summary.accuracy,
        status: 'completed' as const,
        answers: cleanAnswers,
    };

    if (!remoteSynced) {
        useSyncStore.getState().addEvent({
            type: 'mock_test_attempt_submit',
            payload: upsertPayload,
        });
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

    // Cache full attempt detail (including answers JSONB and summary) for 0ms result hydration
    cachePreparedMockAttemptDetail({
        ...upsertPayload,
        created_at: state.startedAt,
    });

    syncContinueLearningOnLocalSubmit({
        userId: state.userId,
        testId: state.testId,
        test,
        attempt: completedAttempt,
        answeredCount: Object.keys(cleanAnswers).length,
    });

    return {
        attempt: completedAttempt,
        summary,
        remoteSynced,
    };
};

export interface PreparedMockCompletedAttemptDetail {
    id: string;
    test_id: string;
    user_id: string;
    start_time: string | null;
    end_time: string | null;
    time_taken_seconds: number | null;
    score: number;
    accuracy: number;
    status: 'completed' | 'in_progress' | 'abandoned';
    answers: Record<string, string>;
    created_at?: string | null;
}

const MOCK_ATTEMPT_DETAIL_STORAGE_PREFIX = 'mindflow_mock_attempt_detail_';
const MOCK_ATTEMPT_DETAIL_IDB_PREFIX = 'mindflow_mock_attempt_detail_idb_';
const memoryAttemptDetailCache = new Map<string, { detail: PreparedMockCompletedAttemptDetail; fetchedAt: number }>();

export const cachePreparedMockAttemptDetail = (detail: PreparedMockCompletedAttemptDetail): void => {
    if (!detail?.id) return;
    const cacheKey = String(detail.id).trim();
    const payload = { detail, fetchedAt: Date.now() };
    memoryAttemptDetailCache.set(cacheKey, payload);
    safeWriteLocalStorage(`${MOCK_ATTEMPT_DETAIL_STORAGE_PREFIX}${cacheKey}`, payload);
    db.setCacheEntry(`${MOCK_ATTEMPT_DETAIL_IDB_PREFIX}${cacheKey}`, payload).catch(() => {});
};

export const getCachedPreparedMockAttemptByIdSnapshot = (
    attemptId?: string | null
): PreparedMockCompletedAttemptDetail | null => {
    const trimmedId = String(attemptId ?? '').trim();
    if (!trimmedId) return null;

    const mem = memoryAttemptDetailCache.get(trimmedId);
    if (mem?.detail) return mem.detail;

    const stored = safeReadLocalStorage<{ detail?: PreparedMockCompletedAttemptDetail }>(
        `${MOCK_ATTEMPT_DETAIL_STORAGE_PREFIX}${trimmedId}`
    );
    if (stored?.detail) {
        memoryAttemptDetailCache.set(trimmedId, { detail: stored.detail, fetchedAt: Date.now() });
        return stored.detail;
    }

    return null;
};

export const readPreparedMockAttemptByIdIndexedDBCache = async (
    attemptId: string
): Promise<PreparedMockCompletedAttemptDetail | null> => {
    const trimmedId = String(attemptId ?? '').trim();
    if (!trimmedId) return null;
    try {
        const cached = await db.getCacheEntry<{ detail?: PreparedMockCompletedAttemptDetail }>(
            `${MOCK_ATTEMPT_DETAIL_IDB_PREFIX}${trimmedId}`
        );
        if (cached?.data?.detail) {
            memoryAttemptDetailCache.set(trimmedId, { detail: cached.data.detail, fetchedAt: Date.now() });
            safeWriteLocalStorage(`${MOCK_ATTEMPT_DETAIL_STORAGE_PREFIX}${trimmedId}`, cached.data);
            return cached.data.detail;
        }
    } catch {
        // IDB fallback
    }
    return null;
};

/**
 * Fetches a student's own completed mock test attempt including answers JSONB (DEC-0017).
 * Reads 0ms local snapshot first, then hydrates from Supabase if online.
 */
export const fetchPreparedMockAttemptById = async (
    testId: string,
    attemptId: string,
    userId: string
): Promise<PreparedMockCompletedAttemptDetail> => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedAttemptId = String(attemptId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();

    if (!trimmedAttemptId) {
        throw new Error('Attempt ID is required');
    }

    const syncSnapshot = getCachedPreparedMockAttemptByIdSnapshot(trimmedAttemptId);
    if (syncSnapshot && (!trimmedUserId || syncSnapshot.user_id === trimmedUserId)) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return syncSnapshot;
        }
    }

    const idbSnapshot = await readPreparedMockAttemptByIdIndexedDBCache(trimmedAttemptId);
    if (idbSnapshot && (!trimmedUserId || idbSnapshot.user_id === trimmedUserId)) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return idbSnapshot;
        }
    }

    let query = supabase
        .from(DB_TABLES.MOCK.ATTEMPTS)
        .select('id, test_id, user_id, start_time, end_time, time_taken_seconds, score, accuracy, status, answers, created_at')
        .eq('id', trimmedAttemptId);

    if (trimmedUserId) {
        query = query.eq('user_id', trimmedUserId);
    }
    if (trimmedTestId) {
        query = query.eq('test_id', trimmedTestId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        if (syncSnapshot) return syncSnapshot;
        if (idbSnapshot) return idbSnapshot;
        throw error;
    }

    if (!data) {
        if (syncSnapshot) return syncSnapshot;
        if (idbSnapshot) return idbSnapshot;
        throw new Error('Mock test attempt not found.');
    }

    const rawAnswers = (data.answers && typeof data.answers === 'object') ? data.answers : {};
    const cleanAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawAnswers)) {
        if (k !== '__cbt_meta' && typeof v === 'string') {
            cleanAnswers[k] = v;
        }
    }

    const detail: PreparedMockCompletedAttemptDetail = {
        id: String(data.id),
        test_id: String(data.test_id),
        user_id: String(data.user_id),
        start_time: data.start_time ?? null,
        end_time: data.end_time ?? null,
        time_taken_seconds: data.time_taken_seconds !== null ? Number(data.time_taken_seconds) : null,
        score: Number(data.score ?? 0),
        accuracy: Number(data.accuracy ?? 0),
        status: (data.status as PreparedMockCompletedAttemptDetail['status']) || 'completed',
        answers: cleanAnswers,
        created_at: data.created_at ?? null,
    };

    cachePreparedMockAttemptDetail(detail);
    return detail;
};

export interface PreparedMockSubjectBreakdown {
    subject: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    marks: number;
    accuracy: number;
}

/**
 * Computes subject-wise breakdown of scores, counts, and accuracy.
 */
export const computePreparedMockSubjectBreakdown = (
    questions: Question[],
    answers: Record<string, string>,
    marksPerQuestion: number,
    negativeMarks: number
): PreparedMockSubjectBreakdown[] => {
    const parsedNeg = Math.abs(Number(negativeMarks ?? 0));
    const safeNegativeMarks = Number.isFinite(parsedNeg) ? parsedNeg : 0;
    const subjectMap = new Map<string, { total: number; correct: number; wrong: number; unanswered: number }>();

    for (const q of questions) {
        const subject = (q.subject || q.classification?.subject || (q as any)?.properties?.subject || 'General').trim() || 'General';
        let stats = subjectMap.get(subject);
        if (!stats) {
            stats = { total: 0, correct: 0, wrong: 0, unanswered: 0 };
            subjectMap.set(subject, stats);
        }
        stats.total += 1;

        const selected = answers[q.id];
        if (!selected || String(selected).trim() === '') {
            stats.unanswered += 1;
        } else if (String(selected).trim() === String(q.correct ?? '').trim()) {
            stats.correct += 1;
        } else {
            stats.wrong += 1;
        }
    }

    const result: PreparedMockSubjectBreakdown[] = [];
    for (const [subject, stats] of subjectMap.entries()) {
        const attempted = stats.correct + stats.wrong;
        const rawScore = stats.correct * marksPerQuestion - stats.wrong * safeNegativeMarks;
        const marks = Number(rawScore.toFixed(2));
        const accuracy = attempted > 0 ? Number(((stats.correct / attempted) * 100).toFixed(1)) : 0;

        result.push({
            subject,
            totalQuestions: stats.total,
            correctCount: stats.correct,
            wrongCount: stats.wrong,
            unansweredCount: stats.unanswered,
            marks,
            accuracy,
        });
    }

    return result.sort((a, b) => b.totalQuestions - a.totalQuestions || a.subject.localeCompare(b.subject));
};

// ============================================================================
// CONTINUE LEARNING HUB: 3-TIER SWR CACHE & LOCAL/REMOTE RECONCILIATION (v1.0.375)
// ============================================================================

export interface ContinueLearningItem {
    attemptId: string;
    testId: string;
    seriesId: string | null;
    categoryId: string | null;
    testName: string;
    seriesName: string;
    categoryName: string;
    status: 'in_progress' | 'completed';
    answeredCount: number;
    totalQuestions: number;
    remainingSeconds: number | null;
    durationMinutes: number;
    score: number;
    totalMarks: number;
    passingMarks: number;
    accuracy: number;
    timeTakenSeconds: number | null;
    activityAt: string;
    release_date: string | null;
    expiry_date: string | null;
    is_published: boolean;
    series_is_published: boolean;
    category_is_active: boolean;
}

const parseContinueLearningTimestampMs = (raw?: string | null): number => {
    if (!raw) return 0;
    const ms = Date.parse(String(raw));
    return Number.isFinite(ms) ? ms : 0;
};

const sanitizeContinueLearningItem = (raw: any): ContinueLearningItem | null => {
    if (!raw || typeof raw !== 'object') return null;
    const attemptId = String(raw.attemptId ?? '').trim();
    const testId = String(raw.testId ?? '').trim();
    if (!attemptId || !testId) return null;

    const status: ContinueLearningItem['status'] =
        raw.status === 'completed' ? 'completed' : 'in_progress';
    const rawDuration = Number(raw.durationMinutes ?? 0);
    const rawTotalQ = Number(raw.totalQuestions ?? 0);
    const rawAnswered = Number(raw.answeredCount ?? 0);
    const rawScore = Number(raw.score ?? 0);
    const rawTotalMarks = Number(raw.totalMarks ?? 0);
    const rawPassingMarks = Number(raw.passingMarks ?? 0);
    const rawAccuracy = Number(raw.accuracy ?? 0);
    const rawRemaining =
        raw.remainingSeconds !== null && raw.remainingSeconds !== undefined
            ? Number(raw.remainingSeconds)
            : null;
    const rawTimeTaken =
        raw.timeTakenSeconds !== null && raw.timeTakenSeconds !== undefined
            ? Number(raw.timeTakenSeconds)
            : null;

    return {
        attemptId,
        testId,
        seriesId: raw.seriesId ? String(raw.seriesId) : null,
        categoryId: raw.categoryId ? String(raw.categoryId) : null,
        testName: String(raw.testName ?? 'Untitled Mock Test'),
        seriesName: String(raw.seriesName ?? 'Mock Series'),
        categoryName: String(raw.categoryName ?? 'Mock Test'),
        status,
        answeredCount: Number.isFinite(rawAnswered) && rawAnswered >= 0 ? Math.trunc(rawAnswered) : 0,
        totalQuestions: Number.isFinite(rawTotalQ) && rawTotalQ >= 0 ? Math.trunc(rawTotalQ) : 0,
        remainingSeconds:
            status === 'in_progress' && rawRemaining !== null && Number.isFinite(rawRemaining)
                ? Math.max(0, Math.trunc(rawRemaining))
                : null,
        durationMinutes: Number.isFinite(rawDuration) && rawDuration >= 0 ? rawDuration : 0,
        score: Number.isFinite(rawScore) ? rawScore : 0,
        totalMarks: Number.isFinite(rawTotalMarks) && rawTotalMarks >= 0 ? rawTotalMarks : 0,
        passingMarks: Number.isFinite(rawPassingMarks) && rawPassingMarks >= 0 ? rawPassingMarks : 0,
        accuracy: Number.isFinite(rawAccuracy) ? rawAccuracy : 0,
        timeTakenSeconds:
            rawTimeTaken !== null && Number.isFinite(rawTimeTaken)
                ? Math.max(0, Math.trunc(rawTimeTaken))
                : null,
        activityAt: String(raw.activityAt ?? new Date(0).toISOString()),
        release_date: raw.release_date ? String(raw.release_date) : null,
        expiry_date: raw.expiry_date ? String(raw.expiry_date) : null,
        is_published: raw.is_published !== false,
        series_is_published: raw.series_is_published !== false,
        category_is_active: raw.category_is_active !== false,
    };
};

const isContinueLearningItemVisible = (
    item: ContinueLearningItem,
    nowMs: number = Date.now()
): boolean =>
    item.is_published !== false &&
    item.series_is_published !== false &&
    item.category_is_active !== false &&
    isTestWithinScheduleWindow(
        { release_date: item.release_date, expiry_date: item.expiry_date },
        nowMs
    );

/**
 * Verifies whether a specific `attemptId` has already been submitted locally (`DEC-0004`)
 * so stale remote `in_progress` rows never revert a completed offline submission.
 */
export const isTestAttemptLocallyCompleted = (
    testId: string,
    attemptId: string,
    userId: string
): boolean => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedAttemptId = String(attemptId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedAttemptId) return false;

    const detailSnapshot = getCachedPreparedMockAttemptByIdSnapshot(trimmedAttemptId);
    if (
        detailSnapshot &&
        detailSnapshot.status === 'completed' &&
        (!trimmedUserId || !detailSnapshot.user_id || detailSnapshot.user_id === trimmedUserId) &&
        (!trimmedTestId || !detailSnapshot.test_id || detailSnapshot.test_id === trimmedTestId)
    ) {
        return true;
    }

    if (trimmedTestId && trimmedUserId) {
        const testAttempts = getCachedUserTestAttemptsSnapshot(trimmedTestId, trimmedUserId);
        if (
            Array.isArray(testAttempts) &&
            testAttempts.some((a) => a.id === trimmedAttemptId && a.status === 'completed')
        ) {
            return true;
        }
    }

    return false;
};

const findLocallyCompletedAttemptSnapshot = (
    testId: string,
    attemptId: string,
    userId: string
): {
    score: number;
    accuracy: number;
    timeTakenSeconds: number | null;
    answeredCount: number | null;
    activityAt: string | null;
} | null => {
    const trimmedTestId = String(testId ?? '').trim();
    const trimmedAttemptId = String(attemptId ?? '').trim();
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedAttemptId) return null;

    const detail = getCachedPreparedMockAttemptByIdSnapshot(trimmedAttemptId);
    if (
        detail &&
        detail.status === 'completed' &&
        (!trimmedUserId || !detail.user_id || detail.user_id === trimmedUserId) &&
        (!trimmedTestId || !detail.test_id || detail.test_id === trimmedTestId)
    ) {
        const cleanAnswerCount =
            detail.answers && typeof detail.answers === 'object'
                ? Object.keys(detail.answers).filter((k) => k !== '__cbt_meta').length
                : 0;
        return {
            score: Number.isFinite(Number(detail.score)) ? Number(detail.score) : 0,
            accuracy: Number.isFinite(Number(detail.accuracy)) ? Number(detail.accuracy) : 0,
            timeTakenSeconds:
                detail.time_taken_seconds !== null && detail.time_taken_seconds !== undefined
                    ? Number(detail.time_taken_seconds)
                    : null,
            answeredCount: cleanAnswerCount,
            activityAt: detail.end_time ?? detail.created_at ?? detail.start_time ?? null,
        };
    }

    if (trimmedTestId && trimmedUserId) {
        const attempts = getCachedUserTestAttemptsSnapshot(trimmedTestId, trimmedUserId);
        const match = attempts?.find(
            (a) => a.id === trimmedAttemptId && a.status === 'completed'
        );
        if (match) {
            return {
                score: match.score,
                accuracy: match.accuracy,
                timeTakenSeconds: match.time_taken_seconds,
                answeredCount: null,
                activityAt: match.end_time ?? match.created_at ?? match.start_time ?? null,
            };
        }
    }

    return null;
};

/**
 * Reads all active offline `in_progress` mock-test sessions for a user in 0ms
 * from `memoryActiveAttemptCache` and `window.localStorage`.
 */
export const readLocalActiveAttemptsForUser = (
    userId: string
): PreparedMockActiveAttemptState[] => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return [];

    const prefix = `${trimmedUserId}_`;
    const storagePrefix = `${MOCK_ACTIVE_ATTEMPT_STORAGE_PREFIX}${prefix}`;
    const byAttemptId = new Map<string, PreparedMockActiveAttemptState>();

    const considerCandidate = (raw: unknown, fallbackTestId?: string) => {
        const normalized = normalizeActiveAttemptState(raw, {
            testId: fallbackTestId,
            userId: trimmedUserId,
        });
        if (!normalized) return;
        if (normalized.userId !== trimmedUserId || normalized.status !== 'in_progress') return;
        if (isTestAttemptLocallyCompleted(normalized.testId, normalized.attemptId, trimmedUserId)) {
            return;
        }
        const existing = byAttemptId.get(normalized.attemptId);
        if (!existing) {
            byAttemptId.set(normalized.attemptId, normalized);
            return;
        }
        const existingMs = parseContinueLearningTimestampMs(existing.updatedAt || existing.startedAt);
        const nextMs = parseContinueLearningTimestampMs(normalized.updatedAt || normalized.startedAt);
        if (nextMs >= existingMs) {
            byAttemptId.set(normalized.attemptId, normalized);
        }
    };

    for (const [key, value] of memoryActiveAttemptCache.entries()) {
        if (key.startsWith(prefix) || value?.userId === trimmedUserId) {
            considerCandidate(value, value?.testId);
        }
    }

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            for (let i = 0; i < window.localStorage.length; i += 1) {
                const storageKey = window.localStorage.key(i);
                if (storageKey && storageKey.startsWith(storagePrefix)) {
                    const fallbackTestId = storageKey.slice(storagePrefix.length);
                    considerCandidate(safeReadLocalStorage<unknown>(storageKey), fallbackTestId);
                }
            }
        }
    } catch {
        // Ignore localStorage enumeration errors
    }

    return Array.from(byAttemptId.values());
};

interface ResolvedContinueLearningTestMeta {
    seriesId: string | null;
    categoryId: string | null;
    testName: string;
    seriesName: string;
    categoryName: string;
    totalQuestions: number;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    release_date: string | null;
    expiry_date: string | null;
    is_published: boolean;
    series_is_published: boolean;
    category_is_active: boolean;
}

const resolveContinueLearningTestMeta = (
    testId: string,
    row: any,
    catalogTests: any[] | undefined,
    nowMs: number
): ResolvedContinueLearningTestMeta | null => {
    const joinedTest = row?.[DB_TABLES.MOCK.TESTS] ?? row?.mock_tests ?? row?.test ?? null;
    const catalogMatch = Array.isArray(catalogTests)
        ? catalogTests.find((t) => t?.id === testId)
        : undefined;
    const testObj = joinedTest ?? catalogMatch ?? getCachedTestDetailsSnapshot(testId, nowMs);
    if (!testObj) return null;

    const syncCatalog = !joinedTest ? readCatalogFromSyncCache() : null;
    const seriesObj =
        testObj[DB_TABLES.MOCK.SERIES] ??
        testObj.mock_series ??
        testObj.test_series ??
        (testObj.series_id && syncCatalog?.series
            ? syncCatalog.series.find((s) => s?.id === testObj.series_id)
            : null);
    const categoryObj =
        seriesObj?.[DB_TABLES.MOCK.CATEGORIES] ??
        seriesObj?.mock_categories ??
        seriesObj?.exam_categories ??
        (seriesObj?.category_id && syncCatalog?.categories
            ? syncCatalog.categories.find((c) => c?.id === seriesObj.category_id)
            : null);

    const is_published = testObj.is_published !== false;
    const series_is_published = seriesObj
        ? seriesObj.is_published !== false
        : testObj.series_is_published !== false;
    const category_is_active = categoryObj
        ? categoryObj.is_active !== false
        : testObj.category_is_active !== false;
    const release_date = testObj.release_date ?? null;
    const expiry_date = testObj.expiry_date ?? null;

    if (
        !is_published ||
        !series_is_published ||
        !category_is_active ||
        !isTestWithinScheduleWindow({ release_date, expiry_date }, nowMs)
    ) {
        return null;
    }

    const totalQuestions = Array.isArray(testObj.question_ids)
        ? testObj.question_ids.length
        : Math.max(0, Number(testObj.question_count ?? 0) || 0);
    const durationMinutes = Math.max(0, Number(testObj.duration_minutes ?? 0) || 0);
    const totalMarks = Number(testObj.total_marks ?? 0) || 0;
    const passingMarks = Number(testObj.passing_marks ?? 0) || 0;

    return {
        seriesId: testObj.series_id ?? seriesObj?.id ?? null,
        categoryId: categoryObj?.id ?? seriesObj?.category_id ?? testObj.category_id ?? null,
        testName: String(testObj.name ?? 'Untitled Mock Test'),
        seriesName: String(seriesObj?.name ?? testObj.series_name ?? 'Mock Series'),
        categoryName: String(categoryObj?.name ?? testObj.category_name ?? 'Mock Test'),
        totalQuestions,
        durationMinutes,
        totalMarks,
        passingMarks,
        release_date: release_date ? String(release_date) : null,
        expiry_date: expiry_date ? String(expiry_date) : null,
        is_published,
        series_is_published,
        category_is_active,
    };
};

const dedupeAndSortContinueLearningItems = (
    items: ContinueLearningItem[],
    limit: number
): ContinueLearningItem[] => {
    const dedupedByTestId = new Map<string, ContinueLearningItem>();
    for (const item of items) {
        const current = dedupedByTestId.get(item.testId);
        if (!current) {
            dedupedByTestId.set(item.testId, item);
            continue;
        }
        if (item.status === 'in_progress' && current.status !== 'in_progress') {
            dedupedByTestId.set(item.testId, item);
            continue;
        }
        if (item.status === current.status) {
            if (
                parseContinueLearningTimestampMs(item.activityAt) >
                parseContinueLearningTimestampMs(current.activityAt)
            ) {
                dedupedByTestId.set(item.testId, item);
            }
        }
    }

    const sorted = Array.from(dedupedByTestId.values()).sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'in_progress' ? -1 : 1;
        }
        return (
            parseContinueLearningTimestampMs(b.activityAt) -
            parseContinueLearningTimestampMs(a.activityAt)
        );
    });

    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : 4;
    return sorted.slice(0, safeLimit);
};

/**
 * Pure projection builder for Continue Learning cards (`DEC-0017`, `DEC-0018`):
 * strips raw `answers` JSONB, reconciles offline active/completed attempts,
 * deduplicates to 1 card per `testId` (`in_progress` preferred), pins `in_progress` first,
 * and sorts newest `activityAt` DESC.
 */
export const buildContinueLearningItems = (params: {
    rows: any[];
    userId: string;
    localActiveAttempts?: PreparedMockActiveAttemptState[];
    catalogTests?: any[];
    limit?: number;
    nowMs?: number;
}): ContinueLearningItem[] => {
    const trimmedUserId = String(params.userId ?? '').trim();
    const nowMs = params.nowMs ?? Date.now();
    const limit = params.limit !== undefined ? params.limit : 4;
    const itemsByAttemptId = new Map<string, ContinueLearningItem>();

    for (const row of params.rows || []) {
        const attemptId = String(row?.id ?? '').trim();
        const testId = String(row?.test_id ?? '').trim();
        if (!attemptId || !testId) continue;

        const rawStatus = String(row?.status ?? '').trim();
        if (rawStatus === 'abandoned') continue;
        if (rawStatus !== 'in_progress' && rawStatus !== 'completed') continue;

        const meta = resolveContinueLearningTestMeta(testId, row, params.catalogTests, nowMs);
        if (!meta) continue;

        let status: 'in_progress' | 'completed' = rawStatus;
        const extracted = extractAttemptAnswersAndMeta(row?.answers);
        let answeredCount = Object.keys(extracted.answers).length;
        const totalDurationSeconds =
            meta.durationMinutes > 0 ? Math.round(meta.durationMinutes * 60) : 3600;

        const rawTimeTaken =
            row?.time_taken_seconds !== null && row?.time_taken_seconds !== undefined
                ? Number(row.time_taken_seconds)
                : null;
        let timeTakenSeconds =
            rawTimeTaken !== null && Number.isFinite(rawTimeTaken)
                ? Math.max(0, Math.trunc(rawTimeTaken))
                : null;

        let remainingSeconds: number | null = null;
        if (status === 'in_progress') {
            if (extracted.meta.remainingSeconds !== null) {
                remainingSeconds =
                    meta.durationMinutes > 0
                        ? Math.max(0, Math.min(totalDurationSeconds, extracted.meta.remainingSeconds))
                        : Math.max(0, extracted.meta.remainingSeconds);
            } else if (timeTakenSeconds !== null && meta.durationMinutes > 0) {
                remainingSeconds = Math.max(0, totalDurationSeconds - timeTakenSeconds);
            } else if (meta.durationMinutes > 0) {
                remainingSeconds = totalDurationSeconds;
            }
        }

        let score = Number.isFinite(Number(row?.score)) ? Number(row.score) : 0;
        let accuracy = Number.isFinite(Number(row?.accuracy)) ? Number(row.accuracy) : 0;
        let activityAt =
            status === 'completed'
                ? String(
                      row?.end_time ??
                          row?.created_at ??
                          row?.start_time ??
                          new Date(nowMs).toISOString()
                  )
                : String(
                      extracted.meta.updatedAt ??
                          row?.start_time ??
                          row?.created_at ??
                          new Date(nowMs).toISOString()
                  );

        if (
            status === 'in_progress' &&
            isTestAttemptLocallyCompleted(testId, attemptId, trimmedUserId)
        ) {
            status = 'completed';
            remainingSeconds = null;
            const localCompleted = findLocallyCompletedAttemptSnapshot(
                testId,
                attemptId,
                trimmedUserId
            );
            if (localCompleted) {
                score = localCompleted.score;
                accuracy = localCompleted.accuracy;
                timeTakenSeconds = localCompleted.timeTakenSeconds ?? timeTakenSeconds;
                if (localCompleted.answeredCount !== null) {
                    answeredCount = localCompleted.answeredCount;
                }
                if (localCompleted.activityAt) {
                    activityAt = localCompleted.activityAt;
                }
            }
        }

        itemsByAttemptId.set(attemptId, {
            attemptId,
            testId,
            seriesId: meta.seriesId,
            categoryId: meta.categoryId,
            testName: meta.testName,
            seriesName: meta.seriesName,
            categoryName: meta.categoryName,
            status,
            answeredCount,
            totalQuestions: meta.totalQuestions,
            remainingSeconds,
            durationMinutes: meta.durationMinutes,
            score,
            totalMarks: meta.totalMarks,
            passingMarks: meta.passingMarks,
            accuracy,
            timeTakenSeconds,
            activityAt,
            release_date: meta.release_date,
            expiry_date: meta.expiry_date,
            is_published: meta.is_published,
            series_is_published: meta.series_is_published,
            category_is_active: meta.category_is_active,
        });
    }

    for (const local of params.localActiveAttempts ?? []) {
        if (!local || !local.attemptId || !local.testId || local.status !== 'in_progress') continue;
        if (trimmedUserId && local.userId && local.userId !== trimmedUserId) continue;
        if (isTestAttemptLocallyCompleted(local.testId, local.attemptId, trimmedUserId)) {
            continue;
        }

        const localAnsweredCount =
            local.answers && typeof local.answers === 'object'
                ? Object.keys(local.answers).filter((k) => k !== '__cbt_meta').length
                : 0;
        const localActivityAt = String(
            local.updatedAt || local.startedAt || new Date(nowMs).toISOString()
        );
        const existing = itemsByAttemptId.get(local.attemptId);

        if (existing) {
            if (existing.status === 'completed') continue;
            if (
                parseContinueLearningTimestampMs(localActivityAt) >=
                parseContinueLearningTimestampMs(existing.activityAt)
            ) {
                existing.answeredCount = localAnsweredCount;
                existing.remainingSeconds = local.remainingSeconds;
                existing.timeTakenSeconds = local.elapsedSeconds;
                existing.activityAt = localActivityAt;
            }
            continue;
        }

        const meta = resolveContinueLearningTestMeta(
            local.testId,
            null,
            params.catalogTests,
            nowMs
        );
        if (!meta) continue;

        itemsByAttemptId.set(local.attemptId, {
            attemptId: local.attemptId,
            testId: local.testId,
            seriesId: meta.seriesId,
            categoryId: meta.categoryId,
            testName: meta.testName,
            seriesName: meta.seriesName,
            categoryName: meta.categoryName,
            status: 'in_progress',
            answeredCount: localAnsweredCount,
            totalQuestions: meta.totalQuestions,
            remainingSeconds: local.remainingSeconds,
            durationMinutes: meta.durationMinutes,
            score: 0,
            totalMarks: meta.totalMarks,
            passingMarks: meta.passingMarks,
            accuracy: 0,
            timeTakenSeconds: local.elapsedSeconds,
            activityAt: localActivityAt,
            release_date: meta.release_date,
            expiry_date: meta.expiry_date,
            is_published: meta.is_published,
            series_is_published: meta.series_is_published,
            category_is_active: meta.category_is_active,
        });
    }

    return dedupeAndSortContinueLearningItems(Array.from(itemsByAttemptId.values()), limit);
};

const reconcileCachedContinueLearningItems = (
    rawItems: ContinueLearningItem[],
    userId: string,
    nowMs: number,
    limit: number
): ContinueLearningItem[] => {
    const itemsByAttemptId = new Map<string, ContinueLearningItem>();
    const metaFallbackByTestId = new Map<string, ContinueLearningItem>();

    for (const rawItem of rawItems) {
        const item = sanitizeContinueLearningItem(rawItem);
        if (!item || !isContinueLearningItemVisible(item, nowMs)) continue;
        metaFallbackByTestId.set(item.testId, item);

        if (
            item.status === 'in_progress' &&
            isTestAttemptLocallyCompleted(item.testId, item.attemptId, userId)
        ) {
            const localCompleted = findLocallyCompletedAttemptSnapshot(
                item.testId,
                item.attemptId,
                userId
            );
            item.status = 'completed';
            item.remainingSeconds = null;
            if (localCompleted) {
                item.score = localCompleted.score;
                item.accuracy = localCompleted.accuracy;
                item.timeTakenSeconds = localCompleted.timeTakenSeconds ?? item.timeTakenSeconds;
                if (localCompleted.answeredCount !== null) {
                    item.answeredCount = localCompleted.answeredCount;
                }
                if (localCompleted.activityAt) {
                    item.activityAt = localCompleted.activityAt;
                }
            }
        }

        itemsByAttemptId.set(item.attemptId, item);
    }

    for (const local of readLocalActiveAttemptsForUser(userId)) {
        const localAnsweredCount =
            local.answers && typeof local.answers === 'object'
                ? Object.keys(local.answers).filter((k) => k !== '__cbt_meta').length
                : 0;
        const localActivityAt = String(
            local.updatedAt || local.startedAt || new Date(nowMs).toISOString()
        );
        const existing = itemsByAttemptId.get(local.attemptId);

        if (existing) {
            if (existing.status === 'completed') continue;
            if (
                parseContinueLearningTimestampMs(localActivityAt) >=
                parseContinueLearningTimestampMs(existing.activityAt)
            ) {
                existing.answeredCount = localAnsweredCount;
                existing.remainingSeconds = local.remainingSeconds;
                existing.timeTakenSeconds = local.elapsedSeconds;
                existing.activityAt = localActivityAt;
            }
            continue;
        }

        const meta = resolveContinueLearningTestMeta(local.testId, null, undefined, nowMs);
        const cachedMeta = metaFallbackByTestId.get(local.testId);
        if (!meta && !cachedMeta) continue;

        itemsByAttemptId.set(local.attemptId, {
            attemptId: local.attemptId,
            testId: local.testId,
            seriesId: meta?.seriesId ?? cachedMeta?.seriesId ?? null,
            categoryId: meta?.categoryId ?? cachedMeta?.categoryId ?? null,
            testName: meta?.testName ?? cachedMeta?.testName ?? 'Untitled Mock Test',
            seriesName: meta?.seriesName ?? cachedMeta?.seriesName ?? 'Mock Series',
            categoryName: meta?.categoryName ?? cachedMeta?.categoryName ?? 'Mock Test',
            status: 'in_progress',
            answeredCount: localAnsweredCount,
            totalQuestions: meta?.totalQuestions ?? cachedMeta?.totalQuestions ?? 0,
            remainingSeconds: local.remainingSeconds,
            durationMinutes: meta?.durationMinutes ?? cachedMeta?.durationMinutes ?? 0,
            score: 0,
            totalMarks: meta?.totalMarks ?? cachedMeta?.totalMarks ?? 0,
            passingMarks: meta?.passingMarks ?? cachedMeta?.passingMarks ?? 0,
            accuracy: 0,
            timeTakenSeconds: local.elapsedSeconds,
            activityAt: localActivityAt,
            release_date: meta?.release_date ?? cachedMeta?.release_date ?? null,
            expiry_date: meta?.expiry_date ?? cachedMeta?.expiry_date ?? null,
            is_published: meta?.is_published ?? cachedMeta?.is_published ?? true,
            series_is_published:
                meta?.series_is_published ?? cachedMeta?.series_is_published ?? true,
            category_is_active: meta?.category_is_active ?? cachedMeta?.category_is_active ?? true,
        });
    }

    return dedupeAndSortContinueLearningItems(Array.from(itemsByAttemptId.values()), limit);
};

const syncContinueLearningOnLocalSubmit = (params: {
    userId: string;
    testId: string;
    test: any;
    attempt: UserTestAttemptItem;
    answeredCount: number;
}): void => {
    const trimmedUserId = String(params.userId ?? '').trim();
    const trimmedTestId = String(params.testId ?? '').trim();
    if (!trimmedUserId || !trimmedTestId) return;

    const existingSync =
        memoryContinueLearningCache.get(trimmedUserId) ??
        safeReadLocalStorage<{ items: ContinueLearningItem[]; fetchedAt: number }>(
            `${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`
        );

    const existingItems = Array.isArray(existingSync?.items)
        ? existingSync.items
              .map(sanitizeContinueLearningItem)
              .filter((x): x is ContinueLearningItem => Boolean(x))
        : [];

    const existingForTest = existingItems.find((item) => item.testId === trimmedTestId);
    const resolvedMeta = params.test
        ? resolveContinueLearningTestMeta(
              trimmedTestId,
              { [DB_TABLES.MOCK.TESTS]: params.test },
              undefined,
              Date.now()
          )
        : null;

    if (!resolvedMeta && !existingForTest) return;

    const completedEntry: ContinueLearningItem = {
        attemptId: params.attempt.id,
        testId: trimmedTestId,
        seriesId: resolvedMeta?.seriesId ?? existingForTest?.seriesId ?? null,
        categoryId: resolvedMeta?.categoryId ?? existingForTest?.categoryId ?? null,
        testName: resolvedMeta?.testName ?? existingForTest?.testName ?? 'Untitled Mock Test',
        seriesName: resolvedMeta?.seriesName ?? existingForTest?.seriesName ?? 'Mock Series',
        categoryName: resolvedMeta?.categoryName ?? existingForTest?.categoryName ?? 'Mock Test',
        status: 'completed',
        answeredCount: params.answeredCount,
        totalQuestions: resolvedMeta?.totalQuestions ?? existingForTest?.totalQuestions ?? 0,
        remainingSeconds: null,
        durationMinutes: resolvedMeta?.durationMinutes ?? existingForTest?.durationMinutes ?? 0,
        score: params.attempt.score,
        totalMarks: resolvedMeta?.totalMarks ?? existingForTest?.totalMarks ?? 0,
        passingMarks: resolvedMeta?.passingMarks ?? existingForTest?.passingMarks ?? 0,
        accuracy: params.attempt.accuracy,
        timeTakenSeconds: params.attempt.time_taken_seconds,
        activityAt:
            params.attempt.end_time ??
            params.attempt.created_at ??
            params.attempt.start_time ??
            new Date().toISOString(),
        release_date: resolvedMeta?.release_date ?? existingForTest?.release_date ?? null,
        expiry_date: resolvedMeta?.expiry_date ?? existingForTest?.expiry_date ?? null,
        is_published: resolvedMeta?.is_published ?? existingForTest?.is_published ?? true,
        series_is_published:
            resolvedMeta?.series_is_published ?? existingForTest?.series_is_published ?? true,
        category_is_active:
            resolvedMeta?.category_is_active ?? existingForTest?.category_is_active ?? true,
    };

    const nextItems = dedupeAndSortContinueLearningItems(
        [completedEntry, ...existingItems.filter((item) => item.testId !== trimmedTestId)],
        12
    );
    const payload = { items: nextItems, fetchedAt: Date.now() };
    memoryContinueLearningCache.set(trimmedUserId, payload);
    safeWriteLocalStorage(`${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`, payload);
    db.setCacheEntry?.(`${MOCK_CONTINUE_LEARNING_IDB_PREFIX}${trimmedUserId}`, payload)?.catch(
        () => {}
    );
};

/**
 * Synchronous 0ms cache lookup for Continue Learning items (`DEC-0004`, `DEC-0017`, `DEC-0018`),
 * re-validating visibility & schedule window and overlaying active offline attempts in 0ms.
 */
export const getCachedContinueLearningSnapshot = (
    userId?: string | null,
    nowMs: number = Date.now(),
    limit: number = 4
): ContinueLearningItem[] | null => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return null;

    const mem = memoryContinueLearningCache.get(trimmedUserId);
    if (mem && Array.isArray(mem.items)) {
        return reconcileCachedContinueLearningItems(mem.items, trimmedUserId, nowMs, limit);
    }

    const stored = safeReadLocalStorage<{ items: ContinueLearningItem[]; fetchedAt: number }>(
        `${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`
    );
    if (stored && Array.isArray(stored.items)) {
        const sanitized = stored.items
            .map(sanitizeContinueLearningItem)
            .filter((item): item is ContinueLearningItem => Boolean(item));
        memoryContinueLearningCache.set(trimmedUserId, {
            items: sanitized,
            fetchedAt: stored.fetchedAt ?? Date.now(),
        });
        return reconcileCachedContinueLearningItems(sanitized, trimmedUserId, nowMs, limit);
    }

    const localActive = readLocalActiveAttemptsForUser(trimmedUserId);
    if (localActive.length > 0) {
        const projected = buildContinueLearningItems({
            rows: [],
            userId: trimmedUserId,
            localActiveAttempts: localActive,
            catalogTests: readCatalogFromSyncCache()?.tests,
            limit,
            nowMs,
        });
        if (projected.length > 0) {
            return projected;
        }
    }

    return null;
};

/**
 * Async IndexedDB fallback hydration for Continue Learning items (`MindFlowDB.sync_metadata`).
 */
export const readContinueLearningIndexedDBCache = async (
    userId?: string | null,
    nowMs: number = Date.now(),
    limit: number = 4
): Promise<ContinueLearningItem[] | null> => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return null;

    const hasSyncCache =
        memoryContinueLearningCache.has(trimmedUserId) ||
        safeReadLocalStorage<unknown>(`${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`) !==
            null;

    if (hasSyncCache) {
        return getCachedContinueLearningSnapshot(trimmedUserId, nowMs, limit);
    }

    try {
        const entry = await db.getCacheEntry<{
            items: ContinueLearningItem[];
            fetchedAt: number;
        }>(`${MOCK_CONTINUE_LEARNING_IDB_PREFIX}${trimmedUserId}`);
        if (entry?.data && Array.isArray(entry.data.items)) {
            const sanitized = entry.data.items
                .map(sanitizeContinueLearningItem)
                .filter((item): item is ContinueLearningItem => Boolean(item));
            const payload = {
                items: sanitized,
                fetchedAt: entry.data.fetchedAt ?? Date.now(),
            };
            memoryContinueLearningCache.set(trimmedUserId, payload);
            safeWriteLocalStorage(
                `${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`,
                payload
            );
            return reconcileCachedContinueLearningItems(sanitized, trimmedUserId, nowMs, limit);
        }
    } catch {
        // Ignore IndexedDB unavailability
    }

    return getCachedContinueLearningSnapshot(trimmedUserId, nowMs, limit);
};

/**
 * Fetches recent `in_progress` and `completed` prepared mock-test attempts for the authenticated student,
 * reconciles offline local sessions, persists a 12-item privacy-safe cache (`DEC-0018`),
 * and returns up to `options?.limit ?? 4` sorted items (`DEC-0004`, `DEC-0017`).
 */
export const fetchContinueLearningItems = async (
    userId?: string | null,
    options?: { limit?: number; nowMs?: number }
): Promise<ContinueLearningItem[]> => {
    const trimmedUserId = String(userId ?? '').trim();
    if (!trimmedUserId) return [];

    const nowMs = options?.nowMs ?? Date.now();
    const requestedLimit =
        options?.limit !== undefined && Number.isFinite(options.limit)
            ? Math.max(0, Math.trunc(options.limit))
            : 4;
    const cacheLimit = Math.max(12, requestedLimit);

    let query: any = supabase
        .from(DB_TABLES.MOCK.ATTEMPTS)
        .select(
            `id, test_id, user_id, start_time, end_time, time_taken_seconds, score, accuracy, status, answers, created_at, ${DB_TABLES.MOCK.TESTS}!inner(id, series_id, name, duration_minutes, total_marks, passing_marks, negative_marks, question_ids, is_published, release_date, expiry_date, ${DB_TABLES.MOCK.SERIES}!inner(id, category_id, name, is_published, ${DB_TABLES.MOCK.CATEGORIES}!inner(id, name, is_active)))`
        )
        .eq('user_id', trimmedUserId);
    if (typeof query.in === 'function') {
        query = query.in('status', ['in_progress', 'completed']);
    }
    if (typeof query.order === 'function') {
        query = query.order('created_at', { ascending: false });
    }
    if (typeof query.limit === 'function') {
        query = query.limit(25);
    }

    const { data, error } = await query;
    if (error) throw error;

    const fullItems = buildContinueLearningItems({
        rows: Array.isArray(data) ? data : [],
        userId: trimmedUserId,
        localActiveAttempts: readLocalActiveAttemptsForUser(trimmedUserId),
        catalogTests: readCatalogFromSyncCache()?.tests,
        limit: cacheLimit,
        nowMs,
    });

    const payload = { items: fullItems, fetchedAt: Date.now() };
    memoryContinueLearningCache.set(trimmedUserId, payload);
    safeWriteLocalStorage(`${MOCK_CONTINUE_LEARNING_STORAGE_PREFIX}${trimmedUserId}`, payload);
    db.setCacheEntry?.(`${MOCK_CONTINUE_LEARNING_IDB_PREFIX}${trimmedUserId}`, payload)?.catch(
        () => {}
    );

    return fullItems.slice(0, requestedLimit);
};
