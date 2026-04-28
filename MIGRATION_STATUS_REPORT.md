# Migration Status Report: React PWA to Android Kotlin

## Executive Summary
This document provides a detailed end-to-end module-by-module comparison of the MindFlow Quiz application migration from React (TypeScript, PWA) to Android (Kotlin, Jetpack Compose).
The goal of the migration is **100% feature parity**. The current state shows the foundational architecture and some core UI elements are implemented in Android, but substantial business logic, complex data handling (Room DB mapping), advanced UI interactions (3D animations, rich text formatting), and worker integrations are missing.

---

## 1. Authentication Module

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Provider / State** | `AuthContext.tsx` | `AuthViewModel.kt` | **Incomplete** | Basic structure present in Android, but lacks the PWA-specific popup sync (`window.addEventListener('storage')`) logic and complex meta-data handling. Needs robust implementation using Supabase `gotrue-kt`. |
| **Login Screen** | `features/auth/components` | `LoginScreen.kt` | **Incomplete** | UI exists in Compose, but full OAuth integration and error handling parity is missing. |
| **Signup Screen** | `features/auth/components` | `SignupScreen.kt` | **Incomplete** | UI exists in Compose, missing full validation and error states. |
| **Profile Stats Hook** | `useProfileStats.ts` | *Missing* | **Todo** | User statistics aggregation logic needs to be migrated to a ViewModel/Repository. |
| **Auth Guarding** | `AuthGuard.tsx` | `AppNavigation.kt` | **Completed** | Navigation logic effectively routes based on `sessionStatus`. |

## 2. Dashboard & Core Navigation

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Main Layout Wrapper** | `MainLayout.tsx` | `MainLayoutScreen.kt` | **Incomplete** | Basic scaffold exists, but complex tab routing and settings modal integration are missing. |
| **Dashboard Screen** | `Dashboard.tsx` | `DashboardScreen.kt` | **Incomplete** | UI scaffold present. Missing live data integration (Stats, Recent Quizzes) which are hardcoded placeholders. |
| **Settings Modal** | `SettingsModal.tsx` | *Missing* | **Todo** | Needs Jetpack Compose equivalent for app preferences (bg animations, sound, etc.). |
| **Settings Store** | `useSettingsStore.ts` | *Missing* | **Todo** | Needs `DataStore` or `SharedPreferences` implementation in Android. |

## 3. Quiz Engine & Execution

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Quiz Store / State Management**| `useQuizSessionStore.ts` (Zustand) | `QuizViewModel.kt` | **Incomplete** | Basic `MutableStateFlow` exists, but lacks advanced features: timers, bookmarks, review marking, 50-50 logic, pause/resume functionality. |
| **Quiz Layout / Orchestrator** | `QuizLayout.tsx` | `QuizScreen.kt` | **Incomplete** | Compose UI shows basic questions. Missing Markdown/LaTeX rendering (needs `markwon`), complex timers, and background animations (Fireballs). |
| **Question Display** | `components/...` | `QuizScreen.kt` | **Incomplete** | Basic MCQ selection works. Missing explanation displays, review marking, and fifty-fifty UI. |
| **Quiz Results** | `patch_results...` | `ResultScreen.kt` | **Incomplete** | Basic placeholder UI exists. Missing complex score breakdowns, time spent per question, and retry/bookmark sync. |
| **Engine Core (Plugins/Strategy)**| `quizEngine.ts`, `TestEngineController.ts` | *Missing* | **Todo** | The extensible plugin architecture for different question types is completely absent in Android. |
| **Timer Worker** | `timerWorker.ts` | *Missing* | **Todo** | Needs a robust Coroutine/Flow-based timer implementation that survives configuration changes. |
| **Text-to-Speech (TTS)** | Custom Hook | `TTSManager.kt` | **Completed** | Basic TTS implemented using Android's native `TextToSpeech` API. |

## 4. Flashcards (Idioms & OWS)

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Flashcard Data Models** | `Idiom`, `OneWord` (`models.ts`) | `IdiomEntity.kt`, `OneWordEntity.kt`| **Incomplete** | Room entities defined but need type converters for complex nested JSON fields (`meanings`, `extras`, etc.). |
| **Flashcard UI (3D Flip)** | `Flashcard.tsx` (CSS 3D) | `FlashcardScreen.kt` | **Completed** | Excellent 1-to-1 migration using Compose `Modifier.graphicsLayer { rotationY }`. |
| **Flashcard State / Logic** | `useIdiomProgress`, Configs | `FlashcardViewModel.kt` | **Incomplete** | Currently uses hardcoded mock data. Needs Room DB integration and "Mark as Read" / Mastery logic. |
| **OWS/Idiom Configuration UI**| `OWSConfig.tsx`, `IdiomsConfig.tsx` | *Missing* | **Todo** | Screens to configure decks (filters, unread vs mastered) are missing. |

## 5. AI Integration

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AI Chat Screen** | `AIChatPage.tsx` | `AIChatScreen.kt` | **Incomplete** | Basic UI exists. Missing advanced features like Quota management (`useQuota.ts`), complex message rendering, and typing indicators. |
| **AI Tutor Logic** | `useAIChat.ts` | `AITutorViewModel.kt` | **Completed** | Native Gemini integration via `generativeai` SDK is implemented and working. |
| **AI Context Passing** | Context from Quiz to AI | `AITutorViewModel.kt` | **Incomplete** | The structure is there (`contextData` parameter), but it needs to be wired up from the `QuizScreen`. |

## 6. Data Layer & Offline Sync

| Feature / Component | React (PWA) | Android (Kotlin) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Database Schema/Models** | `src/types/models.ts` | `Room Entities` | **Incomplete** | Entities exist but lack complex TypeConverters for nested lists and objects (e.g., `options`, `explanation`). |
| **Backend Integration** | `@supabase/supabase-js` | `gotrue-kt`, `postgrest-kt` | **Incomplete** | Client initialized in `SupabaseClient.kt`. Actual remote fetching in Repositories is commented out/missing. |
| **Offline Storage** | IndexedDB (`src/lib/db.ts`) | Room (`AppDatabase.kt`) | **Incomplete** | DAOs exist but are not fully wired to fetch remote data and cache it. |
| **Background Sync** | Service Worker | `SyncWorker.kt` | **Todo** | Worker is scaffolded but the actual logic to check internet, fetch, and save to Room is a placeholder ("Phase 8"). |
