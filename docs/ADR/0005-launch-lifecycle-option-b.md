# ADR 0005: Launch Lifecycle Architecture — Option B (Instant Intro + Background Bootstrap)

* **Status:** Accepted
* **Date:** 10 November 2026
* **Deciders:** Product Architect, Security Lead, Full-Stack Lead
* **Consults:** [MindFlow Constitution](../MINDFLOW_CONSTITUTION.md) (Section 5.4, Section 13 Amendment Clause), `AGENTS.md` (Critical Invariant: HashRouter & OAuth Preservation)

---

## Context & Problem Statement
The MindFlow Constitution Section 5.4 previously specified the "Parallel Mounting Law", prescribing that the React router and application tree `{children}` mount concurrently underneath `<IntroEngine>`.

However, in practice:
1. When `useAppBootstrap` is initializing, `window.location.hash` may contain sensitive OAuth access tokens (e.g. from Google OAuth on web or deep links on Android) or password recovery tokens.
2. If `<HashRouter>` mounts on Frame 0 before `useAppBootstrap` parses and sanitizes the URL hash, React Router attempts to match `/access_token=...` against the route table, misdirecting or stripping tokens.
3. Simultaneously, `NavigationManager` sees `user = null` (prior to session restoration from Supabase/IndexedDB) and can initiate an unwanted guest redirect to `/` or save a corrupted intent.
4. Conversely, the transitional client implementation rendered an artificial `<SynapticLoader>` screen curtain while `!bootstrapState.isReady`, introducing a jarring 2-step visual flash (`Android Splash -> Spinner -> Intro -> UI`).

## Decision Drivers
* **OAuth Safety (Critical Hard Invariant):** Ensure `useAppBootstrap` intercepts, parses, and sanitizes OAuth hash tokens via `window.history.replaceState` before any routing engine touches the URL.
* **Offline Hydration Resilience:** Guarantee that offline IndexedDB auth and configuration stores hydrate before route policies evaluate.
* **Cinematic Zero-Flash Launch:** Deliver an instant 0ms transition from OS launch to the animated intro without intermediary spinner curtains.
* **Fail-Safe Bounding:** Guarantee that bootstrap delays never trap the user behind an indefinite intro curtain.

## Considered Options

1. **Option A (Literal Concurrent Router & Tree Mounting):**
   - Mount `<HashRouter>` and app tree on Frame 0 concurrently with `<IntroEngine>`.
   - *Outcome: Rejected.* High risk of breaking OAuth URL interception, race conditions in `NavigationManager`, and flash of unauthenticated screens before session is loaded.

2. **Option B (Instant Intro + Background Bootstrap + Deferred Router):**
   - Render `<IntroEngine>` immediately on Frame 0 with 0ms loader flash.
   - Run `useAppBootstrap` concurrently in the background behind the opaque intro canvas.
   - Defer `<HashRouter>` mounting until `bootstrapState.isReady === true` (or upon timeout).
   - Intro zoom reveal finishes once minimum duration and bootstrap readiness are both satisfied.
   - Guarded with an 8-second maximum watchdog timer (reusing auth timeout); if bootstrap stalls, router mounts and `NavigationManager` provides actionable recovery.
   - Shorten native Android splash screen (`launchShowDuration: 0` + `SplashScreen.hide()`).
   - *Outcome: Accepted via Constitution Section 13 Pragmatic Amendment Clause.*

3. **Option C (Static Backdrop Curtain):**
   - Replace `<SynapticLoader>` with a static CSS backdrop matching the intro palette.
   - *Outcome: Rejected.* Retains an artificial 2-step visual pause before the animation starts.

## Decision Outcome
Adopted **Option B** as codified in `docs/TEN_PHASE_ROADMAP.md` Phase 9.

### Positive Consequences
* **100% OAuth Preservation:** `window.location.hash` is cleanly extracted and sanitized before `<HashRouter>` mounts.
* **0ms Launch Flash:** Zero intermediary spinner or white flash between OS splash and intro animation.
* **Zero Wrong-Screen Drift:** By the time the intro completes its zoom reveal, the user's active session is restored and the destination route is fully determined.
* **Bounded Maximum Wait:** If network or database stalls, the 8s timeout unblocks the app and routes to actionable offline/recovery UI.

### Negative Consequences / Trade-offs
* Requires coordinating intro completion event with a reactive boolean readiness signal (`bootstrapState.isReady`) in `IntroEngine.tsx` and `App.tsx`.
