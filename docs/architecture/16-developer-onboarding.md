# 16. Developer Onboarding Guide

Welcome to the MindFlow engineering team! This guide is designed to get you productive as quickly as possible.

## 1. What to Read First
Before writing code, familiarize yourself with these core architectural documents:
1. `01-high-level-architecture.md` (System overview)
2. `05-data-flow.md` (How data moves through the app)
3. `07-session-system.md` (The Offline-First quiz engine)
4. `13-hidden-knowledge.md` (Critical unspoken rules and gotchas)

## 2. Core Architecture Concepts You Must Know
- **Offline-First:** Assume the user has no internet connection. Save data to IndexedDB (`src/lib/db.ts`) *first*, then sync to Supabase in the background.
- **Bootstrapping State Machine:** App initialization goes through discrete stages (`BOOTSTRAPPING`, `READY`, etc.) in `useAppBootstrap.ts`. Do not use simple boolean loading flags for global state.
- **Policy Engine:** Navigation is controlled by policies (`AuthPolicy`, `OnboardingPolicy`) inside `src/lib/navigation/`, *not* by wrapping components in `<ProtectedRoute>`.
- **Idempotency:** Background workers (Edge Functions) must be idempotent. They can crash or restart at any time.

## 3. Key Files & Locations
- **Routing:** `src/routes/AppRoutes.tsx` and `src/lib/navigation/NavigationManager.tsx`.
- **Global State:** `src/stores/` (Settings, Layout, Notifications).
- **Quiz Engine Core:** `src/features/quiz/services/quizCreationService.ts`.
- **Database Schema:** `supabase/migrations/`.
- **AI Pipelines:** `supabase/functions/enrich-questions/` and `docs/architecture/AI_TUTOR_PIPELINE.md`.

## 4. Local Setup & Workflows
1. **Running Locally:** Ensure your Vite server runs on **Port 3000** (`npm run dev`).
2. **Testing:** Run `npx vitest --run` for unit tests and `npx tsc --noEmit` for type checking.
3. **Database:** You must have a Supabase project linked (`supabase link`) to apply migrations and test Edge Functions locally.
4. **Capacitor (Mobile):** Use `npm i --legacy-peer-deps` to bypass native plugin conflicts.

## 5. Frequent Pitfalls & Debugging Tips
- **Blank Screen on Load?** Check if `useAppBootstrap` failed. The 8-second auth timeout might have triggered. Clear IndexedDB and reload.
- **Quiz Fails to Resume?** Ensure you didn't bypass `quizCreationService.ts`. If a quiz isn't seeded with `activeQuestions` in IndexedDB immediately upon creation, hydration fails silently.
- **Data Not Showing Up?** Check if you need to bump the `vocab_cache_cleared_vX` version in `src/config/` to force the app to clear its IndexedDB cache and refetch from Supabase.
- **Playwright Tests Failing?** Remember that E2E scripts must hit the `/login` route first to bypass the `NavigationManager` redirect before attempting to verify authenticated routes like `#/dashboard`.

## 6. How to Safely Add New Features
1. **Backend First:** Create the Supabase migration. Ensure the data model is sound and RLS policies are applied.
2. **Types:** Regenerate Supabase types or manually update them.
3. **Feature Folder:** Create a new folder in `src/features/` (e.g., `src/features/leaderboard/`). Add components, hooks, and services there.
4. **Offline Strategy:** If the feature requires offline support, update `src/lib/db.ts` to include the new IndexedDB store.
5. **Verify:** Test the feature with the network throttled to "Offline" in Chrome DevTools.
