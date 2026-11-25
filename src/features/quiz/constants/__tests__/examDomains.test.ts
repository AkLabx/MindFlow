import { describe, it, expect } from 'vitest';
import {
  EXAM_DISPLAY_LABELS,
  getExamDisplayLabel,
  groupExamNamesByDomain,
} from '../examDomains';

const LIVE_DB_EXAMS = [
  'BPSC CSE PRE',
  'UPSC CSE PRE',
  'CGL PRE',
  'RRB NTPC UG',
  'BPSC TRE1',
  'BPSC TRE2',
  'BPSC TRE3',
  'BPSC AEDO',
  'BPSC AUDITOR',
  'BPSC Motor Vehicle Inspectors. QP',
  'BPSC Law Officer GS Question Paper',
  'BPSC - Mineral Development Officer Exam 2025 - GS Paper',
  'BPSC Public Relation Officer GS Question Paper',
  'BPSC - DSO PT 2025',
  'IB ACIO PRE',
  'Demo',
];

describe('examDomains', () => {
  it('excludes Demo (case-insensitive) and maps all 15 live DB exam names to the 6 ordered domains', () => {
    const groups = groupExamNamesByDomain([...LIVE_DB_EXAMS, 'demo', '  DEMO  ']);

    expect(groups.map((g) => g.id)).toEqual([
      'civil_pcs',
      'ssc',
      'railways',
      'teaching',
      'state_officer',
      'defence_police',
    ]);

    expect(groups.map((g) => g.label)).toEqual([
      'Civil Services & State PCS',
      'SSC Exams',
      'Railways (RRB) Exams',
      'Teaching Exams (TRE / TET)',
      'State Officer & Departmental Exams',
      'Defence, Intelligence & Police',
    ]);

    expect(groups[0].exams).toEqual(['BPSC CSE PRE', 'UPSC CSE PRE']);
    expect(groups[1].exams).toEqual(['CGL PRE']);
    expect(groups[2].exams).toEqual(['RRB NTPC UG']);
    expect(groups[3].exams).toEqual(['BPSC TRE1', 'BPSC TRE2', 'BPSC TRE3']);
    expect(groups[4].exams).toEqual([
      'BPSC AEDO',
      'BPSC AUDITOR',
      'BPSC Motor Vehicle Inspectors. QP',
      'BPSC Law Officer GS Question Paper',
      'BPSC - Mineral Development Officer Exam 2025 - GS Paper',
      'BPSC Public Relation Officer GS Question Paper',
      'BPSC - DSO PT 2025',
    ]);
    expect(groups[5].exams).toEqual(['IB ACIO PRE']);

    const allGrouped = groups.flatMap((g) => g.exams);
    expect(allGrouped).toHaveLength(15);
    expect(allGrouped.some((name) => name.toLowerCase().includes('demo'))).toBe(false);
  });

  it('returns human-readable labels for known exams and trimmed raw names for unknown exams', () => {
    expect(getExamDisplayLabel('BPSC CSE PRE')).toBe('BPSC Civil Services Prelims');
    expect(getExamDisplayLabel('UPSC CSE PRE')).toBe('UPSC CSE Prelims');
    expect(getExamDisplayLabel('CGL PRE')).toBe('SSC CGL Prelims');
    expect(getExamDisplayLabel('RRB NTPC UG')).toBe('RRB NTPC (UG)');
    expect(getExamDisplayLabel('BPSC TRE1')).toBe('BPSC Teacher TRE 1.0');
    expect(getExamDisplayLabel('BPSC TRE2')).toBe('BPSC Teacher TRE 2.0');
    expect(getExamDisplayLabel('BPSC TRE3')).toBe('BPSC Teacher TRE 3.0');
    expect(getExamDisplayLabel('BPSC AEDO')).toBe('BPSC AEDO');
    expect(getExamDisplayLabel('BPSC AUDITOR')).toBe('BPSC Auditor');
    expect(getExamDisplayLabel('BPSC Motor Vehicle Inspectors. QP')).toBe('BPSC MVI');
    expect(getExamDisplayLabel('BPSC Law Officer GS Question Paper')).toBe('BPSC Law Officer');
    expect(getExamDisplayLabel('BPSC - Mineral Development Officer Exam 2025 - GS Paper')).toBe(
      'BPSC Mineral Dev. Officer'
    );
    expect(getExamDisplayLabel('BPSC Public Relation Officer GS Question Paper')).toBe(
      'BPSC Public Relation Officer'
    );
    expect(getExamDisplayLabel('BPSC - DSO PT 2025')).toBe('BPSC District Statistical Officer');
    expect(getExamDisplayLabel('IB ACIO PRE')).toBe('IB ACIO Executive');

    expect(Object.keys(EXAM_DISPLAY_LABELS)).toHaveLength(15);
    expect(getExamDisplayLabel('  Future Custom Exam 2026  ')).toBe('Future Custom Exam 2026');
  });

  it('places unrecognized future exam names in Other Competitive Exams and omits empty domains', () => {
    const groups = groupExamNamesByDomain([
      'Demo',
      'SSC CHSL Tier 1',
      'Future Custom Exam 2026',
    ]);

    expect(groups.map((g) => g.id)).toEqual(['ssc', 'other']);
    expect(groups.map((g) => g.label)).toEqual([
      'SSC Exams',
      'Other Competitive Exams',
    ]);
    expect(groups[0].exams).toEqual(['SSC CHSL Tier 1']);
    expect(groups[1].exams).toEqual(['Future Custom Exam 2026']);
  });
});
