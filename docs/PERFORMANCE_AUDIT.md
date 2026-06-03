# Performance & Rendering Audit

## 1. Zustand Subscriptions (Major Render Thrashing)
**Issue:** Several critical components and hooks (like `useQuiz.ts`, `QuizSessionGuard`, `ResultGuard`) use the generic subscription: `const state = useQuizSessionStore();`
**Impact:** Because they do not provide a selector (e.g., `state => state.currentQuestionIndex`), these components are **forced to re-render every single time ANY value in the store changes**. This means every time the timer ticks (every 1 second), the entire quiz tree re-renders.
**Fix Required:** Enforce granular selectors for all Zustand store usage.

## 2. Expensive React Renders
- `PerformanceAnalytics.tsx`: Calculates massive arrays of derived data (like subject stats and charts) directly in the render body. Missing `useMemo` hooks will cause these charts to recalculate on minor state changes.
- `useQuiz.ts`: Returns an object with dozens of properties and functions. Any component consuming `useQuiz()` will re-render continuously because the returned object identity changes on every render. The returned actions (`nextQuestion`, `answerQuestion`) should be wrapped in `useCallback` or exposed via a separate hook.

## 3. DOM Memory Virtualization
- **Good:** The codebase memory mentions strict DOM Memory Virtualization for the `ReelsFeed` using Intersection Observers, which is excellent for mobile performance.
- **Risk:** The `AttemptedQuizzesList` and `SavedQuizzesList` do not appear to use virtualization (`react-window` or `react-virtuoso`). If a user attempts 500 quizzes, the DOM will bloat and crash older Android devices.

## 4. React Query Inefficiencies
React Query is configured globally with `refetchOnWindowFocus: true`. In a PWA, returning from the background causes the app to re-fetch dozens of API calls concurrently. Without `staleTime` correctly configured per-query, this will cause heavy battery drain and UI flickering.
