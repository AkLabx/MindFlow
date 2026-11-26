import { supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/config/dbTables';

export type ExamDomainId =
  | 'civil_pcs'
  | 'ssc'
  | 'railways'
  | 'teaching'
  | 'state_officer'
  | 'defence_police'
  | 'other';

export interface ExamCatalogEntry {
  exam_name: string;
  canonical_group_id: string;
  display_label: string;
  domain_id: ExamDomainId;
  organizing_body: string;
  shift_format_type:
    | 'date_shift_time'
    | 'cce_edition_date'
    | 'tre_tier_date'
    | 'date_only'
    | 'date_range'
    | 'month_range';
  shift_format_example: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
}

const CATALOG_STORAGE_KEY = 'mindflow_exam_catalog_ssot_v1';
const CATALOG_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Offline-safe fallback catalog mirrored from `public.exam_catalog` (SSOT).
 * Guarantees 0ms hydration on cold start or offline Android WebView (`DEC-0004`).
 */
export const FALLBACK_EXAM_CATALOG: readonly ExamCatalogEntry[] = [
  {
    exam_name: 'SSC CGL PRE',
    canonical_group_id: 'ssc_cgl',
    display_label: 'SSC CGL Prelims',
    domain_id: 'ssc',
    organizing_body: 'SSC',
    shift_format_type: 'date_shift_time',
    shift_format_example: '01 Oct 2026 • Shift 2 (01:30 PM)',
    aliases: ['CGL PRE', 'SSC CGL', 'SSC CGL TIER 1', 'SSC CGL Tier-1'],
    sort_order: 10,
    is_active: true,
  },
  {
    exam_name: 'SSC CGL MAINS',
    canonical_group_id: 'ssc_cgl',
    display_label: 'SSC CGL Mains',
    domain_id: 'ssc',
    organizing_body: 'SSC',
    shift_format_type: 'date_shift_time',
    shift_format_example: '19 Jan 2026 • Shift 1 (09:00 AM)',
    aliases: ['CGL MAINS', 'SSC CGL TIER 2', 'SSC CGL Tier-2'],
    sort_order: 15,
    is_active: true,
  },
  {
    exam_name: 'BPSC CCE PRE',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Civil Services Prelims',
    domain_id: 'civil_pcs',
    organizing_body: 'BPSC',
    shift_format_type: 'cce_edition_date',
    shift_format_example: '69th CCE Prelims (30-09-2023)',
    aliases: ['BPSC CSE PRE', 'BPSC CCE', 'BPSC PRE'],
    sort_order: 20,
    is_active: true,
  },
  {
    exam_name: 'BPSC TRE 1.0',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Teacher TRE 1.0',
    domain_id: 'teaching',
    organizing_body: 'BPSC',
    shift_format_type: 'tre_tier_date',
    shift_format_example: 'Class 1-5 • Shift 1 (Aug 2023)',
    aliases: ['BPSC TRE1', 'BPSC TRE 1', 'BPSC 1-5', 'BPSC 9-10 MATHS TRE 1.0', 'BPSC 9-10 SCIENCE TRE -1.0'],
    sort_order: 30,
    is_active: true,
  },
  {
    exam_name: 'BPSC TRE 2.0',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Teacher TRE 2.0',
    domain_id: 'teaching',
    organizing_body: 'BPSC',
    shift_format_type: 'tre_tier_date',
    shift_format_example: 'Class 6-8 (09 Dec 2023)',
    aliases: ['BPSC TRE2', 'BPSC TRE 2', 'BPSC 9-10 SOCIAL SCIENCE TRE 2.0', 'BPSC 9-10 Social Science', 'BPSC 6-8 MATHS SCIENCE'],
    sort_order: 31,
    is_active: true,
  },
  {
    exam_name: 'BPSC TRE 3.0',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Teacher TRE 3.0',
    domain_id: 'teaching',
    organizing_body: 'BPSC',
    shift_format_type: 'tre_tier_date',
    shift_format_example: 'Class 6-8 (Jul 2024)',
    aliases: ['BPSC TRE3', 'BPSC TRE 3'],
    sort_order: 32,
    is_active: true,
  },
  {
    exam_name: 'BPSC AEDO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC AEDO',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_shift_time',
    shift_format_example: '14 Apr 2026 • Shift 1',
    aliases: ['AEDO'],
    sort_order: 40,
    is_active: true,
  },
  {
    exam_name: 'BPSC AUDITOR',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Auditor',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '05 Jul 2026',
    aliases: ['BPSC Auditor', 'Auditor'],
    sort_order: 41,
    is_active: true,
  },
  {
    exam_name: 'BPSC CDPO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC CDPO',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '15 May 2022',
    aliases: ['CDPO', 'B.P.S.C. CDPO'],
    sort_order: 42,
    is_active: true,
  },
  {
    exam_name: 'BPSC AAO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Assistant Audit Officer',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '20 Aug 2022',
    aliases: ['Assistant Audit Officer', 'B.P.S.C. Assistant Audit Officer'],
    sort_order: 43,
    is_active: true,
  },
  {
    exam_name: 'BPSC PROJECT MANAGER',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Project Manager',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '08 Aug 2021',
    aliases: ['Project Manager', 'B.P.S.C. Project Manager'],
    sort_order: 44,
    is_active: true,
  },
  {
    exam_name: 'BPSC ASSISTANT',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Assistant',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '31 Aug 2023 • Mains Paper II',
    aliases: ['BPSC Assistant Mains', 'Assistant Mains'],
    sort_order: 45,
    is_active: true,
  },
  {
    exam_name: 'BPSC AGRICULTURE',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Agriculture Dept',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_range',
    shift_format_example: '01–04 Mar 2024',
    aliases: ['Agriculture Dept', 'BPSC Agriculture Department-2024'],
    sort_order: 46,
    is_active: true,
  },
  {
    exam_name: 'BPSC MVI',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC MVI',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_range',
    shift_format_example: '09–10 Aug 2025',
    aliases: ['BPSC Motor Vehicle Inspectors. QP', 'BPSC Motor Vehicle Inspector'],
    sort_order: 47,
    is_active: true,
  },
  {
    exam_name: 'BPSC MDO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Mineral Dev. Officer',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_range',
    shift_format_example: '09–10 Aug 2025',
    aliases: ['BPSC - Mineral Development Officer Exam 2025 - GS Paper', 'BPSC Mineral Development Officer'],
    sort_order: 48,
    is_active: true,
  },
  {
    exam_name: 'BPSC LAW OFFICER',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Law Officer',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_range',
    shift_format_example: '26–27 Jul 2025',
    aliases: ['BPSC Law Officer GS Question Paper'],
    sort_order: 49,
    is_active: true,
  },
  {
    exam_name: 'BPSC PRO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Public Relation Officer',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_range',
    shift_format_example: '26–27 Jul 2025',
    aliases: ['BPSC Public Relation Officer GS Question Paper'],
    sort_order: 50,
    is_active: true,
  },
  {
    exam_name: 'BPSC DSO',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC District Statistical Officer',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '03 Aug 2025',
    aliases: ['BPSC - DSO PT 2025'],
    sort_order: 51,
    is_active: true,
  },
  {
    exam_name: 'BPSC OTHER',
    canonical_group_id: 'bpsc',
    display_label: 'BPSC Misc / Compilation',
    domain_id: 'state_officer',
    organizing_body: 'BPSC',
    shift_format_type: 'date_only',
    shift_format_example: '15 May 2025',
    aliases: ['BPSC 2025', 'BPSC Misc'],
    sort_order: 59,
    is_active: true,
  },
  {
    exam_name: 'RRB NTPC UG',
    canonical_group_id: 'rrb_ntpc',
    display_label: 'RRB NTPC (UG)',
    domain_id: 'railways',
    organizing_body: 'RRB',
    shift_format_type: 'date_shift_time',
    shift_format_example: '07 May 2026 • Shift 1 (09:00 AM - 10:30 AM)',
    aliases: ['RRB NTPC', 'RRB'],
    sort_order: 60,
    is_active: true,
  },
  {
    exam_name: 'IB ACIO PRE',
    canonical_group_id: 'ib_acio',
    display_label: 'IB ACIO Executive',
    domain_id: 'defence_police',
    organizing_body: 'IB',
    shift_format_type: 'date_range',
    shift_format_example: '16–18 Sep 2025',
    aliases: ['IB ACIO'],
    sort_order: 70,
    is_active: true,
  },
  {
    exam_name: 'UPSC CSE PRE',
    canonical_group_id: 'upsc_cse',
    display_label: 'UPSC CSE Prelims',
    domain_id: 'civil_pcs',
    organizing_body: 'UPSC',
    shift_format_type: 'date_only',
    shift_format_example: '25 May 2025',
    aliases: ['UPSC CSE'],
    sort_order: 80,
    is_active: true,
  },
  {
    exam_name: 'UPSC CDS',
    canonical_group_id: 'upsc_cds',
    display_label: 'UPSC CDS',
    domain_id: 'defence_police',
    organizing_body: 'UPSC',
    shift_format_type: 'date_only',
    shift_format_example: '13 Apr 2025',
    aliases: ['CDS'],
    sort_order: 85,
    is_active: true,
  },
  {
    exam_name: 'BIHAR POLICE',
    canonical_group_id: 'bihar_police',
    display_label: 'Bihar Police / SI',
    domain_id: 'defence_police',
    organizing_body: 'BPSSC',
    shift_format_type: 'date_shift_time',
    shift_format_example: '17 Dec 2023 • Shift 1',
    aliases: ['Bihar Police', 'Bihar SI', 'BPSSC'],
    sort_order: 90,
    is_active: true,
  },
  {
    exam_name: 'OTHER',
    canonical_group_id: 'other',
    display_label: 'Other Competitive Exam',
    domain_id: 'other',
    organizing_body: 'OTHER',
    shift_format_type: 'date_only',
    shift_format_example: '01 Jan 2026',
    aliases: ['Other', 'General'],
    sort_order: 999,
    is_active: true,
  },
];

let memoryCatalog: ExamCatalogEntry[] | null = null;
let memoryFetchedAt = 0;
let inFlightPromise: Promise<ExamCatalogEntry[]> | null = null;

function readStoredCatalog(): { entries: ExamCatalogEntry[]; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.entries) && parsed.entries.length > 0) {
      return { entries: parsed.entries, fetchedAt: Number(parsed.fetchedAt || 0) };
    }
  } catch {
    // Ignore storage corruption and use fallback
  }
  return null;
}

function writeStoredCatalog(entries: ExamCatalogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CATALOG_STORAGE_KEY,
      JSON.stringify({ entries, fetchedAt: Date.now() })
    );
  } catch {
    // Non-fatal in private browsing / quota exceeded
  }
}

/**
 * Returns the fastest available SSOT catalog synchronously (memory -> localStorage -> static fallback).
 */
export function getCachedExamCatalog(): readonly ExamCatalogEntry[] {
  if (memoryCatalog && memoryCatalog.length > 0) {
    return memoryCatalog;
  }
  const stored = readStoredCatalog();
  if (stored) {
    memoryCatalog = stored.entries;
    memoryFetchedAt = stored.fetchedAt;
    return memoryCatalog;
  }
  return FALLBACK_EXAM_CATALOG;
}

/**
 * Hydrates `public.exam_catalog` with SWR caching and offline-safe fallback.
 */
export async function fetchExamCatalog(forceRefresh = false): Promise<ExamCatalogEntry[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCatalog && now - memoryFetchedAt < CATALOG_CACHE_TTL_MS) {
    return memoryCatalog;
  }
  if (!forceRefresh && inFlightPromise) {
    return inFlightPromise;
  }

  const stored = !forceRefresh ? readStoredCatalog() : null;
  if (stored && now - stored.fetchedAt < CATALOG_CACHE_TTL_MS) {
    memoryCatalog = stored.entries;
    memoryFetchedAt = stored.fetchedAt;
    return memoryCatalog;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [...getCachedExamCatalog()];
  }

  inFlightPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.BANK.EXAM_CATALOG)
        .select(
          'exam_name, canonical_group_id, display_label, domain_id, organizing_body, shift_format_type, shift_format_example, aliases, sort_order, is_active'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error || !Array.isArray(data) || data.length === 0) {
        return [...getCachedExamCatalog()];
      }

      const entries = data as ExamCatalogEntry[];
      memoryCatalog = entries;
      memoryFetchedAt = Date.now();
      writeStoredCatalog(entries);
      return entries;
    } catch {
      return [...getCachedExamCatalog()];
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

/**
 * Resolves a canonical DB exam name or legacy alias to its authoritative `exam_catalog.exam_name`.
 */
export function resolveCanonicalExamName(rawName: string | null | undefined): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();

  for (const entry of getCachedExamCatalog()) {
    if (entry.exam_name.toLowerCase() === lower) {
      return entry.exam_name;
    }
    if (entry.aliases.some((alias) => alias.toLowerCase() === lower)) {
      return entry.exam_name;
    }
  }
  return trimmed;
}

/**
 * Returns the SSOT entry for a canonical exam name or alias if found.
 */
export function findExamCatalogEntry(rawName: string | null | undefined): ExamCatalogEntry | undefined {
  if (!rawName) return undefined;
  const trimmed = rawName.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  return getCachedExamCatalog().find(
    (entry) =>
      entry.exam_name.toLowerCase() === lower ||
      entry.aliases.some((alias) => alias.toLowerCase() === lower)
  );
}

/**
 * Returns all canonical `exam_name` values belonging to a canonical group (e.g., `'ssc_cgl'`, `'bpsc'`).
 */
export function getExamNamesForGroup(canonicalGroupId: string): string[] {
  const lower = canonicalGroupId.trim().toLowerCase();
  return getCachedExamCatalog()
    .filter((entry) => entry.is_active && entry.canonical_group_id.toLowerCase() === lower)
    .map((entry) => entry.exam_name);
}
