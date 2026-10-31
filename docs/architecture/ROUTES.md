# Routing & Navigation

MindFlow uses `react-router-dom` (HashRouter due to OAuth hash-fragment compatibilities on GitHub Pages & Android) combined with a centralized Policy Engine orchestrator called `NavigationManager`.

## Routing Tree

```mermaid
graph TD
    Router[HashRouter / AppRoutes] --> AuthGate[/ Dedicated Auth Portal (AuthPage) ]
    Router --> LoginRedirect[/login -> Redirect to /]
    Router --> Signup[ /signup ]

    Router --> Onboarding[ /onboarding Flow ]

    Router --> AppShell[<AppLayout> (MainLayout)]
    AppShell --> Dash[/dashboard]
    AppShell --> TodaysPlan[/todays-plan]
    AppShell --> DailyMission[/daily-mission]
    AppShell --> English[/english]
    AppShell --> Community[/community]
    AppShell --> Profile[/profile]
    AppShell --> Settings[/settings]

    Router --> Quiz[Immersive Quiz & Vocab Sessions]
    Quiz --> QuizSession[/quiz/session/:mode/:id]
    Quiz --> VocabSession[/vocab/:type/session/:id]

    Router --> Admin[Admin Area]
    Admin --> AdminDash[/admin]
    Admin --> ContentStudio[/admin/content]
```

## Route Table Overview

| Route Path | Component Layout | Access Policy | Description |
|---|---|---|---|
| `/` | `AuthPage` (None) | `RouteAccessType.GUEST_ONLY` | Unified Authentication Portal (Web & Native) |
| `/login` | None | None | Instant redirect to `/` |
| `/signup` | None | `RouteAccessType.GUEST_ONLY` | Dedicated Registration View |
| `/onboarding` | None | Authenticated (`NOT_COMPLETED`) | Post-auth onboarding flow |
| `/dashboard` | `AppLayout` | `RouteAccessType.AUTHENTICATED` | Main student hub & active study sessions |
| `/todays-plan` | `AppLayout` (Header Hidden) | `RouteAccessType.AUTHENTICATED` | Daily SSC Exam Prep Engine (Dual Track) |
| `/daily-mission` | `AppLayout` (Header Hidden) | `RouteAccessType.AUTHENTICATED` | Daily Mission Task View |
| `/quiz/session/:mode/:id` | None (Immersive) | `RouteAccessType.AUTHENTICATED` | Active Quiz player (Learning/Mock/God) |
| `/vocab/:type/session` | None (Immersive) | `RouteAccessType.AUTHENTICATED` | Vocab swipe & flashcard session |
| `/profile` | `AppLayout` | `RouteAccessType.AUTHENTICATED` | User details, subscription & preferences |
| `/admin/*` | Admin Shell | `RouteAccessType.ADMIN` | CMS / Curation / Metadata Studio |
| `*` | `<Navigate to="/" />` | Fallback | Catch-all orphan route redirect |

## Key Navigation Mechanisms

### NavigationManager (`src/lib/navigation/NavigationManager.tsx`)
Replaces traditional nested Route Guards. Wraps specific routes and subtrees in `AppRoutes`.
It synchronously evaluates:
1. **Platform Policy (`PlatformPolicy.ts`):** Defines unified guest entry and logout routes (`'/'`).
2. **Auth Policy (`AuthPolicy.ts`):** Checks authentication state (`user`) and administrative roles (`admin@mindflow.com` or `profile?.role === 'admin'`).
3. **Intent Policy (`IntentPolicy.ts`):** Captures full deep-link state (`pathname`, `search`, `hash`, `timestamp`, `expiresAt`, `platform`) to restore routes after authentication.
4. **Onboarding Policy (`OnboardingPolicy.ts`):** Checks onboarding completion (`'NOT_STARTED'`, `'IN_PROGRESS'`, `'COMPLETED'`), redirecting first-time users to `/onboarding`.

### Hardware Back Button (`src/hooks/useHardwareBackButton.ts`)
Intercepts Android back buttons globally via Capacitor:
- Implements strict hierarchical URL mapping (e.g., if on `/vocab/idioms/session`, back navigates to config, NOT arbitrary history).
- Closes open modals, drawers, and overlays first.
- Requires double-tap within 2 seconds to exit app on `/dashboard`.
