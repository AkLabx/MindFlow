# 1. High-Level Architecture

## Overview
MindFlow is an interactive, offline-first mobile and web application built with React, Vite, and Capacitor. It is designed to help users master subjects via adaptive quizzes and detailed AI explanations. The backend is powered by Supabase, offering PostgreSQL for relational data, Edge Functions for backend logic and AI orchestration, and GoTrue for authentication.

## Technology Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite 5
- **Native Wrapper:** Capacitor 8
- **Styling:** Tailwind CSS 3
- **State Management:** Zustand 5 & Context API
- **Data Fetching & Caching:** TanStack React Query 5, IndexedDB (offline persistence)
- **Backend / Database:** Supabase (PostgreSQL, Edge Functions, GoTrue Auth, Realtime)
- **AI Integrations:** Google Gemini via `@google/genai` (called server-side in Edge Functions)
- **Routing:** React Router v7 (HashRouter for GitHub Pages/mobile)
- **PWA:** Vite PWA Plugin
- **Drag & Drop:** `@dnd-kit`

## Project Structure

```text
/
├── android/               # Capacitor Android native project
├── docs/                  # Project documentation and architecture guides
├── public/                # Static assets
├── scripts/               # Utility scripts for maintenance
├── src/                   # Main source code directory
│   ├── assets/            # Global assets
│   ├── components/        # Reusable UI components
│   ├── config/            # Global configuration (e.g., storage keys)
│   ├── features/          # Feature-based modular architecture (ai, quiz, vocab, admin, etc.)
│   ├── hooks/             # Global React hooks
│   ├── layouts/           # Page layout wrappers (MainLayout, AppLayout)
│   ├── lib/               # Shared libraries (Supabase client, Navigation policies)
│   ├── pages/             # Global pages (e.g., AuthPage, PrivacyPolicy)
│   ├── providers/         # Top-level React context providers
│   ├── routes/            # Application routing definitions
│   ├── stores/            # Global Zustand stores (settings, layout, notifications)
│   ├── types/             # Global TypeScript types
│   ├── utils/             # Helper utilities
│   └── workers/           # Web workers
├── supabase/
│   ├── functions/         # Supabase Edge Functions (Deno)
│   └── migrations/        # Database SQL migrations
```

## Architectural Principles & Rationale

1. **Feature-Based Modularity:** The `src/features/` directory isolates logic, components, and state by domain (e.g., `quiz`, `ai`, `vocab`). **Rationale:** Reduces tight coupling and prevents "god folders", improving maintainability as the app scales. **Confidence:** Confirmed.
2. **Offline-First Architecture:** Core features, specifically the learning and quiz sessions, are designed to work without an internet connection. Data is aggressively cached in `IndexedDB`, and state changes are synced to Supabase when network is restored. **Rationale:** Essential for mobile learning contexts where connectivity is unstable. **Confidence:** Confirmed.
3. **Strict Bootstrapping State Machine:** App initialization is governed by `useAppBootstrap.ts` rather than a boolean flag. It progresses through `BOOTSTRAPPING`, `READY`, `FAILED`, etc. **Rationale:** Prevents UI flicker and race conditions during hydration of local caches and authentication state. **Confidence:** Confirmed.
4. **Policy-Driven Navigation:** Rather than wrapping routes in traditional generic guards, a `NavigationManager` orchestrates routing using explicit policies (`AuthPolicy`, `OnboardingPolicy`, `PlatformPolicy`). **Rationale:** Centralizes complex access rules and deep-linking intent storage. **Confidence:** Confirmed.
5. **Idempotent Backend Workers:** AI tasks are queued using `pgmq` and processed asynchronously by Edge Functions. **Rationale:** Separates long-running AI enrichment from synchronous API calls, ensuring rate limits are respected without blocking the UI. **Confidence:** Confirmed.
6. **Backend-First Implementation:** System correctness, reliable uploads, and queued operations are established before complex UI. **Rationale:** Prevents flaky frontend logic relying on brittle, slow endpoints. **Confidence:** Confirmed (derived from historical memory guidelines).

## Current Limitations & Technical Debt

- **Monolithic Frontend Repository:** Both admin/content-studio interfaces and consumer mobile applications live in the same source tree. *Impact:* Medium. *Recommendation:* Consider splitting the admin dashboard from the consumer app to reduce bundle size and accidental leakage of admin routes, though currently mitigated by strict routing policies.
- **Complex Cache Invalidation:** Because data exists in Supabase, IndexedDB, and memory (Zustand/React Query), keeping everything synchronized requires complex delta-sync logic and explicit cache clearing versions (e.g., `vocab_cache_cleared_vX`). *Impact:* High. *Recommendation:* Standardize on TanStack Query for all remote data combined with an IndexedDB persister to reduce custom synchronization boilerplate.
- **Global Mutex Deadlocks in Auth:** `gotrue-js` has a known issue where hanging requests lock a global mutex. The app currently wraps auth calls in a custom `Promise.race` with an 8-second timeout (`src/lib/supabase.ts`). *Impact:* High. *Recommendation:* Monitor Supabase JS SDK updates to remove this monkey-patch when the upstream bug is resolved.
- **Mobile vs Web Styling:** The app tries to use responsive CSS (Tailwind) rather than separate components for mobile vs desktop. This generally works but sometimes requires specific native patches (e.g., Capacitor immersive mode). *Impact:* Low.
