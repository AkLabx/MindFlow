import { db } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { telemetry } from '@/lib/telemetry';
import { invalidateQuestionMetadataMemoryCache } from '@/features/quiz/hooks/useQuestionMetadata';
import { clearFilterOptionsCache } from '@/features/admin/question-builder/api/questionBuilderApi';
import {
  ADMIN_TEST_ANALYTICS_IDB_PREFIX,
  invalidateMockTestAnalyticsCache,
} from '@/features/admin/test-series/api/adminTestSeriesApi';
import { invalidatePreparedMockQuestionCaches } from '@/features/mock-tests/api/mockTestsApi';

const SUBJECT_COUNTS_STORAGE_KEY = 'mindflow_subject_counts';
const EXAM_COUNTS_STORAGE_KEY = 'mindflow_exam_counts_cache_v1';
const QUIZ_METADATA_SYNC_KEY = 'quiz_metadata_sync';

export interface QuestionBankInvalidationOptions {
  questionIds?: string[];
  deletedIds?: string[];
  action?: 'save' | 'soft_delete' | 'bulk_soft_delete' | 'bulk_update' | 'image_update' | 'review_update';
}

/**
 * Single authoritative coordinator for invalidating all React Query, `localStorage`,
 * in-memory singleton, and `MindFlowDB` IndexedDB caches affected by question edits,
 * image updates, review approvals, or soft-deletes (`DEC-0004`, `DEC-0018`).
 */
export const invalidateQuestionBankCaches = async (
  options: QuestionBankInvalidationOptions = {}
): Promise<void> => {
  const cleanQuestionIds = Array.from(
    new Set((options.questionIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean))
  );
  const cleanDeletedIds = Array.from(
    new Set((options.deletedIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean))
  );

  // 1. In-memory & localStorage feature caches
  try {
    invalidateQuestionMetadataMemoryCache();
  } catch {
    // Non-fatal in isolated test runners
  }

  try {
    clearFilterOptionsCache();
  } catch {
    // Non-fatal
  }

  try {
    invalidateMockTestAnalyticsCache();
  } catch {
    // Non-fatal
  }

  try {
    invalidatePreparedMockQuestionCaches();
  } catch {
    // Non-fatal
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SUBJECT_COUNTS_STORAGE_KEY);
      window.localStorage.removeItem(EXAM_COUNTS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }

  // 2. React Query caches (dashboard counts, taxonomy, images, admin queues)
  try {
    const invalidations: Promise<unknown>[] = [
      queryClient.invalidateQueries({ queryKey: ['dashboard-subject-counts'] }),
      queryClient.invalidateQueries({ queryKey: ['subject-taxonomy'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] }),
    ];

    if (cleanQuestionIds.length > 0 || cleanDeletedIds.length > 0) {
      const impactedIds = Array.from(new Set([...cleanQuestionIds, ...cleanDeletedIds]));
      for (const qId of impactedIds) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: ['question-image', 'question', qId] }));
        invalidations.push(queryClient.invalidateQueries({ queryKey: ['question-image', 'explanation', qId] }));
      }
    } else {
      invalidations.push(queryClient.invalidateQueries({ queryKey: ['question-image'] }));
    }

    await Promise.allSettled(invalidations);
  } catch {
    // Non-fatal if queryClient is mocked/unavailable
  }

  // 3. MindFlowDB IndexedDB stores (`quiz_metadata_cache` & `sync_metadata`)
  try {
    const idbOps: Promise<unknown>[] = [];
    if (cleanDeletedIds.length > 0 && typeof db?.deleteQuizMetadataCache === 'function') {
      idbOps.push(db.deleteQuizMetadataCache(cleanDeletedIds));
    }
    if (typeof db?.deleteCacheEntriesByPrefix === 'function') {
      idbOps.push(
        db.deleteCacheEntriesByPrefix([ADMIN_TEST_ANALYTICS_IDB_PREFIX, QUIZ_METADATA_SYNC_KEY])
      );
    }
    if (idbOps.length > 0) {
      await Promise.allSettled(idbOps);
    }
  } catch {
    // Ignore IndexedDB unavailability
  }

  // 4. Privacy-preserving diagnostic telemetry (zero PII)
  try {
    telemetry.emit('offline_sync_completed', {
      recordsSynced: Math.max(1, cleanQuestionIds.length + cleanDeletedIds.length),
      durationMs: 0,
    });
  } catch {
    // Ignore telemetry failures
  }
};
