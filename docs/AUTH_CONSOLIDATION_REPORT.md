# Phase 2A.1: Authentication Consolidation Report

## 1. Current State of Auth Access
Direct calls to `supabase.auth` are scattered across the codebase, completely bypassing the established `AuthContext`.

### `supabase.auth.getSession()` Occurrences:
- **Global & Infrastructure:**
  - `src/App.tsx` (App initialization check)
  - `src/providers/PresenceProvider.tsx` (Presence initialization)
  - `src/hooks/useAppVisibilityReawakening.ts` (PWA foreground check)
  - `src/lib/db.ts` (IndexedDB fallback layer mapping)
- **Quiz Guards & UI:**
  - `src/features/quiz/components/SavedQuizzesList.tsx`
  - `src/features/quiz/components/AttemptedQuizzesList.tsx`
  - `src/features/quiz/components/QuizSessionGuard.tsx`
  - `src/features/quiz/components/ResultGuard.tsx`
  - `src/features/quiz/components/QuizConfig.tsx`
  - `src/features/quiz/hooks/useQuiz.ts`
  - `src/features/quiz/stores/useQuizSessionStore.ts`
- **Other Features:**
  - `src/features/community/api/uploadMedia.ts`

### `supabase.auth.getUser()` Occurrences:
- **Global & Infrastructure:**
  - `src/features/auth/context/AuthContext.tsx` (Correct usage)
- **Services API (Anti-pattern):**
  - `src/features/community/api/deletionService.ts` (Multiple occurrences)
  - `src/features/community/api/communityApi.ts` (Multiple occurrences)
  - `src/features/idioms/utils/supabaseIdioms.ts`
  - `src/features/ows/utils/supabaseOws.ts`

## 2. Migration Strategy

The goal is a strict 100% adherence to: `const { user, session } = useAuth();`

**Category A: React Components (Safe & Easy)**
*Strategy:* Swap `supabase.auth.getSession()` for the `useAuth()` hook.
*Files:* `SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`, `QuizSessionGuard.tsx`, `ResultGuard.tsx`, `QuizConfig.tsx`.

**Category B: Global Providers & Hooks (Medium)**
*Strategy:* Ensure providers like `PresenceProvider.tsx` are wrapped *inside* `AuthProvider` and consume `useAuth()` instead of manual fetches. Update `useAppVisibilityReawakening` to rely on the AuthContext context value or trigger a context refresh rather than a direct Supabase call.
*Files:* `PresenceProvider.tsx`, `App.tsx` (if applicable), `useAppVisibilityReawakening.ts`.

**Category C: Pure Functions & API Files (Complex)**
*Strategy:* Hooks cannot be used inside standard `.ts` API files like `communityApi.ts`. These functions must be refactored to accept `userId` as a parameter from the UI component that calls them, rather than fetching the user themselves.
*Files:* `communityApi.ts`, `deletionService.ts`, `uploadMedia.ts`, `supabaseIdioms.ts`, `supabaseOws.ts`, `lib/db.ts`.

## 3. Execution Plan for Phase 2A.1

1.  **Refactor React Components:** Convert all Quiz Guards and UI components to use `useAuth()`.
2.  **Refactor Providers:** Migrate `PresenceProvider` and `App` initialization to rely on `AuthContext`.
3.  **Refactor API Signatures:** Update all `community` and `quiz` utility functions to require `userId` as a parameter, pushing the responsibility of knowing the user up to the React components.
4.  **Verify & Test:** Ensure the app compiles and global session states sync correctly.
