# Quiz Architecture Boundary Report

## 1. UI Importing Persistence Layers
**Violation:** `QuizSessionGuard.tsx`, `QuizConfig.tsx`, and `AttemptedQuizzesList.tsx` directly import `import { db } from '../../../lib/db';`.
*Risk:* The React rendering tree is tightly coupled to the IndexedDB browser API. If we switch persistence engines (e.g., SQLite in Capacitor), the UI breaks.
*Solution:* The `api/` layer or global stores should wrap `db` calls.

## 2. Store Importing UI/Presentation Logic
**Violation:** `useQuizSessionStore.ts` directly imports `useNotificationStore`.
```typescript
useNotificationStore.getState().showToast({
    variant: 'sync',
    message: 'You are offline. Progress saved locally.'
});
```
*Risk:* The data/state layer is controlling visual UI rendering (Toasts).
*Solution:* The component initiating the action (or a global event listener) should dispatch UI notifications based on state changes.

## 3. Circular Dependency Risks
**Violation:** `useQuiz.ts` proxies and wraps methods from `useQuizSessionStore.ts`, but both files attempt to manage the same concept of "Finalizing" and "Syncing".
*Risk:* If `useQuizSessionStore` attempts to use utility mappers that rely on `useQuiz.ts`, a circular dependency crash will occur.

## 4. API Layer Integrity
**Success:** Following Wave 1, UI components no longer import `supabase` directly for reads. The boundary between UI and Cloud Data is currently holding strong for queries.
