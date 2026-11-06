# ADR 0002: Logical Back Navigation & Direct Session Launch

* **Status:** Accepted
* **Date:** 06 November 2026
* **Deciders:** Product Designer, Mobile UX Architect
* **Consults:** [MindFlow Constitution](../MINDFLOW_CONSTITUTION.md) (Commandments 4, 5)

---

## Context & Problem Statement
In previous builds, two severe navigation friction points existed:
1. **The Library Redirection Trap:** Upon creating a quiz in `QuizConfig.tsx` or `SubjectTopicsPage.tsx`, the application redirected users to `/quiz/library?tab=created` with a `setTimeout` before launching the quiz session. This produced a disorienting screen flicker and added an unwanted library visit to the back stack.
2. **Erratic Back Behavior:** Using `window.history.back()` or pressing Android's hardware back button frequently popped users out of parent context (e.g., from question review back to random external links instead of the scorecard).

## Decision Drivers
* Direct, frictionless entry into testing sessions (Zero-Library Friction).
* Predictable hierarchical navigation on both Android Capacitor WebView and Desktop Web.
* In-quiz progress protection against accidental back-button taps.

## Decision Outcome
1. **Direct Session Navigation:** Replaced post-creation library hops with immediate deterministic navigation:
   $$\text{navigate}\left(\texttt{/quiz/session/\{mode\}/\{quizId\}}\right)$$
2. **Logical vs. Historical Navigation Split:**
   - In-App `<ArrowLeft />` buttons strictly navigate to the designated **logical parent** defined in `NavigationManager` / route state.
   - Android Hardware Back executes the **Topmost Interceptor Pattern** (Modal $\rightarrow$ Bottom Sheet Confirmation $\rightarrow$ Logical Parent).

### Positive Consequences
* Zero screen flash on quiz generation.
* Aspirants can never accidentally exit an ongoing quiz without seeing the "Pause / Quit Session" bottom sheet.
* Back button behavior is deterministic regardless of how deep the user navigated.
