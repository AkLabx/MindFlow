# State Management

MindFlow uses a hybrid approach to state management: **Zustand** for transient/UI state, **IndexedDB** for offline-capable persistent state, and **React Query / Supabase RPC** for server state.

## Data Flow Architecture

```mermaid
graph TD
    UI[React Components] --> Zustand[Zustand Stores]
    UI --> Contexts[React Contexts]

    Zustand --> IDB[(IndexedDB)]
    Zustand --> SupabaseRPC[Supabase Client/RPC]

    IDB -.-> Zustand : Hydration on Boot

    SupabaseRPC --> IDB : Cache Delta Sync
    SupabaseRPC --> RemoteDB[(PostgreSQL)]
```

## State Layers

### 1. IndexedDB (`src/lib/db.ts`)
- **Library:** `idb` (native wrapper).
- **Purpose:** Massive local storage (offline first) for Questions, Flashcards, Vocab cache.
- **Rules:**
  - Every schema change requires incrementing `DB_VERSION`.
  - Do NOT store unhydrated placeholder objects (e.g., virtual pagination markers). Filter them out before writing.

### 2. Zustand Stores (`src/stores/`)
- **Purpose:** Global client state that doesn't need context re-rendering.
- **Examples:**
  - `useNotificationStore`: Global push notifications/toasts.
  - `flashcardStore` (in features): Manages swipe indices, current session cards, known/unknown counters.
- **Rules:** When implementing sliding windows or virtual pagination, append to the array rather than replacing it to preserve backwards swiping.

### 3. React Contexts
- **Purpose:** State that intimately ties to the React Tree or requires massive provider boundaries.
- **Examples:** `AuthContext`, `AppProvider`, `PresenceProvider`.

### 4. Server State (Delta Sync)
Instead of polling the DB or downloading tables on every load, the app asks the server:
`get_filtered_quiz_metadata(p_last_sync_at)`
It merges the new rows into IndexedDB, updates the `last_sync_at` timestamp, and tells Zustand to re-render.
