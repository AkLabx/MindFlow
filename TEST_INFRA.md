# MindFlow Result Dashboard — Test Infrastructure & E2E Testing Track (TEST_INFRA.md)

> **Document Version:** 1.0.0  
> **Target Subsystem:** Answer Key Engine & Result Dashboard (`src/features/tools/answer-key-engine/`)  
> **Author:** `teamwork_test_writer_e2e`  
> **Authority Precedence:** MindFlow Product Constitution (`docs/MINDFLOW_CONSTITUTION.md`), `PROJECT.md`, `spec_report.md`, `ORIGINAL_REQUEST.md`  
> **Test Runner:** Vitest (`npx vitest --run`)  
> **Typecheck:** TypeScript (`npx tsc --noEmit`)

---

## 1. Test Philosophy & Architecture Principles

The MindFlow Result Dashboard provides high-stakes examination candidates (SSC CGL, SSC CHSL, RRB ALP, etc.) with competitive rankings, multi-shift normalisation analytics, cohort comparisons, and granular score breakdowns. Because decisions made on this dashboard directly affect candidates' competitive expectations and preparation strategies, testing must adhere to strict engineering principles:

### 1.1 Opaque-Box & Requirement-Driven
- Tests are executed against public contracts, exported functions, service methods, parser adapters, and data interfaces without introspecting volatile private internal state.
- Specifications derive strictly from `ORIGINAL_REQUEST.md`, `spec_report.md`, and `PROJECT.md`.
- No tests are constructed to mirror an idiosyncratic internal implementation; rather, implementations must satisfy the authoritative mathematical specifications.

### 1.2 Authoritative Oracles & Ground-Truth Fixtures
- Every expected test outcome is anchored in an authoritative reference oracle:
  1. **Section 6 Golden Calculation Fixtures:** Canonical candidate metrics for SSC CGL Tier-1 test run `326120624836` (13 Oct 2026 Shift 1, UR).
  2. **Mathematical Proofs:** Deterministic equations for Standard Competition 1224 Ranking, Percentile calculation, Top X% cumulative frequency, and SSC Formula-2 normalisation.
  3. **Staff Selection Commission Official Notice Formulations:** Proof of shift-rank invariance ($K_i > 0$).
  4. **Vendor Response Sheet HTML Standards:** Eduquity ASP.NET postback structures and TCS iON `.menu-tbl` markup.

### 1.3 Zero-Tolerance for Facade Tests & Dummy Assertions
- Facade tests (assertions like `expect(true).toBe(true)` or tautological checks) are strictly banned.
- All tests execute real logic: string parsing, DOM traversing, arithmetic aggregation, sorting algorithms, privacy filters, and caching workflows.
- Assertions verify exact mathematical constants, rounded floating points to defined precisions, and correct state transitions.

### 1.4 Test Isolation & Determinism
- Each test is hermetic and self-contained: it initializes its own inputs and fixtures, runs independently of test execution order, and produces zero side-effects on subsequent tests.
- LocalStorage and IndexedDB mocks are wiped between test cycles.
- Non-deterministic elements (such as timestamps) use controlled, frozen test vectors.

---

## 2. 4-Tier Test Case Design Matrix

To ensure end-to-end confidence across the entire Answer Key Engine, test cases are organized into four comprehensive tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 4: Real-World Scenarios                                          │
│ • Official Eduquity production test run 326120624836 (Full E2E)       │
│ • TCS iON multi-section real response sheet markup                     │
│ • 53-Shift master directory sorting, navigation, and hardest/easiest  │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: Cross-Feature Interactions (Pairwise Combinations)             │
│ • Normalisation score + rank ties preservation                        │
│ • Offline cache snapshot rehydration + dynamic histogram updates      │
│ • Category filtering + histogram scrubber synchronization             │
│ • Serious cohort (marks >= 100) + sectional zero attempts             │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: Boundary & Corner Cases (>=5 per Feature across 14 Features)  │
│ • Zero attempts (division by zero guard -> '—' dash)                  │
│ • Min/max marks boundaries (-50.0 to +200.0)                          │
│ • Tie ranks (1224 competition ranking with skips)                     │
│ • Single-candidate shifts (N = 1, rank 1/1, percentile 100%)         │
│ • Normalisation sample gate (N < 1,000 threshold warning)             │
│ • Negative marks lost formatting (no double negatives '--8.0')        │
│ • PII masking and caller auth guardrails                              │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 1: Feature Coverage (>=5 per Feature across 14 Features)         │
│ • Features 1 through 14: Happy-path baseline functional verification  │
│ • Inputs -> Calculations -> Output contracts -> Honest labeling       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier 1: Feature Coverage (>= 5 Tests per Feature across 14 Features)

All 14 features identified in `PROJECT.md` and `spec_report.md` are covered by at least 5 distinct test cases in Tier 1:

| Feature # | Feature Name | Test Case IDs | Scope Verified |
| :---: | :--- | :--- | :--- |
| **F1** | Candidate Details Card | `T1-F1-01` to `T1-F1-05` | Name masking, roll masking, category badge, date/time formatting, venue handling. |
| **F2** | Score Summary Hero Card | `T1-F2-01` to `T1-F2-05` | Raw score calculation (136/200), KPI tiles (Right +144, Wrong -8, Skipped 12, 82% Acc), ScoreDonut arc segment calculations. |
| **F3** | Rank Among Candidates & You vs Average | `T1-F3-01` to `T1-F3-05` | Overall rank (39,096 / 2,84,571), Shift rank (554 / 4,834), Category rank (16,596 / 1,15,911), deltas (+30.94, +31.88, +29.93), Balance Scale tilt. |
| **F4** | Subject Wise Marks | `T1-F4-01` to `T1-F4-05` | Section A Reasoning (40.5, 88%), Section B GK (17.0, 52%), Section C Maths (33.5, 94%), Section D English (45.0, 92%), Table/Card toggle contract. |
| **F5** | Normalised Score and Rank | `T1-F5-01` to `T1-F5-05` | Formula-2 calculation (137.37 marks), overall rank update (33,335), category rank update (14,088), shift rank invariance (554 -> 554), Formula-1 provisional status. |
| **F6** | Candidates On Each Mark | `T1-F6-01` to `T1-F6-05` | Histogram slider dynamic bins at $X=136$ (Bin count 3,075, Marks $\ge 136$ count 40,623, Top 14.3%, Below count 2,43,948), total consistency check. |
| **F7** | Subject Wise Comparison (Serious Cohort) | `T1-F7-01` to `T1-F7-05` | Serious cohort benchmark ($\ge 100$ total marks), section deltas (+0.80, -6.79, +5.07, +12.79), cohort average accuracies (88%, 66%, 86%, 74%). |
| **F8** | Average Marks & Shift Directory | `T1-F8-01` to `T1-F8-05` | Candidate shift mean (104.12), hardest shift (89.80), easiest shift (120.01), difficulty ranking (#24 hardest out of 53 shifts), SortedBars ordering. |
| **F9** | Core Calculation Engine | `T1-F9-01` to `T1-F9-05` | Marking scheme (+2.0, -0.5), competition ranking (1224 rule), percentile calculation, top X% calculation, delta classification. |
| **F10** | Formatting Engine | `T1-F10-01` to `T1-F10-05` | Indian digit grouping (`2,84,571`), trailing zero suppression (`136` vs `40.5`), date format (`13 Oct 2026`), 12-hour IST time (`9:00 AM IST`), delta labels. |
| **F11** | Offline Storage & Hydration | `T1-F11-01` to `T1-F11-05` | Native IndexedDB v16 object stores (`exam_candidate_results`, `exam_dashboard_snapshots`), 0ms hydration waterfall, local caching fallback. |
| **F12** | Backend Relational Schema & Indexes | `T1-F12-01` to `T1-F12-05` | DDL constraints, BTree index on `(exam_id, section_id, marks DESC)`, integer `marks_x2` bin representation, relational referential integrity. |
| **F13** | Live Supabase RPCs & Privacy Guardrails | `T1-F13-01` to `T1-F13-05` | `get_result_dashboard` caller authentication, caller-only data scoping, zero PII leak in aggregate distributions, performance budget (<3ms). |
| **F14** | UI Accessibility & State Coverage | `T1-F14-01` to `T1-F14-05` | Tabular numbers (`tabular-nums font-mono`), $\ge 44\times 44\text{px}$ touch targets, complete state coverage (loading, empty, error, low-sample), mobile-first 360px viewport. |

---

## 4. Tier 2: Boundary & Corner Cases (>= 5 Tests per Feature across 14 Features)

Tier 2 exposes the engine to adversarial conditions, edge limits, and degenerative data distributions:

| Feature # | Edge Condition | Test Case ID | Expected Safe Behavior |
| :---: | :--- | :--- | :--- |
| **F1** | Empty or single-token name | `T2-F1-01` | Single token `'A'` yields `'A'`, empty yields `'Aspirant'`. |
| **F1** | Short roll number (< 6 characters) | `T2-F1-02` | Preserves or falls back to mask without crash. |
| **F1** | Long roll number (16+ chars) | `T2-F1-03` | Keeps first 4, last 2, masks all middle digits. |
| **F1** | Special characters in venue string | `T2-F1-04` | Sanitizes or truncates safely without XSS. |
| **F1** | Missing exam date and shift code | `T2-F1-05` | Falls back to current date and default shift label without `undefined` text. |
| **F2** | 0 questions attempted (0 right, 0 wrong) | `T2-F2-01` | Accuracy returns `null` or `'—'` (division by zero avoided), raw score 0.0. |
| **F2** | Maximum possible score (100 right, 0 wrong) | `T2-F2-02` | Score = 200.0 / 200, 100% accuracy, right +200.0, wrong 0. |
| **F2** | Minimum possible score (0 right, 100 wrong) | `T2-F2-03` | Score = -50.0 / 200, 0% accuracy, wrong -50.0 marks lost. |
| **F2** | All 100 questions skipped | `T2-F2-04` | Attempted = 0, Skipped = 100, Score = 0.0, Accuracy = `'—'`. |
| **F2** | Floating negative marks lost formatting | `T2-F2-05` | Displays `-8.0 Marks Lost` avoiding double negative `--8.0`. |
| **F3** | Tie ranks (equal scores) | `T2-F3-01` | 3 candidates with identical score 136 share rank 554; next candidate gets rank 557 (1224 rule). |
| **F3** | Single-candidate shift ($N = 1$) | `T2-F3-02` | Shift rank = 1, total = 1, percentile = 100.00%ile, delta = 0.00. |
| **F3** | Candidate score exactly matches average | `T2-F3-03` | Delta = 0.00, trend = `'neutral'`, label = `'Equal to average'`. |
| **F3** | Candidate has strictly lowest score in scope | `T2-F3-04` | Rank = $N$, percentile = $0.00$\%ile or $(1 - (N-1)/N)\times 100$. |
| **F3** | Candidate has strictly highest score in scope | `T2-F3-05` | Rank = 1, percentile = 100.00%ile, top 0.1% or $\le 1/N$. |
| **F4** | Section with 0 attempted | `T2-F4-01` | Section accuracy displays `'—'`, score = 0.0, attempted = 0. |
| **F4** | Section with negative score | `T2-F4-02` | 2 right (+4.0), 20 wrong (-10.0) -> -6.0 marks, accuracy 9.1%. |
| **F4** | Section with all 25 correct | `T2-F4-03` | 25 right, 0 wrong -> 50.0 marks, accuracy 100%. |
| **F4** | Section with dropped/bonus question | `T2-F4-04` | Correctly adds bonus marks into section and total score. |
| **F4** | Responsive table column overflow | `T2-F4-05` | Wraps into scrollable container or switches to card view without horizontal clip. |
| **F5** | Shift sample size $N < 1,000$ | `T2-F5-01` | Gated behind statistical sample size: status = `'INSUFFICIENT_SAMPLE'`, score = null. |
| **F5** | Shift standard deviation = 0 (identical scores) | `T2-F5-02` | Guarded division avoids `Infinity` or `NaN`. |
| **F5** | Formula-1 activation requested | `T2-F5-03` | Returns `null` / `'N/A'` with pending confirmation message. |
| **F5** | Normalised score exceeds 200 or falls below -50 | `T2-F5-04` | Accurately computes linear projection without arbitrary truncation. |
| **F5** | Shift rank before vs after normalisation | `T2-F5-05` | Strict invariance: $\text{Rank}_{\text{raw}} \equiv \text{Rank}_{\text{norm}}$. |
| **F6** | Slider dragged to minimum mark (-50) | `T2-F6-01` | Below count = 0, AtOrAbove count = $N$, Top % = 100.0%. |
| **F6** | Slider dragged to maximum mark (200) | `T2-F6-02` | AtOrAbove count = candidates with 200, below count = $N - \text{toppers}$. |
| **F6** | Slider dragged out of bounds (< -50 or > 200) | `T2-F6-03` | Clamped to examination bounds [-50, 200]. |
| **F6** | Non-existent mark bin with 0 candidates | `T2-F6-04` | Bin count displays 0 without breaking cumulative counts. |
| **F6** | Keyboard step increment (ArrowLeft/ArrowRight) | `T2-F6-05` | Shifts by exactly 1.0 or 0.5 marks with accessible `aria-valuenow`. |
| **F7** | Serious cohort sample size $N < 10$ | `T2-F7-01` | Renders low-sample warning banner rather than skewed averages. |
| **F7** | Candidate scored < 100 (non-serious aspirant) | `T2-F7-02` | Benchmark against $\ge 100$ cohort remains valid and educational. |
| **F7** | Candidate scored perfect 50 in section | `T2-F7-03` | Visual bar handles max score without container overflow. |
| **F7** | Section delta is exactly 0.00 vs serious cohort | `T2-F7-04` | Neutral badge displayed with `0.00` and gray styling. |
| **F7** | Candidate section accuracy = 0% vs cohort 80% | `T2-F7-05` | Red delta displayed without division by zero. |
| **F8** | Shift directory with only 1 shift recorded | `T2-F8-01` | Renders single shift notice ("#1 out of 1 shifts recorded so far"). |
| **F8** | All shifts have identical mean marks | `T2-F8-02` | Tied difficulty ranks handled deterministically. |
| **F8** | Candidate shift is the hardest shift (#1 hardest) | `T2-F8-03` | Summary tile correctly highlights Your Shift === Hardest. |
| **F8** | Candidate shift is the easiest shift (#53 hardest) | `T2-F8-04` | Summary tile correctly highlights Your Shift === Easiest. |
| **F8** | Search/filter in "View All Shifts" slide-over | `T2-F8-05` | Filter by shift code or date returns matched subset, empty returns empty state. |
| **F9** | Marking scheme with 0 negative mark | `T2-F9-01` | Section marks = $2.0 \times \text{Right} - 0 \times \text{Wrong}$. |
| **F9** | Negative candidate marks in percentile | `T2-F9-02` | Percentile formula handles negative marks seamlessly. |
| **F9** | Large candidate array ($N = 100,000$) | `T2-F9-03` | Competition rank computes in $< 50\text{ms}$ using binary search / sorted array. |
| **F9** | Top X% computation with all candidates tied | `T2-F9-04` | At or above count = $N \implies \text{Top } 100.0\%$. |
| **F9** | Delta precision rounding | `T2-F9-05` | $136 - 105.06 = 30.94$, avoiding floating-point precision artifacts (`30.939999999999998`). |
| **F10** | Indian number formatting with 0 | `T2-F10-01` | Returns `'0'`. |
| **F10** | Indian number formatting with negative number | `T2-F10-02` | Returns `'-2,84,571'`. |
| **F10** | Trailing zero suppression on half marks | `T2-F10-03` | `40.50` returns `'40.5'`, `136.00` returns `'136'`. |
| **F10** | Null/undefined inputs to formatters | `T2-F10-04` | Returns `'—'` or `'N/A'` rather than `'null'` or `'NaN'`. |
| **F10** | 12-hour IST time parsing with invalid strings | `T2-F10-05` | Returns original string or fallback gracefully. |
| **F11** | IndexedDB QuotaExceededError simulation | `T2-F11-01` | Handled silently without bubbling up to crash the UI. |
| **F11** | IndexedDB schema upgrade from v15 to v16 | `T2-F11-02` | Existing stores preserved, new stores (`exam_candidate_results`, `exam_dashboard_snapshots`) created. |
| **F11** | LocalStorage corrupted JSON data | `T2-F11-03` | Safely catches parse error, returns `null`, triggers network fetch. |
| **F11** | Stale cache invalidation | `T2-F11-04` | Cache older than TTL flags for background revalidation. |
| **F11** | Offline offline-fallback waterfall | `T2-F11-05` | Renders from IndexedDB in $< 10\text{ms}$ when network offline. |
| **F12** | Duplicate submission insertion constraint | `T2-F12-01` | Enforces unique `(exam_id, roll_number)` upsert behavior. |
| **F12** | Section results foreign key deletion | `T2-F12-02` | Deleting submission cascades cleanly to section results. |
| **F12** | Half-mark indexing via `marks_x2` | `T2-F12-03` | Mark `40.5` stores as integer `81`, preventing floating-point index degradation. |
| **F12** | BTree index utilization on section ranks | `T2-F12-04` | Verifies index order `(exam_id, section_id, marks DESC)`. |
| **F12** | Null constraint violation prevention | `T2-F12-05` | Essential columns reject null insertions. |
| **F13** | Unauthorized caller requests other's submission | `T2-F13-01` | Throws `'Access denied: You can only query your own rank.'`. |
| **F13** | Anonymous unauthenticated caller | `T2-F13-02` | Rejected immediately with 401 Unauthorized. |
| **F13** | PII exclusion in aggregate RPC | `T2-F13-03` | `get_marks_distribution` returns only counts and bin marks, zero names/rolls. |
| **F13** | Non-existent submission ID | `T2-F13-04` | Returns null / empty dashboard payload gracefully. |
| **F13** | Sub-3ms query latency validation | `T2-F13-05` | Validates fast execution on index-backed data. |
| **F14** | Viewport down to 320px extreme mobile width | `T2-F14-01` | Layout wraps vertically with zero horizontal scroll blowout. |
| **F14** | Shimmer loading skeleton transition | `T2-F14-02` | Shimmer blocks match card dimensions (CLS = 0). |
| **F14** | Error state retry button click | `T2-F14-03` | Invokes refetch handler and clears error banner. |
| **F14** | Prefers-reduced-motion active | `T2-F14-04` | Animations disabled or instant duration applied. |
| **F14** | High-contrast WCAG 2.1 AA ratio | `T2-F14-05` | Contrast ratio $\ge 4.5:1$ on text elements. |

---

## 5. Tier 3: Cross-Feature Interactions (Pairwise Combinations)

Tier 3 validates the emergent behaviors when multiple features operate together:

1. **Normalisation with Tie Handling (`T3-PAIR-01`)**:
   - Multiple candidates in Shift A have identical raw scores (e.g. three candidates at 136.0).
   - Normalisation formula applies strictly monotonic linear scaling ($K_i > 0$).
   - Verification: All three candidates receive identical normalised scores and identical shift ranks.
2. **Offline Hydration with Score Distribution Bins (`T3-PAIR-02`)**:
   - Dashboard loads offline from IndexedDB v16 snapshot.
   - User drags histogram slider to mark $X = 140$.
   - Verification: Cached distribution bins compute counts and Top % locally without network request.
3. **Category Filtering with Histogram Dynamic Counters (`T3-PAIR-03`)**:
   - User switches category filter from `All` to `OBC` on the Candidates On Each Mark card.
   - Dynamic counter tiles recalculate for OBC cohort: $N_{\text{OBC}} = 1,15,911$.
   - Verification: Sum of Below $X$ + AtOrAbove $X$ equals total OBC sample size.
4. **Shift Difficulty Ranking with Normalisation Scaling Factor (`T3-PAIR-04`)**:
   - Hardest shift (mean 89.80) vs Easiest shift (mean 120.01).
   - Verification: Candidate in hardest shift receives higher positive normalisation increment than candidate with identical score in easiest shift.
5. **Serious Cohort Filter with Sectional Zero Attempts (`T3-PAIR-05`)**:
   - Candidate has 0 attempts in GK (Section B) but scores $\ge 100$ total marks across other sections.
   - Verification: Candidate is classified in Serious Cohort ($\ge 100$ total); GK comparison shows dash accuracy and delta $-23.79$.
6. **Subject Wise Table/Cards View Toggle with Responsive Resize (`T3-PAIR-06`)**:
   - View toggles between Cards and Table while screen viewport width dynamically resizes between 360px and 1024px.
   - Verification: State preserves selected view preference without resetting or layout breakage.
7. **PII Masking with Cloud Upsert Pipeline (`T3-PAIR-07`)**:
   - Candidate parses response sheet; raw details saved to secure database with caller ID.
   - Client display receives masked roll `3261******36` and masked name `R*** K***`.
   - Verification: Unmasked PII is never rendered in UI or exposed in client telemetry logs.

---

## 6. Tier 4: Real-World Scenarios

Tier 4 tests complete, authentic end-to-end workflows using production response sheets and real examination catalogs:

### 6.1 Eduquity Production Test Run `326120624836` (Golden Fixture)
- **Input:** Authentic Eduquity response sheet HTML containing watermark `326120624836`, exam date `13 Oct 2026`, Shift 1, UR Category, and 100 question tables.
- **Workflow:**
  1. `EduquityAdapter.canParse(html)` detects vendor.
  2. `EduquityAdapter.parse(html, sscConfig)` parses questions and sections.
  3. Section marks calculated: Sec A 40.5, Sec B 17.0, Sec C 33.5, Sec D 45.0.
  4. Total raw marks calculated: 136.0 / 200, 82% accuracy.
  5. Competitive standing calculated: Overall rank 39,096 / 2,84,571 (86.26%ile), Shift rank 554 / 4,834 (88.56%ile), Category rank 16,596 / 1,15,911 (85.68%ile).
  6. Averages & deltas: Overall avg 105.06 (+30.94), Shift avg 104.12 (+31.88), Category avg 106.07 (+29.93).
  7. Serious cohort subject comparison: Sec A +0.80, Sec B -6.79, Sec C +5.07, Sec D +12.79.
  8. Histogram bins at $X = 136$: Bin count 3,075, Marks $\ge 136$ count 40,623 (Top 14.3%), Below 2,43,948.
  9. Formula-2 normalisation: 137.37 marks, shift rank invariant at 554.
  10. Shift directory: Rank #24 hardest out of 53 shifts (mean 104.12).
  11. IndexedDB v16 saves candidate result and dashboard snapshot for instant 0ms offline rehydration.

### 6.2 TCS iON Multi-Section Response Sheet Parsing
- **Input:** TCS iON response sheet HTML containing `.menu-tbl`, `rightAns` classes, `Chosen Option` text, and candidate details table.
- **Workflow:**
  1. `TcsIonAdapter.canParse(html)` detects TCS format.
  2. DOM/Regex parser extracts roll number, candidate name, date, and shift.
  3. Parses all 4 sections with positive and negative marking.
  4. Verifies correct scoring and fallback regex resilience.

### 6.3 53-Shift Directory Navigation and Difficulty Ordering
- **Input:** Complete dataset of 53 examination shifts spanning multiple exam dates.
- **Workflow:**
  1. Shift sorting algorithm ranks shifts in ascending order of mean marks (1 = hardest, 53 = easiest).
  2. Hardest shift identified as 89.80; easiest shift identified as 120.01.
  3. Candidate's shift (`2026-10-13_S1`, mean 104.12) correctly placed at rank #24.
  4. Slide-over drawer search filter narrows by date and shift keyword.

---

## 7. Feature Checklist and Coverage Thresholds

| Feature | Description | Target Coverage | Status |
| :--- | :--- | :---: | :---: |
| **F1** | Candidate Details Card | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F2** | Score Summary Hero Card | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F3** | Rank Among Candidates & You vs Average | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F4** | Subject Wise Marks (Cards / Table) | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F5** | Normalised Score and Rank | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F6** | Candidates On Each Mark (Histogram) | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F7** | Subject Wise Comparison (Serious Cohort) | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F8** | Average Marks & Shift Directory | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F9** | Core Calculation Engine | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F10** | Formatting Engine | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F11** | Offline Storage & Hydration (v16) | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F12** | Backend Relational Schema & Indexes | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F13** | Live Supabase RPCs & Privacy Guardrails | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |
| **F14** | UI Accessibility & State Coverage | $\ge 5$ Tier 1, $\ge 5$ Tier 2 | **100% Covered** |

### Quality & Performance Gates
- **Unit & E2E Pass Rate:** 100% passing (0 failures).
- **TypeScript Typecheck:** `npx tsc --noEmit` must pass with 0 errors.
- **Execution Budget:** E2E suite runs in $< 15$ seconds under Vitest threads pool.
- **Adversarial Integrity:** Division by zero, floating precision, tie ranks, negative scores, and unauthorized access guarded without fatal exceptions.

---

## 8. Test Execution Commands

```powershell
# Run the complete E2E testing track
npx vitest --run src/features/tools/answer-key-engine/__tests__/e2e/

# Run typecheck verification
npx tsc --noEmit

# Run full project test suite
npx vitest --run
```

*Authoritative Test Infrastructure specification finalized and published.*
