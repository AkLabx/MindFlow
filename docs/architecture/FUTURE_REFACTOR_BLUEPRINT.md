# Future Architecture Refactor Blueprint

Based on an evaluation of the current MindFlow codebase, the architecture has grown organically. While it utilizes Feature-Sliced Design (FSD) in parts, the boundaries between Layouts, Routing, Policies, and Auth have become tangled over time.

To make the app truly modular, robust, and maintainable for the next 5–10 years, we need to separate concerns into strictly isolated layers. This document serves as the canonical long-term architecture reference for MindFlow.

> **CRITICAL DIRECTIVE: DO NOT REFACTOR YET**
> This refactor must not begin immediately. The project is currently stabilizing (OAuth, Single Door architecture, route restoration). Beginning a massive architectural refactor while these systems are settling introduces unnecessary risk and regressions. **Architectural excellence comes after application stability.** (See the [Implementation Roadmap](#implementation-roadmap) below).

---

## Target Folder Structure

```text
src/
├── app/                  # App root (App.tsx, Providers)
│   ├── bootstrap/        # Staged initialization sequence
│   ├── routes/           # Global route assembler
│   └── layouts/          # Dumb presentation shells
│
├── core/                 # Core system layers
│   ├── auth/             # Pure authentication logic
│   ├── policies/         # Reusable access guards
│   └── navigation/       # Intent Manager (URL restoration)
│
├── shared/               # Feature-agnostic reusable code
│   ├── components/       # Buttons, Modals, Cards
│   ├── hooks/            # Global UI hooks
│   ├── utils/            # Pure functions
│   ├── constants/        # Global constants (e.g., ROUTES)
│   ├── types/            # Global interfaces
│   ├── validators/       # Zod schemas / validation
│   └── icons/            # SVG components
│
├── features/             # Isolated business domains
│   ├── dashboard/
│   ├── tools/
│   ├── quiz/
│   ├── profile/
│   ├── community/
│   ├── analytics/
│   └── admin/
│
├── pages/                # Root page compositions
└── archive/              # Deprecated code (to be deleted)
```

---

## 1. App Shell / Layout Layer

Layouts must become completely **dumb containers** responsible only for visual structure and page composition.

A layout should only know about:
- `<Header />`
- `<Footer />`
- Safe Area Insets
- `<Sidebar />`
- `<Outlet />` (children)

A layout should **never** know about:
- Authentication state
- Redirect logic or Navigation decisions
- Permission checks or Business rules
- Onboarding state

---

## 2. Routing Layer & Route Registry

Currently, `AppRoutes.tsx` is an enormous file handling lazy loading, layouts, policies, and auth states simultaneously.

**The Solution: Route Registry & Configuration-Driven Routing**
Instead of one central routing file declaring every feature route, each feature should declare its own routes internally:

```text
src/features/dashboard/routes.ts
src/features/quiz/routes.ts
src/features/profile/routes.ts
```

The global application router (`src/app/routes/config.ts`) simply assembles all registered feature routes into the final routing table. This keeps routing ownership inside the feature itself and makes adding/removing features completely modular.

### Route Constants
Hardcoded strings must be eliminated. A dedicated constants file (`src/shared/constants/routes.ts`) should be introduced:

```typescript
export const ROUTES = {
  dashboard: "/dashboard",
  tools: "/tools",
  profile: "/profile",
};
```
Usage: `navigate(ROUTES.dashboard)` instead of `navigate("/dashboard")`.

---

## 3. Auth Layer

Authentication deserves its own strictly isolated layer (`src/core/auth/`).

**Responsibilities:**
- `login()`
- `logout()`
- `restoreSession()`
- `refreshToken()`
- `oauth()`

The Auth layer should have **absolutely no knowledge** of:
- Dashboard, Profile, or Onboarding
- Feature routing or Application navigation

**Authentication exposes identity—not application behavior.**

---

## 4. Policy Layer

Instead of having one giant `NavigationManager` making every decision, navigation security will be handled by highly composable, single-responsibility **Policy Components** (`src/core/policies/`):

- `<RequireAuth>`
- `<RequireAdmin>`
- `<RequirePremium>`
- `<RequireEmailVerified>`
- `<RequireOnboarding>`

Each policy owns exactly one responsibility. They wrap routes and compose together naturally (e.g., `<RequireAuth><RequireAdmin>...`), determining if a user has access or needs to be redirected.

---

## 5. Intent Manager (formerly NavigationManager)

`NavigationManager` will not be removed, but it will be dramatically shrunk into an **Intent Manager** (`src/core/navigation/`).

**Responsibilities:**
- Save navigation intent (where did the user want to go?).
- Restore navigation intent (once policies allow access).

It will **not** make authentication decisions, perform active redirects based on roles, or evaluate onboarding. It merely remembers the desired URL destination.

---

## 6. Feature Isolation

Features (`src/features/*`) must be fiercely independent.

A feature should **never** directly depend on:
- Global layouts, headers, or footers.
- Navigation internals.

Ideally, a feature shouldn't even care *where* it is rendered in the app shell. A feature should own only its UI, local state, services, and business logic. Everything else must remain outside the feature boundary.

---

## 7. Shared Layer

The `src/shared/` directory is explicitly for code that is independent of any specific feature.
Business logic stays inside `features/`. The Shared layer exists only for common reusable building blocks (Hooks, UI primitives, Validators, Types, Route Constants).

---


## 8. Branding and Configuration Constants

To support dynamic branding (e.g., custom themes, promotional banners, festive seasons, ad setups), all customizable brand assets and string constants must be strictly centralized.

Instead of hardcoding "MindFlow" or banner images inside individual components, a dedicated constants configuration (e.g., `src/constants/branding.ts` or `src/config/brand.ts`) should be created.

**Responsibilities:**
- Define Application Names and Taglines.
- Define Asset URLs for festive overlays or partner branding.
- Feature flags for seasonal UI components.

---

## 9. Staged Application Bootstrap

Rather than treating startup as one massive, monolithic initialization process (`useAppBootstrap.ts`), the bootstrap sequence must be staged modularly:

`Bootstrap -> Configuration -> Supabase -> IndexedDB -> Stores -> Services -> Application Ready`

Each stage has clear responsibilities. If one stage fails (e.g., IDB corruption), the failure is isolated and handled gracefully without necessarily bringing down the entire application or deadlocking the Auth initialization. This improves resilience, debugging, and future extensibility.

---

## Implementation Roadmap

This refactoring requires careful orchestration.

### Phase 1 — Stabilization (Current Phase)
Complete the current stabilization work first. No major architecture changes yet.
- Finish routing regressions.
- Restore Dashboard/Header/Footer completely.
- Restore all missing routes.
- Verify all navigation flows and Single Door logic.

### Phase 2 — Production Stability
Once the application is stabilized:
- Produce a stable release.
- Complete manual testing.
- Fix remaining bugs.
- Enter feature freeze.

### Phase 3 — Architecture Refactor
**Only after the application is considered stable** should the architecture blueprint begin implementation.
- This entire refactor should happen in a dedicated `architecture-refactor` branch rather than on the primary development branch.
- Sequentially introduce Modular routing, Policy layers, Shared layers, the Route Registry.
- [x] Route Constants (Initial registry created in `src/constants/routes.ts`).
- Intent Manager, Feature Isolation, and Bootstrap modularization.
