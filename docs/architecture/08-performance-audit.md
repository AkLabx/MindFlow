# 8. Performance Audit

## Overview
Based on static analysis of the React application and database schema, several performance characteristics and potential bottlenecks have been identified.

## Positive Architectural Choices
- **Virtualization:** `@tanstack/react-virtual` is used for long lists, preventing DOM node bloat on mobile devices.
- **Aggressive Local Caching:** IndexedDB and React Query drastically reduce network round trips.
- **Code Splitting:** `vite.config.ts` splits vendor libraries (Supabase, PDF generation, Markdown parsing) into separate chunks, keeping the initial JS payload small.

## Areas of Concern

### 1. Excessive Renders in Quiz Session
* **Risk:** High
* **Observation:** The quiz timer and progress state update continuously. If `useQuizSessionStore` is subscribed to at the root layout level, it causes the entire React tree to re-render every second.
* **Recommendation:** Ensure components only subscribe to the specific slices of Zustand state they need (`useQuizSessionStore(state => state.timeRemaining)`).

### 2. Large Component Trees (Admin Dashboard)
* **Risk:** Medium
* **Observation:** Files like `AdminContentStudio.tsx` appear to handle multiple tabs (Ingest, Review, Profiles) within a single component file or immediate children, potentially leading to large initial evaluations.
* **Recommendation:** Implement `React.lazy` and `<Suspense>` for tabs that are not immediately visible.

### 3. Missing Indexes & N+1 Query Risks (Database)
* **Risk:** Medium
* **Observation:** The `saved_quizzes` table lacks an `updated_at` column, forcing queries to rely on `created_at` or parse JSON states to find recently paused quizzes. Furthermore, fetching history and analytics often joins across massive tables (`questions`, `user_synonym_interactions`).
* **Recommendation:** Ensure B-Tree indexes exist on `user_id` and timestamp columns in `quiz_history`, `saved_quizzes`, and `analytics_events`. Use database RPCs to aggregate data rather than fetching lists and aggregating in the client (preventing N+1 loops).

### 4. Cache Invalidation Overhead
* **Risk:** Medium
* **Observation:** Bulk metadata uses a "Delta Sync" architecture (`get_filtered_quiz_metadata`). While efficient for the network, reading, parsing, and merging thousands of records into IndexedDB on the main thread during app bootstrap can block the UI.
* **Recommendation:** Move heavy IndexedDB merging operations to a Web Worker, or utilize `requestIdleCallback` to prevent blocking the main thread during hydration.

### 5. Bundle Size Concerns
* **Risk:** Low (Currently managed)
* **Observation:** The inclusion of heavy libraries (`three`, `pptxgenjs`, `jspdf`, `mammoth`, `html2canvas`) bloats the node_modules.
* **Recommendation:** Ensure these modules are strictly dynamically imported (`await import('jspdf')`) only when the user explicitly triggers an export or 3D feature, preventing them from being loaded in the main chunk.

*Evidence:* `package.json`, `vite.config.ts`, `AppLayout.tsx`, schema migrations.
*Confidence:* Highly Likely (Static Inference).
