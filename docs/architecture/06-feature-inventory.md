# 6. Feature Inventory

## Overview
MindFlow is a comprehensive educational platform containing several interconnected domain features spanning learning, AI tutoring, community, and administrative tools.

## 1. Learning & Quiz Engine (Core)
*Status:* **Completed / Active**
- **Offline-First Quiz Sessions:** Users can take quizzes without internet connectivity. State is aggressively saved to IndexedDB and synced to Supabase.
- **Multiple Choice Questions (MCQ):** Supported via a plugin architecture (`mcqPlugin`).
- **Mock Tests:** Full-length, timed exam simulations (e.g., specific exams like SSC, Banking).
- **Progress Tracking:** Saves partially completed quizzes and allows resumption.

## 2. Vocabulary & Flashcards (Vocab Hub)
*Status:* **Completed / Active**
- **Synonyms & Antonyms:** Spaced repetition flashcard system.
- **One Word Substitutions (OWS):** Vocabulary expansion feature.
- **Idioms:** Swipe-based learning interface tracking mastery levels (`mastered`, `tricky`, `review`, `clueless`).
- **Gamification:** Daily challenge scores and streak tracking.

## 3. AI Integrations
*Status:* **Completed / Active (Iterating)**
- **AI Tutor (Ask AI):** On-demand explanations for specific questions. Uses a two-stage pipeline (Grounding context fetch followed by JSON generation) to avoid Free Tier Gemini quota exhaustion.
- **Automated Content Ingestion (Admin):** Pipeline to upload PDFs, run OCR, extract questions, and enrich them with taxonomy and translations via background workers (`pgmq`).
- **Samvad AI Chat:** Conversational agent interface.

## 4. User Account & Onboarding
*Status:* **Completed**
- **Authentication:** Email/Password and Google OAuth via Supabase GoTrue.
- **Post-Auth Onboarding:** A modular state machine workflow (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`) to gather user preferences before allowing access to the dashboard.
- **Account Deletion & Data Export:** GDPR compliant data export and hard deletion RPCs.

## 5. Community & Social (Reels)
*Status:* **Experimental / Partially Implemented**
- **Educational Reels:** Short-form, scrollable educational content.
- **Social Interactions:** Likes and comments on reels.
- **Moderation:** Community blocking and reporting systems.

## 6. Administration & Content Studio
*Status:* **Active (Internal Tooling)**
- **Ingestion Dashboard:** UI for administrators to upload PDFs and monitor the status of `pgmq` jobs.
- **Review Queue:** Interface to approve, edit, or reject AI-extracted questions before they go live (`question_lifecycle_status`).
- **System Configuration:** Dynamic toggle of UI features via `app_ui_config` table.

## Deprecated / Removed Features
- **Guest Login:** Strictly prohibited by current architectural policies.
- **Legacy Route Guards:** Generic `AuthGuard` or `ProtectedRoute` components have been strictly removed in favor of the centralized `NavigationManager` and Policy Engine.
- **Single-Stage Google Search Grounding:** Removed from the `ask-ai-tutor` pipeline due to 429 quota errors.

*Evidence:* `src/features/*` directory structure, migration files, memory guidelines.
*Confidence:* Confirmed.
