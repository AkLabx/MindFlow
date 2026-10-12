# Routing & Navigation

MindFlow uses `react-router-dom` (HashRouter due to OAuth hash-fragment compatibilities) combined with a centralized Policy Engine orchestrator called `NavigationManager`.

## Routing Tree

```mermaid
graph TD
    Router[HashRouter / AppRoutes] --> Landing[/ Landing Page ]
    Router --> Login[/login Redirect]
    Router --> Signup[/signup Redirect]

    Router --> Onboarding[ /onboarding Flow ]

    Router --> Main[<MainLayout>]
    Main --> Dash[/dashboard]
    Main --> English[/english]
    Main --> Profile[/profile]
    Main --> Settings[/settings]

    Router --> Quiz[<QuizLayout>]
    Quiz --> QuizSession[/quiz/session/:quizId]
    Quiz --> MockSession[/quiz/session/mock/:quizId]

    Router --> Admin[Admin Area]
    Admin --> AdminDash[/admin]
    Admin --> ContentStudio[/admin/content]
```

## Route Table Overview (Highlighted)

| Route Path | Component Layout | Access Policy | Description |
|---|---|---|---|
| `/` | `LandingPage` (None) | Unauthenticated Only | Auth Gate / Marketing |
| `/onboarding` | None | Authenticated (`NOT_COMPLETED`) | First-time user setup |
| `/dashboard` | `MainLayout` | Authenticated | Main user hub |
| `/quiz/session/:id` | `QuizLayout` | Authenticated | Active Quiz player |
| `/vocab/idioms/session`| (No Layout, Immersive) | Authenticated | Flashcard swipe UI |
| `/profile` | `MainLayout` | Authenticated | User details |
| `/admin/*` | (Admin Layout) | `RouteAccessType.ADMIN` | CMS / Curation / Metadata |
| `*` | `<Navigate to="/" />` | Fallback | Orphan route catcher |

## Important Navigation Mechanisms

### NavigationManager (`src/components/common/NavigationManager.tsx`)
Replaces traditional nested Route Guards. Wraps specific routes in `AppRoutes`.
It evaluates:
1. **Platform Policy:** Blocks desktop-only routes on mobile.
2. **Auth Policy:** Is the user logged in? If not, redirect to `/` (saving intent URL).
3. **Onboarding Policy:** Has the user finished onboarding? If not, force `/onboarding`.
4. **Admin Policy:** Does `user.email === admin@mindflow.com`?

### Hardware Back Button (`useHardwareBackButton.ts`)
Intercepts Android back buttons globally.
- Implements strict hierarchical URL mapping (e.g., if on `/vocab/idioms/session`, back goes to `/vocab/idioms/config`, NOT just `history.back()`).
- Closes Modals/Overlays FIRST.
- Requires double-tap to exit on `/dashboard`.
