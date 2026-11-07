/**
 * Self-contained offline caching layer for Answer Key Engine & Result Dashboard.
 * Compliant with Boundary directive (zero modifications to global src/lib/db.ts).
 */
import type { CachedCandidateResult, CachedDashboardSnapshot } from '../types';

const SNAPSHOT_KEY_PREFIX = 'mindflow_exam_dashboard_snapshot_';
const LATEST_SNAPSHOT_KEY = 'mindflow_latest_dashboard_snapshot_id';
const CANDIDATE_KEY_PREFIX = 'mindflow_exam_candidate_result_';
const LATEST_CANDIDATE_KEY = 'mindflow_latest_candidate_result_id';

export const answerKeyCache = {
  saveExamDashboardSnapshot: async (snapshot: CachedDashboardSnapshot): Promise<void> => {
    try {
      localStorage.setItem(`${SNAPSHOT_KEY_PREFIX}${snapshot.submission_id}`, JSON.stringify(snapshot));
      localStorage.setItem(LATEST_SNAPSHOT_KEY, snapshot.submission_id);
    } catch (e) {
      console.warn('[answerKeyCache] Failed to save dashboard snapshot:', e);
    }
  },

  getExamDashboardSnapshot: async (submissionId: string): Promise<CachedDashboardSnapshot | null> => {
    try {
      const data = localStorage.getItem(`${SNAPSHOT_KEY_PREFIX}${submissionId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getLatestExamDashboardSnapshot: async (): Promise<CachedDashboardSnapshot | null> => {
    try {
      const latestId = localStorage.getItem(LATEST_SNAPSHOT_KEY);
      if (!latestId) return null;
      return answerKeyCache.getExamDashboardSnapshot(latestId);
    } catch {
      return null;
    }
  },

  saveExamResult: async (result: CachedCandidateResult): Promise<void> => {
    try {
      localStorage.setItem(`${CANDIDATE_KEY_PREFIX}${result.id}`, JSON.stringify(result));
      localStorage.setItem(LATEST_CANDIDATE_KEY, result.id);
    } catch (e) {
      console.warn('[answerKeyCache] Failed to save candidate result:', e);
    }
  },

  getLatestExamResult: async (): Promise<CachedCandidateResult | null> => {
    try {
      const latestId = localStorage.getItem(LATEST_CANDIDATE_KEY);
      if (!latestId) return null;
      const data = localStorage.getItem(`${CANDIDATE_KEY_PREFIX}${latestId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};
