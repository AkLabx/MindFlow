import {
  ExamDomainId,
  FALLBACK_EXAM_CATALOG,
  findExamCatalogEntry,
  getCachedExamCatalog,
} from '../services/examCatalogService';

export interface ExamDomainDefinition {
  id: ExamDomainId;
  label: string;
  tooltip: string;
}

export interface ExamDomainGroup extends ExamDomainDefinition {
  exams: string[];
}

export const EXAM_DISPLAY_LABELS: Record<string, string> = Object.fromEntries(
  FALLBACK_EXAM_CATALOG.map((entry) => [entry.exam_name, entry.display_label])
);

export function getExamDisplayLabel(rawName: string): string {
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  const catalogMatch = findExamCatalogEntry(trimmed);
  if (catalogMatch) return catalogMatch.display_label;
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
    tooltip: 'BPSC departmental & specialist officer examinations (AEDO, Auditor, CDPO, MVI, Law, DSO)',
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

const EXPLICIT_DOMAIN_MAP: Record<string, ExamDomainDefinition['id']> = Object.fromEntries(
  FALLBACK_EXAM_CATALOG.map((entry) => [entry.exam_name, entry.domain_id])
) as Record<string, ExamDomainDefinition['id']>;

function resolveExamDomainId(rawName: string): ExamDomainDefinition['id'] {
  const trimmed = rawName.trim();
  const catalogMatch = findExamCatalogEntry(trimmed);
  if (catalogMatch) return catalogMatch.domain_id;

  const explicit = EXPLICIT_DOMAIN_MAP[trimmed];
  if (explicit) return explicit;

  if (/\b(CSE|CCE|PCS|PRELIMS|UPSC)\b/i.test(trimmed) && !/\b(TRE\d*|CGL|IB)\b/i.test(trimmed)) {
    return 'civil_pcs';
  }
  if (/\b(SSC|CGL|CHSL|MTS|CPO|STENO|GD)\b/i.test(trimmed)) {
    return 'ssc';
  }
  if (/\b(RRB|NTPC|ALP|RPF|GROUP\s*D)\b/i.test(trimmed)) {
    return 'railways';
  }
  if (/\b(TRE[\s._-]*\d*|TET|CTET|STET|PRT|TEACHER|HEADMASTER)\b/i.test(trimmed)) {
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

  // Build sort order lookup from SSOT catalog so domain lists stay predictably ordered
  const sortOrderMap = new Map<string, number>();
  for (const entry of getCachedExamCatalog()) {
    sortOrderMap.set(entry.exam_name, entry.sort_order);
  }

  const seen = new Set<string>();
  for (const rawName of rawExamNames) {
    if (typeof rawName !== 'string') continue;
    const trimmed = rawName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'demo') continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);

    const domainId = resolveExamDomainId(trimmed);
    buckets.get(domainId)?.push(trimmed);
  }

  return DOMAIN_DEFINITIONS
    .map((def) => ({
      ...def,
      exams: (buckets.get(def.id) ?? []).sort(
        (a, b) => (sortOrderMap.get(a) ?? 900) - (sortOrderMap.get(b) ?? 900) || a.localeCompare(b)
      ),
    }))
    .filter((group) => group.exams.length > 0);
}
