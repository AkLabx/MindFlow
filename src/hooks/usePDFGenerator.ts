import { useState, useCallback } from 'react';

export interface PDFGenerationConfig {
  fileName: string;
  [key: string]: any;
}

export interface UsePDFGeneratorReturn<T> {
  generatePDF: (data: T[], config: PDFGenerationConfig) => Promise<void>;
  isGenerating: boolean;
  error: Error | null;
}

/**
 * A reusable hook for generating PDFs from data.
 * @param generatorFn The function that performs the actual PDF generation.
 */
export function usePDFGenerator<T>(
  generatorFn: (data: T[], config: PDFGenerationConfig) => Promise<void>
): UsePDFGeneratorReturn<T> {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generatePDF = useCallback(async (data: T[], config: PDFGenerationConfig) => {
    setIsGenerating(true);
    setError(null);
    try {
      await generatorFn(data, config);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during PDF generation'));
    } finally {
      setIsGenerating(false);
    }
  }, [generatorFn]);

  return { generatePDF, isGenerating, error };
}
