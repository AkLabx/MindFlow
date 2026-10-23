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

/**
 * Hook to retrieve the lightweight question metadata catalog.
 * It serves as the single architectural owner of cache warming:
 * - Reads instantly from IndexedDB cache.
 * - If cache is empty, it transparently triggers the Delta Sync fetch.
 * - Returns the resulting metadata array for UI consumption.
 */
export const useQuestionMetadata = (): UseQuestionMetadataReturn => {
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const loadMetadata = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      // 1. Instantly load from cache
      if (!forceRefresh) {
        const cachedMetadata = await db.getQuizMetadataCache();
        if (cachedMetadata && cachedMetadata.length > 0) {
          setMetadata(cachedMetadata);
          setIsLoading(false); // Instantly render UI for fast cache hit
        }
      }

      // 2. Fetch delta in the background (or foreground if no cache / forced)
      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      // 3. Update state
      setMetadata(data);

      if (data.length === 0) {
        console.warn("No questions fetched from database.");
      }
    } catch (err: any) {
      console.error("Failed to load questions:", err);
      setError("Failed to load question bank. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return { metadata, isLoading, error, progress, refresh: () => loadMetadata(true) };
};
