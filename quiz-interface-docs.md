# Learning Mode Quiz Interface Documentation

This document explains the frontend UI design, component flow, and button functionalities of the Learning Mode Quiz Interface. It is designed to guide developers in building a custom HTML-based quiz with similar frontend logic.

## Overview
The Learning Mode interface is built primarily in `LearningSession.tsx`, which wraps the question display (`QuizQuestionDisplay.tsx`) and the explanation component (`QuizExplanation.tsx`) inside an `ActiveQuizLayout.tsx`.

The interface provides an interactive, timed environment where users can answer questions, use lifelines (like 50:50), navigate between questions, and view immediate explanations.

## UI Components & Flow

### 1. ActiveQuizLayout
This is the main structural shell. It divides the screen into three areas:
- **Header:** Displays progress, bookmarks, timer, and a pause button.
- **Content Area:** Where the current question, options, and explanation are rendered.
- **Footer (Bottom Nav):** Contains navigation controls (Next, Previous), the 50:50 lifeline, and access to the Side Panel / Settings.

### 2. Header (`header` element)
The header provides essential context about the session.
- **Home/Exit Button:** Aborts the session and returns to the home screen (`onGoHome`).
- **Progress Indicator:** Shows current question number out of total (e.g., "3 of 10").
- **Pause Button:** Pauses the timer and blur the screen (`handlePause`).
- **Bookmark Button:** Toggles the bookmark status for the current question (`onToggleBookmark`).
- **Timer Bar:** A visual countdown timer.
    - Turns yellow when `<= 15s` remaining.
    - Turns red when `<= 5s` remaining.

### 3. Content Area (`QuizQuestionDisplay` & `QuizExplanation`)
- **Question Text:** Displays the question prompt.
- **Options List:** Renders available choices.
    - When a user clicks an option (`handleAnswerSelect`):
        - It locks further selection.
        - Calculates the exact time spent.
        - Triggers success/error sounds based on correctness.
        - Applies styles indicating Correct (green) or Incorrect (red) choices.
- **Explanation (`QuizExplanation`):** Only visible *after* an answer is selected or time runs out. Displays detailed reasoning for the correct answer.

### 4. Footer (Bottom Navigation Area)
The footer is always accessible at the bottom of the screen.

#### Buttons and their Purposes:

*   **Settings (Gear Icon):**
    *   **Purpose:** Opens a modal (`SettingsModal`) to adjust quiz preferences (e.g., font size, sound toggle).
    *   **Action:** Sets `isSettingsOpen` to true.

*   **Menu / Side Panel (Hamburger Icon):**
    *   **Purpose:** Opens the `QuizNavigationPanel` to jump directly to other questions, view all answered/unanswered statuses, or submit the quiz.
    *   **Action:** Sets `isNavOpen` to true.

*   **Previous (ChevronLeft Icon):**
    *   **Purpose:** Navigates back to the previously viewed question.
    *   **State:** Disabled if currently on the first question (Index 0).
    *   **Action:** Calls `handlePrevClick()`, which triggers `onPrev()`.

*   **50:50 Lifeline:**
    *   **Purpose:** Hides half of the *incorrect* options to make the question easier.
    *   **State:** Disabled if the question is already answered, time has run out, or the lifeline has already been used on this question.
    *   **Action (`handleFiftyFifty`):**
        1. Identifies incorrect options.
        2. Shuffles them.
        3. Selects half of them.
        4. Calls `onFiftyFifty(questionId, hiddenOptions)` to pass state to the parent, triggering UI updates to hide those specific choices.

*   **Next / Finish Button:**
    *   **Purpose:** Moves to the next question. If on the last question, it finishes the session.
    *   **State:** Disabled *until* an answer is selected (Enforces answering before proceeding in Learning Mode).
    *   **Action (`handleNextClick`):** Calls `onNext()` or `finishSession()` depending on the current index.

## Key Overlay Modals

1.  **Time's Up Modal:**
    *   Appears when the timer expires (`showTimeUpModal`).
    *   Automatically selects a 'TIME_UP' state, locks options, and reveals the correct answer and explanation.
    *   Auto-closes after 2 seconds.
2.  **Pause Overlay:**
    *   Triggered by the Pause button.
    *   Blurs the `quiz-card-container` to prevent cheating.
    *   Displays a "Resume Quiz" button (`handleResume`).
3.  **Side Navigation Panel (`QuizNavigationPanel`):**
    *   Shows a grid overview of all questions.
    *   Allows jumping to specific questions (`onJumpToQuestion`).

## Internal Frontend State Required
To replicate this in HTML/JS, you need to track:
*   `currentIndex`: Current question being viewed.
*   `timeLeft`: Time remaining for the current question.
*   `userAnswers`: Key-value map of question IDs to selected options.
*   `hiddenOptions`: Map tracking which options are hidden by the 50:50 lifeline.
*   `isPaused`: Boolean controlling the blur overlay.
