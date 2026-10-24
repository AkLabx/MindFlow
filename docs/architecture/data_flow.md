# End-to-End Data Flow

This document maps the flow of data through critical application paths.

## 1. Authentication Flow

The authentication flow utilizes a single-gate architecture where unauthenticated users hit the public landing page, and authenticated users are routed internally.

```mermaid
sequenceDiagram
    participant User
    participant App (Frontend)
    participant AuthPolicy (NavManager)
    participant Supabase Auth

    User->>App (Frontend): Request /dashboard
    App (Frontend)->>AuthPolicy (NavManager): Evaluate Route
    AuthPolicy (NavManager)->>Supabase Auth: Check Session (Fast Path)

    alt Session Valid
        Supabase Auth-->>AuthPolicy (NavManager): User Profile
        AuthPolicy (NavManager)-->>App (Frontend): Allow Render
        App (Frontend)-->>User: Show Dashboard
    else Session Invalid/Loading
        AuthPolicy (NavManager)->>App (Frontend): Save Intent & Redirect to / (Landing)
        User->>App (Frontend): Click Login (OAuth)
        App (Frontend)->>Supabase Auth: signInWithOAuth()
        Note over App (Frontend): Yields to event loop, NO resetting loading state in finally block.
        Supabase Auth-->>User: Redirect to Provider
    end
```

## 2. Quiz Session Lifecycle

Quiz sessions are heavily managed by the frontend `quizCreationService` and persisted offline-first.

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant quizCreationService
    participant IndexedDB
    participant Supabase DB

    User->>Frontend UI: Click "Create Quiz"
    Frontend UI->>quizCreationService: createQuiz(filters, mode)
    quizCreationService->>IndexedDB: Seed Quiz locally (saveQuiz)
    Note over quizCreationService: Offline-First constraint: Must seed IndexedDB before Supabase.
    quizCreationService->>Supabase DB: INSERT INTO saved_quizzes (state, created_at)
    Supabase DB-->>quizCreationService: Return quizId
    quizCreationService-->>Frontend UI: Session Ready

    loop Every Answer / Timer Tick
        User->>Frontend UI: Answer Question
        Frontend UI->>IndexedDB: updateQuizProgress() (Upsert-safe)
        Frontend UI->>Supabase DB: Background sync (supabase.from().update())
    end
```

## 3. Data Synchronization (Offline-First Delta Sync)

MindFlow uses a Delta Sync architecture for bulk metadata (e.g., vocab cards, quiz configs).

1. **App Load:** Frontend queries `syncService`.
2. **Local Check:** Reads `last_sync_at` from `localStorage` or IndexedDB.
3. **Delta Request:** Calls Supabase RPC (e.g., `get_filtered_quiz_metadata(p_last_sync_at)`).
4. **Merge:** New or modified rows are merged into IndexedDB.
5. **Cache Invalidation:** If schema changes (flagged via `vocab_cache_cleared_vX`), IndexedDB is wiped and a full sync occurs.

## 4. AI Tutor Flow (Edge Function)

```mermaid
sequenceDiagram
    participant Frontend
    participant EdgeFunction (chat-ai)
    participant SupabaseRPC
    participant GoogleGemini

    Frontend->>EdgeFunction (chat-ai): POST /chat-ai (Prompt, context)
    EdgeFunction (chat-ai)->>SupabaseRPC: check_and_increment_ai_quota()
    Note over SupabaseRPC: Atomic lock (SELECT FOR UPDATE)

    alt Quota Exceeded
        SupabaseRPC-->>EdgeFunction (chat-ai): Throw 'quota_exceeded'
        EdgeFunction (chat-ai)-->>Frontend: HTTP 429 Limit Reached
    else Quota Available
        SupabaseRPC-->>EdgeFunction (chat-ai): Return config (model_chain)
        EdgeFunction (chat-ai)->>GoogleGemini: fetchGeminiStream()
        GoogleGemini-->>EdgeFunction (chat-ai): Stream chunks
        EdgeFunction (chat-ai)-->>Frontend: Stream Response
    end
```
