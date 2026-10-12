# Shared Services & Utilities

Documentation for global API connectors and cross-cutting utility functions.

## `/lib` Directory (External SDKs)

### `supabase.ts`
- **Purpose:** Initializes the Supabase client.
- **Critical Logic:** Implements a global `fetchWithTimeout` override.
- **Rule:** Default timeout is 15s. Edge functions (AI Tutor) use 45s. Storage uploads use 5 minutes.

### `db.ts`
- **Purpose:** IndexedDB configuration.
- **Critical Logic:** Handles version migrations. All reads/writes to local storage pass through this typed boundary.

## `/hooks` Directory (System Hooks)

### `useAppBootstrap.ts`
- **Purpose:** Initial hydration state machine (see Authentication docs).

### `useHardwareBackButton.ts`
- **Purpose:** Mobile-first enterprise back-button interceptor.
- **Critical Logic:** Replaces React Router's naive `navigate(-1)` with a deterministic path tree (e.g., dismissing active keyboards or modals first, enforcing a double-tap-to-exit on the dashboard).

### `useAppVisibilityReawakening.ts`
- **Purpose:** Concurrency lock for OS foregrounding.
- **Critical Logic:** Debounces rapid background/foreground transitions to prevent auth mutex deadlocks.

## `/services` Directory

Contains purely functional API calls that do not require React Hooks. Often imported inside React Query fetchers or Zustand stores to interact with Supabase RPCs.
