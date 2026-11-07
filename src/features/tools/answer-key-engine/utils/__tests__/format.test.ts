import { describe, it, expect } from 'vitest';
import {
  formatIndianNumber,
  formatMarks,
  formatPercentile,
  formatTopPercentage,
  formatExamDate,
  formatExamTime,
  formatDeltaText,
  formatMaskedRoll,
  formatMaskedName,
} from '../format';

describe('Result Dashboard Pure Formatting Core (format.ts)', () => {
  describe('formatIndianNumber', () => {
    it('formats numbers with Indian grouping commas', () => {
      expect(formatIndianNumber(284571)).toBe('2,84,571');
      expect(formatIndianNumber(115911)).toBe('1,15,911');
      expect(formatIndianNumber(39096)).toBe('39,096');
      expect(formatIndianNumber(40623)).toBe('40,623');
      expect(formatIndianNumber(243948)).toBe('2,43,948');
      expect(formatIndianNumber(3075)).toBe('3,075');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatIndianNumber(null)).toBe('—');
      expect(formatIndianNumber(undefined)).toBe('—');
    });
  });

  describe('formatMarks', () => {
    it('suppresses trailing zeros on whole integers', () => {
      expect(formatMarks(136.0)).toBe('136');
      expect(formatMarks(45.0)).toBe('45');
      expect(formatMarks(17.0)).toBe('17');
    });

    it('formats single decimal place when non-zero', () => {
      expect(formatMarks(40.5)).toBe('40.5');
      expect(formatMarks(33.5)).toBe('33.5');
    });

    it('formats two decimal places correctly', () => {
      expect(formatMarks(137.37)).toBe('137.37');
      expect(formatMarks(104.12)).toBe('104.12');
    });

    it('handles null/undefined', () => {
      expect(formatMarks(null)).toBe('—');
      expect(formatMarks(undefined)).toBe('—');
    });
  });

  describe('formatPercentile & formatTopPercentage', () => {
    it('formats percentile string', () => {
      expect(formatPercentile(88.56)).toBe('88.56%');
      expect(formatPercentile(null)).toBe('—');
    });

    it('formats top percentage string', () => {
      expect(formatTopPercentage(14.3)).toBe('Top 14.3%');
      expect(formatTopPercentage(null)).toBe('—');
    });
  });

  describe('formatMaskedRoll & formatMaskedName (PII Protection)', () => {
    it('masks roll number keeping first 4 and last 2 characters', () => {
      expect(formatMaskedRoll('326120624836')).toBe('3261******36');
      expect(formatMaskedRoll('12345678')).toBe('1234**78');
      expect(formatMaskedRoll(null)).toBe('—');
    });

    it('masks candidate name preserving first character per word', () => {
      expect(formatMaskedName('RAKESH KUMAR')).toBe('R*** K***');
      expect(formatMaskedName('AALOK KUMAR SHARMA')).toBe('A*** K*** S***');
      expect(formatMaskedName(null)).toBe('—');
    });
  });

  describe('formatDeltaText', () => {
    it('formats positive, negative, and neutral deltas', () => {
      expect(formatDeltaText(30.94)).toBe('+30.94 more');
      expect(formatDeltaText(-6.79)).toBe('-6.79 less');
      expect(formatDeltaText(0)).toBe('Equal to average');
    });
  });
});
