export interface ExamDomainDefinition {
  id: 'civil_pcs' | 'ssc' | 'railways' | 'teaching' | 'state_officer' | 'defence_police' | 'other';
  label: string;
  tooltip: string;
}

export interface ExamDomainGroup extends ExamDomainDefinition {
  exams: string[];
}

export const EXAM_DISPLAY_LABELS: Record<string, string> = {
  'BPSC CSE PRE': 'BPSC Civil Services Prelims',
  'UPSC CSE PRE': 'UPSC CSE Prelims',
  'CGL PRE': 'SSC CGL Prelims',
  'RRB NTPC UG': 'RRB NTPC (UG)',
  'BPSC TRE1': 'BPSC Teacher TRE 1.0',
  'BPSC TRE2': 'BPSC Teacher TRE 2.0',
  'BPSC TRE3': 'BPSC Teacher TRE 3.0',
  'BPSC AEDO': 'BPSC AEDO',
  'BPSC AUDITOR': 'BPSC Auditor',
  'BPSC Motor Vehicle Inspectors. QP': 'BPSC MVI',
  'BPSC Law Officer GS Question Paper': 'BPSC Law Officer',
  'BPSC - Mineral Development Officer Exam 2025 - GS Paper': 'BPSC Mineral Dev. Officer',
  'BPSC Public Relation Officer GS Question Paper': 'BPSC Public Relation Officer',
  'BPSC - DSO PT 2025': 'BPSC District Statistical Officer',
  'IB ACIO PRE': 'IB ACIO Executive',
};

export function getExamDisplayLabel(rawName: string): string {
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  return EXAM_DISPLAY_LABELS[trimmed] ?? trimmed;
}

const DOMAIN_DEFINITIONS: readonly ExamDomainDefinition[] = [
  {
    id: 'civil_pcs',
    label: 'Civil Services & State PCS',
    tooltip: 'UPSC and State PCS Preliminary Civil Services examinations',
  },
  {
    id: 'ssc',
    label: 'SSC Exams',
    tooltip: 'Staff Selection Commission examinations (CGL, CHSL, MTS, CPO)',
  },
  {
    id: 'railways',
    label: 'Railways (RRB) Exams',
    tooltip: 'Railway Recruitment Board exams including RRB NTPC, ALP & Group D',
  },
  {
    id: 'teaching',
    label: 'Teaching Exams (TRE / TET)',
    tooltip: 'Teacher Recruitment (BPSC TRE) and Eligibility Tests (TET / CTET)',
  },
  {
    id: 'state_officer',
    label: 'State Officer & Departmental Exams',
    tooltip: 'BPSC departmental & specialist officer examinations (AEDO, Auditor, MVI, Law, DSO)',
  },
  {
    id: 'defence_police',
    label: 'Defence, Intelligence & Police',
    tooltip: 'Intelligence Bureau (IB ACIO), Defence (CDS/NDA) and Police recruitment exams',
  },
  {
    id: 'other',
    label: 'Other Competitive Exams',
    tooltip: 'Additional competitive and general previous year question papers',
  },
] as const;

const EXPLICIT_DOMAIN_MAP: Record<string, ExamDomainDefinition['id']> = {
  'BPSC CSE PRE': 'civil_pcs',
  'UPSC CSE PRE': 'civil_pcs',
  'CGL PRE': 'ssc',
  'RRB NTPC UG': 'railways',
  'BPSC TRE1': 'teaching',
  'BPSC TRE2': 'teaching',
  'BPSC TRE3': 'teaching',
  'BPSC AEDO': 'state_officer',
  'BPSC AUDITOR': 'state_officer',
  'BPSC Motor Vehicle Inspectors. QP': 'state_officer',
  'BPSC Law Officer GS Question Paper': 'state_officer',
  'BPSC - Mineral Development Officer Exam 2025 - GS Paper': 'state_officer',
  'BPSC Public Relation Officer GS Question Paper': 'state_officer',
  'BPSC - DSO PT 2025': 'state_officer',
  'IB ACIO PRE': 'defence_police',
};

function resolveExamDomainId(rawName: string): ExamDomainDefinition['id'] {
  const trimmed = rawName.trim();
  const explicit = EXPLICIT_DOMAIN_MAP[trimmed];
  if (explicit) return explicit;

  if (/\b(CSE|PCS|PRELIMS|UPSC)\b/i.test(trimmed) && !/\b(TRE\d*|CGL|IB)\b/i.test(trimmed)) {
    return 'civil_pcs';
  }
  if (/\b(SSC|CGL|CHSL|MTS|CPO|STENO|GD)\b/i.test(trimmed)) {
    return 'ssc';
  }
  if (/\b(RRB|NTPC|ALP|RPF|GROUP\s*D)\b/i.test(trimmed)) {
    return 'railways';
  }
  if (/\b(TRE\d*|TET|CTET|STET|PRT|TEACHER|HEADMASTER)\b/i.test(trimmed)) {
    return 'teaching';
  }
  if (/^BPSC\b/i.test(trimmed)) {
    return 'state_officer';
  }
  if (/\b(IB|ACIO|CDS|NDA|AFCAT|POLICE|SI|CAPF)\b/i.test(trimmed)) {
    return 'defence_police';
  }
  return 'other';
}

export function groupExamNamesByDomain(rawExamNames: string[]): ExamDomainGroup[] {
  const buckets = new Map<ExamDomainDefinition['id'], string[]>();
  for (const def of DOMAIN_DEFINITIONS) {
    buckets.set(def.id, []);
  }

  const seen = new Set<string>();
  for (const rawName of rawExamNames) {
    if (typeof rawName !== 'string') continue;
    const trimmed = rawName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'demo') continue;
    if (seen.has(rawName)) continue;
    seen.add(rawName);

    const domainId = resolveExamDomainId(rawName);
    buckets.get(domainId)?.push(rawName);
  }

  return DOMAIN_DEFINITIONS
    .map((def) => ({
      ...def,
      exams: buckets.get(def.id) ?? [],
    }))
    .filter((group) => group.exams.length > 0);
}
