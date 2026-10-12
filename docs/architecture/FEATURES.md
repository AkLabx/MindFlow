# Feature Index (FSD)

All domain logic lives in `src/features/*`. Strict barrel export rules apply.

## Features

- **about**
  - **Purpose:** Informational content about MindFlow.
- **admin**
  - **Purpose:** God-mode dashboard. Content Studio, Review queues, User management.
  - **Key Routes:** `/admin`, `/admin/content`, `/admin/enrichment`.
- **ai**
  - **Purpose:** Handles Edge function interaction, chat bundles, AI tutor overlays.
- **auth**
  - **Purpose:** Auth context, Login/Signup logic, Profile management.
- **blueprints**
  - **Purpose:** Exam simulation logic.
- **community**
  - **Purpose:** Social aspects, user feeds, leaderboards.
- **english**
  - **Purpose:** English hub entry point.
- **flashcards**
  - **Purpose:** The core swipe-based gesture engine (Framer Motion).
- **intro**
  - **Purpose:** Reusable tutorial engine.
- **mock-tests**
  - **Purpose:** Timed mock tests.
- **notifications**
  - **Purpose:** Notification history and badge counts.
- **onboarding**
  - **Purpose:** Post-auth user setup state machine.
- **quiz**
  - **Purpose:** Massive domain containing the Quiz Engine, MCQ UI, test evaluation, timer management.
- **school**
  - **Purpose:** Academic integrations.
- **settings**
  - **Purpose:** User preferences and account deletion.
- **tools**
  - **Purpose:** Utilities like Ascii Art Hub, Flashcard Maker.
- **vocab**
  - **Purpose:** Specialized domain for OWS (One Word Substitution), Idioms, and Synonyms. Interacts heavily with `flashcards` UI.

## FSD Rule Enforcement
You must import from `src/features/quiz/index.ts` (or simply `src/features/quiz`), not `src/features/quiz/engine/QuizEngine.ts`.
