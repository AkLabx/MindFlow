import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { computeHistogramMetrics } from '../utils/stats';

export interface HistogramBin {
  marks: number;
  cnt: number;
  cum_below: number;
  cum_above: number;
}

export interface HistogramMetrics {
  selectedMark: number;
  binCount: number;
  atOrAboveCount: number;
  topPct: number;
  belowCount: number;
  totalCandidates: number;
}

export interface UseHistogramSliderProps {
  examId: string;
  candidateMark: number;
  initialScopeKey?: string;
}

export interface UseHistogramSliderReturn {
  selectedMark: number;
  setSelectedMark: (marks: number) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  bins: HistogramBin[];
  metrics: HistogramMetrics;
  isLoading: boolean;
  error: string | null;
  resetToCandidateMarks: () => void;
  handleSliderChange: (event: React.ChangeEvent<HTMLInputElement> | number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useHistogramSlider({
  examId,
  candidateMark,
  initialScopeKey = 'all',
}: UseHistogramSliderProps): UseHistogramSliderReturn {
  const [selectedMark, setSelectedMark] = useState<number>(candidateMark);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialScopeKey);
  const [bins, setBins] = useState<HistogramBin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync selectedMark if candidateMark changes initially
  useEffect(() => {
    setSelectedMark(candidateMark);
  }, [candidateMark]);

  const fetchDistribution = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    setError(null);

    try {
      const scopeType = selectedCategory === 'all' ? 'overall' : 'category';
      const scopeKey = selectedCategory;

      const { data, error: rpcErr } = await supabase.rpc('get_marks_distribution', {
        p_exam_id: examId,
        p_scope_type: scopeType,
        p_scope_key: scopeKey,
        p_section_id: 'total',
      });

      if (rpcErr) throw rpcErr;

      if (Array.isArray(data)) {
        setBins(data as HistogramBin[]);
      } else {
        setBins([]);
      }
    } catch (err: any) {
      console.error('[useHistogramSlider] Error loading distribution:', err);
      setError(err?.message || 'Failed to load score distribution.');
    } finally {
      setIsLoading(false);
    }
  }, [examId, selectedCategory]);

  useEffect(() => {
    fetchDistribution();
  }, [fetchDistribution]);

  // Compute total candidates from bins
  const totalCandidates = useMemo(() => {
    if (!bins || bins.length === 0) return 0;
    return bins.reduce((sum, b) => sum + (b.cnt || 0), 0);
  }, [bins]);

  // Dynamic metrics based on selectedMark
  const metrics: HistogramMetrics = useMemo(() => {
    const rawMetrics = computeHistogramMetrics(bins, selectedMark, totalCandidates);
    return {
      selectedMark,
      binCount: rawMetrics.binCount,
      atOrAboveCount: rawMetrics.atOrAboveCount,
      topPct: rawMetrics.topPct,
      belowCount: rawMetrics.belowCount,
      totalCandidates,
    };
  }, [bins, selectedMark, totalCandidates]);

  const resetToCandidateMarks = useCallback(() => {
    setSelectedMark(candidateMark);
  }, [candidateMark]);

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement> | number) => {
    const value = typeof event === 'number' ? event : parseFloat(event.target.value);
    if (!Number.isNaN(value)) {
      setSelectedMark(Math.round(value * 2) / 2); // 0.5 step resolution
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMark(prev => Math.max(0, prev - 0.5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMark(prev => prev + 0.5);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedMark(0);
    }
  }, []);

  return {
    selectedMark,
    setSelectedMark,
    selectedCategory,
    setSelectedCategory,
    bins,
    metrics,
    isLoading,
    error,
    resetToCandidateMarks,
    handleSliderChange,
    handleKeyDown,
  };
}
