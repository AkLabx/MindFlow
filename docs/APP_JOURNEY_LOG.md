# MindFlow - App Journey & Release Log

This document is the single source of truth for the evolution of the MindFlow application. Every version bump, feature rollout, architectural enhancement, and critical bug fix is chronologically documented here with exact **Indian Standard Time (IST)** timestamps to provide complete visibility into the app's journey for all existing and incoming developers.

---

## 📌 Team Ritual & Governance Policy

> ### ⚠️ MANDATORY WORKFLOW RITUAL FOR ALL TEAM MEMBERS & AI AGENTS
> Every developer (human or AI pair programmer) working on this repository **MUST** follow this ritual without exception:
>
> 1. **Trigger**: Whenever a version bump is performed in `package.json` (or `android/app/build.gradle`).
> 2. **Logging Destination**: Prepend the new release entry immediately below the `---` divider in this file (`docs/APP_JOURNEY_LOG.md`).
> 3. **Required Entry Fields**:
>    - **Version Tag**: `## [vX.Y.Z] - DD MMMM YYYY, HH:MM AM/PM IST`
>    - **Executive Summary**: A concise 1-2 sentence overview of the release purpose.
>    - **Work Breakdown**: Grouped under `### ✨ Features Added`, `### 🐛 Bug Fixes`, `### ⚡ Performance & Refactoring`, or `### 🔒 Security & Architecture`.
>    - **Impacted Scope**: Mention core modules or paths modified (e.g., `src/features/quiz/`, `src/lib/navigation/`).
> 4. **STRICT ZERO-SENSITIVITY POLICY**:
>    - **NEVER** log API keys, access tokens, secrets, service passwords, internal database URLs, or real user identifiers.
>    - Keep all descriptions high-level, architectural, and educational for developers.
> 5. **Cross-Platform Awareness**:
>    - MindFlow is both a PWA on GitHub Pages (`<HashRouter>`) and an Android app via Capacitor. Keep logs mindful of both targets.

---

## 🚀 App Journey Changelog

## [v1.0.283] - 31 October 2026, 12:16 PM IST

### Executive Summary
Major release introducing the **Today's Plan (Daily SSC Exam Prep Engine)**, comprehensive Dashboard experience enhancements, streamlined state synchronization, and core Navigation and Session Recovery hardening.

### ✨ Features Added
- **Today's Plan Module (`src/features/todays-plan/`)**:
  - **Dual-Track Prep System**: Seamless switching between **GK Exam Drill** and **English Vocab Booster**.
  - **Intelligent Scheduling Engine (`todaysPlanAlgorithm.ts`)**:
    - **Mistake Vault Integration**: Automatically flags and surfaces previously failed questions for high-priority retention drills.
    - **Spaced Retention Repetition**: Implements structured interval spacing (1-day, 3-day, 7-day, 14-day, 30-day intervals) to solidify memory.
    - **Chapters of 25**: Sequential syllabus progression curating focused 25-question topic batches.
  - **Adaptive Daily Hero Card**: 1-click drill launch (`TodaysPlanHeroCard.tsx`), real-time completion tracking, and animated skeleton loaders.
  - **Interactive Vocab Booster**: Flashcard-style vocabulary mastery cards with contextual examples and definitions.
- **Dashboard Experience Overhaul**:
  - **Live Dynamic Greeting & Stats (`DashboardGreeting.tsx`)**: Shows real-time bookmark counts synced between IndexedDB and Supabase, time-based dynamic greetings, and quick-action shortcuts.
  - **SSC Subject Strip (`SubjectStrip.tsx`)**: Highlighting primary exam subjects with progress indicators and instant subject drill launches.
  - **Targeted Exam Topics (`ImportantForSscStrip.tsx`)**: Quick-access tags for frequently tested topics and high-yield concepts.
  - **Suggested Drills & User Progress Cards**: Refined metrics and drill recommendations based on user practice patterns.

### 🐛 Bug Fixes & System Hardening
- **Navigation Flow Stabilization (`NavigationManager.tsx`)**:
  - Resolved history stack corruption and race conditions during fast tab switches on mobile and Capacitor Android.
  - Enhanced route-guard transitions and ensured smooth deep-linking without URL hash collisions.
- **Session Recovery & Bootstrap (`RecoveryManager.ts`, `useAppBootstrap.ts`)**:
  - Hardened guest session recovery logic against transient token refresh failures.
  - Preserved the mandatory OAuth hash interception guardrail (`window.location.hash` parsing) for GitHub Pages hosting.
- **Optimistic State Management (`useBookmarkStore.ts`, `useQuizSessionStore.ts`)**:
  - Enabled immediate optimistic UI updates for bookmarks and quiz states with resilient background synchronization to IndexedDB and cloud.
- **Provider Refactoring (`src/providers/AppProvider.tsx`, `src/lib/queryClient.ts`)**:
  - Extracted TanStack QueryClient into a clean dedicated module (`queryClient.ts`), reducing unnecessary render cycles in the core app tree.

---

## [v1.0.277] - 27 October 2026, 03:10 PM IST

### Executive Summary
Messaging and chat stability update resolving auto-scrolling issues in active discussion rooms.

### 🐛 Bug Fixes & Improvements
- **Chat Scrolling (`src/features/community/`)**:
  - Integrated React Virtuoso `followOutput` to ensure the chat window automatically follows new incoming messages smoothly.
  - Simplified scroll event handlers to prevent jitter on high-frequency message streams.

---

## [v1.0.276] - 27 October 2026, 01:03 PM IST

### Executive Summary
UI consistency update adding full Dark Mode compatibility to community message rooms.

### 🐛 Bug Fixes & Improvements
- **Theme Polish**:
  - Normalized Tailwind CSS dark mode classes (`dark:bg-slate-900`, `dark:text-slate-100`) across `ActiveChatRoom` and community message threads.
  - Resolved background-text contrast issues on dark themes for user message bubbles.

---

## [v1.0.275] - 27 October 2026, 09:39 AM IST

### Executive Summary
Mobile typing experience overhaul in chat inputs.

### ✨ Features Added & Improvements
- **Auto-Expanding Chat Bar**: Replaced single-line input with an auto-expanding textarea in `ChatInputBar.tsx`, allowing multi-line drafting without obstructing keyboard viewports.

---

## [v1.6 (6) - Android Release] - 25 October 2026, 04:57 PM IST

### Executive Summary
Production build release for Google Play Store packaging the latest PWA improvements into Capacitor Android.

### ⚡ Build & Platform Updates
- **Android Configuration (`android/app/build.gradle`)**:
  - Bumped `versionCode` to `6` and `versionName` to `1.6`.
  - Verified splash screen and deep-link handling for Android 14+ devices.

---

## [v1.0.273] - 26 October 2026, 08:51 PM IST

### Executive Summary
Layout fixes for mobile chat viewport and message rendering hierarchies.

### 🐛 Bug Fixes
- **Mobile Chat Layout**: Restored clean flexbox hierarchies and resolved message rendering overflow issues on narrow viewports.

---

## [v1.0.272] - 26 October 2026, 05:37 PM IST

### Executive Summary
Mobile edge-to-edge layout adaptation for immersive chat rooms.

### ⚡ Refactoring & Improvements
- **Edge-to-Edge UI**:
  - Removed restrictive `fixed inset-0` constraints from `MainLayout` on chat routes.
  - Allowed active chat room viewports to utilize full device display width while preserving `max-w-3xl` constraints on desktop screens.

---

## [v1.0.271] - 26 October 2026, 09:42 AM IST

### ✨ Features Added
- **Message Action Menu**: Implemented an accessible long-press context menu on chat messages supporting copy, quote, and report actions.

---

## [v1.0.270] - 26 October 2026, 07:49 AM IST

### ⚡ Architecture
- **URL-Driven Chat Routes**: Extracted `ActiveChatRoom` component and transitioned messaging views to URL parameters (`#/community/chat/:roomId`), enabling direct navigation and browser back/forward support.

---

## [v1.0.269] - 26 October 2026, 07:23 AM IST

### 🐛 Bug Fixes
- **Viewport Occlusion**: Corrected keyboard pop-up occlusions in `ActiveChatRoom` on mobile web browsers.

---

## [v1.0.268] - 25 October 2026, 12:21 AM IST

### ⚡ Architecture
- **Dedicated Headers**: Standardized header components and layout containers across secondary application pages.

---

## [v1.0.267] - 25 October 2026, 06:31 PM IST

### ⚡ UI Optimization
- **Header Route Visibility**: Dynamic suppression of the global navigation header on focused views (quizzes, active study rooms) to maximize reading screen real estate.

---

## [v1.0.266] - 25 October 2026, 04:10 PM IST

### 🐛 Bug Fixes
- **Auth Session Loops**: Resolved infinite session expired refresh loops for guest aspirants navigating between offline and online states.

---

## [v1.0.265] - 24 October 2026, 04:36 PM IST

### 🔒 Reliability
- **Stale-Session Recovery**: Completed full implementation of the session recovery manager for seamless user re-authentication without loss of quiz progress.

---

## [v1.0.264] - 24 October 2026, 02:33 PM IST

### ✨ UI Polish
- **Interactive Feedback**: Added clear "Coming Soon" modal feedback for in-development dashboard action tiles.

---

## [v1.0.263] - 24 October 2026, 11:23 AM IST

### 🔒 Reliability & Architecture
- **Global Session Recovery Architecture**: Laid foundational recovery routines to detect invalidated auth tokens and gracefully guide users through re-auth.

---

## [v1.0.262] - 24 October 2026, 09:27 AM IST

### 📚 Documentation
- **Architecture Mapping**: Generated comprehensive repository and directory maps in `/docs` to guide feature modularization.
