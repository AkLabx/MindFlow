/**
 * MindFlow Result Dashboard Pure Calculation Engine
 * 
 * Deterministic mathematical models for marking schemes, section scores,
 * accuracies, competition ranks, percentiles, Top X%, deltas, and Formula-2 normalisation.
 * Fully compliant with MindFlow Product Constitution Section 2 & 6.
 */

export interface SectionMarkingRule {
  positiveMark: number;
  negativeMark: number;
  totalQuestions: number;
}

export interface NormalisationParameters {
  rawScore: number;
  shiftN: number;
  shiftMean: number;
  shiftStdDev: number;
  shiftTop01Mean: number;
  overallN: number;
  overallMean: number;
  overallStdDev: number;
  overallTop01Mean: number;
  maxShiftBaseline: number; // M_q^gm: sum of mean + stddev of easiest shift (129.80 in golden fixture)
  maxShiftMean?: number;
  minSampleGate?: number; // default 1000
}

export interface NormalisationResult {
  normalisedScore: number | null;
  formula: 'formula_1' | 'formula_2';
  status: 'SUCCESS' | 'INSUFFICIENT_SAMPLE' | 'INSUFFICIENT_VARIANCE' | 'PENDING_CONFIRMATION';
  description: string;
}

export interface HistogramBinData {
  marks: number;
  cnt: number;
  cum_below?: number;
  cum_above?: number;
}

/**
 * Calculates raw section score given correct/wrong counts and marking scheme.
 * Eliminates IEEE 754 precision floating point artifacts.
 */
export function calculateSectionMarks(
  correct: number,
  wrong: number,
  positive: number = 2.0,
  negative: number = 0.5
): number {
  const pos = Math.max(0, correct) * positive;
  const neg = Math.max(0, wrong) * Math.abs(negative);
  const raw = pos - neg;
  return Math.round((raw + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates percentage accuracy. Returns null if attempted <= 0 to prevent division by zero.
 */
export function calculateAccuracy(
  correct: number,
  attempted: number
): number | null {
  if (attempted <= 0) return null;
  const ratio = (correct / attempted) * 100;
  return Math.round(ratio);
}

/**
 * Standard Competition 1224 ranking: 1 + count(competitor > candidate).
 */
export function calculateCompetitionRank(
  candidateScore: number,
  competitorScores: number[]
): number {
  if (!competitorScores || competitorScores.length === 0) return 1;
  let countStrictlyGreater = 0;
  for (let i = 0; i < competitorScores.length; i++) {
    if (competitorScores[i] > candidateScore) {
      countStrictlyGreater++;
    }
  }
  return 1 + countStrictlyGreater;
}

/**
 * Calculates percentile rank (0 to 100%) to 2 decimal places.
 * P = (1 - (rank - 1) / total) * 100
 */
export function calculatePercentile(
  rank: number,
  totalCandidates: number
): number {
  if (totalCandidates <= 0) return 0;
  if (totalCandidates === 1 || rank <= 1) return 100;
  if (rank > totalCandidates) return 0;

  const rawPercentile = (1 - (rank - 1) / totalCandidates) * 100;
  return Math.round((rawPercentile + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates Top X% (e.g. Top 14.3%).
 */
export function calculateTopPercentage(
  candidatesAtOrAbove: number,
  totalCandidates: number
): number {
  if (totalCandidates <= 0 || candidatesAtOrAbove <= 0) return 0;
  const raw = (candidatesAtOrAbove / totalCandidates) * 100;
  return Math.round((raw + Number.EPSILON) * 10) / 10;
}

/**
 * Computes difference between candidate value and average benchmark.
 */
export function calculateDelta(
  candidateValue: number,
  averageValue: number
): {
  delta: number;
  trend: 'more' | 'less' | 'neutral';
  formatted: string;
} {
  const rawDelta = candidateValue - averageValue;
  const delta = Math.round((rawDelta + Number.EPSILON) * 100) / 100;

  if (Math.abs(delta) < 0.005) {
    return {
      delta: 0,
      trend: 'neutral',
      formatted: 'Equal to average',
    };
  }

  if (delta > 0) {
    const formattedVal = delta.toFixed(2);
    return {
      delta,
      trend: 'more',
      formatted: `+${formattedVal} more`,
    };
  }

  const formattedVal = Math.abs(delta).toFixed(2);
  return {
    delta,
    trend: 'less',
    formatted: `-${formattedVal} less`,
  };
}

/**
 * Multi-shift Normalisation using Formula-2 (Top-0.1% anchor).
 * 
 * Formula:
 * M_ij^norm = ((M_t^g - M_gm) / (M_t^q - M_iq)) * (M_ij - M_iq) + M_q^gm
 */
export function calculateNormalisedScoreFormula2(
  params: NormalisationParameters
): NormalisationResult {
  const minGate = params.minSampleGate ?? 1000;

  if (params.overallN < minGate || params.shiftN < 30) {
    return {
      normalisedScore: null,
      formula: 'formula_2',
      status: 'INSUFFICIENT_SAMPLE',
      description: `Sample size too small (N=${params.overallN}, Shift N=${params.shiftN}). Minimum required is ${minGate}.`,
    };
  }

  const denominator = params.shiftTop01Mean - params.shiftMean;
  if (denominator <= 0) {
    return {
      normalisedScore: null,
      formula: 'formula_2',
      status: 'INSUFFICIENT_VARIANCE',
      description: 'Insufficient shift variance between top-0.1% and shift mean.',
    };
  }

  const numerator = params.overallTop01Mean - params.overallMean;
  const scale = numerator / denominator;
  const deviation = params.rawScore - params.shiftMean;
  const normalised = (scale * deviation) + params.maxShiftBaseline;

  const rounded = Math.round((normalised + Number.EPSILON) * 100) / 100;

  return {
    normalisedScore: rounded,
    formula: 'formula_2',
    status: 'SUCCESS',
    description: 'Formula-2 Normalisation calculated with Top-0.1% anchor.',
  };
}

/**
 * Computes dynamic metrics for histogram slider scrubber.
 */
export function computeHistogramMetrics(
  bins: HistogramBinData[],
  targetMark: number,
  totalCandidates: number
): {
  binCount: number;
  atOrAboveCount: number;
  topPct: number;
  belowCount: number;
} {
  if (!bins || bins.length === 0 || totalCandidates <= 0) {
    return {
      binCount: 0,
      atOrAboveCount: 0,
      topPct: 0,
      belowCount: 0,
    };
  }

  // Exact bin matching targetMark (using 0.5 interval or nearest 1 mark step)
  const exactBin = bins.find(b => Math.abs(b.marks - targetMark) < 0.26);
  const binCount = exactBin ? exactBin.cnt : 0;

  let atOrAboveCount = 0;
  for (let i = 0; i < bins.length; i++) {
    if (bins[i].marks >= targetMark - 0.001) {
      atOrAboveCount += bins[i].cnt;
    }
  }

  const belowCount = Math.max(0, totalCandidates - atOrAboveCount);
  const topPct = calculateTopPercentage(atOrAboveCount, totalCandidates);

  return {
    binCount,
    atOrAboveCount,
    topPct,
    belowCount,
  };
}
