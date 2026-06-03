# Quiz Domain Dependency Audit

## 1. Bounded Contexts Identified

- **Core Engine**: `engine/`, `types/`, `hooks/useQuiz.ts`, `stores/useQuizSessionStore.ts`, `services/questionService.ts`
- **Analytics & History**: `components/PerformanceAnalytics.tsx`, `components/AttemptedQuizzesList.tsx`, `services/analyticsService.ts`, `stores/useAnalyticsStore.ts`
- **Library & Saving**: `components/QuizLibrary.tsx`, `components/SavedQuizzesList.tsx`, `stores/useBookmarkStore.ts`, `components/SavedQuizCard.tsx`
- **Live Quiz Mode**: `live/LiveQuizRoom.tsx`, `live/useGenAILive.ts`
- **Mock/God Mode**: `mock/MockSession.tsx`, `mock/GodModeSession.tsx`
- **Learning Mode**: `learning/LearningSession.tsx`
- **AI Tutor**: `components/AiExplanationButton.tsx`

## 2. Hidden Coupling Identified

### A. Direct Supabase Client Usage in UI
The following components bypass the `api/` or `services/` layer and make direct Supabase calls:
- `SavedQuizzesList.tsx`
- `AttemptedQuizzesList.tsx`
- `QuizSessionGuard.tsx`
- `ResultGuard.tsx`
- `ShareGatekeeper.tsx`
- `QuizConfig.tsx`
- `AiExplanationButton.tsx`
*Risk:* If these are moved to different domains (like Analytics or AI Tutor), managing the API layer will become fragmented.

### B. Direct Global Store Usage in UI
- `QuizSessionGuard`, `ResultGuard`, and `QuizConfig` directly import `useQuizSessionStore` instead of going through custom hooks.

### C. External Dependencies
- Multiple features (`blueprints`, `synonyms`, `idioms`, `ows`) rely deeply on `quiz` internals (hooks, types, layouts). Breaking `quiz` will instantly break these external domains if contracts are not preserved.

## 3. Incremental Migration Plan (Phase 2 Strategy)

Do NOT move large folders immediately. Follow this strict sequence to ensure stability:

**Step 2A: The API Abstraction Layer (Decoupling UI)**
- *Action:* Remove all direct `import { supabase } from '@/lib/supabase'` from `features/quiz/components/*`.
- *Implementation:* Create dedicated React Query hooks in `features/quiz/api/` (e.g., `useSavedQuizzes`, `useAttemptedQuizzes`) and refactor components to use them.
- *Goal:* UI components become pure and unaware of the database.

**Step 2B: Decouple External Consumers (Contract Stabilization)**
- *Action:* Features like `synonyms`, `idioms`, and `blueprints` must stop deep-importing `quiz/components/ui/*`.
- *Implementation:* If a component is shared across domains (e.g., a generic `QuizCard`), move it to a shared `src/components/domain/` or `src/features/core/`.

**Step 2C: Isolate Sub-Domains (Internal Refactoring)**
- *Action:* Move Analytics, AI Tutor, and Live/Mock modes into their respective bounded contexts within `features/quiz/` (e.g., `features/quiz/analytics/`, `features/quiz/tutor/`).
- *Implementation:* Update internal imports. No files leave the `quiz` folder yet.

**Step 2D: Extraction (Final Move)**
- *Action:* Extract the isolated sub-domains into top-level features (e.g., `features/analytics`, `features/ai-tutor`).
- *Risk:* Low, because steps 2A-2C have already decoupled them from the core engine.
