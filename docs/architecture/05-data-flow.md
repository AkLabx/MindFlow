# 5. Data Flow Architecture

## Overview
MindFlow's data flow is characterized by an **Offline-First, Delta-Sync** approach for user progress (Quizzes, Vocab), and an **Asynchronous Queue-Driven** approach for backend processing (AI Enrichment).

## 1. Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase Auth
    participant IndexedDB Cache

    User->>Frontend: Opens App
    Frontend->>Supabase Auth: getSession() (8s timeout)
    Supabase Auth-->>Frontend: Returns Session
    Frontend->>IndexedDB Cache: Hydrate User Data & Meta
    Frontend-->>User: Render Dashboard
```
*Note:* The 8s timeout prevents `gotrue-js` mutex deadlocks.

## 2. Quiz Session Flow (Offline-First)
Quizzes are heavily reliant on local storage to ensure uninterrupted learning.
```mermaid
sequenceDiagram
    participant UI
    participant QuizCreationService
    participant IndexedDB
    participant Supabase DB

    UI->>QuizCreationService: Create/Start Quiz
    QuizCreationService->>IndexedDB: Immediate Insert (State, Filters, Time)
    QuizCreationService-->>UI: Navigate to Active Quiz
    UI->>IndexedDB: Log answers (Debounced)
    UI->>Supabase DB: Background Sync (supabase.from.update)
    UI->>QuizCreationService: Submit Quiz
    QuizCreationService->>Supabase DB: RPC(submit_quiz_session_rpc)
```
*Constraint:* Quizzes MUST be seeded into IndexedDB immediately upon creation before progress updates can occur to prevent 'not found' sync errors. Mutations must be upsert-safe.

## 3. Background Metadata Sync (Delta Sync)
For bulk metadata (Vocab definitions, Quiz configs), the app avoids fetching entire tables.
1. Frontend checks local cache (IndexedDB) for last `updated_at`.
2. Frontend calls RPC `get_filtered_quiz_metadata(p_last_sync_at)`.
3. Backend returns only modified rows.
4. Frontend merges updates into IndexedDB.

## 4. AI Content Ingestion Pipeline
```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant Supabase Storage
    participant Supabase DB
    participant PGMQ
    participant Edge Function (enrich-questions)
    participant Gemini Model

    Admin->>Frontend: Upload PDF Document
    Frontend->>Supabase Storage: Direct Upload (content_studio bucket)
    Frontend->>Supabase DB: Insert row into source_documents
    Supabase DB->>PGMQ: DB Trigger/RPC enqueues job
    PGMQ->>Edge Function (enrich-questions): Worker pulls job
    Edge Function (enrich-questions)->>Gemini Model: Taxonomy, Research, Translation
    Gemini Model-->>Edge Function (enrich-questions): Structured JSON
    Edge Function (enrich-questions)->>Supabase DB: Update question_lifecycle_status = 'ENRICHED'
```
*Constraint:* Batch size is strictly 1 to avoid bypassing Gemini RPM limits. Infrastructure errors use exponential backoff via PGMQ visibility timeout (`vt`).

## 5. Vocabulary / Spaced Repetition (OWS, Idioms)
1. User interacts with a word (e.g., swipes a flashcard).
2. UI updates local Zustand store.
3. Zustand asynchronously updates IndexedDB.
4. Background worker syncs `user_synonym_interactions` to Supabase.
5. If the database schema for vocab changes, `vocab_cache_cleared_vX` flag in `localStorage` is bumped, forcing the frontend to clear IndexedDB and refetch entirely.

*Evidence:* Memory guidelines, `quizCreationService.ts`, `useQuizSessionStore.ts`, AI architecture docs.
*Confidence:* Confirmed.
