# Error Handling Hardening Plan

## Scope
This plan details hardening strategies for critical system bottlenecks: `useQuiz.ts` (Persistence logic), `syncService.ts` (Offline Sync), and `AuthContext.tsx` (Session management).

### 1. `useQuiz.ts` (Local Persistence)
**Current Issue:**
```typescript
db.updateQuizProgress(state.quizId, stateToSave as any).catch(console.error);
```
**Risk:** `IndexedDB` can fail if the device storage quota is exceeded or if Safari throws a DOMException in private browsing. A `console.error` silently swallows this, meaning the user assumes their offline progress is saved when it isn't.
**Hardening Action:** Update the `.catch()` to interface with `useNotificationStore` and warn the user: "Local storage full. Progress may not be saved offline."

### 2. `syncService.ts` (PWA Offline Queue)
**Current Issue:**
```typescript
const { error } = await supabase.from('saved_quizzes').upsert({ ... });
// Often called in Promise.all() without individual try/catch boundaries
```
**Risk:** Background flushes operate as "Fire and Forget". If a user takes an exam on a train, connects to Wi-Fi briefly, and the sync fails (e.g. timeout), the data remains in IndexedDB but the UI never reflects the error state to the user.
**Hardening Action:**
- Implement an Exponential Backoff retry wrapper for all Supabase mutations in `syncService`.
- If a mutation permanently fails after 3 retries, dispatch a global error state to `AuthContext` or `useSyncStore` to flag the UI with a "Sync Failed" warning banner.

### 3. `AuthContext.tsx` (Session SignOut)
**Current Issue:**
```typescript
await supabase.auth.signOut({ scope: 'global' });
// Inside catch block: console.error(...);
```
**Risk:** If the network drops exactly when the user clicks "Sign Out", the global token revocation hangs or throws. The current implementation catches this and continues clearing local caches, which is defensively sound. However, the UI does not reload.
**Hardening Action:** Ensure `window.location.href = '/'` or a hard reload is executed in the `finally` block of the sign-out routine to guarantee all unmounted React Query states and Zustand subscriptions are fully wiped from memory, avoiding data leaks to the next logged-in user on shared devices.
