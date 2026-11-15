import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/db';
import { fetchQuestionMetadata } from '../services/questionService';
import { Question } from '../types';

interface UseQuestionMetadataReturn {
  metadata: Question[];
  isLoading: boolean;
  error: string | null;
  progress: { current: number; total: number };
  refresh: () => Promise<void>;
}

let memoryMetadataCache: Question[] | null = null;
let lastDeltaCheckTime = 0;
const DELTA_CHECK_TTL_MS = 5 * 60 * 1000;

/**
 * Hook to retrieve the lightweight question metadata catalog.
 * It serves as the single architectural owner of cache warming:
 * - Reads instantly from memory singleton / IndexedDB cache.
 * - If cache is empty or TTL expired, it transparently triggers the Delta Sync fetch.
 * - Returns the resulting metadata array for UI consumption.
 */
export const useQuestionMetadata = (): UseQuestionMetadataReturn => {
  const [metadata, setMetadata] = useState<Question[]>(() => memoryMetadataCache || []);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !memoryMetadataCache || memoryMetadataCache.length === 0
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const loadMetadata = useCallback(async (forceRefresh = false) => {
    let hasCachedData = Boolean(!forceRefresh && memoryMetadataCache && memoryMetadataCache.length > 0);
    try {
      if (!forceRefresh && memoryMetadataCache && memoryMetadataCache.length > 0) {
        setMetadata(memoryMetadataCache);
        setIsLoading(false);
        if (Date.now() - lastDeltaCheckTime < DELTA_CHECK_TTL_MS) {
          return;
        }
      } else {
        setIsLoading(true);
      }

      setError(null);
      setProgress({ current: 0, total: 0 });

      // 1. Instantly load from cache (0ms offline-first per Constitution Section 5)
      if (!forceRefresh && !hasCachedData) {
        const cacheStart = performance.now();
        const cachedMetadata = await db.getQuizMetadataCache();
        if (cachedMetadata && cachedMetadata.length > 0) {
          hasCachedData = true;
          memoryMetadataCache = cachedMetadata;
          const duration = Math.round(performance.now() - cacheStart);
          if (import.meta.env.DEV) {
            console.log(`[useQuestionMetadata] IndexedDB cache hit: ${cachedMetadata.length} items in ${duration}ms`);
          }
          setMetadata(cachedMetadata);
          setIsLoading(false); // Instantly render UI for fast cache hit
        }
      }

      // 2. Fetch delta in the background (or foreground if no cache / forced)
      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      }, forceRefresh);

      // 3. Update state & singleton memory cache
      memoryMetadataCache = data;
      lastDeltaCheckTime = Date.now();
      setMetadata(data);

      if (data.length === 0) {
        console.warn("No questions fetched from database.");
      }
    } catch (err: any) {
      console.error("Failed to load questions:", err);
      if (!hasCachedData) {
        setError("Failed to load question bank. Please check your internet connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return { metadata, isLoading, error, progress, refresh: () => loadMetadata(true) };
};
