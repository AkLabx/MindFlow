import { useState, useCallback } from 'react';

interface UseJSONDownloaderReturn<T> {
  downloadJSON: (data: T[], fileName: string) => Promise<void>;
  isGenerating: boolean;
  error: Error | null;
}

/**
 * A hook for downloading data as a JSON file with a simulated delay.
 */
export function useJSONDownloader<T>(): UseJSONDownloaderReturn<T> {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadJSON = useCallback(async (data: T[], fileName: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Artificial delay to allow spinner to be seen
      await new Promise(resolve => setTimeout(resolve, 1000));

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('JSON Download failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during JSON download'));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { downloadJSON, isGenerating, error };
}
