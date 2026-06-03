# Phase 2A.1-A: Auth Dependency Impact Analysis

## Group A: Safe Immediate Refactors
These are React Components where we can instantly swap `supabase.auth.getSession()` for the `useAuth()` hook. The risk is **Low** because they are fully within the React lifecycle.

- `src/features/quiz/components/SavedQuizzesList.tsx`
- `src/features/quiz/components/AttemptedQuizzesList.tsx`
- `src/features/quiz/components/QuizSessionGuard.tsx`
- `src/features/quiz/components/ResultGuard.tsx`
- `src/features/quiz/components/QuizConfig.tsx`

## Group B: Provider-Level Refactors
These are global state hooks and providers that currently rely on `supabase.auth`. The risk is **Medium** as we must ensure `AuthProvider` initializes before these components.

- `src/providers/PresenceProvider.tsx` (Needs to consume `useAuth`)
- `src/hooks/useAppVisibilityReawakening.ts` (Should trigger an auth context refresh rather than bypassing it)
- `src/App.tsx` (Redundant session checks)

## Group C: Signature Change Refactors
These are pure functions and API layer files. Removing `supabase.auth.getUser()` requires passing `userId` as a parameter. Changing their signatures will cascade across multiple domains. The risk is **High**.

### 1. `communityApi.ts`
*Exported functions affected:* `toggleLikeComment`, `createComment`, `createPost`, `searchProfiles`, `toggleFollow`, `checkBlockStatus`, `blockUser`, `unblockUser`, `fetchUserProfile`, `fetchUserPosts`, `getOrCreateChatRoom`, `fetchPosts`, `toggleLikePost`, `fetchReelComments`, `toggleLikeReel`, `createReelComment`, `fetchReels`, `fetchComments`.
*Caller Tree:*
- `CommentThread.tsx`
- `PostCard.tsx`
- `CreatePostModal.tsx`
- `useCreatePost.ts`
- `CommunitySearch.tsx`
- `UserProfile.tsx`
- `CommunityFeed.tsx`
- `ReelCommentsPage.tsx`
- `ReelsFeed.tsx`
- `PostPage.tsx`
- `ChatRooms.tsx`

### 2. `deletionService.ts`
*Exported functions affected:* `deletePost`, `deleteReel`
*Caller Tree:*
- `PostPage.tsx`
- `UserProfile.tsx`

### 3. `uploadMedia.ts`
*Exported functions affected:* `uploadMedia`
*Caller Tree:*
- `CreatePostModal.tsx`
- `ReelUploadModal.tsx`
- `useCreatePost.ts`

### 4. `supabaseIdioms.ts` / `supabaseOws.ts`
*Exported functions affected:* `fetchIdioms`, `fetchOws`
*Caller Tree:*
- Currently isolated to their own domains, but used deeply in custom hooks.

### 5. `lib/db.ts` (IndexedDB Sync Layer)
*Exported functions affected:* Sync and offline storage mappers.
*Caller Tree:*
- Extensively used across `features/quiz`, `features/idioms`, `features/synonyms`, `features/ows`, `features/auth`, and `features/ai`.

## Strategy Decision
Because Group C has a massive blast radius affecting over 30 external files across Community, AI, Settings, and Routing, we will strictly execute **Group A and Group B only** in this phase. Group C will require a dedicated "API Layer Abstraction" phase where we implement React Query to handle these cascades safely.
