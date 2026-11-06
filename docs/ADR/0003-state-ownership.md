# ADR 0003: Single State Ownership & Protected Context Clears

* **Status:** Accepted
* **Date:** 06 November 2026
* **Deciders:** Lead Architect, Staff Frontend Engineer
* **Consults:** [MindFlow Constitution](../MINDFLOW_CONSTITUTION.md) (Commandments 1, 2, 3)

---

## Context & Problem Statement
In `QuizConfig.tsx`, when users selected an exam from the dashboard, the page rendered an *Active Exam Banner* at the top, but scrolling down into "Advanced Filters" presented alphabetical exam capsules (`[A-I]`, `[J-R]`, `[S-Z]`, `[Other]`). This violated the **Single Source of Truth** principle, leading users to wonder which control had priority.

Furthermore, clicking "Clear All Filters" wiped the user's exam context back to empty, and clicking "QuickStart" sampled from global un-scoped database metadata.

## Decision Drivers
* "One Concept $\rightarrow$ One Control $\rightarrow$ One Location."
* Protect user goals when clearing transient filters.
* Prevent cross-exam question leakage in express drills.

## Decision Outcome
1. **Control Deduplication:** Conditionally hide alphabetical raw exam capsules in `QuizConfig.tsx` whenever `activeExamInfo` is present. The top banner is the sole authoritative controller.
2. **Protected Clear Invariant:** `handleClearFilters` resets ad-hoc subject, topic, shift, and difficulty filters while preserving the user's active exam context.
3. **Exam-Scoped QuickStart:** Sampling for `Easy`, `Medium`, and `Hard` drills samples strictly from `metadata.filter(q => matchesCanonicalExam(activeExam, q.examName))`.
4. **Platform-Wide Badging:** Propagated canonical exam badges across `SavedQuizCard`, `AttemptedQuizCard`, `MistakeNotebookPage`, and `BookmarksPage`.

### Positive Consequences
* Zero cognitive confusion regarding which exam selector is active.
* Tapping "Clear Filters" no longer destroys the user's study goal.
* Consistent visual badging across all downstream cards.
