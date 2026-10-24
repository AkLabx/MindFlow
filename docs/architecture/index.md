# MindFlow Architecture Audit: Executive Summary

Welcome to the comprehensive Architecture Audit for the **MindFlow** project. This documentation provides a deep, evidence-based review of the codebase, system design, and developer workflows, designed to bring a new senior developer up to speed quickly.

## Project Overview

MindFlow is an intelligent, offline-first adaptive learning platform designed to help students master complex subjects through interactive quizzes, flashcards, and AI-assisted tutoring.

- **Stack:** React 19, Vite, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **AI Integration:** Google Gemini API (Flash 2.0 / 2.5) via Edge Functions
- **State Management:** Zustand, React Context, IndexedDB (Offline caching)
- **Routing:** React Router v7 with a custom `NavigationManager` policy engine
- **Platform:** PWA (Progressive Web App) + Capacitor for native Android deployment

## Documentation Directory

This architecture audit is divided into logical domains:

1. **[Frontend Architecture](./frontend.md)** - Routing, state management, component hierarchy, and PWA setup.
2. **[Backend & Database Architecture](./backend_and_db.md)** - Supabase schema, RLS, edge functions, and missing constraints.
3. **[Data Flow](./data_flow.md)** - End-to-end sequences for critical paths (Login, Quiz, AI, Sync).
4. **[Security & Reliability](./security_and_reliability.md)** - Audit of auth, idempotency, offline resilience, and risks.
5. **[Developer Experience & Onboarding](./developer_experience.md)** - Setup, workflows, implicit knowledge, and improvement roadmap.

## Overall Architecture Scorecard

*(Scores are out of 10. Rated for a modern, production-ready enterprise app.)*

| Category | Score | Confidence | Justification |
| :--- | :--- | :--- | :--- |
| **Maintainability** | 6.5 | Highly Likely | Uses Feature-Sliced Design (`src/features/`), but suffers from tangled policies (`NavigationManager`) and overlapping state stores. Future refactor blueprint exists. |
| **Scalability** | 7.5 | Confirmed | Supabase backend scales well; AI edge functions use atomic quota tracking (`20260702100000_ai_governance_atomic_quota.sql`) to prevent abuse. |
| **Performance** | 7.0 | Highly Likely | Offline-first via IndexedDB + Delta sync is great, but large bundle size chunks exist (e.g., `vendor-markdown`, `vendor-export`). |
| **Reliability** | 8.0 | Confirmed | Strong idempotency in backend RPCs. Auth runtime has strict mutex timeout guards (`src/lib/supabase.ts`). Offline sync (`src/lib/syncService.ts`) handles network transitions. |
| **Security** | 7.5 | Confirmed | Heavy use of RLS policies. Atomic locks on AI usage. However, some heavy client-side reliance on IndexedDB requires careful sanitization upon sync. |
| **Developer Experience** | 6.0 | Possible | Local setup is straightforward (Vite + Supabase), but implicit knowledge (e.g., specific port 3000 requirement, strict `.env` variables) and lack of a structured test suite (`vitest` is configured but tests are sparse) hurt the score. |
| **Testability** | 4.0 | Confirmed | The system relies heavily on manual/Playwright UI testing. Unit tests are very scarce. Logic is often coupled with UI components or Supabase singletons. |
| **Documentation Quality** | 8.5 | Confirmed | Excellent auto-generated docs (`docs/architecture/`), `README.md`, and clear AGENTS rules. This audit significantly boosts this score. |
| **Technical Debt** | 6.5 | Confirmed | Technical debt is acknowledged and documented (`FUTURE_REFACTOR_BLUEPRINT.md`). Main debt lies in route guards and the evolution of the quiz engine. |
| **Overall Architecture**| **7.0** | | A solid, offline-capable PWA with robust backend mechanisms, but currently constrained by frontend coupling and testability gaps. |

---

> **Note on Conventions:** Throughout this audit, statements are backed by a **Confidence Label**:
> - **[Confirmed]**: Directly verified from the codebase.
> - **[Highly Likely]**: Strong evidence, but not fully explicit.
> - **[Possible]**: Reasonable inference with limited evidence.
> - **[Unknown]**: Cannot be determined from the repository.
