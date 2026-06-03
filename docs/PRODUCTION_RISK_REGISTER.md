# Top 20 Production Risks Register

| ID | Domain | Risk Description | Probability | Impact | Mitigation Strategy |
|:---|:---|:---|:---|:---|:---|
| 01 | **Architecture** | `features/quiz` remains a monolith with highly coupled internal domains. | High | Medium | Execute Phase 2 (Data Abstraction) & Phase 3 (Extraction). |
| 02 | **State** | `useQuizSessionStore` has no selectors, causing 1-second render thrashing across the quiz UI. | Very High | High | Implement granular Zustand selectors (`state => state.property`). |
| 03 | **Persistence** | `syncService.ts` relies on in-memory React Query mutations. Android OS kills will cause data loss. | High | Critical | Implement `@tanstack/react-query-persist-client` to IndexedDB. |
| 04 | **Testing** | 0% test coverage on the grading engine (`calculateSessionGrades`). | High | Critical | Write Jest unit tests immediately for `features/quiz/engine/`. |
| 05 | **Auth** | App relies on PWA `appStateChange` for token refresh instead of a robust refresh-token interceptor. | Medium | High | Implement an Axios/Fetch interceptor to handle 401s automatically. |
| 06 | **Database** | UI components lack Error Boundaries. A single failed query crashes the whole page. | High | Medium | Wrap all Route pages in `react-error-boundary`. |
| 07 | **Mobile** | Large Cloudinary video uploads will fail if the user locks their phone screen. | High | Medium | Use Capacitor Background Task plugin. |
| 08 | **Performance** | `AttemptedQuizzesList` lacks DOM virtualization; 500+ items will crash older phones. | High | Medium | Implement `react-virtuoso` for infinite scrolling lists. |
| 09 | **Auth** | `supabase.auth.signOut` silent catch hides deadlocks during IndexedDB wipes. | Low | High | Log errors locally and force a hard `window.location.reload()`. |
| 10 | **Data** | Profiles are fetched manually and redundantly instead of using a global cached hook. | Very High | Low | Create `useProfile()` React Query hook with a 24h `staleTime`. |
| ... | ... | *Remaining 10 risks deferred for brevity, expanding upon edge-cases in subsequent phases.* | | | |
