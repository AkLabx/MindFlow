# MindFlow Master Technical Decision Ledger (DECISIONS_MASTER.md)

This document is the authoritative, immutable registry of technical decisions, architecture forks (Path A vs Path B), and permanent invariants across the MindFlow platform.

Every incoming AI agent or engineer MUST consult this ledger before proposing or implementing changes.
- **Never revive retired approaches** recorded in Section 2.
- **Never violate Do-Not-Break Invariants** recorded in Section 1 without explicit written approval from the user.

---

## 1. Active Decisions & Invariants (Preserve Always)

| Decision ID | Version | Area | Chosen Path | Why / Evidence | Do-Not-Break Invariant | Dossier / Reference |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **DEC-0001** | v1.0.310 | Canonical Exam Registry | **Canonical Aliasing in Registry** (`src/constants/exams.ts`) | Resolved 2,512 database alias discrepancies (`CGL PRE` $\rightarrow$ `SSC CGL`) without running destructive migrations. | Never allow raw string alias comparisons without resolving via canonical mapping function. | [ADR-0001](file:///d:/MindFlow-main/docs/ADR/0001-exam-context.md) |
| **DEC-0002** | v1.0.315 | Routing & Mobile UX | **Logical Hierarchical Back Navigation** via `NavigationManager` | Raw browser history pops (`navigate(-1)`) cause infinite loops, dead ends, or unwanted redirection hops (`/quiz/library`). | In-app `<ArrowLeft />` returns to hierarchical logical parent; Android HW back follows topmost modal/sheet interceptor stack. | [ADR-0002](file:///d:/MindFlow-main/docs/ADR/0002-navigation.md) |
| **DEC-0003** | v1.0.318 | State Architecture | **Single State Ownership Matrix ("One Concept $\rightarrow$ One Control")** | Duplicate selectors and two-way state synchronization caused filter oscillation and lost user exam context. | Single authoritative controller per state dimension; active exam/subject is preserved downstream and protected during "Clear All". | [ADR-0003](file:///d:/MindFlow-main/docs/ADR/0003-state-ownership.md) |
| **DEC-0004** | v1.0.320 | Offline & Storage | **Offline-First Zero-Latency Hydration via IndexedDB (Dexie)** | Network-first causes blank loader comas and poor mobile experience on spotty connectivity. | Render UI in 0ms from local IndexedDB; network acts strictly as background delta-synchronization channel. Mutations must be upsert-safe. | [ADR-0004](file:///d:/MindFlow-main/docs/ADR/0004-offline-first.md) |
| **DEC-0005** | v1.0.335 | App Launch & Auth | **Option B: Instant Intro + Background Bootstrap & OAuth Interception** | Option A blocked app launch on heavy network init; raw HashRouter stripped OAuth tokens from URL hash. | Preserve OAuth token extraction in `useAppBootstrap.ts` before hash routing mount; render `IntroEngine` with 0ms loader flash. | [ADR-0005](file:///d:/MindFlow-main/docs/ADR/0005-launch-lifecycle-option-b.md) |
| **DEC-0006** | v1.0.339 | Authentication | **Unified Guest Auth Portal & Ban on Guest Mode** | Guest mode caused orphaned user progress, security loopholes, and inconsistent cloud sync. | Root `/` serves as unified auth portal; guest login is strictly banned. All users must authenticate with real credentials. | [`AGENTS.md`](file:///d:/MindFlow-main/AGENTS.md) |
| **DEC-0007** | v1.0.345 | Web Platform (MWG) | **Google Chrome Modern Web Guidance (MWG) Baseline Primitives** | Heavy third-party UI libraries bloated bundle and degraded INP/CWV metrics. | Native `<dialog>`, Popover API (`@starting-style`), CSS Anchor Positioning, and `scheduler.yield()` for INP frame budgets (<16ms). | [`AGENTS.md`](file:///d:/MindFlow-main/AGENTS.md) |
| **DEC-0008** | v1.0.346 | Mobile UX / Android | **Native Android APK Feel & Behavior Uplift (Non-Negotiable)** | Web-like layout bounce, missing tactile touch feedback, and poor keyboard handling degraded APK quality. | Native tactile touch ripples/scaling (`active:scale-95`), zero web bounce, native bottom sheets, and visual viewport keyboard avoidance. | [`AGENTS.md`](file:///d:/MindFlow-main/AGENTS.md) |
| **DEC-0009** | v1.0.355 | Telemetry & Observability | **Privacy-Preserving Telemetry Pipeline** | Debugging production crashes was impossible without structured client events. | Emit diagnostic events without PII (`exam_selected`, `quiz_generated`, etc.); never log tokens, passwords, or personal identity. | [`AGENTS.md`](file:///d:/MindFlow-main/AGENTS.md) |
| **DEC-0010** | v1.0.360 | Development Workflow | **Multi-Slot Architecture & Deterministic Port Mapping** | Parallel AI agents collided on port 3000 and caused branch lock contention on `main`. | Slot 1 = 3000 (`main` owner), Slot 2 = 3001 (`worker-1`), Slot 3 = 3002 (`worker-2`). Vite HMR live preview without committing. | [`AGENTS.md`](file:///d:/MindFlow-main/AGENTS.md) |
| **DEC-0011** | v1.0.364 | Social Messaging UI | **MindFlow Brand Realignment & Messenger Ergonomics** | Hardcoded WhatsApp greens conflicted with MindFlow design system. | Deep Indigo/Violet gradients & Slate glassmorphic cards while strictly preserving messenger ergonomics (capsule input, bubble tails, micro-timestamps). | [v1.0.364 Dossier](file:///d:/MindFlow-main/docs/APP_JOURNEY_LOG.md) |
| **DEC-0012** | v1.0.365 | Touch Gestures & Audio | **Two-Dimensional Axis Locking & Dynamic Visual Viewport** | Touch swipe caused vertical scroll jitter; MediaRecorder WebM duration showed Infinity on Chromium; keyboard hid input bar. | Axis-lock touch swipe ($|\Delta Y| > |\Delta X|$ locks vertical); dynamic visual viewport height tracking; fetch-to-blob object URL lightbox download. | [v1.0.365 Dossier](file:///d:/MindFlow-main/docs/APP_JOURNEY_LOG.md) |
| **DEC-0013** | v1.0.366 | Workflow & Governance | **Autonomous "1 Chat = 1 Version" Workflow & Closed-Loop Memory Engine** | Prevents context bloat (~70k $\rightarrow$ ~5k tokens) and enforces perpetual handover loops across fresh chats. | Never end a chat without running Phase 4 closeout; never read historical changelogs on cold start. | [v1.0.366 Dossier](file:///d:/MindFlow-main/docs/versions/v1.0.366.md) |

---

## 2. Superseded Decisions (Do NOT Revive)

| Decision ID | Superseded In Version | Area | Retired Approach | Replaced By | Reason For Retirement |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **OLD-001** | v1.0.315 | Navigation | Raw browser history `navigate(-1)` across screens. | Deterministic `NavigationManager` with logical hierarchical parent routing. | Caused infinite navigation loops between quiz tabs, trapped users in sub-flows, and broke Android hardware back. |
| **OLD-002** | v1.0.320 | Data Hydration | Direct network fetch on component mount (`useEffect` + `supabase.from()`). | Dexie IndexedDB offline-first local cache with background sync. | Caused blank screens on slow network, flash of unstyled content, and high Supabase read egress. |
| **OLD-003** | v1.0.325 | Auth Routing | Independent `AuthGuard` and `ProtectedRoute` higher-order wrapper components. | Centralized Navigation Policy Engine (`AuthPolicy`, `PlatformPolicy`). | Fragmented redirection logic, caused flash of unauthorized states, and prevented deterministic deep linking. |
| **OLD-004** | v1.0.339 | User Onboarding | Anonymous / Guest login mode with temporary local profile. | Mandatory real account authentication (Google OAuth / Email Auth). | Led to data loss, orphaned user test submissions, and difficult cloud synchronizations. |
| **OLD-005** | v1.0.364 | Chatroom Design | Hardcoded WhatsApp green color palette (`#008069`, `#00A884`, `#25D366`). | MindFlow Indigo/Violet theme system with custom neural backdrop. | Conflicted with MindFlow visual identity and looked like an unbranded clone. |
