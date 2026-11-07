import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { answerKeyCache } from '../services/answerKeyCache';
import type { ResultDashboardData } from '../types';

export interface UseResultDashboardReturn {
  dashboard: ResultDashboardData | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 0ms Offline Cache Hydration + Background Supabase RPC Synchronization Hook.
 * Compliant with MindFlow Constitution Section 2 & 4.
 */
export function useResultDashboard(submissionId?: string): UseResultDashboardReturn {
  const [dashboard, setDashboard] = useState<ResultDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Monitor online / offline network state
  useEffect(() => {
    isMountedRef.current = true;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setError(null);

    // Step 1: 0ms Local Offline Cache Hydration
    try {
      let cachedSnapshot = null;
      if (submissionId) {
        cachedSnapshot = await answerKeyCache.getExamDashboardSnapshot(submissionId);
      } else {
        cachedSnapshot = await answerKeyCache.getLatestExamDashboardSnapshot();
      }

      if (cachedSnapshot?.dashboard_data && isMountedRef.current) {
        setDashboard(cachedSnapshot.dashboard_data);
        setIsLoading(false);
      }
    } catch (localErr) {
      console.warn('[useResultDashboard] Local cache miss:', localErr);
    }

    // If offline, stop here with cached data
    if (!navigator.onLine) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
      return;
    }

    // Step 2: Background Supabase RPC Synchronization
    try {
      if (isMountedRef.current) {
        setIsSyncing(true);
      }

      let targetId = submissionId;
      if (!targetId) {
        const localCandidate = await answerKeyCache.getLatestExamResult();
        if (localCandidate?.id) {
          targetId = localCandidate.id;
        } else {
          const { data: userSub, error: subErr } = await supabase
            .from('exam_submissions')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subErr) throw subErr;
          targetId = userSub?.id;
        }
      }

      if (!targetId) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsSyncing(false);
        }
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_result_dashboard', {
        p_submission_id: targetId,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data && isMountedRef.current) {
        const dashboardPayload = data as ResultDashboardData;
        setDashboard(dashboardPayload);

        await answerKeyCache.saveExamDashboardSnapshot({
          submission_id: targetId,
          exam_id: dashboardPayload.candidate?.exam_name || 'default_exam',
          cached_at: new Date().toISOString(),
          dashboard_data: dashboardPayload,
        });
      }
    } catch (err: any) {
      console.error('[useResultDashboard] Sync error:', err);
      if (isMountedRef.current) {
        if (!dashboard) {
          setError(err?.message || 'Failed to load scorecard dashboard.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  }, [submissionId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboard,
    isLoading,
    isSyncing,
    isOffline,
    error,
    refetch: fetchDashboardData,
  };
}
