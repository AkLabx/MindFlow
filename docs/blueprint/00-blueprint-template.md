# Generation Blueprint Template: [Gen X - Generation Title]

> **Usage:** Copy this template when starting a new 10-version Generation Blueprint under `docs/blueprint/`. Follow the **Rolling-Horizon Planning Rule**: keep **Step 1** execution-ready (high-definition), **Steps 2–5** at medium detail (concrete deliverables & boundaries), and **Steps 6–10** as strategic outcome sketches until prior steps complete.

---

## 1. Generation Metadata

- **Generation ID:** `Gen X`
- **Target File:** `docs/blueprint/vX.Y_blueprint.md`
- **Version Span:** `vX.Y.Z` $\rightarrow$ `vX.Y.(Z+9)` *(or graduation tag `vX.(Y+1).0`)*
- **Status:** `PLANNED` | `ACTIVE` | `COMPLETED`
- **Parent Index:** [`docs/blueprint/main_blueprint.md`](./main_blueprint.md)
- **Active Step:** `Step 1` (`vX.Y.Z`)
- **Last Updated:** `DD MMMM YYYY`

---

## 2. Generation Vision & Scope Boundaries

- **Core Theme:** <!-- 1-2 sentences describing the primary product & engineering arc of these 10 versions -->
- **Entry Prerequisites:**
  - <!-- Verified baseline version, clean main branch, passing static checks -->
- **Exit / Graduation Criteria:**
  - <!-- Concrete state required before unlocking the next 10-step Generation -->
- **Strictly Deferred / Parked Scope (Do NOT Pull Into This Generation):**
  - <!-- Explicit list of major features frozen for Gen X+1 to protect focus and velocity -->
- **Guardrail & Invariant Focus:**
  - <!-- Key DEC-XXXX invariants, Constitution rules, and Circuit Breakers most relevant to this generation -->

---

## 3. 10-Step Milestone Summary Table

| Step # | Target Version | Milestone Title | Horizon Tier | Status | Proof / PR |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **1** | `vX.Y.Z+1` | **[Next Immediate Milestone Title]** | High-Def | `[ ] NEXT` | — |
| **2** | `vX.Y.Z+2` | **[Milestone 2 Title]** | Medium | `[ ] PLANNED` | — |
| **3** | `vX.Y.Z+3` | **[Milestone 3 Title]** | Medium | `[ ] PLANNED` | — |
| **4** | `vX.Y.Z+4` | **[Milestone 4 Title]** | Medium | `[ ] PLANNED` | — |
| **5** | `vX.Y.Z+5` | **[Milestone 5 Title]** | Medium | `[ ] PLANNED` | — |
| **6** | `vX.Y.Z+6` | **[Milestone 6 Title]** | Vision | `[ ] VISION` | — |
| **7** | `vX.Y.Z+7` | **[Milestone 7 Title]** | Vision | `[ ] VISION` | — |
| **8** | `vX.Y.Z+8` | **[Milestone 8 Title]** | Vision | `[ ] VISION` | — |
| **9** | `vX.Y.Z+9` | **[Milestone 9 Title]** | Vision | `[ ] VISION` | — |
| **10** | `vX.Y.Z+10` | **[Milestone 10 / Generation Sign-Off]** | Vision | `[ ] VISION` | — |

---

## 4. Detailed Step Cards (Rolling Horizon)

### Step 1 (`vX.Y.Z+1`): [Milestone Title] — *[HIGH-DEFINITION SPEC]*

- **Vision:** <!-- Why this version matters right now and what user/engineering problem it solves -->
- **Planned Scope & Impacted Files:**
  1. **[Deliverable 1]:** Concrete implementation scope.
     - Target files: `src/...`
  2. **[Deliverable 2]:** Concrete implementation scope.
     - Target files: `src/...`
  3. **[Deliverable 3]:** Concrete implementation scope.
     - Target files: `src/...`
- **Dependencies & Circuit Breaker Check:**
  - *Modified files count estimate:* `N files` (threshold: `<= 10`)
  - *New npm / Gradle dependencies:* `None` (or specify for explicit user confirmation)
  - *Database / RLS / Auth contract impact:* `None` (or specify additive migration / RPC details)
  - *Invariants to protect:* `DEC-XXXX`, `DEC-YYYY`
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vite build` (clean) + targeted `vitest` tests.
  - *Runtime:* Exact manual/browser/Android verification flow on `http://localhost:3000/` (or assigned slot port) proving end-to-end real storage/API behavior with zero mocks.

---

### Step 2 (`vX.Y.Z+2`): [Milestone Title] — *[MEDIUM DETAIL]*

- **Vision:** <!-- Core outcome of this version -->
- **Planned Scope & Target Boundaries:**
  - <!-- Deliverable A -->
  - <!-- Deliverable B -->
  - *Out of scope:* <!-- What stays excluded -->
- **Dependencies & Circuit Breakers:** <!-- Prerequisite step, potential >10 files / schema / dependency triggers -->
- **Real-World Verification Goal:** <!-- Concrete browser/device/build verification criterion -->

---

### Step 3 (`vX.Y.Z+3`): [Milestone Title] — *[MEDIUM DETAIL]*

- **Vision:**
- **Planned Scope & Target Boundaries:**
- **Dependencies & Circuit Breakers:**
- **Real-World Verification Goal:**

---

### Step 4 (`vX.Y.Z+4`): [Milestone Title] — *[MEDIUM DETAIL]*

- **Vision:**
- **Planned Scope & Target Boundaries:**
- **Dependencies & Circuit Breakers:**
- **Real-World Verification Goal:**

---

### Step 5 (`vX.Y.Z+5`): [Milestone Title] — *[MEDIUM DETAIL]*

- **Vision:**
- **Planned Scope & Target Boundaries:**
- **Dependencies & Circuit Breakers:**
- **Real-World Verification Goal:**

---

### Steps 6–10: Strategic Horizon Cards — *[HIGH-LEVEL VISION]*

#### Step 6 (`vX.Y.Z+6`): [Milestone Title]
- **Vision:** <!-- Strategic capability and expected user/system outcome -->
- **Planned Scope Sketch:** <!-- High-level bullet boundary -->
- **Dependencies / Circuit Breakers:** <!-- Expected triggers to watch when promoting to Medium -->
- **Real-World Verification Goal:** <!-- Primary acceptance signal -->

#### Step 7 (`vX.Y.Z+7`): [Milestone Title]
- **Vision:**
- **Planned Scope Sketch:**
- **Dependencies / Circuit Breakers:**
- **Real-World Verification Goal:**

#### Step 8 (`vX.Y.Z+8`): [Milestone Title]
- **Vision:**
- **Planned Scope Sketch:**
- **Dependencies / Circuit Breakers:**
- **Real-World Verification Goal:**

#### Step 9 (`vX.Y.Z+9`): [Milestone Title]
- **Vision:**
- **Planned Scope Sketch:**
- **Dependencies / Circuit Breakers:**
- **Real-World Verification Goal:**

#### Step 10 (`vX.Y.Z+10`): [Milestone Title & Generation Graduation]
- **Vision:**
- **Planned Scope Sketch:**
- **Dependencies / Circuit Breakers:**
- **Real-World Verification Goal:**

---

## 5. Living Horizon Maintenance Protocol

During **Phase 4 (Closeout Step 4)** of every completed chat version:
1. Mark the finished row in Section 3 as `[x] DONE` and fill in the exact PR `#` / commit SHA.
2. Promote the new **Step N+1** to **High-Definition Spec** (exact files, circuit breakers, runtime test) so `CURRENT_HANDOVER.md` matches it 1:1.
3. Refine **Step N+5** from Vision into Medium Detail, keeping a continuous 4-step medium horizon ahead of the active version.
4. When **Step 10** finishes, mark this Generation `COMPLETED`, update `docs/blueprint/main_blueprint.md`, and run a fresh Blueprint Planning session for the next 10-step Generation.
