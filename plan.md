1. **Version Freshness (Throttle)**
   - In `src/hooks/useAppVisibilityReawakening.ts`, add a 5-minute throttle mechanism to control `registration.update()` checks. Store the last check timestamp in memory.

2. **Session-Expired Detection (Sign In Again)**
   - In `RecoveryManager.ts`, handle no-session explicitly: if `!data.session`, throw `Object.assign(new Error('Auth session missing'), { code: 'session_not_found' })` instead of a standard `Error`.
   - In `RecoveryBanner.tsx`:
     - Update "Sign In Again" button to call `supabase.auth.signOut({ scope: 'local' })` to safely clear the dead session locally, wait for it, then set intent and route.
     - For "Go to Home", conditionally route to `ROUTES.DASHBOARD` if authenticated, or `#/.` if guest. Ensure non-redundancy with "Sign In Again".

3. **Telemetry Auth Loop Guard**
   - Update `fetchWithTimeout.ts` `isSafeToRetry` or inside the `catch` block to explicitly ignore paths like `/auth/v1/user`, `/auth/v1/token`, or the `analytics_events` post url, to prevent telemetry logic or `getSession` itself from triggering an infinite recovery loop. Use a marker for internal auth calls or just check the URL.

4. **In-page Retry (QueryStateHandler)**
   - In `src/components/ui/ErrorState/QueryStateHandler.tsx`, wrap the `onRetry` prop function provided to `ErrorState` to call `triggerAppRecovery('Manual Retry')` first. If recovery is successful, then call the original `onRetry` which triggers React Query refetching.

5. **Tests Setup and Missing Files**
   - I couldn't find `RecoveryManager.test.ts` in the git history on this machine. Since the PR was merged to main and I cannot locate the deleted files in standard git history hooks here, I will **create `RecoveryManager.test.ts` from scratch** testing single-flight, re-entrancy, state transitions, and the new session-expired logic.
   - For `fetchWithTimeout.test.ts`, I'll compare it with standard test outputs and write missing tests for auto-recovery telemetry loops.
   - Add a test confirming `isSafeToRetry` handles `submit_quiz_session` properly.

6. **Pre-commit Checks**
   - Run `pre_commit_instructions` and satisfy all verifications.
