# MindFlow Quiz: React to Android (Kotlin & Jetpack Compose) Migration Guide

## 1. Executive Summary

This document provides a conceptual breakdown and comprehensive guide for converting the **MindFlow Quiz** PWA (built with React, TypeScript, and Vite) into a **Native Android Application** using **Kotlin** and **Jetpack Compose**.

Converting a React web application to a native Android app is a complete frontend rewrite. However, because MindFlow relies heavily on Supabase for the backend, the core data models, database schema, edge functions, and authentication flow remain conceptually identical.

## 2. Conceptual Mapping: React vs. Android

To translate the existing codebase, here is how the primary technologies and concepts map from your React environment to Android:

| Concept | React / Web (Current) | Android / Native (Target) |
| :--- | :--- | :--- |
| **UI Framework** | React (Declarative) | Jetpack Compose (Declarative) |
| **Language** | TypeScript | Kotlin |
| **State Management** | Zustand & React Context / useReducer | ViewModels & Kotlin `StateFlow` / `SharedFlow` |
| **Routing / Navigation**| React Router (`<BrowserRouter>`) | Jetpack Navigation Compose |
| **Styling** | Tailwind CSS & CSS modules | Compose Modifiers & Material Design 3 |
| **Backend SDK** | `@supabase/supabase-js` | `io.github.jan-tennert.supabase:gotrue-kt` (Supabase Kotlin) |
| **Offline Storage** | IndexedDB (`src/lib/db.ts`) | Room Database (SQLite abstraction) |
| **Background Sync** | Service Workers (PWA) | Android WorkManager |
| **AI Integration** | Google GenAI JS SDK | Google AI Client SDK for Android |

## 3. Translating the MindFlow Architecture

MindFlow uses a feature-based architecture. This translates incredibly well to Android's recommended "Feature Module" or "Clean Architecture" patterns.

### A. The Data Layer (Supabase & Offline)
- **Current:** `src/lib/supabase.ts`, `src/lib/db.ts` (IndexedDB), `src/lib/syncService.ts`.
- **Target:**
  - Use **Room** to create local database tables that mirror the Supabase schemas for `Questions`, `Idioms`, `OWS`, and `QuizAttempts`.
  - Use the **Supabase Kotlin Client** to fetch remote data.
  - Implement the Repository Pattern. For example, a `QuizRepository` will check the Room database first (offline-first), and then use WorkManager to sync with Supabase in the background, replicating what `syncService.ts` does.

### B. The Presentation Layer & Features
- **Authentication (`src/features/auth`):**
  Translate the Supabase-js Auth to Supabase-kt `GoTrue`. The React AuthProvider becomes an `AuthViewModel` exposing a `StateFlow<AuthState>` that the entire app observes to determine whether to show the Login screen or the Dashboard.
- **The Quiz Engine (`src/features/quiz`):**
  The `useQuizSessionStore` (reducer/context) translates perfectly into a `QuizViewModel`. State variables like `currentQuestionIndex`, `score`, and `timer` will be reactive `MutableStateFlow`s.
  The visual components (e.g., `QuizLayout.tsx`, `QuestionDisplay.tsx`) become `@Composable` functions.
- **Flashcards (`src/features/flashcards` & `src/features/ows`):**
  The 3D flip effect using Framer Motion translates into Compose `graphicsLayer` animations (`rotationY`). State management for tracking seen/mastered cards will be handled by a `FlashcardViewModel` hooked up to Room.

### C. The AI Tutor
- **Current:** Calls Google Gemini via `@google/genai` inside React hooks.
- **Target:** Use the `generativeai` Android SDK. The prompt engineering (passing the current question, options, and user doubt) will be constructed in a dedicated `AITutorUseCase` or `AIViewModel`.

## 4. Phased Migration Plan

We will execute this rewrite iteratively without deleting the existing React codebase. All React code will be preserved in a `react-mindflow-app` directory.

### Phase 1: Project Scaffolding (Current)
- Setup the Android Gradle project structure (Kotlin DSL).
- Define module architecture (`app/src/main/java/com/mindflow/quiz`).
- Add basic Jetpack Compose dependencies and the Supabase Kotlin SDK.

### Phase 2: Core Data Layer
- Setup Room Database entities based on `src/types/models.ts`.
- Initialize the Supabase client in Kotlin.
- Build Repositories to fetch and cache data.

### Phase 3: Authentication & User Profile
- Implement the UI for Login and Signup using Jetpack Compose.
- Connect to Supabase Auth (`GoTrue`).
- Setup navigation to route users to the Dashboard upon successful login.

### Phase 4: Main Navigation & Dashboard
- Implement the Jetpack Compose Navigation graph.
- Build the Dashboard UI, mapping `MainLayout.tsx` and the dashboard features.

### Phase 5: The Quiz Engine
- Translate `useQuizSessionStore` to `QuizViewModel`.
- Build the adaptive UI for answering questions.
- Implement the scoring logic and result screens.

### Phase 6: Flashcards & Additional Tools
- Implement Idiom and OWS flashcard screens with Compose animations.
- Integrate WorkManager for background syncing of learning progress.

### Phase 7: AI Tutor & Polish
- Integrate Google Gemini SDK.
- Add text-to-speech support using Android's native `TextToSpeech` engine.
- Final UI polish, Material 3 theming, and animations.
