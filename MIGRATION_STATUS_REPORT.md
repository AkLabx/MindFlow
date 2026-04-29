# Migration Status Report: React PWA to Android Kotlin

## Executive Summary
This document provides a detailed end-to-end module-by-module comparison of the MindFlow Quiz application migration from React (TypeScript, PWA) to Android (Kotlin, Jetpack Compose).
The goal of the migration is **100% feature parity**. The current state shows the foundational architecture and some core UI elements are implemented in Android, but substantial business logic, complex data handling (Room DB mapping), advanced UI interactions (3D animations, rich text formatting), and worker integrations are missing.

---

## 1. Authentication Module

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Provider / State** | `AuthContext.tsx` | `AuthViewModel.kt` | [ ] **Incomplete** | Basic structure present in Android, but lacks the PWA-specific popup sync (`window.addEventListener('storage')`) logic and complex meta-data handling. Needs robust implementation using Supabase `gotrue-kt`. |
| **Login Screen** | `features/auth/components` | `LoginScreen.kt` | [ ] **Incomplete** | UI exists in Compose, but full OAuth integration and error handling parity is missing. |
| **Signup Screen** | `features/auth/components` | `SignupScreen.kt` | [ ] **Incomplete** | UI exists in Compose, missing full validation and error states. |
| **Profile Stats Hook** | `useProfileStats.ts` | *Missing* | [ ] **Todo** | User statistics aggregation logic needs to be migrated to a ViewModel/Repository. |
| **Auth Guarding** | `AuthGuard.tsx` | `AppNavigation.kt` | [x] **Completed** | Navigation logic effectively routes based on `sessionStatus`. |

## 2. Dashboard & Core Navigation

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Main Layout Wrapper** | `MainLayout.tsx` | `MainLayoutScreen.kt` | [ ] **Incomplete** | Basic scaffold exists, but complex tab routing and settings modal integration are missing. |
| **Dashboard Screen** | `Dashboard.tsx` | `DashboardScreen.kt` | [ ] **Incomplete** | UI scaffold present. Missing live data integration (Stats, Recent Quizzes) which are hardcoded placeholders. |
| **Settings Modal** | `SettingsModal.tsx` | *Missing* | [ ] **Todo** | Needs Jetpack Compose equivalent for app preferences (bg animations, sound, etc.). |
| **Settings Store** | `useSettingsStore.ts` | *Missing* | [ ] **Todo** | Needs `DataStore` or `SharedPreferences` implementation in Android. |

## 3. Quiz Engine & Execution

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Quiz Store / State Management**| `useQuizSessionStore.ts` (Zustand) | `QuizViewModel.kt` | [ ] **Incomplete** | Basic `MutableStateFlow` exists, but lacks advanced features: timers, bookmarks, review marking, 50-50 logic, pause/resume functionality. |
| **Quiz Layout / Orchestrator** | `QuizLayout.tsx` | `QuizScreen.kt` | [ ] **Incomplete** | Compose UI shows basic questions. Missing Markdown/LaTeX rendering (needs `markwon`), complex timers, and background animations (Fireballs). |
| **Question Display** | `components/...` | `QuizScreen.kt` | [ ] **Incomplete** | Basic MCQ selection works. Missing explanation displays, review marking, and fifty-fifty UI. |
| **Quiz Results** | `patch_results...` | `ResultScreen.kt` | [ ] **Incomplete** | Basic placeholder UI exists. Missing complex score breakdowns, time spent per question, and retry/bookmark sync. |
| **Engine Core (Plugins/Strategy)**| `quizEngine.ts`, `TestEngineController.ts` | *Missing* | [ ] **Todo** | The extensible plugin architecture for different question types is completely absent in Android. |
| **Timer Worker** | `timerWorker.ts` | *Missing* | [ ] **Todo** | Needs a robust Coroutine/Flow-based timer implementation that survives configuration changes. |
| **Text-to-Speech (TTS)** | Custom Hook | `TTSManager.kt` | [x] **Completed** | Basic TTS implemented using Android's native `TextToSpeech` API. |

## 4. Flashcards (Idioms & OWS)

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Flashcard Data Models** | `Idiom`, `OneWord` (`models.ts`) | `IdiomEntity.kt`, `OneWordEntity.kt`| [ ] **Incomplete** | Room entities defined but need type converters for complex nested JSON fields (`meanings`, `extras`, etc.). |
| **Flashcard UI (3D Flip)** | `Flashcard.tsx` (CSS 3D) | `FlashcardScreen.kt` | [x] **Completed** | Excellent 1-to-1 migration using Compose `Modifier.graphicsLayer { rotationY }`. |
| **Flashcard State / Logic** | `useIdiomProgress`, Configs | `FlashcardViewModel.kt` | [ ] **Incomplete** | Currently uses hardcoded mock data. Needs Room DB integration and "Mark as Read" / Mastery logic. |
| **OWS/Idiom Configuration UI**| `OWSConfig.tsx`, `IdiomsConfig.tsx` | *Missing* | [ ] **Todo** | Screens to configure decks (filters, unread vs mastered) are missing. |

## 5. AI Integration

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AI Chat Screen** | `AIChatPage.tsx` | `AIChatScreen.kt` | [ ] **Incomplete** | Basic UI exists. Missing advanced features like Quota management (`useQuota.ts`), complex message rendering, and typing indicators. |
| **AI Tutor Logic** | `useAIChat.ts` | `AITutorViewModel.kt` | [x] **Completed** | Native Gemini integration via `generativeai` SDK is implemented and working. |
| **AI Context Passing** | Context from Quiz to AI | `AITutorViewModel.kt` | [ ] **Incomplete** | The structure is there (`contextData` parameter), but it needs to be wired up from the `QuizScreen`. |

## 6. Data Layer & Offline Sync

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Database Schema/Models** | `src/types/models.ts` | `Room Entities` | [ ] **Incomplete** | Entities exist but lack complex TypeConverters for nested lists and objects (e.g., `options`, `explanation`). |
| **Backend Integration** | `@supabase/supabase-js` | `gotrue-kt`, `postgrest-kt` | [ ] **Incomplete** | Client initialized in `SupabaseClient.kt`. Actual remote fetching in Repositories is commented out/missing. |
| **Offline Storage** | IndexedDB (`src/lib/db.ts`) | Room (`AppDatabase.kt`) | [ ] **Incomplete** | DAOs exist but are not fully wired to fetch remote data and cache it. |
| **Background Sync** | Service Worker | `SyncWorker.kt` | [ ] **Todo** | Worker is scaffolded but the actual logic to check internet, fetch, and save to Room is a placeholder ("Phase 8"). |

---

# Sprint Execution Roadmap (Phase-wise)

## 🚀 Sprint 1: Foundation (Data Layer & Sync)
**Goal:** Establish the heartbeat of the app. Ensure data can flow from Supabase -> Room -> Repository.

- [x] **Phase 1: Question Sync Architecture**
  - Add `kotlinx.serialization` and `DataStore` dependencies.
  - Update `QuestionEntity` with `updatedAt` and `syncStatus` sync tracking fields.
  - Create `QuestionDto` matching Supabase schema and define a mapper (`toEntity`).
  - Implement `SyncDataStore` to persist the timestamp of the last successful question sync.
  - Implement `SyncWorker` offline-first logic for `questions` to fetch only updated/new records.
  - Refactor `QuizRepository` to utilize `QuestionDto` mapping and implement local DB source of truth logic.
- [x] **Phase 2: Idioms & One Word Substitution (OWS) Sync Integration**
  - Update `IdiomEntity` and `OneWordEntity` with sync tracking fields.
  - Create `IdiomDto` and `OneWordDto` with their respective mappers.
  - Update `SyncDataStore` to track `lastSync` for idioms and OWS separately.
  - Expand `SyncWorker` to fetch and sync `idioms` and `ows` tables from Supabase to Room.
  - Establish Repositories for Idioms and OWS with Flow emissions identical to `QuizRepository`.
- [x] **Phase 3: Robust TypeConverters & Room Integration**
  - Implement and verify complex `TypeConverters` for Room handling arrays and JSON objects (e.g., options, usage sentences, meaning objects).
  - Verify database schema generation.
- [x] **Phase 4: Sync Orchestration & Bootstrapping**
  - Implement the UI or App startup logic to schedule `SyncWorker` periodically (e.g., via WorkManager).
  - Add initial loading states (bootstrapping) to ensure crucial data is pulled before first-time offline use.

## 🚀 Sprint 2: Core Engine (The State Machine)
**Goal:** Make the Quiz Engine as robust as the React `quizReducer.ts`.

- [ ] **Phase 1: State Machine Setup**
  - Refactor `QuizViewModel.kt` using Sealed Classes for intents/events (`Next`, `Prev`, `Answer`, `FiftyFifty`).
  - Implement the core state class representing the current quiz session.
- [ ] **Phase 2: Timer and Mode Implementations**
  - Integrate a robust coroutine/Flow-based timer logic surviving configuration changes.
  - Implement mode toggles handling (Learning Mode, Mock Mode, God Mode logic).
- [ ] **Phase 3: Advanced Features & State Resiliency**
  - Implement "Mark for Review" and bookmarking session logic.
  - Ensure the state is perfectly serialized/saved across Activity death using `SavedStateHandle` or DataStore.

## 🚀 Sprint 3: Data Integration (Removing the Illusions)
**Goal:** Wire the UI to the actual Data Layer. Eliminate all mock data.

- [ ] **Phase 1: Dashboard Connectivity**
  - Connect `DashboardScreen` to real statistics from Room DB.
  - Replace hardcoded placeholders with actual user profile and history data.
- [ ] **Phase 2: Quiz Engine UI Integration**
  - Connect `QuizScreen` to observe active Flows from `QuizRepository`.
  - Display actual explanations and correct options based on the user's answers.
- [ ] **Phase 3: Flashcard Spaced Repetition (SRS)**
  - Connect `FlashcardScreen` to observe Flows from `IdiomsRepository`/`OWSRepository`.
  - Implement Mastery/Filtering logic via Room queries (e.g., fetching only unread or "review" required cards).

## 🚀 Sprint 4: Enhancements (AI Context & Polish)
**Goal:** Exceed the React PWA's capabilities with native integrations.

- [ ] **Phase 1: Advanced AI Context Injection**
  - Upgrade `AITutorViewModel` to inject specific question context (Question text, Options, User Answer) into the Gemini prompt dynamically from `QuizScreen`.
- [ ] **Phase 2: Rich Text Rendering**
  - Integrate `Markwon` library for robust Markdown and LaTeX rendering in Quiz questions and explanations.
- [ ] **Phase 3: Native Enhancements & Final Polish**
  - Finalize and polish native Text-To-Speech (TTS) integrations across the app for the "Talk" mode.
  - Add missing animations and Jetpack Compose equivalent preferences (Settings screen).
