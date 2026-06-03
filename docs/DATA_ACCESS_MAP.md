# Global Data Access & Query Map

## 1. Categorized Data Access Report

### A. UI Components Making Direct Database Calls
Directly querying the database from React components violates separation of concerns, blocks server-side rendering, and makes testing impossible without heavy mocks.

**Quiz Domain (High Risk of Refactor Breakage)**
- `SavedQuizzesList.tsx`: READ `saved_quizzes`
- `AttemptedQuizzesList.tsx`: READ `quiz_history`
- `QuizSessionGuard.tsx`: READ `saved_quizzes` (Auth Session Check)
- `ResultGuard.tsx`: READ `quiz_history` (Auth Session Check)
- `QuizConfig.tsx`: INSERT `saved_quizzes`
- `AiExplanationButton.tsx`: RPC `vote_explanation`
- `ShareGatekeeper.tsx`: RPC `clone_shared_quiz`

**Community Domain (Medium Risk)**
- `ReelCommentsPage.tsx`: READ `reel_likes`, `reel_comments`
- `PostPage.tsx`: READ `post_likes`, `post_comments`
- `ChatRooms.tsx`: READ `chat_participants` (via Realtime channel)

**Admin & Settings Domain (Low Risk)**
- `AdminUploadMaterials.tsx`: SELECT/INSERT `study_materials`, Storage Upload
- `DeleteAccountPage.tsx`: RPC `export_user_data`, RPC `request_account_deletion`
- `RestoreAccountModal.tsx`: RPC `restore_account`
- `ProfilePage.tsx`: UPDATE `profiles`, Storage Upload
- `SettingsPage.tsx`: Auth Update User
- `AuthPage.tsx`: Auth Sign In / Sign Up

**Routing / Global (High Risk)**
- `AppRoutes.tsx`: RPC `clone_shared_quiz`
- `App.tsx`: Auth Session Check
- `PresenceProvider.tsx`: Auth Session Check

### B. Custom Hooks Making Database Calls
Hooks are better than components, but raw fetches inside hooks lose the benefits of caching and deduplication.

- `useQuiz.ts` (Quiz): RPC `submit_quiz_session`
- `usePerformanceAnalytics.ts` (Quiz): RPC `get_user_performance_metrics`, RPC `reset_user_analytics`
- `useCreatePost.ts` (Community): Storage Upload, INSERT `posts`
- `useNotificationPreferences.ts` (Notifications): INSERT `notification_preferences`
- `useAppVisibilityReawakening.ts` (Global): Auth Session Check

### C. Services & API Modules (The Correct Pattern)
These files correctly abstract database operations, although they currently use raw fetches. They should be wrapped by React Query hooks.

**Community**
- `communityApi.ts`: Extensive queries across `profiles`, `posts`, `chat_rooms`, `reels`, RPC `search_profiles_trgm`
- `chatApi.ts`: Storage Uploads
- `deletionService.ts`: DELETE operations, Storage Removal
- `reportsApi.ts`: RPC `delete_content_by_admin`, RPC `restore_content_by_admin`

**Quiz & Study**
- `questionService.ts`: READ `questions`
- `analyticsService.ts`: Read/Write `analytics_events`
- `blueprintService.ts`: RPC `get_blueprint_questions`

**Other Features**
- `adminApi.ts`: CRUD `questions`
- `supabaseIdioms.ts`: READ `idiom`
- `supabaseOws.ts`: READ `ows`
- `syncService.ts` (Global): Massive UPSERTs for background sync (PWA offline sync layer)

## 2. Identified Query Duplications & Patterns

### Duplicate Queries
1.  **Auth `getSession()` and `getUser()` Checks:**
    - Called massively across the entire app (`App.tsx`, `PresenceProvider.tsx`, `AuthContext.tsx`, 5 different `Quiz` UI guards, `useAppVisibilityReawakening.ts`, and deep inside `communityApi.ts` functions).
    - *Issue:* Redundant network requests for data already held in `AuthContext` or easily cached by React Query.
2.  **Profile Fetching:**
    - Fetched in `AuthContext.tsx` on initialization.
    - Re-fetched in `communityApi.ts` for social feeds.
    - *Issue:* `profiles` data is highly cacheable. It should be fetched once via a global `useProfile()` React Query hook.
3.  **Quiz Cloning (`clone_shared_quiz` RPC):**
    - Executed in both `AppRoutes.tsx` and `ShareGatekeeper.tsx`.
    - *Issue:* Duplicated business logic.

### React Query vs. Manual Fetches
- **Current State:** The application initializes a robust `@tanstack/react-query` Client in `AppProvider.tsx` with extensive diagnostic logging.
- **Problem:** Despite React Query being configured, almost 80% of the data fetching (especially inside `features/quiz` and `features/community/pages`) uses raw `await supabase.from()` calls sequentially.
- **Why this is bad:**
  - No automatic background refetching on focus.
  - No deduping of concurrent requests (e.g., `getSession` race conditions).
  - UI components have to manage `isLoading` and `error` states manually, bloating the render logic.

## 3. The Data Layer Migration Matrix

To resolve the architectural violations before moving any folders, we must execute the following data-layer extractions:

| Current File Location (UI/Hook) | Action | Target Abstraction Location |
| :--- | :--- | :--- |
| `SavedQuizzesList.tsx` | Extract `supabase.from('saved_quizzes')` | `features/quiz/api/queries.ts` -> `useSavedQuizzes()` |
| `AttemptedQuizzesList.tsx` | Extract `supabase.from('quiz_history')` | `features/quiz/api/queries.ts` -> `useQuizHistory()` |
| `QuizConfig.tsx` | Extract INSERT to `saved_quizzes` | `features/quiz/api/mutations.ts` -> `useCreateQuiz()` |
| `AiExplanationButton.tsx` | Extract RPC `vote_explanation` | `features/quiz/api/mutations.ts` -> `useVoteExplanation()` |
| `ShareGatekeeper.tsx` | Extract RPC `clone_shared_quiz` | `features/quiz/api/mutations.ts` -> `useCloneQuiz()` |
| `QuizSessionGuard.tsx` | Replace raw Auth session checks | Consume global `useAuth()` hook |
| `ResultGuard.tsx` | Replace raw Auth session checks | Consume global `useAuth()` hook |
| `ReelCommentsPage.tsx` | Extract raw fetches | `features/community/api/queries.ts` -> `useReelStats()` |
| `PostPage.tsx` | Extract raw fetches | `features/community/api/queries.ts` -> `usePostStats()` |
| `AdminUploadMaterials.tsx` | Extract Storage/DB logic | `features/admin/api/mutations.ts` -> `useUploadMaterial()` |

## Conclusion
The `features/quiz` domain is heavily coupled to the database at the UI level. If you moved the `QuizConfig` component to a new folder today, you would drag the entire Supabase client dependency with it, creating technical debt.

**Prerequisite to Phase 2 (Restructuring):** We must execute the API Abstraction Layer (moving queries from the UI into React Query hooks) as outlined in the matrix above.
