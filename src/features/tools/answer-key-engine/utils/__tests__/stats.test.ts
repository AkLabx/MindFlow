import { describe, it, expect } from 'vitest';
import {
  calculateSectionMarks,
  calculateAccuracy,
  calculateCompetitionRank,
  calculatePercentile,
  calculateTopPercentage,
  calculateDelta,
  calculateNormalisedScoreFormula2,
  computeHistogramMetrics,
  NormalisationParameters,
} from '../stats';

describe('Result Dashboard Pure Calculation Engine (stats.ts)', () => {
  describe('Golden Fixtures: Section Marks & Totals', () => {
    it('calculates Section A (Reasoning): 21 right, 3 wrong -> 40.5 marks, 88% accuracy', () => {
      const marks = calculateSectionMarks(21, 3, 2.0, 0.5);
      const accuracy = calculateAccuracy(21, 24);
      expect(marks).toBe(40.5);
      expect(accuracy).toBe(88);
    });

    it('calculates Section B (GK): 11 right, 10 wrong -> 17.0 marks, 52% accuracy', () => {
      const marks = calculateSectionMarks(11, 10, 2.0, 0.5);
      const accuracy = calculateAccuracy(11, 21);
      expect(marks).toBe(17.0);
      expect(accuracy).toBe(52);
    });

    it('calculates Section C (Maths): 17 right, 1 wrong -> 33.5 marks, 94% accuracy', () => {
      const marks = calculateSectionMarks(17, 1, 2.0, 0.5);
      const accuracy = calculateAccuracy(17, 18);
      expect(marks).toBe(33.5);
      expect(accuracy).toBe(94);
    });

    it('calculates Section D (English): 23 right, 2 wrong -> 45.0 marks, 92% accuracy', () => {
      const marks = calculateSectionMarks(23, 2, 2.0, 0.5);
      const accuracy = calculateAccuracy(23, 25);
      expect(marks).toBe(45.0);
      expect(accuracy).toBe(92);
    });

    it('verifies total marks sum equals 136.0 and overall accuracy is 82%', () => {
      const totalMarks = calculateSectionMarks(72, 16, 2.0, 0.5);
      const accuracy = calculateAccuracy(72, 88);
      expect(totalMarks).toBe(136.0);
      expect(accuracy).toBe(82);

      const sectionSum = 40.5 + 17.0 + 33.5 + 45.0;
      expect(sectionSum).toBe(136.0);
    });
  });

  describe('Golden Fixtures: Percentile & Ranks', () => {
    it('Overall Percentile: Rank 39,096 in N=2,84,571 -> 86.26%', () => {
      const p = calculatePercentile(39096, 284571);
      expect(p).toBe(86.26);
    });

    it('Shift Percentile: Rank 554 in N=4,834 -> 88.56%', () => {
      const p = calculatePercentile(554, 4834);
      expect(p).toBe(88.56);
    });

    it('Category Percentile: Rank 16,596 in N=1,15,911 -> 85.68%', () => {
      const p = calculatePercentile(16596, 115911);
      expect(p).toBe(85.68);
    });

    it('Standard 1224 Competition ranking with score ties', () => {
      const scores = [150, 140, 140, 130, 130, 130, 100];
      expect(calculateCompetitionRank(150, scores)).toBe(1);
      expect(calculateCompetitionRank(140, scores)).toBe(2);
      expect(calculateCompetitionRank(130, scores)).toBe(4);
      expect(calculateCompetitionRank(100, scores)).toBe(7);
      expect(calculateCompetitionRank(90, scores)).toBe(8);
    });
  });

  describe('Golden Fixtures: Deltas & Averages', () => {
    it('computes overall delta: 136.0 vs 105.06 -> +30.94 more', () => {
      const res = calculateDelta(136.0, 105.06);
      expect(res.delta).toBe(30.94);
      expect(res.trend).toBe('more');
      expect(res.formatted).toBe('+30.94 more');
    });

    it('computes shift delta: 136.0 vs 104.12 -> +31.88 more', () => {
      const res = calculateDelta(136.0, 104.12);
      expect(res.delta).toBe(31.88);
      expect(res.trend).toBe('more');
      expect(res.formatted).toBe('+31.88 more');
    });

    it('computes category delta: 136.0 vs 106.07 -> +29.93 more', () => {
      const res = calculateDelta(136.0, 106.07);
      expect(res.delta).toBe(29.93);
      expect(res.trend).toBe('more');
      expect(res.formatted).toBe('+29.93 more');
    });

    it('computes negative delta correctly', () => {
      const res = calculateDelta(17.0, 23.79);
      expect(res.delta).toBe(-6.79);
      expect(res.trend).toBe('less');
      expect(res.formatted).toBe('-6.79 less');
    });

    it('computes neutral delta when values are equal', () => {
      const res = calculateDelta(100.0, 100.0);
      expect(res.delta).toBe(0);
      expect(res.trend).toBe('neutral');
      expect(res.formatted).toBe('Equal to average');
    });
  });

  describe('Golden Fixtures: Formula-2 Normalisation', () => {
    const goldenParams: NormalisationParameters = {
      rawScore: 136.0,
      shiftN: 4834,
      shiftMean: 104.12,
      shiftStdDev: 18.25,
      shiftTop01Mean: 168.45,
      overallN: 284571,
      overallMean: 105.06,
      overallStdDev: 19.10,
      overallTop01Mean: 170.80,
      maxShiftBaseline: 129.80,
    };

    it('calculates normalised score', () => {
      const res = calculateNormalisedScoreFormula2(goldenParams);
      expect(res.status).toBe('SUCCESS');
      const denominator = goldenParams.shiftTop01Mean - goldenParams.shiftMean;
      const numerator = goldenParams.overallTop01Mean - goldenParams.overallMean;
      const scale = numerator / denominator;
      const expectedNorm = Math.round((scale * (136.0 - 104.12) + goldenParams.maxShiftBaseline) * 100) / 100;
      expect(res.normalisedScore).toBe(expectedNorm);
    });

    it('enforces sample gate N < 1000', () => {
      const res = calculateNormalisedScoreFormula2({
        ...goldenParams,
        overallN: 500,
      });
      expect(res.status).toBe('INSUFFICIENT_SAMPLE');
      expect(res.normalisedScore).toBeNull();
    });

    it('enforces positive denominator variance', () => {
      const res = calculateNormalisedScoreFormula2({
        ...goldenParams,
        shiftTop01Mean: 100.0,
        shiftMean: 104.12,
      });
      expect(res.status).toBe('INSUFFICIENT_VARIANCE');
      expect(res.normalisedScore).toBeNull();
    });
  });

  describe('Histogram Metrics & Scrubber', () => {
    const sampleBins = [
      { marks: 134, cnt: 2900 },
      { marks: 135, cnt: 3000 },
      { marks: 136, cnt: 3075 },
      { marks: 137, cnt: 3100 },
      { marks: 138, cnt: 2800 },
      { marks: 150, cnt: 28848 },
    ];
    const totalCandidates = 284571;

    it('computes exact bin count and top percentage', () => {
      const metrics = computeHistogramMetrics(sampleBins, 136, totalCandidates);
      expect(metrics.binCount).toBe(3075);
      expect(metrics.atOrAboveCount).toBe(3075 + 3100 + 2800 + 28848);
      expect(metrics.belowCount).toBe(totalCandidates - metrics.atOrAboveCount);
      expect(metrics.topPct).toBeGreaterThan(0);
    });
  });
});
