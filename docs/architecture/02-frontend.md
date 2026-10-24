# 2. Frontend Architecture

## Overview
The frontend is built with React 19 and Vite. It is organized using a feature-based architecture where domains (like `quiz`, `vocab`, `admin`) encapsulate their own components, hooks, stores, and services.

## Routing & Navigation
Routing is managed by React Router v7 (`HashRouter`) and coordinated through a central `NavigationManager`.

- **HashRouter:** Used to ensure compatibility across GitHub Pages deployments and native Capacitor Android environments without complex server rewrites.
- **NavigationManager (`src/lib/navigation/NavigationManager.tsx`):** Acts as the single top-level route guard. It delegates access control to specific policy classes:
  - `AuthPolicy`: Ensures the user is authenticated.
  - `OnboardingPolicy`: Manages the state machine of new user onboarding.
  - `PlatformPolicy`: Handles environment-specific constraints.
  - `IntentPolicy`: Stores deep-link parameters for post-login redirection.

*Evidence:* `src/lib/navigation/NavigationManager.tsx`, Memory guidelines.
*Confidence:* Confirmed.

## State Management
State is managed hierarchically using multiple tools suited to specific scopes:

1. **Zustand (`src/stores/`, `src/features/*/stores/`):**
   - Used for global UI state, settings (`useSettingsStore`), layouts, notifications, and complex feature state like active quiz sessions (`useQuizSessionStore`).
   - Specifically handles offline state hydration from IndexedDB.
2. **React Context (`src/providers/`):**
   - Used for tightly coupled dependency injection and state that rarely changes, such as `AuthContext` (wrapping Supabase user state) and `AppProvider`.
3. **TanStack React Query:**
   - Used for remote data fetching, caching, and background synchronization (e.g., fetching vocab lists or community content).
4. **IndexedDB (`src/lib/db.ts`):**
   - Used heavily for the offline-first Quiz engine, storing paused sessions, quiz history, and metadata.

## Component Hierarchy & Organization
- `AppLayout.tsx`: The main authenticated application shell.
- `MainLayout.tsx`: Handles the responsive shell (bottom navigation on mobile, side navigation on desktop).
- **Feature Components:** Components are colocated within `src/features/<name>/components/`. Reuse is prioritized (e.g., using existing row/card components instead of duplicating).
- **Shared UI:** Global primitives live in `src/components/ui/` (e.g., Buttons, Cards, Modals).

## Theme System & Styling Approach
- **Tailwind CSS:** All styling is utility-first using Tailwind.
- **Dark Mode:** Supported natively via Tailwind's `dark:` classes, toggled globally by the user settings store.
- **Responsiveness:** Single-codebase responsive design (flexbox/grid) rather than separate mobile/desktop implementations. Avoids fixed pixel assumptions.
- **Animations:** Managed primarily with Framer Motion (`framer-motion`) for smooth page transitions and interactive feedback (e.g., swipeable cards).

## Error Boundaries
- Centralized in `src/providers/ErrorBoundary.tsx`. Captures unhandled React rendering errors and presents a fallback UI to prevent white screens of death, allowing the user to reload or return home.

## Performance Optimizations & Lazy Loading
- **Vite Code Splitting:** `vite.config.ts` explicitly defines `manualChunks` to split vendor dependencies (Supabase, Markdown, PDF export tools, Framer Motion) into separate JS bundles, keeping the main application chunk small.
- **Virtualization:** Uses `@tanstack/react-virtual` for long lists (e.g., vocabulary grids, history) to prevent DOM bloat and ensure 60fps scrolling on mobile devices.
- **Throttling/Debouncing:** Applied to continuous state updates (like quiz timers) to minimize re-renders.

## Background Synchronization
To bypass Chromium/WebKit 64KB memory buffer limits during page unloading or backgrounding, background sync uses the Supabase JS client (`supabase.from().update()`) rather than native `fetch` with `keepalive: true`.

*Confidence:* Confirmed via project configurations (`vite.config.ts`), package dependencies, and explicit memory guidelines.
