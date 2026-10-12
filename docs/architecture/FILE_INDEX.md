# File Documentation Index

A multi-tiered breakdown of files within the repository.

## Level 1 — Critical Architecture Files

These files dictate the structural integrity of the application.

### `src/App.tsx`
- **Purpose:** The root React component.
- **Responsibilities:** Wraps the app in Error Boundaries, App Providers, Theme setups, and evaluates the `useAppBootstrap` state machine to render the fallback screens (Maintenance, Update Required, Startup Failed) or the `AppRoutes`.

### `src/routes/AppRoutes.tsx`
- **Purpose:** Central routing configuration.
- **Responsibilities:** Defines all valid URL paths. Maps paths to specific FSD domain components. Wraps paths in `<NavigationManager>`.
- **Note:** Missing a route here means a 404 fallback to `/`.

### `src/components/common/NavigationManager.tsx`
- **Purpose:** Policy-based routing orchestrator.
- **Responsibilities:** Evaluates Auth, Onboarding, and Platform policies before allowing a component to render. Handles redirection intents.

### `src/features/auth/context/AuthContext.tsx`
- **Purpose:** The source of truth for user authentication state.
- **Responsibilities:** Distributes `user` and `session` objects. Executes local cache wipes upon `signOut()`.

### `src/layouts/MainLayout.tsx` & `src/layouts/QuizLayout.tsx`
- **Purpose:** Root UI shells.
- **Responsibilities:** Renders the global header, desktop sidebar, and mobile bottom navigation around the `<Outlet />`.

## Level 2 — Feature Files

Found within `src/features/*`.

- **Entry Points (`index.ts`):** Exposes the public API of the feature.
- **Components (`components/`):** React views specific to the domain (e.g., `QuizPlayer.tsx`).
- **Hooks (`hooks/`):** Domain logic (e.g., `useSubmitQuiz.ts`). Must encapsulate async mutations, query cache updates, and loading states.
- **Stores (`stores/`):** Domain-specific Zustand state (e.g., `flashcardStore.ts`).

## Level 3 — Reusable UI Primitives

Found primarily in `src/components/ui/` and `src/components/common/`.

- **Purpose:** Dumb components.
- **Examples:**
  - `Button.tsx`, `Card.tsx`, `Badge.tsx`: Styled Tailwind wrappers.
  - `SynapticLoader.tsx`: The standard visual spinner.
  - `VersionBanner.tsx`: UI for forced updates.
- **Rules:** They contain NO business logic, NO Supabase calls, and NO complex state beyond visual interactions (hover, click, modal open/close).
