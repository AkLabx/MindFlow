# Project Specification: MindFlow Result Dashboard for Answer Key Engine

## Architecture Overview

The MindFlow Result Dashboard (`src/features/tools/answer-key-engine/`) provides aspirants of high-stakes national examinations (e.g., SSC CGL, SSC CHSL, RRB ALP, RRB Technician) with competitive ranking, multi-shift normalisation analytics, cohort comparisons, and granular score breakdown.

The system is architected into four decoupled layers following Feature-Sliced Design (FSD) and the MindFlow Product Constitution (`docs/MINDFLOW_CONSTITUTION.md`):

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Presentation & Modular Visuals                                │
│ • ScorecardDashboard (Container & State Coordinator)                   │
│ • 8 Dedicated Section Cards (Single responsibility, mobile-first 360px)│
│ • 5 Pure SVG Visual Primitives (ScoreDonut, BalanceScale, etc.)       │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Application Hooks & Offline-First Hydration                   │
│ • useResultDashboard, useHistogramSlider, useShiftAverages             │
│ • 0ms hydration from IndexedDB (MindFlowDB v16)                        │
│ • Background synchronization via Supabase RPCs                         │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Deterministic Calculation & Formatting Core                   │
│ • stats.ts: Pure mathematical models (raw scores, ranks, percentiles,  │
│   deltas, Formula-2 normalisation, histogram binning)                  │
│ • format.ts: en-IN digit grouping, date/time, masked PII, deltas       │
│ • 100% test coverage with golden calculation fixtures in Vitest        │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Cloud Backend & Relational Storage (Supabase Postgres)        │
│ • Tables: exam_submissions, exam_section_results,                      │
│   exam_score_distribution (marks_x2), exam_scope_stats,                │
│   exam_shift_directory, official_answer_keys                           │
│ • BTree indexes: idx_sub_exam_norm, idx_sub_exam_cat_norm on          │
│   exam_submissions, idx_section_results_ranking on exam_section_results│
│ • Privacy-preserving SECURITY DEFINER RPCs (caller auth, zero PII leak)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Inventory

| # | Feature | Description | Milestone | Specification Source |
|---|---------|-------------|-----------|----------------------|
| 1 | Candidate Details Card | PII-masked candidate information card displaying masked name (`R*** K***`), masked roll (`3261******36`), category badge, exam date, shift time (12-hr IST), venue name, and subject | M5 | `spec_report.md` §4.1, `frontend_report.md` §5 |
| 2 | Score Summary Hero Card | Central score hero card with initials avatar, animated ~170px SVG `ScoreDonut`, raw score `136 / 200 Marks`, and 4 KPI metric tiles (Right +144.0, Wrong -8.0, Skipped, 82% Accuracy) | M5 | `spec_report.md` §4.2, `frontend_report.md` §5 |
| 3 | Rank & Average Benchmark | Three competition rank tiles (Overall 39,096, Shift 554, Category 16,596) with percentile pills, animated `BalanceScale` SVG, 'Your marks 136' pill, and 3 average tiles with directional deltas | M5 | `spec_report.md` §4.3, `frontend_report.md` §5 |
| 4 | Subject Wise Marks | Toggle between Cards View and Table View for 4 sections (Reasoning 40.5, GK 17.0, Maths 33.5, English 45.0) with accuracy badges, progress bars, and deep navy summary footer | M5 | `spec_report.md` §4.4, `frontend_report.md` §5 |
| 5 | Normalised Score & Rank | Multi-shift normalisation card supporting Formula-2 (top-0.1% anchor, 137.37 marks, baseline $M_q^{gm}=129.80$) and Formula-1 (provisional, returns null/NA), crimson rank tiles, shift rank invariance check, and bonus marks footer | M3, M5 | `spec_report.md` §4.5, §6, `backend_report.md` §6 |
| 6 | Candidates On Each Mark | Histogram analytics card with dark navy header, category filter tabs (`All`, `UR`, `OBC`, etc.), interactive SVG scrubber slider, and 3 dynamic counter tiles (X to X+1, >=X Top %, <X) | M5 | `spec_report.md` §4.6, `frontend_report.md` §4.3 |
| 7 | Subject Wise Comparison | Benchmarking candidate section marks against Serious Cohort (total marks >= 100) using comparison bars with vertical black tick for cohort average and accuracy row | M5 | `spec_report.md` §4.7, `frontend_report.md` §4.4 |
| 8 | Average Marks & Shift Directory | Analytics card with Shift/Category/Gender tabs, 3 summary tiles (Your Shift 104.12, Hardest 89.80, Easiest 120.01), "#24 hardest out of 53 shifts" callout, `SortedBars` SVG, and slide-over sheet | M5 | `spec_report.md` §4.8, `frontend_report.md` §4.5 |
| 9 | Pure Calculation Engine | Deterministic, framework-agnostic stats functions for marking schemes, section scores, accuracies, competition ranks, percentiles, top X%, deltas, and Formula-2 normalisation | M2 | `spec_report.md` §5, `frontend_report.md` §7.1 |
| 10 | Pure Formatting Engine | Indian digit grouping (`en-IN`), trailing zero suppression for integer marks, date/time in 12-hr IST, directional delta labels, and PII masking | M2 | `spec_report.md` §5.3, `frontend_report.md` §7.2 |
| 11 | Offline-First IndexedDB v16 | Dexie-free native IndexedDB schema bump from v15 to v16 in `MindFlowDB`, adding `exam_candidate_results` and `exam_dashboard_snapshots` for instant 0ms hydration | M4 | `backend_report.md` §2, `frontend_report.md` §6 |
| 12 | Backend Relational Schema | PostgreSQL tables: `exam_section_results` (indexed on `(exam_id, section_id, marks DESC)`), `exam_score_distribution` (`marks_x2`), `exam_scope_stats`, `exam_shift_directory`; composite indexes on `exam_submissions` | M3 | `backend_report.md` §4 |
| 13 | Secure Live Supabase RPCs | `get_result_dashboard` (strict auth check, section ranks), `get_marks_distribution`, `get_shift_averages` sub-3ms response times, and zero PII exposure of competitor records | M3 | `backend_report.md` §5 |
| 14 | Accessible Controls & States | WCAG 2.1 AA compliance, tabular numerals (`font-mono tabular-nums`), $\ge 44\times 44\text{px}$ touch targets, complete state coverage (`ShimmerBlock`, empty, low-sample, `ErrorState`), mobile-first down to 360px | M5 | `spec_report.md` §9, `frontend_report.md` §3.1 |

---

## Phased Milestones Breakdown

| # | Milestone Name | Detailed Scope & Deliverables | Dependencies |
|---|----------------|-------------------------------|--------------|
| **M1** | Master Architecture & Implementation Plan | Author authoritative `docs/RESULT_DASHBOARD_IMPLEMENTATION_PLAN.md` and repo-root `PROJECT.md` specifying component hierarchy, state ownership, schema DDL, RLS, RPCs, IndexedDB v16, golden fixtures test strategy, and Constitution compliance checklist. | None |
| **M2** | Pure Calculation Engine & Vitest Test Suite | Implement `src/features/tools/answer-key-engine/utils/stats.ts` and `utils/format.ts`. Author exhaustive Vitest unit tests in `utils/__tests__/` verifying 100% of Section 6 golden calculation fixtures. | M1 |
| **M3** | Backend Relational Schema & Live Supabase Deployment | Author SQL migration `supabase/migrations/20261107000000_create_result_dashboard_analytics.sql`. Apply to live project `sjcfagpjstbfxuiwhlps`. Enable RLS on `official_answer_keys`. Deploy and verify RPCs `get_result_dashboard`, `get_marks_distribution`, `get_shift_averages`. | M1 |
| **M4** | Offline Storage v16 & Integration Hooks | Upgrade `MindFlowDB` to schema version 16 in `src/lib/db.ts` with stores `exam_candidate_results` and `exam_dashboard_snapshots`. Implement client integration hooks (`useResultDashboard`, `useHistogramSlider`, `useShiftAverages`) with 0ms hydration waterfall. | M2, M3 |
| **M5** | UI Visual Primitives & 8 Dashboard Sections | Implement 5 SVG visual components (`ScoreDonut`, `BalanceScale`, `HistogramSlider`, `CohortComparisonBar`, `SortedBars`) and 8 modular section cards. Refactor `ScorecardDashboard.tsx` with mobile-first 360px responsiveness and complete state coverage. | M2, M4 |
| **M6** | Final Verification, E2E Pass & Forensic Audit | Complete end-to-end integration pass with live Eduquity test run (`326120624836`). Pass strict `npx tsc --noEmit` (0 errors), `npx vite build`, and `npx vitest --run`. Prepare audit verification evidence. | M5 |

---

## Interface Contracts

### 1. Calculation Engine (`src/features/tools/answer-key-engine/utils/stats.ts`)

```typescript
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
  maxShiftBaseline: number; // M_q^gm: sum of mean + stddev of easiest shift (129.80 in golden fixture: 120.01 + 9.79, evaluating to golden 137.37)
  maxShiftMean?: number; // legacy/informational
  minSampleGate?: number; // default 1000
}

export interface NormalisationResult {
  normalisedScore: number | null;
  formula: 'formula_1' | 'formula_2';
  status: 'SUCCESS' | 'INSUFFICIENT_SAMPLE' | 'PENDING_CONFIRMATION';
  description: string;
}

export function calculateSectionMarks(
  correct: number,
  wrong: number,
  positive: number,
  negative: number
): number;

export function calculateAccuracy(
  correct: number,
  attempted: number
): number | null;

export function calculateCompetitionRank(
  candidateScore: number,
  competitorScores: number[]
): number;

export function calculatePercentile(
  rank: number,
  totalCandidates: number
): number;

export function calculateTopPercentage(
  candidatesAtOrAbove: number,
  totalCandidates: number
): number;

export function calculateDelta(
  candidateValue: number,
  averageValue: number
): {
  delta: number;
  trend: 'more' | 'less' | 'neutral';
  formatted: string;
};

export function calculateNormalisedScoreFormula2(
  params: NormalisationParameters
): NormalisationResult;

export function computeHistogramMetrics(
  bins: Array<{ marks: number; cnt: number; cum_below: number; cum_above: number }>,
  targetMark: number,
  totalCandidates: number
): {
  binCount: number;
  atOrAboveCount: number;
  topPct: number;
  belowCount: number;
};
```

### 2. Formatting Engine (`src/features/tools/answer-key-engine/utils/format.ts`)

```typescript
export function formatIndianNumber(value: number | string | null | undefined): string;
export function formatMarks(marks: number | null | undefined): string;
export function formatPercentile(percentile: number | null | undefined): string;
export function formatTopPercentage(topPct: number | null | undefined): string;
export function formatExamDate(dateStr: string | null | undefined): string;
export function formatExamTime(timeStr: string | null | undefined): string;
export function formatDeltaText(delta: number): string;
export function formatMaskedRoll(roll: string | null | undefined): string;
export function formatMaskedName(name: string | null | undefined): string;
```

### 3. Layer 3 Application Hooks (`src/features/tools/answer-key-engine/hooks/`)

```typescript
// 1. useResultDashboard
export interface ResultDashboardData {
  candidate: {
    submission_id: string;
    candidate_name: string;
    roll_number: string;
    category: string;
    gender?: string;
    state?: string;
    exam_date: string;
    exam_time: string;
    shift_name: string;
    shift_code: string;
    venue_name: string;
    exam_name: string;
  };
  score_summary: {
    raw_score: number;
    max_marks: number;
    bonus_marks: number;
    total_questions: number;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
    normalised_score: number | null;
    normalised_formula: 'formula_1' | 'formula_2';
  };
  ranks: {
    overall: { rank: number; total: number; percentile: number };
    shift: { rank: number; total: number; percentile: number };
    category: { rank: number; total: number; percentile: number };
    normalised: {
      overall_rank: number;
      overall_percentile: number;
      shift_rank: number;
      shift_percentile: number;
      category_rank: number;
      category_percentile: number;
    };
  };
  averages_and_deltas: {
    overall: { mean: number; delta: number; n: number };
    shift: { mean: number; delta: number; n: number };
    category: { mean: number; delta: number; n: number };
  };
  section_results: Array<{
    section_id: string;
    name: string;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    marks: number;
    accuracy: number;
    rank: number;
    serious_cohort_avg_marks: number;
    serious_cohort_delta: number;
    serious_cohort_avg_accuracy: number;
  }>;
  shift_directory_summary: {
    total_shifts: number;
    your_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
    hardest_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
    easiest_shift: { shift_code: string; shift_label: string; mean: number; n: number; difficulty_rank: number };
  };
  score_distribution_summary: {
    candidate_marks: number;
    total_sample_n: number;
    count_at_exact_marks: number;
    count_gte_marks: number;
    count_lt_marks: number;
    top_x_percent: number;
  };
}

export interface UseResultDashboardReturn {
  dashboard: ResultDashboardData | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useResultDashboard(submissionId?: string): UseResultDashboardReturn;

// 2. useHistogramSlider
export interface HistogramBin {
  marks: number;
  cnt: number;
  cum_below: number;
  cum_above: number;
}

export interface HistogramMetrics {
  selectedMark: number;
  binCount: number;
  atOrAboveCount: number;
  topPct: number;
  belowCount: number;
  totalCandidates: number;
}

export interface UseHistogramSliderProps {
  examId: string;
  candidateMark: number;
  initialScopeKey?: string;
}

export interface UseHistogramSliderReturn {
  selectedMark: number;
  setSelectedMark: (marks: number) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  bins: HistogramBin[];
  metrics: HistogramMetrics;
  isLoading: boolean;
  error: string | null;
  resetToCandidateMarks: () => void;
  handleSliderChange: (event: React.ChangeEvent<HTMLInputElement> | number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useHistogramSlider(props: UseHistogramSliderProps): UseHistogramSliderReturn;

// 3. useShiftAverages
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

export function useShiftAverages(props: UseShiftAveragesProps): UseShiftAveragesReturn;
```

### 4. Native IndexedDB v16 (`src/lib/db.ts`)

```typescript
export interface CachedCandidateResult {
  id: string; // submission_id
  exam_id: string;
  user_id?: string;
  roll_number: string;
  candidate_name: string;
  exam_date: string;
  exam_time: string;
  shift_name: string;
  shift_code: string;
  venue_name: string;
  category: string;
  raw_score: number;
  bonus_marks: number;
  normalised_score: number | null;
  total_correct: number;
  total_wrong: number;
  total_unattempted: number;
  accuracy: number;
  section_details: Record<string, any>;
  question_responses: any[];
  saved_at: string;
}

export interface CachedDashboardSnapshot {
  submission_id: string;
  exam_id: string;
  cached_at: string;
  dashboard_data: any; // Complete JSON payload from get_result_dashboard
}
```

### 5. Database RPC Contracts (`public`)

```sql
-- 1. Full Dashboard Document (Sub-3ms execution, caller authenticated)
-- Auth Guard: IF auth.uid() IS NULL OR v_sub.user_id <> auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
-- Returns candidate scores, 3 competition ranks, normalised score (Formula-2), section ranks, and cohort stats
get_result_dashboard(p_submission_id UUID) RETURNS JSONB;

-- 2. Histogram Slider Bins (marks_x2 integer half-marks)
get_marks_distribution(
    p_exam_id TEXT,
    p_scope_type TEXT DEFAULT 'overall',
    p_scope_key TEXT DEFAULT 'all',
    p_section_id TEXT DEFAULT 'total'
) RETURNS JSONB;

-- 3. Shift Difficulty & Dimension Averages (Shift difficulty rank, category, gender)
get_shift_averages(
    p_exam_id TEXT,
    p_dimension TEXT DEFAULT 'shift' -- 'shift' | 'category' | 'gender'
) RETURNS JSONB;
```

---

## Code Layout & File Directory Structure

```
d:\MindFlow-main\
├── docs/
│   └── RESULT_DASHBOARD_IMPLEMENTATION_PLAN.md   # Authoritative Master Architecture Blueprint
├── PROJECT.md                                     # Master Project Specification (This File)
├── supabase/
│   └── migrations/
│       └── 20261107000000_create_result_dashboard_analytics.sql # Relational tables, indexes, RLS, RPCs
├── src/
│   ├── config/
│   │   └── features.ts                            # Normalisation strategy & analytics feature flags
│   ├── lib/
│   │   └── db.ts                                  # Native IndexedDB MindFlowDB bump to v16
│   └── features/
│       └── tools/
│           └── answer-key-engine/
│               ├── AnswerKeyCalculator.tsx        # Entry point updated for v16 cache
│               ├── types.ts                       # Extended dashboard, normalisation, & RPC types
│               ├── index.ts                       # Public barrel exports
│               ├── hooks/
│               │   ├── useResultDashboard.ts      # 0ms IndexedDB hydration & RPC sync
│               │   ├── useHistogramSlider.ts      # Draggable scrubber & dynamic bin state
│               │   └── useShiftAverages.ts        # Shift difficulty sorting & drawer state
│               ├── services/
│               │   ├── answerKeyService.ts        # RPC invocation & v16 DB persistence
│               │   └── normalisationStrategy.ts   # Formula-1 and Formula-2 strategy registry
│               ├── utils/
│               │   ├── stats.ts                   # Pure calculation engine
│               │   ├── format.ts                  # Indian digit grouping, masked PII, dates
│               │   └── __tests__/
│               │       ├── stats.test.ts          # Vitest suite verifying golden calculation fixtures
│               │       └── format.test.ts         # Vitest suite verifying formatters & masking
│               └── components/
│                   ├── ScorecardDashboard.tsx     # Refactored 8-section layout coordinator
│                   ├── common/
│                   │   ├── HonestLabelingBanner.tsx # N sample size disclosure & estimate notices
│                   │   ├── MetricTile.tsx           # Reusable KPI tile with trend indicators
│                   │   └── SectionHeader.tsx        # Unified title, badge, and descriptive tooltip
│                   ├── visuals/
│                   │   ├── ScoreDonut.tsx           # Animated ~170px SVG Donut chart
│                   │   ├── BalanceScale.tsx         # You vs Average dynamic SVG balance scale
│                   │   ├── HistogramSlider.tsx      # SVG histogram with keyboard/touch scrubber
│                   │   ├── CohortComparisonBar.tsx  # Horizontal bar with vertical black average tick
│                   │   ├── SortedBars.tsx           # SVG shift difficulty horizontal ranking
│                   │   └── AllShiftsSlideOver.tsx   # Accessible slide-over sheet for shift directory
│                   └── sections/
│                       ├── CandidateDetailsSection.tsx      # Section 1: Candidate Details card
│                       ├── ScoreSummarySection.tsx          # Section 2: Score Summary hero card
│                       ├── RankAndAverageSection.tsx        # Section 3: Rank Among Candidates & You vs Avg
│                       ├── SubjectWiseMarksSection.tsx      # Section 4: Subject Wise Marks card/table
│                       ├── NormalisedScoreSection.tsx       # Section 5: Normalised Score and Rank
│                       ├── MarksDistributionSection.tsx     # Section 6: Candidates On Each Mark
│                       ├── SubjectWiseComparisonSection.tsx # Section 7: Serious Cohort Comparison
│                       └── AverageMarksSection.tsx          # Section 8: Average Marks (Shift/Cat/Gender)
```
