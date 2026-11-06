# ADR 0004: Offline-First Zero-Latency Hydration via IndexedDB

* **Status:** Accepted
* **Date:** 06 November 2026
* **Deciders:** Principal Systems Engineer, Mobile Architect
* **Consults:** [MindFlow Constitution](../MINDFLOW_CONSTITUTION.md) (Commandments 4, 9)

---

## Context & Problem Statement
Aspirants frequently practice under unstable network conditions (intermittent 3G mobile data, rural travel, offline libraries). Requiring an initial network round-trip to Supabase before rendering the dashboard, resuming paused quizzes, or calculating question counts resulted in 3-5 second white-screen delays and failed launches.

## Decision Drivers
* Sub-10ms initial dashboard render.
* 100% offline quiz practice and answer recording.
* Upsert-safe background synchronization without data loss.

## Decision Outcome
Elevated IndexedDB (via Dexie `db.ts`) to the **primary source of local truth**:
1. **Hydration Waterfall:** Eagerly hydrate from local IndexedDB at `t = 0ms`. The UI is interactive immediately.
2. **Background Delta Sync:** Background network synchronization (`syncService`) pulls delta updates and pushes completed attempts without blocking user interaction.
3. **Session Auto-Save:** In-flight quiz answers and timers write to Dexie on every option selection, allowing instant quiz resumption if the PWA or Capacitor WebView process is evicted from memory.

### Positive Consequences
* Instant, zero-latency app startup.
* Full study functionality maintained during total network outages.
* Battery and cellular data consumption drastically reduced.
