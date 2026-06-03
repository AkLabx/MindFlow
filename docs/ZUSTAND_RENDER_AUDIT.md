# Zustand Render Thrashing Audit

## The Problem
Zustand uses strict equality checks to determine if a React component should re-render. If a component subscribes to the entire store via `const state = useStore()`, it will re-render every time **any** property in that store changes.

In `useQuizSessionStore`, we have a global timer that ticks every 1,000ms. Because of full-store subscriptions, the entire quiz component tree re-renders every single second, completely regardless of user interaction.

## Identified Full-Store Subscriptions (CRITICAL Thrashers)

### 1. `useQuiz.ts`
- **Current Pattern:** `const state = useQuizSessionStore();`
- **Impact:** Extreme. `useQuiz` is the central controller hook imported by almost every component in the active quiz view (`QuizLayout`, `QuizQuestionDisplay`, `QuizBottomNav`, `QuizTimer`).
- **Render Frequency:** 1x per second (timer tick) + on every answer click + on every bookmark toggle.
- **Cascading Effect:** Because `useQuiz` returns a newly allocated object on every render, every component consuming `useQuiz` is forced to re-render, shredding battery life and scrolling performance.

### 2. `QuizSessionGuard.tsx` & `ResultGuard.tsx`
- **Current Pattern:** `const state = useQuizSessionStore();`
- **Impact:** High. These guards wrap the entire routing layer. Re-rendering them forces React reconciliation down the entire DOM tree.
- **Required Fix:** They only need to subscribe to `state.id`, `state.isHydrated`, `state.status`, and `state.questions`.

## Identified Safe Subscriptions (Using Selectors)
The codebase correctly uses granular selectors in some highly optimized global areas, such as:
- `usePresenceStore((state) => state.setOnlineUsers)`
However, within the `quiz` domain, selectors are almost universally absent.

## Action Plan (Remediation)
1. **Refactor `useQuiz.ts`**: Do not read the entire state in the React render body. Convert action callbacks (`nextQuestion`, `submitQuiz`) to use `useQuizSessionStore.getState()` instead of relying on the reactive hook closure.
2. **Implement Selectors**: If a component needs the timer, it should use `const time = useQuizSessionStore(state => state.quizTimeRemaining)`. If it needs the current question, it should use `const currentIndex = useQuizSessionStore(state => state.currentQuestionIndex)`.
