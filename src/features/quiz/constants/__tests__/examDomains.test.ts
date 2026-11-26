import { describe, it, expect } from 'vitest';
import {
  EXAM_DISPLAY_LABELS,
  getExamDisplayLabel,
  groupExamNamesByDomain,
} from '../examDomains';
import { resolveCanonicalExamName } from '../../services/examCatalogService';

const LIVE_DB_EXAMS = [
  'BPSC CCE PRE',
  'UPSC CSE PRE',
  'SSC CGL PRE',
  'SSC CGL MAINS',
  'RRB NTPC UG',
  'BPSC TRE 1.0',
  'BPSC TRE 2.0',
  'BPSC TRE 3.0',
  'BPSC AEDO',
  'BPSC AUDITOR',
  'BPSC CDPO',
  'BPSC AAO',
  'BPSC PROJECT MANAGER',
  'BPSC ASSISTANT',
  'BPSC AGRICULTURE',
  'BPSC MVI',
  'BPSC MDO',
  'BPSC LAW OFFICER',
  'BPSC PRO',
  'BPSC DSO',
  'BPSC OTHER',
  'IB ACIO PRE',
  'Demo',
];

describe('examDomains', () => {
  it('excludes Demo (case-insensitive) and maps all 22 live canonical DB exam names to the 6 ordered domains', () => {
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

    expect(groups[0].exams).toEqual(['BPSC CCE PRE', 'UPSC CSE PRE']);
    expect(groups[1].exams).toEqual(['SSC CGL PRE', 'SSC CGL MAINS']);
    expect(groups[2].exams).toEqual(['RRB NTPC UG']);
    expect(groups[3].exams).toEqual(['BPSC TRE 1.0', 'BPSC TRE 2.0', 'BPSC TRE 3.0']);
    expect(groups[4].exams).toEqual([
      'BPSC AEDO',
      'BPSC AUDITOR',
      'BPSC CDPO',
      'BPSC AAO',
      'BPSC PROJECT MANAGER',
      'BPSC ASSISTANT',
      'BPSC AGRICULTURE',
      'BPSC MVI',
      'BPSC MDO',
      'BPSC LAW OFFICER',
      'BPSC PRO',
      'BPSC DSO',
      'BPSC OTHER',
    ]);
    expect(groups[5].exams).toEqual(['IB ACIO PRE']);

    const allGrouped = groups.flatMap((g) => g.exams);
    expect(allGrouped).toHaveLength(22);
    expect(allGrouped.some((name) => name.toLowerCase().includes('demo'))).toBe(false);
  });

  it('returns human-readable labels for known exams, legacy aliases, and trimmed raw names for unknown exams', () => {
    expect(getExamDisplayLabel('BPSC CCE PRE')).toBe('BPSC Civil Services Prelims');
    expect(getExamDisplayLabel('UPSC CSE PRE')).toBe('UPSC CSE Prelims');
    expect(getExamDisplayLabel('SSC CGL PRE')).toBe('SSC CGL Prelims');
    expect(getExamDisplayLabel('SSC CGL MAINS')).toBe('SSC CGL Mains');
    expect(getExamDisplayLabel('CGL PRE')).toBe('SSC CGL Prelims');
    expect(getExamDisplayLabel('RRB NTPC UG')).toBe('RRB NTPC (UG)');
    expect(getExamDisplayLabel('BPSC TRE 1.0')).toBe('BPSC Teacher TRE 1.0');
    expect(getExamDisplayLabel('BPSC TRE 2.0')).toBe('BPSC Teacher TRE 2.0');
    expect(getExamDisplayLabel('BPSC TRE 3.0')).toBe('BPSC Teacher TRE 3.0');
    expect(getExamDisplayLabel('BPSC AEDO')).toBe('BPSC AEDO');
    expect(getExamDisplayLabel('BPSC AUDITOR')).toBe('BPSC Auditor');
    expect(getExamDisplayLabel('BPSC MVI')).toBe('BPSC MVI');
    expect(getExamDisplayLabel('BPSC LAW OFFICER')).toBe('BPSC Law Officer');
    expect(getExamDisplayLabel('BPSC MDO')).toBe('BPSC Mineral Dev. Officer');
    expect(getExamDisplayLabel('BPSC PRO')).toBe('BPSC Public Relation Officer');
    expect(getExamDisplayLabel('BPSC DSO')).toBe('BPSC District Statistical Officer');
    expect(getExamDisplayLabel('IB ACIO PRE')).toBe('IB ACIO Executive');

    expect(resolveCanonicalExamName('CGL PRE')).toBe('SSC CGL PRE');
    expect(resolveCanonicalExamName('BPSC CSE PRE')).toBe('BPSC CCE PRE');
    expect(Object.keys(EXAM_DISPLAY_LABELS).length).toBeGreaterThanOrEqual(24);
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
