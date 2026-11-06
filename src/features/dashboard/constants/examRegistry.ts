export interface CanonicalExam {
  id: string;               // Unique slug (e.g., 'ssc_cgl')
  displayName: string;      // User-facing title (e.g., 'SSC CGL')
  shortCode: string;        // Badge label (e.g., 'CGL')
  category: 'SSC' | 'State PSC' | 'Railways' | 'Defense' | 'Police' | 'Other';
  subtitle: string;         // e.g., 'Tier 1 & 2 PYQs'
  icon: string;             // Lucide icon name
  badgeColor: string;       // Badge color theme
  gradient: string;         // Tailwind gradient string
  borderClass: string;      // Tailwind border string
  textClass: string;        // Tailwind text accent
  dbExamNames: string[];    // Exact strings or prefixes in questions.examName
  matchPrefix?: string;     // Optional prefix match (e.g. 'BPSC')
  isDefaultFeatured: boolean;
}

export const CANONICAL_EXAMS: CanonicalExam[] = [
  {
    id: 'ssc_cgl',
    displayName: 'SSC CGL',
    shortCode: 'SSC CGL',
    category: 'SSC',
    subtitle: 'Combined Graduate Level • Tier 1 & 2',
    icon: 'Landmark',
    badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-600/10 via-indigo-600/5 to-transparent',
    borderClass: 'border-blue-200/90 dark:border-blue-800/60',
    textClass: 'text-blue-600 dark:text-blue-400',
    dbExamNames: ['CGL PRE', 'SSC CGL'],
    matchPrefix: 'SSC CGL',
    isDefaultFeatured: true,
  },
  {
    id: 'bpsc',
    displayName: 'BPSC',
    shortCode: 'BPSC',
    category: 'State PSC',
    subtitle: 'CCE, TRE & Bihar Special Services',
    icon: 'Scale',
    badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    gradient: 'from-amber-600/10 via-orange-600/5 to-transparent',
    borderClass: 'border-amber-200/90 dark:border-amber-800/60',
    textClass: 'text-amber-600 dark:text-amber-400',
    dbExamNames: [
      'BPSC CSE PRE',
      'BPSC TRE2',
      'BPSC AEDO',
      'BPSC AUDITOR',
      'BPSC Motor Vehicle Inspectors. QP',
      'BPSC 6-8 MATHS SCIENCE',
      'BPSC 6-8 MATHS SCIENCE (1)',
      'BPSC 9-10 SCIENCE (1)',
      'BPSC Law Officer GS Question Paper',
      'BPSC - Mineral Development Officer Exam 2025 - GS Paper',
      'BPSC Public Relation Officer GS Question Paper',
      'BPSC 9-10 MATHS TRE 1.0',
      'BPSC TRE1',
      'BPSC 9-10 SOCIAL SCIENCE TRE 2.0',
      'BPSC 9-10 Social Science',
      'BPSC 1-5',
      'BPSC 9-10 SCIENCE TRE -1.0',
      'BPSC - DSO PT 2025',
      'BPSC 9-10 SCIENCE',
    ],
    matchPrefix: 'BPSC',
    isDefaultFeatured: true,
  },
  {
    id: 'rrb_ntpc',
    displayName: 'RRB NTPC',
    shortCode: 'Railways',
    category: 'Railways',
    subtitle: 'Non-Technical Popular Categories',
    icon: 'Train',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    gradient: 'from-emerald-600/10 via-teal-600/5 to-transparent',
    borderClass: 'border-emerald-200/90 dark:border-emerald-800/60',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    dbExamNames: ['RRB NTPC UG', 'RRB NTPC', 'RRB'],
    matchPrefix: 'RRB',
    isDefaultFeatured: true,
  },
  {
    id: 'ib_acio',
    displayName: 'IB ACIO',
    shortCode: 'IB ACIO',
    category: 'Other',
    subtitle: 'Intelligence Bureau Executive Exam',
    icon: 'ShieldAlert',
    badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
    gradient: 'from-purple-600/10 via-violet-600/5 to-transparent',
    borderClass: 'border-purple-200/90 dark:border-purple-800/60',
    textClass: 'text-purple-600 dark:text-purple-400',
    dbExamNames: ['IB ACIO PRE', 'IB ACIO'],
    matchPrefix: 'IB',
    isDefaultFeatured: true,
  },
  {
    id: 'upsc_cds',
    displayName: 'UPSC CDS',
    shortCode: 'CDS',
    category: 'Defense',
    subtitle: 'Combined Defence Services (IMA/OTA)',
    icon: 'Award',
    badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
    gradient: 'from-rose-600/10 via-red-600/5 to-transparent',
    borderClass: 'border-rose-200/90 dark:border-rose-800/60',
    textClass: 'text-rose-600 dark:text-rose-400',
    dbExamNames: ['UPSC CDS', 'CDS'],
    isDefaultFeatured: false,
  },
  {
    id: 'bihar_police',
    displayName: 'Bihar Police / SI',
    shortCode: 'Police',
    category: 'Police',
    subtitle: 'Sub-Inspector & Constable Exam',
    icon: 'Shield',
    badgeColor: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300',
    gradient: 'from-cyan-600/10 via-blue-600/5 to-transparent',
    borderClass: 'border-cyan-200/90 dark:border-cyan-800/60',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    dbExamNames: ['Bihar Police', 'Bihar SI', 'BPSSC'],
    isDefaultFeatured: false,
  },
];

/**
 * Checks if a question matches a canonical exam definition.
 */
export const matchesCanonicalExam = (exam: CanonicalExam, rawExamName: string | null | undefined): boolean => {
  if (!rawExamName) return false;
  const trimmed = rawExamName.trim();
  if (exam.dbExamNames.some(name => name.toLowerCase() === trimmed.toLowerCase())) {
    return true;
  }
  if (exam.matchPrefix && trimmed.toUpperCase().startsWith(exam.matchPrefix.toUpperCase())) {
    return true;
  }
  return false;
};

/**
 * Calculates question counts for each canonical exam from lightweight metadata.
 */
export const computeExamCounts = (
  metadataList: Array<{ examName?: string | null; sourceInfo?: { examName?: string | null } }>
): Record<string, number> => {
  const counts: Record<string, number> = {};
  CANONICAL_EXAMS.forEach(exam => {
    counts[exam.id] = 0;
  });

  if (!metadataList || metadataList.length === 0) return counts;

  metadataList.forEach(q => {
    const rawExam = q.examName ?? q.sourceInfo?.examName;
    if (!rawExam) return;

    for (const exam of CANONICAL_EXAMS) {
      if (matchesCanonicalExam(exam, rawExam)) {
        counts[exam.id] = (counts[exam.id] || 0) + 1;
        break;
      }
    }
  });

  return counts;
};
