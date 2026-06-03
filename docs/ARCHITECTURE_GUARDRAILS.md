# Quiz Domain Architecture Guardrails

To prevent the Quiz monolithic anti-patterns from recurring, the following strict boundaries are now enforced:

## 1. The UI Layer (`components/`, `layouts/`, `pages/`)
- **Prohibited:** Direct imports of `lib/db.ts` (IndexedDB) or `lib/supabase.ts`.
- **Prohibited:** Direct imports of raw store setters that bypass defined hooks.
- **Allowed:** Imports of React Query Hooks from `api/queries.ts` and `api/mutations.ts`.
- **Allowed:** Imports of global providers or cross-domain components strictly through standard aliased barrels (`@/features/...`).

## 2. The Store Layer (`stores/`)
- **Prohibited:** Direct imports of `components/*` or presentation layers (like `useNotificationStore`).
- **Prohibited:** Handling complex server-state mapping.
- **Allowed:** Managing ephemeral local React state (Zustand).

## 3. The API Layer (`api/`)
- **Prohibited:** UI DOM interactions or React Router navigations.
- **Allowed:** Wrapping standard `supabase.from` and `supabase.rpc` calls inside `@tanstack/react-query` hooks.
- **Requirement:** All hooks must map their cache invalidations explicitly to standard keys defined in `queryKeys.ts`.

## 4. The Engine Layer (`engine/`)
- **Prohibited:** React Hook imports (`useState`, `useMemo`, `useQuery`).
- **Allowed:** Pure, framework-agnostic business logic (Grading math, score aggregation, array shuffling).
- **Requirement:** Must be 100% unit-testable without a browser DOM.

## 5. The Persistence Layer (`lib/db.ts`)
- **Requirement:** Should act entirely as a background offline queue. UI should rarely consult it directly unless implementing an explicit PWA offline feature.
