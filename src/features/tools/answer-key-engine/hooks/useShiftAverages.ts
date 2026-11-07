import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export type ShiftDimension = 'shift' | 'category' | 'gender';

export interface ShiftDirectoryItem {
  shift_code: string;
  exam_date: string;
  shift_label: string;
  shift_time?: string;
  n: number;
  mean: number;
  difficulty_rank: number;
}

export interface DimensionStatsItem {
  key: string;
  n: number;
  mean: number;
  median: number;
  max: number;
}

export interface UseShiftAveragesProps {
  examId: string;
  userShiftCode?: string;
  initialDimension?: ShiftDimension;
}

export interface UseShiftAveragesReturn {
  dimension: ShiftDimension;
  setDimension: (dim: ShiftDimension) => void;
  shifts: ShiftDirectoryItem[];
  dimensionStats: DimensionStatsItem[];
  yourShift: ShiftDirectoryItem | null;
  hardestShift: ShiftDirectoryItem | null;
  easiestShift: ShiftDirectoryItem | null;
  totalShifts: number;
  isSlideOverOpen: boolean;
  setIsSlideOverOpen: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShiftAverages({
  examId,
  userShiftCode,
  initialDimension = 'shift',
}: UseShiftAveragesProps): UseShiftAveragesReturn {
  const [dimension, setDimension] = useState<ShiftDimension>(initialDimension);
  const [shifts, setShifts] = useState<ShiftDirectoryItem[]>([]);
  const [dimensionStats, setDimensionStats] = useState<DimensionStatsItem[]>([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAverages = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_shift_averages', {
        p_exam_id: examId,
        p_dimension: dimension,
      });

      if (rpcErr) throw rpcErr;

      if (dimension === 'shift') {
        const rawShifts: ShiftDirectoryItem[] = Array.isArray(data)
          ? data.map((item: any, idx: number) => ({
              shift_code: item.shift_code || `shift_${idx}`,
              exam_date: item.exam_date || '',
              shift_label: item.shift_name || item.shift_label || item.shift_code,
              shift_time: item.shift_time || '',
              n: item.candidate_count || item.n || 0,
              mean: item.mean_score || item.mean || 0,
              difficulty_rank: item.difficulty_rank || idx + 1,
            }))
          : [];

        // Sort shifts by difficulty rank ascending (hardest first = lowest average)
        rawShifts.sort((a, b) => a.difficulty_rank - b.difficulty_rank);
        setShifts(rawShifts);
      } else {
        const rawStats: DimensionStatsItem[] = Array.isArray(data)
          ? data.map((item: any) => ({
              key: item.scope_key || item.key || 'Unknown',
              n: item.candidate_count || item.n || 0,
              mean: item.mean_score || item.mean || 0,
              median: item.median_score || item.median || 0,
              max: item.max_score || item.max || 0,
            }))
          : [];
        setDimensionStats(rawStats);
      }
    } catch (err: any) {
      console.error('[useShiftAverages] Error loading shift averages:', err);
      setError(err?.message || 'Failed to load shift averages.');
    } finally {
      setIsLoading(false);
    }
  }, [examId, dimension]);

  useEffect(() => {
    fetchAverages();
  }, [fetchAverages]);

  const yourShift = useMemo(() => {
    if (!userShiftCode || shifts.length === 0) return null;
    return shifts.find(s => s.shift_code === userShiftCode) || null;
  }, [shifts, userShiftCode]);

  const hardestShift = useMemo(() => {
    if (shifts.length === 0) return null;
    return shifts[0]; // Difficulty rank 1 (lowest mean score)
  }, [shifts]);

  const easiestShift = useMemo(() => {
    if (shifts.length === 0) return null;
    return shifts[shifts.length - 1]; // Highest mean score
  }, [shifts]);

  return {
    dimension,
    setDimension,
    shifts,
    dimensionStats,
    yourShift,
    hardestShift,
    easiestShift,
    totalShifts: shifts.length,
    isSlideOverOpen,
    setIsSlideOverOpen,
    isLoading,
    error,
    refetch: fetchAverages,
  };
}
