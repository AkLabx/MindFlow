# Component & Layout Architecture

How major structural components assemble the UI hierarchy.

## Dependency Graph

```mermaid
graph TD
    App[<App />] --> Error[<ErrorBoundary>]
    Error --> Intro[<IntroEngine>]
    Intro --> AuthProv[<AppProvider>]
    AuthProv --> Router[<HashRouter>]
    Router --> Routes[<AppRoutes>]
    Routes --> NavMgr[<NavigationManager>]

    NavMgr --> MainLayout[<MainLayout>]
    NavMgr --> QuizLayout[<QuizLayout>]
    NavMgr --> Immersive[Immersive Views (No Layout)]

    MainLayout --> Header[Global Header]
    MainLayout --> Sidebar[Sidebar Desktop]
    MainLayout --> ContentArea[View Content]
    MainLayout --> BottomNav[Bottom Navigation Mobile]

    QuizLayout --> QuizHeader[Quiz Info Header]
    QuizLayout --> QuizContent[Quiz Engine Content]
```

## Layout Principles

### Safe Area Insets
Mobile UI does not use "Immersive Mode" (which hides the system Android back button and breaks bottom navigation). Instead, layouts use CSS variables:
`pb-[calc(3.5rem_+_env(safe-area-inset-bottom))]`
**Note:** Operators in arbitrary Tailwind `calc()` must be separated by underscores.

### Z-Index Management
- **Bottom Navigation:** Fixed bottom, z-index ~40.
- **Modals:** Fixed overlay, z-index ~50.
- **AI Tutor Chat:** Floating, z-index ~60.

### Global Footer
The footer MUST remain visible across Social sections. Fixed-bottom elements inside these sections must dynamically account for the footer height (~56px).
