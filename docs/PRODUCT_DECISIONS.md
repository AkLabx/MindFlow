# MindFlow Product Decisions Log (PRODUCT_DECISIONS.md)

This document tracks major strategic product and architectural decisions across MindFlow's evolution. Every architectural pivot, structural refactor, or global invariant must be recorded here with its corresponding Architecture Decision Record (ADR).

---

## Decision Log Index

| Decision ID | Date | Title | Status | Impacted Scope | Summary |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **[ADR-0001](./ADR/0001-exam-context.md)** | 05 Nov 2026 | **Exam-First Architecture & Canonical Aliasing** | **Accepted** | Navigation, Store, Dashboard, QuizConfig | Establish single canonical exam registry to resolve 2,512 database alias discrepancies (`CGL PRE` $\rightarrow$ `SSC CGL`) and drive dashboard Tier 1.5. |
| **[ADR-0002](./ADR/0002-navigation.md)** | 06 Nov 2026 | **Logical Back Navigation & Direct Session Launch** | **Accepted** | Navigation, Routing, Mobile UX | Shift from browser history pops to deterministic logical hierarchy; eliminate `/quiz/library` redirection hops. |
| **[ADR-0003](./ADR/0003-state-ownership.md)** | 06 Nov 2026 | **Single State Ownership & Protected Filter Resets** | **Accepted** | Global Stores, State Architecture | Forbid duplicate exam selectors; enforce "One Concept $\rightarrow$ One Control"; protect active exam on "Clear All". |
| **[ADR-0004](./ADR/0004-offline-first.md)** | 06 Nov 2026 | **Offline-First Zero-Latency Hydration via IndexedDB** | **Accepted** | Dexie DB, Sync Engine, PWA/Capacitor | Render UI in 0ms from local storage; treat network strictly as background delta-synchronization channel. |
| **[ADR-0005](./ADR/0005-launch-lifecycle-option-b.md)** | 10 Nov 2026 | **Launch Lifecycle: Option B (Instant Intro + Background Bootstrap)** | **Accepted** | App Bootstrap, IntroEngine, HashRouter, OAuth | Pragmatic Amendment (Section 13): Render IntroEngine immediately with 0ms loader flash while useAppBootstrap runs in background to safely intercept OAuth tokens and hydrate IndexedDB before HashRouter mounts. |

---

## Permanent Governance Reference
For the binding rules governing these decisions, consult the **[MindFlow Constitution](./MINDFLOW_CONSTITUTION.md)**.
