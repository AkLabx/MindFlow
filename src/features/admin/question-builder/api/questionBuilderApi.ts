import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';
import { db } from '@/lib/db';
import {
    QuestionLightweight,
    QuestionFilterParams,
    FilterOptions,
    CANONICAL_EXAM_PREFIX
} from '../types/questionBuilder.types';
import { Question } from '@/types/models';
import {
    CANONICAL_EXAMS,
    getCanonicalExamById,
    resolveCanonicalExamNames
} from '@/features/dashboard/constants/examRegistry';

const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000;
const FILTER_OPTIONS_STORAGE_KEY = 'mindflow_qb_filter_options_v2';
const UUID_CHUNK_SIZE = 100;
export const MAX_QUICK_PICK_QUESTIONS = 300;

interface CachedFilterSnapshot {
    data: FilterOptions;
    fetchedAt: number;
}

let memoryFilterCache: CachedFilterSnapshot | null = null;
let inFlightFilterOptionsPromise: Promise<FilterOptions> | null = null;

const readStorageSnapshot = (): CachedFilterSnapshot | null => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(FILTER_OPTIONS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedFilterSnapshot;
        if (
            parsed &&
            typeof parsed.fetchedAt === 'number' &&
            parsed.data &&
            Array.isArray(parsed.data.subjects) &&
            Array.isArray(parsed.data.difficulties) &&
            Array.isArray(parsed.data.examNames) &&
            Array.isArray(parsed.data.examYears) &&
            Array.isArray(parsed.data.topics) &&
            Array.isArray(parsed.data.subTopics) &&
            Array.isArray(parsed.data.examDateShifts)
        ) {
            return parsed;
        }
    } catch {
        // Ignore storage read/parse failures
    }
    return null;
};

const writeStorageSnapshot = (snapshot: CachedFilterSnapshot): void => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(FILTER_OPTIONS_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
        // Ignore storage quota/access failures
    }
};

export const getCachedFilterOptions = (): FilterOptions | null => {
    if (memoryFilterCache) return memoryFilterCache.data;
    const stored = readStorageSnapshot();
    if (stored) {
        memoryFilterCache = stored;
        return stored.data;
    }
    return null;
};

export const clearFilterOptionsCache = (): void => {
    memoryFilterCache = null;
    inFlightFilterOptionsPromise = null;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(FILTER_OPTIONS_STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors
    }
};

const extractDistinctStrings = (rows: unknown): string[] => {
    if (!Array.isArray(rows)) return [];
    const set = new Set<string>();
    for (const row of rows) {
        const raw = typeof row === 'string' ? row : (row as { value?: unknown })?.value;
        if (raw === null || raw === undefined) continue;
        const trimmed = String(raw).trim();
        if (trimmed) set.add(trimmed);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const extractDistinctYears = (rows: unknown): number[] => {
    if (!Array.isArray(rows)) return [];
    const set = new Set<number>();
    for (const row of rows) {
        const raw = typeof row === 'string' || typeof row === 'number'
            ? row
            : (row as { value?: unknown })?.value;
        if (raw === null || raw === undefined) continue;
        const trimmed = String(raw).trim();
        if (!trimmed) continue;
        const parsed = Number.parseInt(trimmed, 10);
        if (Number.isFinite(parsed)) {
            set.add(parsed);
        }
    }
    return Array.from(set).sort((a, b) => b - a);
};

const buildFilterOptionsFromMetadataCache = async (): Promise<FilterOptions | null> => {
    const rows = await db.getQuizMetadataCache();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const subjects = new Set<string>();
    const difficulties = new Set<string>();
    const examNames = new Set<string>();
    const examYears = new Set<number>();
    const topics = new Set<string>();
    const subTopics = new Set<string>();
    const examDateShifts = new Set<string>();

    const addStr = (target: Set<string>, val: unknown) => {
        if (val === null || val === undefined) return;
        const trimmed = String(val).trim();
        if (trimmed) target.add(trimmed);
    };

    for (const row of rows) {
        addStr(subjects, row.classification?.subject || row.subject);
        addStr(topics, row.classification?.topic || row.topic);
        addStr(subTopics, row.classification?.subTopic || row.subTopic);
        addStr(difficulties, row.properties?.difficulty || row.difficulty);
        addStr(examNames, row.sourceInfo?.examName || row.examName);
        addStr(examDateShifts, row.sourceInfo?.examDateShift || row.examDateShift);

        const rawYear = row.sourceInfo?.examYear || row.examYear;
        if (rawYear !== null && rawYear !== undefined && String(rawYear).trim() !== '') {
            const parsed = Number.parseInt(String(rawYear).trim(), 10);
            if (Number.isFinite(parsed)) examYears.add(parsed);
        }
    }

    return {
        subjects: Array.from(subjects).sort((a, b) => a.localeCompare(b)),
        difficulties: Array.from(difficulties).sort((a, b) => a.localeCompare(b)),
        examNames: Array.from(examNames).sort((a, b) => a.localeCompare(b)),
        examYears: Array.from(examYears).sort((a, b) => b - a),
        topics: Array.from(topics).sort((a, b) => a.localeCompare(b)),
        subTopics: Array.from(subTopics).sort((a, b) => a.localeCompare(b)),
        examDateShifts: Array.from(examDateShifts).sort((a, b) => a.localeCompare(b)),
    };
};

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
    const now = Date.now();
    if (memoryFilterCache && now - memoryFilterCache.fetchedAt < FILTER_OPTIONS_TTL_MS) {
        return memoryFilterCache.data;
    }

    const stored = !memoryFilterCache ? readStorageSnapshot() : null;
    if (stored && now - stored.fetchedAt < FILTER_OPTIONS_TTL_MS) {
        memoryFilterCache = stored;
        return stored.data;
    }

    if (inFlightFilterOptionsPromise) {
        return inFlightFilterOptionsPromise;
    }

    inFlightFilterOptionsPromise = (async (): Promise<FilterOptions> => {
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                throw new Error('Offline: cannot fetch distinct filter options');
            }

            const [
                subjectRes,
                difficultyRes,
                examNameRes,
                examYearRes,
                topicRes,
                subTopicRes,
                examDateShiftRes,
            ] = await Promise.all([
                supabase.rpc('get_distinct_values', { column_name: 'subject' }),
                supabase.rpc('get_distinct_values', { column_name: 'difficulty' }),
                supabase.rpc('get_distinct_values', { column_name: 'examName' }),
                supabase.rpc('get_distinct_values', { column_name: 'examYear' }),
                supabase.rpc('get_distinct_values', { column_name: 'topic' }),
                supabase.rpc('get_distinct_values', { column_name: 'subTopic' }),
                supabase.rpc('get_distinct_values', { column_name: 'examDateShift' }),
            ]);

            const rpcError =
                subjectRes.error ||
                difficultyRes.error ||
                examNameRes.error ||
                examYearRes.error ||
                topicRes.error ||
                subTopicRes.error ||
                examDateShiftRes.error;

            if (rpcError) throw rpcError;

            const options: FilterOptions = {
                subjects: extractDistinctStrings(subjectRes.data),
                difficulties: extractDistinctStrings(difficultyRes.data),
                examNames: extractDistinctStrings(examNameRes.data),
                examYears: extractDistinctYears(examYearRes.data),
                topics: extractDistinctStrings(topicRes.data),
                subTopics: extractDistinctStrings(subTopicRes.data),
                examDateShifts: extractDistinctStrings(examDateShiftRes.data),
            };

            const snapshot: CachedFilterSnapshot = {
                data: options,
                fetchedAt: Date.now(),
            };
            memoryFilterCache = snapshot;
            writeStorageSnapshot(snapshot);
            return options;
        } catch (err) {
            const staleCache = memoryFilterCache?.data ?? readStorageSnapshot()?.data;
            if (staleCache) {
                return staleCache;
            }

            try {
                const offlineFallback = await buildFilterOptionsFromMetadataCache();
                if (offlineFallback) {
                    return offlineFallback;
                }
            } catch {
                // Fall through and throw original error
            }

            throw err;
        }
    })().finally(() => {
        inFlightFilterOptionsPromise = null;
    });

    return inFlightFilterOptionsPromise;
};

const sanitizePostgrestSearch = (raw: string | undefined): string => {
    if (!raw) return '';
    return raw.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
};

const QUESTION_LIGHTWEIGHT_SELECT =
    'id, v1_id, question, subject, topic, subTopic, difficulty, examName, examYear, examDateShift, questionType, tags, explanation, options, correct';

const applyQuestionFilters = <T extends Record<string, any>>(
    initialQuery: T,
    params: QuestionFilterParams
): { query: T; empty: boolean } => {
    let query: any = initialQuery;

    const sanitizedSearch = sanitizePostgrestSearch(params.search);
    if (sanitizedSearch) {
        // Broadened search to include subject and topic
        query = query.or(
            `question.ilike.%${sanitizedSearch}%,v1_id.ilike.%${sanitizedSearch}%,subject.ilike.%${sanitizedSearch}%,topic.ilike.%${sanitizedSearch}%`
        );
    }

    if (params.subject) query = query.eq('subject', params.subject);
    if (params.topic) query = query.eq('topic', params.topic);
    if (params.subTopic) query = query.eq('subTopic', params.subTopic);
    if (params.difficulty) query = query.eq('difficulty', params.difficulty);

    if (params.examName) {
        const knownExamNames = getCachedFilterOptions()?.examNames;
        const trimmedExam = params.examName.trim();

        if (trimmedExam.startsWith(CANONICAL_EXAM_PREFIX)) {
            const canonicalId = trimmedExam.slice(CANONICAL_EXAM_PREFIX.length);
            const exam = getCanonicalExamById(canonicalId);
            const resolvedNames = resolveCanonicalExamNames(exam ?? canonicalId, knownExamNames);
            if (resolvedNames.length === 0) {
                return { query, empty: true };
            }
            query = query.in('examName', resolvedNames);
        } else {
            const lowerExam = trimmedExam.toLowerCase();
            const matchedCanonical = CANONICAL_EXAMS.find(
                e => e.id.toLowerCase() === lowerExam || e.displayName.toLowerCase() === lowerExam
            );
            if (matchedCanonical) {
                const resolvedNames = resolveCanonicalExamNames(matchedCanonical, knownExamNames);
                if (resolvedNames.length === 0) {
                    return { query, empty: true };
                }
                query = query.in('examName', resolvedNames);
            } else {
                query = query.eq('examName', params.examName);
            }
        }
    }

    if (params.examYear) query = query.eq('examYear', params.examYear);
    if (params.examDateShift) query = query.eq('examDateShift', params.examDateShift);

    // Ordering by creation date descending to show latest first when empty search
    query = query.order('created_at', { ascending: false });

    return { query, empty: false };
};

export const searchQuestions = async (
    params: QuestionFilterParams,
    page: number = 0,
    limit: number = 25
): Promise<{ data: QuestionLightweight[]; total: number }> => {
    const baseQuery = supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .select(QUESTION_LIGHTWEIGHT_SELECT, { count: 'exact' })
        .is('deleted_at', null);

    const { query: filteredQuery, empty } = applyQuestionFilters(baseQuery, params);
    if (empty) {
        return { data: [], total: 0 };
    }

    // Pagination
    const from = page * limit;
    const to = from + limit - 1;
    const query = filteredQuery.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        data: (data || []) as unknown as QuestionLightweight[],
        total: count || 0
    };
};

export const fetchMatchingQuestionsSlice = async (
    params: QuestionFilterParams,
    limit: number
): Promise<QuestionLightweight[]> => {
    const numericLimit = Number.isFinite(limit) ? Math.trunc(limit) : 1;
    const clampedLimit = Math.max(1, Math.min(MAX_QUICK_PICK_QUESTIONS, numericLimit));

    const baseQuery = supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .select(QUESTION_LIGHTWEIGHT_SELECT)
        .is('deleted_at', null);

    const { query: filteredQuery, empty } = applyQuestionFilters(baseQuery, params);
    if (empty) {
        return [];
    }

    const { data, error } = await filteredQuery.range(0, clampedLimit - 1);

    if (error) throw error;

    return (data || []) as unknown as QuestionLightweight[];
};

export const fetchQuestionsByUUIDs = async (ids: string[]): Promise<QuestionLightweight[]> => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) return [];

    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += UUID_CHUNK_SIZE) {
        chunks.push(uniqueIds.slice(i, i + UUID_CHUNK_SIZE));
    }

    const responses = await Promise.all(
        chunks.map(chunk =>
            supabase
                .from(DB_TABLES.BANK.QUESTIONS)
                .select('id, v1_id, question, subject, topic, subTopic, difficulty, examName, examYear, examDateShift, questionType, tags, explanation, options, correct')
                .is('deleted_at', null)
                .in('id', chunk)
        )
    );

    const results: QuestionLightweight[] = [];
    for (const res of responses) {
        if (res.error) throw res.error;
        if (res.data) {
            results.push(...(res.data as unknown as QuestionLightweight[]));
        }
    }

    return results;
};

export type QuestionPreviewRecord = Question & {
    deleted_at?: string | null;
    status?: string | null;
};

export const fetchQuestionPreview = async (id: string): Promise<QuestionPreviewRecord | null> => {
    const query = supabase
        .from(DB_TABLES.BANK.QUESTIONS)
        .select('*')
        .eq('id', id);

    const { data, error } = typeof (query as any).maybeSingle === 'function'
        ? await (query as any).maybeSingle()
        : await query.single();

    if (error) throw error;

    return (data as QuestionPreviewRecord) ?? null;
};
