# Developer Experience & Onboarding Guide

Welcome to the MindFlow team! This guide covers the essential workflows, hidden knowledge, and setup requirements needed to become productive immediately.

## 1. Local Setup & Environment

1. **Node.js:** Ensure you are using a recent Node LTS version (v18+).
2. **Install Dependencies:** You **must** use the legacy peer deps flag due to React 19 / Capacitor conflicts.
   `npm install --legacy-peer-deps`
3. **Environment Variables (`.env`):**
   `SUPABASE_URL=your_project_url`
   `SUPABASE_ANON_KEY=your_anon_key`
   `VITE_BASE_URL=/`
   `API_KEY=your_gemini_key`
4. **Development Server:**
   `npm run dev &`
   *Crucial Note:* The Vite dev server is configured strictly for **port 3000** (`http://localhost:3000/`). Do not rely on the default Vite port 5173, as automation and CORS configurations expect 3000. **[Confirmed]**

## 2. Developer Workflows

### Building & Testing
- **Typechecking:** Use `npx tsc --noEmit`. There is no dedicated `npm run typecheck` script. **[Confirmed]**
- **Unit Testing:** Use `npx vitest --run`. Avoid `npm test`. **[Confirmed]**
- **Visual Verification:** If you alter frontend UI, run temporary Python Playwright scripts (`test_ui.py`) locally targeting port 3000. Remember to automate login first before verifying authenticated routes (`/dashboard`). **[Confirmed]**

### Incrementing Versions
- The app version is dynamically read from `package.json` into Vite (`VITE_APP_VERSION`).
- To bump the version cleanly without git tag conflicts:
  `npm version patch --no-git-tag-version`

## 3. Hidden Knowledge & "Tribal" Rules

To avoid causing regressions, keep these rules in mind:

- **Do Not Reset Auth Loading in Finally Blocks:** When triggering Supabase OAuth (e.g., Google login), the function resolves *before* the browser completes the redirect. Resetting the UI loading state will cause a jarring flash back to the "Login" button. Only reset on `catch`. **[Confirmed]**
- **Quiz Offline First:** Never mutate Supabase quiz progress without first saving the quiz strictly to IndexedDB (`db.saveQuiz`). Failure to do so breaks the `QuizSessionGuard` fallback. **[Confirmed]**
- **No Negative Margins on Root Containers:** Auth and Onboarding pages render outside `MainLayout`. Use `min-h-[100dvh] w-full` and padding instead of negative margins to prevent screen clipping on mobile devices. **[Confirmed]**
- **Postgres Arrays vs JSON:** The `options` columns in `public.questions` are `text[]`, not JSONB. Use `array_length(col, 1)`. **[Confirmed]**

## 4. Improvement Roadmap

Prioritized based on Impact vs. Effort.

### Quick Wins (< 1 week)
1. **Unit Test Coverage:** Introduce Vitest coverage for core pure functions (e.g., `quizCreationService`, `AuthPolicy`).
2. **Schema Validation:** Implement Zod to validate data entering the IndexedDB cache to prevent "poisoned state" crashes on app load.

### Medium-Term (< 1 month)
1. **Route Guard Decoupling:** Refactor `NavigationManager` into discrete, composable middleware (following `FUTURE_REFACTOR_BLUEPRINT.md`).
2. **Component Refactoring:** Break down massive components like `QuizSessionGuard` and `LearningSession` into smaller, context-aware hooks.

### Long-Term
1. **Full Redux/Zustand Migration:** Deprecate the complex `useReducer` in the Quiz engine in favor of a flat Zustand store to prevent deep re-rendering issues.
