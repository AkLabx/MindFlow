# Frontend Architecture

This document outlines the frontend structure, state management, routing, and performance characteristics of the MindFlow application.

## 1. High-Level Architecture

MindFlow is a React 19 Single Page Application (SPA) built with Vite and designed as a Progressive Web App (PWA). It leverages Capacitor for native Android deployment.

- **Design Pattern:** The app attempts to follow Feature-Sliced Design (FSD), grouping logic by domain in `src/features/` (e.g., `auth`, `quiz`, `vocab`, `dashboard`). **[Confirmed]**
- **Offline-First:** The app heavily utilizes IndexedDB (via a local `db` wrapper) to store quiz state, flashcards, and progress, ensuring usability without a network connection. **[Confirmed]**

## 2. Component Hierarchy & Shared UI

- **Shell:** The root `App.tsx` initializes global providers (`QueryClientProvider`, `ThemeAndBrandingInjector`, `AuthProvider`).
- **Routing Shell:** The `AppRoutes.tsx` component wraps the application in a `QuizProvider` and orchestrates navigation.
- **Shared UI:** Reusable visual elements (Buttons, Cards, Loaders like `SynapticLoader`) are located in `src/components/`. **[Confirmed]**
- **Feature Components:** Domain-specific UI is nested within `src/features/<domain>/components/`.

## 3. Routing (`src/routes/`)

- **Router:** React Router v7 (`react-router-dom`) using `HashRouter` (configured via a script in `public/404.html` for GitHub Pages support). **[Confirmed]**
- **Navigation Engine:** Instead of standard inline route guards, MindFlow uses a centralized `NavigationManager` (`src/lib/navigation/NavigationManager.tsx`).
- **Policy Engine:** `NavigationManager` evaluates routes based on policies (`AuthPolicy`, `PlatformPolicy`, `IntentPolicy`). It handles deep-linking (intent restoration) and unauthorized redirects synchronously before rendering. **[Confirmed]**
- **Status:** **[Highly Likely]** While robust, this centralized guard system has grown complex and is slated for a refactor to cleanly separate concerns (per `docs/architecture/FUTURE_REFACTOR_BLUEPRINT.md`).

## 4. State Management

The frontend utilizes a hybrid state management approach:

1.  **Zustand:** Used for global, non-persisted UI state and specific domain logic (e.g., `useNotificationStore`, `useQuizSessionStore`, `useSyncStore`). **[Confirmed]**
2.  **React Context / Reducer:** The core quiz engine (`src/features/quiz/stores/quizReducer.ts`) uses a complex `useReducer` pattern coupled with Context to manage the highly dynamic state of an active learning session. **[Confirmed]**
3.  **IndexedDB (Local Database):** Acts as the primary local state for user data. `src/lib/db.ts` defines interfaces for saving progress (`SynonymInteraction`, `OWSInteraction`, etc.). **[Confirmed]**
4.  **React Query (TanStack Query):** Configured in `src/providers/AppProvider.tsx` (with diagnostics enabled on the window object). Used for server state fetching, though direct Supabase client calls are also prevalent. **[Confirmed]**

## 5. Styling Architecture

- **Tailwind CSS:** The primary styling engine (`tailwind.config.js`). It includes custom color palettes (`primary-*`) and animations (`shimmer`). **[Confirmed]**
- **Theming:** Dark mode is supported via the `class` strategy in Tailwind. The app uses `ThemeAndBrandingInjector` to apply themes dynamically. **[Confirmed]**
- **Typography:** Uses 'Inter', 'Poppins', and 'Noto Sans Devanagari' to support mixed English/Hindi content gracefully. **[Confirmed]**

## 6. Performance Optimizations & Known Issues

- **Bundle Splitting:** `vite.config.ts` explicitly chunks vendor libraries (Supabase, PDF export, Markdown rendering, Framer Motion) to keep the initial load small. **[Confirmed]**
- **Lazy Loading:** `React.lazy()` and `<Suspense>` (with `SynapticLoader` as fallback) are heavily used in `AppRoutes.tsx` to lazy-load admin pages, tools, and specific feature hubs. **[Confirmed]**
- **PWA Caching:** `vite-plugin-pwa` configures Workbox to cache assets up to 15MB, ensuring offline availability of static resources. **[Confirmed]**
- **Potential Bottlenecks:**
    - **Re-renders:** The complex Context/Reducer setup in the Quiz session may cause unnecessary re-renders of the entire quiz tree if not memoized perfectly. **[Possible]**
    - **Large Components:** The `QuizSessionGuard` and session orchestrators (`LearningSession`, `MockSession`) are complex and manage significant logic, making them prime candidates for future refactoring. **[Highly Likely]**
