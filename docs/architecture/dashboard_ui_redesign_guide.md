# MindFlow SSC GK Dashboard — Complete UI/UX & Engineering Specification Guide

> **Document Scope:** Purely architectural, visual, and interactive specification guide (**Zero code edits applied**).  
> **Reference Design:** `MindFlow SSC GK Dashboard.png`  
> **Target Component:** `src/pages/DashboardPage.tsx` (and modular sub-components under `src/features/dashboard/components/`)  
> **Target Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Capacitor (Android Hybrid WebView) + Supabase + IndexedDB (`db.ts`)

---

## 1. Executive Summary & Visual Philosophy

The target **MindFlow SSC GK Dashboard** (`MindFlow SSC GK Dashboard.png`) transforms the current generic hub into a **purpose-built, high-density, exam-focused learning command center** tailored specifically for SSC (CGL, CHSL, MTS, CPO, GD) General Knowledge & General Awareness aspirants.

### Core Visual Pillars in the Screenshot
1. **Soft Multi-Stop Gradient Canvas & Crisp White Card Containers:**
   - The background uses a soft, atmospheric vertical/diagonal gradient canvas (cool lavender-blue/indigo tint at the top transitioning into a clean alabaster/slate-white base `#F4F6FB` → `#EEF2FF` in light mode, with a cohesive deep navy-slate counterpart in dark mode).
   - Every functional module sits inside **crisp white elevated card containers** (`bg-white`, `rounded-2xl` / `16px–20px` radius, subtle border `border-slate-100`, and soft multi-layered elevation shadow `0 4px 20px -2px rgba(15, 23, 42, 0.06)`).
2. **Scannable 5-Tier Vertical Information Hierarchy:**
   - **Tier 1 — Top Brand & User Header / Hero Strip:** App branding (`MindFlow SSC GK`), personalized greeting, live streak/XP pills, notification bell, and user avatar.
   - **Tier 2 — 6-Column Subject Strip (`Subjects` + `View All`):** Instant 1-tap access to the 6 core SSC GK pillars (*History, Polity, Geography, Economy, Science, Static GK*) with colorful custom icon tiles.
   - **Tier 3 — `Quick Actions` Grid:** Fast-launch white cards for high-frequency study workflows (*Daily PYQ / Mock Test, Custom Practice, Rapid Flashcards / Vocab, Saved Bookmarks / Revision*).
   - **Tier 4 — Split `Smart Insight` Row (`Today's Suggested Drill` + `Your Progress`):** A 2-column asymmetric/split row pairing an actionable, personalized weak-topic drill card on the left with a real-time accuracy & progress visual card on the right.
   - **Tier 5 — `Important for SSC` Strip (`Important for SSC` + `View All`):** High-yield, exam-trending SSC GK micro-topics (e.g., *Constitutional Amendments, Folk Dances & Festivals, Five-Year Plans, River Systems, Modern History, Vitamins & Diseases*) with question-count badges and 1-tap drill launch.
   - **Tier 6 — Persistent Bottom Navigation Bar:** Clean fixed bottom bar with active indicator pill for instant tab switching on mobile and Capacitor Android.

---

## 2. Global Canvas, Viewport & Safe-Area Architecture

### 2.1 Background Gradient & Surface Tokens
To achieve 100% parity with the screenshot's depth and contrast between the canvas and the white cards:

| Surface / Token | Light Mode (Primary Screenshot Look) | Dark Mode Adaptation |
| :--- | :--- | :--- |
| **Page Canvas Background** | `bg-gradient-to-b from-[#EEF2FF] via-[#F5F7FF] to-[#F8FAFC]` | `dark:from-slate-950 dark:via-slate-900 dark:to-slate-950` |
| **Top Hero / Header Wash** | Radial top glow `radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 100%)` | `radial-gradient(120% 180px at 50% 0%, rgba(99,102,241,0.22) 0%, transparent 100%)` |
| **Primary Card Container** | `bg-white border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] rounded-2xl` | `dark:bg-slate-900/90 dark:border-slate-800/80 dark:shadow-none` |
| **Section Heading Text** | `text-slate-900 font-bold text-[16px] sm:text-[18px] tracking-tight` | `dark:text-slate-100` |
| **Section Action Link (`View All`)** | `text-indigo-600 hover:text-indigo-700 font-semibold text-xs sm:text-sm` | `dark:text-indigo-400` |
| **Body / Subtitle Text** | `text-slate-500 text-xs sm:text-sm font-medium` | `dark:text-slate-400` |

### 2.2 Container Grid & Spacing Rhythm
- **Outer Scroll Container:**
  - `min-h-full w-full overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]` so the bottom-most `"Important for SSC"` cards never get clipped behind the fixed Bottom Navigation Bar on Capacitor Android or mobile browsers.
- **Inner Content Wrapper:**
  - `max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 space-y-5 sm:space-y-6`
  - Maintains a tight, native-app vertical rhythm (`20px`–`24px` between sections) so all major tiers are immediately visible or within a single natural thumb scroll.

---

## 3. Inch-by-Inch Component Breakdown & Interactive Specifications

---

### 3.1 Tier 1: Top Header & SSC GK Context Bar

#### Visual Anatomy
1. **Left Side — Brand Identity & Exam Target:**
   - **App Emblem / Icon:** Rounded square badge (`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20`) featuring the MindFlow brain/spark icon.
   - **Title & Subtitle Stack:**
     - Primary Title: **`MindFlow`** or **`SSC GK Hub`** (`text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none`).
     - Greeting / Target Subtitle: **`Welcome back, {firstName}`** or **`Target: SSC CGL • CHSL • MTS`** (`text-xs font-medium text-slate-500 mt-1`).
2. **Right Side — Gamification & Utility Controls:**
   - **Streak Pill:** Compact rounded pill (`px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 flex items-center gap-1 text-amber-700 font-bold text-xs`) with a flame icon (`🔥` / Lucide `Flame` filled `#F59E0B`) and dynamic streak count (e.g., `7d` or `12`).
   - **Notification Bell Button:** Circular white icon button (`w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-600 relative`) with an unread crimson/indigo dot (`w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2`).
   - **User Avatar Button:** Circular avatar (`w-9 h-9 rounded-full ring-2 ring-indigo-500/20 overflow-hidden`) showing `user.user_metadata.avatar_url` or an initial fallback badge.

#### Interactive Behavior & Dynamicity
- **Streak Pill Tap:** Opens a lightweight streak summary popover or navigates to `ROUTES.QUIZ.ANALYTICS`.
- **Notification Bell Tap:** Navigates to `ROUTES.NOTIFICATION` (`/notification`).
- **Avatar Tap:** Opens the profile menu or navigates to `ROUTES.PROFILE.ROOT` (`/profile`).

---

### 3.2 Tier 2: 6-Column Subject Strip (`Subjects` + `View All`)

#### Visual Anatomy (100% Parity with Screenshot)
- **Section Header Row:**
  - Left: Section title **`Subjects`** (or **`Explore Subjects`**) in `text-[16px] sm:text-[17px] font-bold text-slate-900`.
  - Right: Interactive link **`View All`** (`text-xs sm:text-sm font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline`) with a subtle right chevron (`ChevronRight w-4 h-4`).
- **6-Column Subject Container:**
  - Wrapped in a clean white card container (`bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]`) **or** rendered as 6 individual white/tinted elevated mini-cards in a 6-column row (`grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3` on responsive viewports, or a 6-column horizontal strip `grid-cols-6` with compact tiles).
  - **Best Practice for Exact Screenshot Parity Across Viewports:**
    - On Desktop/Tablet (`sm:` and up): `grid grid-cols-6 gap-3`.
    - On Mobile (`< 640px`): Either `grid grid-cols-6 gap-1.5` (compact icon + label stack fitting all 6 across the row exactly like the screenshot) or `grid grid-cols-3 gap-2.5` if labels wrap. To match the 6-across strip in the screenshot without horizontal overflow, use `grid grid-cols-6 gap-1.5 sm:gap-3` with `min-w-0` and `text-[11px] sm:text-xs font-semibold text-slate-700 truncate text-center`.

#### The 6 Canonical SSC GK Subjects & Visual Tokens

| Col # | Subject Label | Database Filter Key (`classification.subject`) | Icon / Visual Motif | Tile Background & Accent Color |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **History** | `'History'` | Ancient Pillar / Monument / Scroll (`Landmark` / custom SVG) | Warm Amber/Terracotta (`bg-amber-50 text-amber-600 border-amber-100`) |
| **2** | **Polity** | `'Polity'` | Constitution Book / Scales of Justice (`Scale` / `BookOpen` SVG) | Royal Blue/Indigo (`bg-blue-50 text-blue-600 border-blue-100`) |
| **3** | **Geography** | `'Geography'` | Globe / Earth Continents (`Globe2` / custom SVG) | Emerald/Teal (`bg-emerald-50 text-emerald-600 border-emerald-100`) |
| **4** | **Economy** | `'Economics'` / `'Economy'` | Rising Bar Chart / Currency Coin (`TrendingUp` / `Coins` SVG) | Violet/Purple (`bg-purple-50 text-purple-600 border-purple-100`) |
| **5** | **Science** | `'Science'` (`Physics`, `Chemistry`, `Biology`) | Atom / Microscope / Beaker (`Atom` / `FlaskConical` SVG) | Cyan/Sky (`bg-cyan-50 text-cyan-600 border-cyan-100`) |
| **6** | **Static GK** | `'Static GK'` / `'Current Affairs'` | Trophy / Classical Star / India Map (`Award` / `Sparkles` SVG) | Rose/Coral (`bg-rose-50 text-rose-600 border-rose-100`) |

#### Each Subject Tile's Internal Structure
```
+-----------------------------------+
|   +---------------------------+   |
|   |   [3D/Duotone SVG Icon]   |   |  <- w-11 h-11 sm:w-12 sm:h-12 rounded-xl tinted box
|   +---------------------------+   |
|             History               |  <- text-[11px] sm:text-xs font-semibold text-slate-700
|           (Optional: 1.2k Qs)     |  <- text-[10px] text-slate-400 font-medium
+-----------------------------------+
```

#### Button Activity & Navigation Flow
- **Tapping any of the 6 Subject Tiles:**
  - Triggers haptic/visual press feedback (`active:scale-95 transition-transform duration-150`).
  - Navigates to `ROUTES.QUIZ.CONFIG` (`/quiz/config`) passing pre-populated subject filter state:
    ```ts
    navigate(ROUTES.QUIZ.CONFIG, {
      state: {
        initialFilters: { ...emptyFilters, subject: [subjectItem.dbKey] },
        initialMode: 'learning',
        source: 'dashboard_subject_strip'
      }
    });
    ```
  - **Required Enhancement in `QuizConfig.tsx`:** Initialize `filters` from `(location.state as any)?.initialFilters || emptyFilters` so the user lands in `QuizConfig` with that exact subject already selected and its topics/question counts pre-filtered!
- **Tapping `View All`:**
  - Navigates to `ROUTES.QUIZ.CONFIG` (`/quiz/config`) or `ROUTES.MCQS` (`/mcqs`) with all subjects expanded so the user can browse the full classification tree (including Computer Awareness, Environment, Art & Culture, Sports, etc.).

---

### 3.3 Tier 3: `Quick Actions` Section

#### Visual Anatomy (100% Parity with Screenshot)
- **Section Header:**
  - Title: **`Quick Actions`** (`text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3`).
- **Grid Layout:**
  - A 2x2 or 4-column responsive grid of crisp white action cards (`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5`).
- **Card Styling:**
  - Each card is a white container (`bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-indigo-200 hover:shadow-md transition-all duration-200 flex items-center sm:flex-col sm:items-start gap-3 text-left group cursor-pointer`).

#### The 4 Quick Action Cards

| Card # | Title | Subtitle / Micro-copy | Icon & Badge Style | Target Action / Route |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Daily PYQ Drill** (or **Quick Mock**) | `25 Qs • 15 Mins` / `SSC Tier-1 Pattern` | Lightning Bolt / Timer (`Zap` / `Timer`) in Indigo-Violet gradient badge (`bg-indigo-50 text-indigo-600`) | Launches a 25-question mixed SSC GK mock or navigates to `ROUTES.QUIZ.CONFIG` with `initialMode: 'mock'` |
| **2** | **Custom Quiz** (or **Topic Practice**) | `Filter by Year, Shift & Topic` | Sliders / Layers (`SlidersHorizontal` / `Layers`) in Blue badge (`bg-blue-50 text-blue-600`) | Navigates to `ROUTES.QUIZ.CONFIG` (`/quiz/config`) with `initialMode: 'learning'` |
| **3** | **English & Vocab** (or **Flashcards**) | `Synonyms, OWS & Idioms` | Book / Sparkle (`BookMarked` / `Brain`) in Emerald badge (`bg-emerald-50 text-emerald-600`) | Navigates to `ROUTES.ENGLISH` (`/english`) or Flashcard deck |
| **4** | **Saved & Bookmarks** (or **Revision Bank**) | `{bookmarkCount} Saved Questions` | Bookmark Star (`Bookmark` / `FolderHeart`) in Amber/Orange badge (`bg-amber-50 text-amber-600`) | Navigates to `ROUTES.QUIZ.BOOKMARKS` (`/quiz/bookmarks`) or `ROUTES.QUIZ.LIBRARY` (`/quiz/library`) |

*(Note: If a 4-card 2x2 layout is used on mobile, each card features a left icon badge `w-10 h-10 rounded-xl`, a middle title + subtitle stack, and a subtle right arrow `ChevronRight w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all`.)*

---

### 3.4 Tier 4: Split `Smart Insight` Row (`Today's Suggested Drill` + `Your Progress`)

This row is the centerpiece of personalization in `MindFlow SSC GK Dashboard.png`. It sits in a **2-column split grid** (`grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4`, or `grid-cols-2` side-by-side on mobile/tablet depending on screen width — specifically `grid-cols-1 sm:grid-cols-2` or compact `grid-cols-2` with 55%/45% split).

---

#### Left Card: `Today's Suggested Drill`

##### Visual Anatomy
- **Card Surface:** White elevated card (`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] relative overflow-hidden flex flex-col justify-between`).
- **Top Eyebrow / Header:**
  - Small smart badge/header: Sparkle/Target icon (`Sparkles` or `Target` in `text-indigo-600`) + **`Today's Suggested Drill`** (`text-sm sm:text-[15px] font-bold text-slate-900`).
  - Optional pill tag on the right: **`AI Pick`** or **`Weak Area`** (`px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100`).
- **Middle Content — Dynamic Drill Topic & Metadata:**
  - **Recommended Topic Title:** e.g., **`Indian Polity: Fundamental Rights & Duties`** or **`Modern History: 1857–1947 Movement`** (`text-base sm:text-lg font-extrabold text-slate-900 mt-2 line-clamp-1`).
  - **Reason / Diagnostic Subtext:** e.g., **`Based on your recent accuracy (54% in Polity)`** or **`High weightage in SSC CGL Tier-1 (2–3 Qs/Shift)`** (`text-xs text-slate-500 mt-0.5`).
  - **Drill Specs Pills Row:**
    - Pill 1: `Clock` icon + **`15 Questions`** (`text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg`)
    - Pill 2: `Timer` icon + **`10 Mins`** (`text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg`)
    - Pill 3: `Flame` / `Tag` icon + **`PYQ Focus`** (`text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg`)
- **Bottom CTA Button:**
  - Full-width or prominent primary button: **`Start Drill →`** (`w-full sm:w-auto mt-3.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all`).

##### Dynamicity Per User (How It Adapts)
1. **Returning User with Quiz History (`stats.weakTopics.length > 0`):**
   - Queries `useProfileStats().stats.weakTopics[0]` (the subject/topic where the user has `< 65%` accuracy over $\ge 5$ attempts).
   - Selects 15 high-frequency SSC PYQ questions from that weak subject/topic using `db.getQuizMetadataCache()`.
   - Displays: `"{WeakSubject}: High-Yield Revision"` and `"Accuracy: {subjectAccuracy}% • Boost by +15%"`.
2. **Returning User with High Accuracy Across All Topics (`averageScore >= 80%`):**
   - Switches recommendation to **"SSC CGL Tier-1 Tough Shift Challenge (Hard PYQs)"** (`difficulty: ['Hard']`).
3. **Brand-New User (`quizzesCompleted === 0`):**
   - Displays a curated diagnostic starter drill: **"SSC GK Diagnostic Drill: Top 15 Repeated PYQs"** with subtext `"Take a 8-min baseline test to unlock personalized weak-topic insights"`.
4. **Button Click Activity:**
   - Clicking **`Start Drill`** immediately builds a 15-question session (or navigates to `/quiz/config` with `autoStart: true` and the pre-selected subject/topic filters) so the user enters the quiz in 1 tap.

---

#### Right Card: `Your Progress`

##### Visual Anatomy
- **Card Surface:** White elevated card (`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition-all`).
- **Top Header Row:**
  - Title: **`Your Progress`** (`text-sm sm:text-[15px] font-bold text-slate-900`).
  - Right Link/Icon: **`Details →`** or `BarChart3` icon (`text-xs font-semibold text-indigo-600`).
- **Middle Visual — Circular Accuracy Gauge + Key Metrics:**
  - **Left/Center Circular SVG Progress Ring:**
    - `w-16 h-16 sm:w-20 sm:h-20` SVG ring with smooth `stroke-dasharray` / `stroke-dashoffset` animation.
    - Track stroke: `#E2E8F0` (`slate-200`), Progress stroke: `#4F46E5` (`indigo-600`) or `#10B981` (`emerald-500` when $\ge 75\%$).
    - Center label inside ring: **`{averageScore}%`** (`text-sm sm:text-base font-extrabold text-slate-900`) + tiny **`Accuracy`** label (`text-[9px] font-semibold text-slate-400 uppercase`).
  - **Right Metrics Stack (Beside the Ring):**
    - **Metric 1 (Quizzes / Questions Solved):**
      - Value: **`{correctAnswers}`** (or **`{quizzesCompleted} Tests`**) in `text-sm sm:text-base font-extrabold text-slate-900`.
      - Label: `Correct Answers` / `Quizzes Completed` (`text-[11px] text-slate-500 font-medium`).
    - **Metric 2 (Study Time / Daily Goal):**
      - Value: **`{totalTimeSpentFormatted}`** (e.g., `4h 20m`) or **`{dailyProgress}/50 Qs`** in `text-xs sm:text-sm font-bold text-indigo-600`.
      - Horizontal mini progress bar (`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1`) with fill (`bg-indigo-600 rounded-full`).

##### Dynamicity Per User
- Bound directly to `useProfileStats()` (`src/features/auth/hooks/useProfileStats.ts`) + IndexedDB quiz history (`db.getQuizHistory()`).
- **Important Engineering Fix Note:** In `src/features/auth/hooks/useProfileStats.ts` line 52, `const localHistory: any[] = [];` is currently stubbed as an empty array! To make **`Your Progress`** 100% live and dynamic per user, `useProfileStats` should read `await db.getAll('quiz_history')` (or query Supabase `quiz_attempts` / `saved_quizzes` state) so `quizzesCompleted`, `correctAnswers`, `averageScore`, and `weakTopics` populate with real user telemetry.
- **Loading State:** While `loading === true`, display a subtle shimmer skeleton over the percentage and metrics without shifting card height.
- **Click Activity:** Tapping anywhere on **`Your Progress`** navigates to `ROUTES.QUIZ.ANALYTICS` (`/quiz/analytics`).

---

### 3.5 Tier 5: `Important for SSC` Section (`Important for SSC` + `View All`)

#### Visual Anatomy (100% Parity with Screenshot)
- **Section Header Row:**
  - Left: Fire/Star accent icon + **`Important for SSC`** (`text-[16px] sm:text-[17px] font-bold text-slate-900`).
  - Right: **`View All`** button/link (`text-xs sm:text-sm font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline`).
- **Cards Layout:**
  - A horizontal scrollable strip on mobile (`flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar`) and a multi-column grid on desktop/tablet (`sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-3.5`).
  - Or a 2-column / 3-column grid of compact white topic cards (`bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-indigo-200 transition-all cursor-pointer`).

#### Curated High-Yield SSC Topics (Data Structure)
Each card in **`Important for SSC`** represents a high-frequency SSC exam topic derived from actual SSC CGL/CHSL/MTS PYQ weightage:

| Card # | Topic Title | Subject Pill | Badge / Tag | Question Count / Meta | Target Filter Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Articles & Amendments** | `Polity` (Blue pill) | `🔥 Must Do` | `120+ PYQs` | `{ subject: ['Polity'], topic: ['Constitution', 'Articles & Amendments'] }` |
| **2** | **Folk Dances, Arts & Festivals** | `Static GK` (Rose pill) | `⭐ Top Asked` | `180+ PYQs` | `{ subject: ['Static GK'], topic: ['Art & Culture', 'Dance & Festivals'] }` |
| **3** | **Gandhian Era & National Movement** | `History` (Amber pill) | `🔥 High Weight` | `150+ PYQs` | `{ subject: ['History'], topic: ['Modern History'] }` |
| **4** | **Five-Year Plans & Census 2011** | `Economy` (Purple pill) | `📈 Trending` | `95+ PYQs` | `{ subject: ['Economics'], topic: ['Five Year Plans', 'Census'] }` |
| **5** | **Indian River Systems & Passes** | `Geography` (Emerald pill) | `🌍 Core GK` | `110+ PYQs` | `{ subject: ['Geography'], topic: ['Indian Geography', 'Rivers'] }` |
| **6** | **Vitamins, Diseases & Human Body** | `Science` (Cyan pill) | `🧬 Bio Special` | `140+ PYQs` | `{ subject: ['Science', 'Biology'], topic: ['Human Body & Diseases'] }` |

#### Internal Anatomy of Each `Important for SSC` Card
1. **Top Row:**
   - Subject category pill (`px-2 py-0.5 rounded-md text-[10px] font-bold`) on the left.
   - High-yield tag (`🔥 Hot` / `PYQ`) or question count badge (`120 Qs`) on the right (`text-[10px] font-semibold text-slate-400`).
2. **Middle Row:**
   - Topic Title (`text-xs sm:text-sm font-bold text-slate-900 mt-2 line-clamp-2 leading-snug`).
3. **Bottom Row:**
   - Left: Exam relevance micro-label (e.g., `Asked in CGL 2024`).
   - Right: Circular play/arrow button (`w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors`).

#### Button Activity & Dynamicity
- **Dynamic Question Counts:** Using `useQuestionIndex(metadata)`, each card dynamically displays the exact number of questions available in the user's cached question bank for that topic, plus how many the user has already mastered!
- **Card Tap Activity:** Navigates to `ROUTES.QUIZ.CONFIG` with the exact `subject` and `topic` filters pre-applied (or directly launches a 20-question topic drill).
- **`View All` Tap Activity:** Navigates to `ROUTES.QUIZ.CONFIG` (or opens a modal/sheet listing all high-weightage SSC topics sorted by PYQ frequency).

---

### 3.6 Tier 6: Bottom Navigation Bar (Mobile & Capacitor Android Parity)

#### Visual Anatomy
- Fixed at the bottom of the viewport (`fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(15,23,42,0.04)]`).
- **5 Navigation Items (`grid grid-cols-5 h-16 items-center`):**
  1. **Home** (`Home` / `LayoutDashboard` icon) — Active on `/dashboard` (`text-indigo-600 font-bold` with top/pill indicator).
  2. **Practice / MCQs** (`CheckSquare` / `Layers` icon) — Navigates to `ROUTES.MCQS` (`/mcqs`) or `ROUTES.QUIZ.CONFIG` (`/quiz/config`).
  3. **English / Vocab** (`BookOpen` / `Languages` icon) — Navigates to `ROUTES.ENGLISH` (`/english`).
  4. **Analytics** (`BarChart2` / `PieChart` icon) — Navigates to `ROUTES.QUIZ.ANALYTICS` (`/quiz/analytics`).
  5. **Profile / Saved** (`User` / `Bookmark` icon) — Navigates to `ROUTES.PROFILE.ROOT` (`/profile`) or `ROUTES.QUIZ.BOOKMARKS`.

---

## 4. End-to-End Dynamicity Matrix (Per-User State Adaptation)

To ensure the dashboard feels alive and personalized for every user cohort:

| User State / Cohort | Greeting & Streak Header | `Today's Suggested Drill` Card | `Your Progress` Card | `Important for SSC` Strip |
| :--- | :--- | :--- | :--- | :--- |
| **1. First-Time User (0 Quizzes)** | `"Welcome, {Name}! 👋"` • Streak: `0d (Start Today!)` | **"SSC GK Diagnostic Drill (15 Qs)"** — *"Find your baseline score across all 6 GK subjects"* | Ring at `0%` with encouraging prompt: *"Complete 1 drill to unlock accuracy analytics"* | Highlights **"Top 100 Most Repeated SSC PYQs"** as the first card |
| **2. Active Aspirant (Has Weak Topics)** | `"Welcome back, {Name}!"` • Streak: `🔥 {N} Days` | Dynamically targets lowest-accuracy subject (e.g., **"Economy: Five-Year Plans & Banking"** — *"Your accuracy is 48% • Practice 15 Qs"*) | Shows live `averageScore%` ring, total `correctAnswers`, and `totalTimeSpentFormatted` | Sorts cards so topics from the user's weak subjects appear first in the strip |
| **3. Power User (>80% Accuracy)** | `"Keep dominating, {Name}!"` • Streak: `🔥 {N} Days` | **"SSC CGL Tier-2 / Hard Shift Challenger"** (`difficulty: ['Hard']`, 25 Qs, Timer enabled) | Emerald green ring (`#10B981`), shows rank/mastery badge | Displays completion checkmarks (`✓ 85% Mastered`) on practiced topic cards |
| **4. Offline / Low-Connectivity User (Capacitor Android)** | Renders immediately from `AuthContext` cached session | Reads cached metadata from IndexedDB (`db.getQuizMetadataCache()`) with zero network block | Reads local history from IndexedDB (`db.ts`) in `< 15ms` | Launches offline-capable quizzes from cached question bank |
| **5. Admin User (`isAdmin === true`)** | Displays a subtle **`Admin Control`** chip (`ShieldAlert` icon) in the top header bar next to notifications | Standard personalized drill | Standard progress stats | Includes quick-edit or blueprint preview access |

---

## 5. Best Practices for React + Vite + Capacitor Android Implementation

### 5.1 Passing Pre-Selected Filters Across `HashRouter`
Because the app strictly uses `<HashRouter>` (`https://aklabx.github.io/MindFlow/#/dashboard`), tapping any **Subject Tile**, **Quick Action**, **Suggested Drill**, or **Important for SSC** card must navigate cleanly via `useNavigate()`:
```tsx
// Helper inside DashboardPage.tsx
const handleNavigateWithFilters = (
  partialFilters: Partial<InitialFilters>,
  mode: QuizMode = 'learning'
) => {
  navigateWithSpinner(ROUTES.QUIZ.CONFIG, {
    state: {
      initialFilters: {
        subject: [],
        topic: [],
        subTopic: [],
        difficulty: [],
        questionType: [],
        examName: [],
        examYear: [],
        examDateShift: [],
        tags: [],
        ...partialFilters,
      },
      initialMode: mode,
    },
  });
};
```
And in `src/features/quiz/components/QuizConfig.tsx` (line 67), update the initial state hook:
```tsx
const [filters, setFilters] = useState<InitialFilters>(
  (location.state as any)?.initialFilters || emptyFilters
);
```
*(Wait for `useNavSpinner` if needed: note that `useNavSpinner` currently only forwards `(path: string)`. Updating `useNavSpinner` to accept `(path: string, options?: NavigateOptions)` ensures `location.state` is preserved during transition!)*

### 5.2 Capacitor Android WebView Optimization
1. **Touch Responsiveness (`300ms` Delay Elimination & Tactile States):**
   - Apply `touch-manipulation select-none active:scale-[0.97] transition-transform duration-150` on all 6 Subject tiles, Quick Action cards, the `Start Drill` CTA, and `Important for SSC` cards.
2. **Hardware Back Button Compliance:**
   - When the user is on `/dashboard` (`ROUTES.DASHBOARD`), `useHardwareBackButton.ts` treats `/dashboard` as the authenticated root so pressing the Android hardware back button does not navigate back into `/login` or `/onboarding`.
3. **Zero Layout Shift (CLS = 0) During Metadata & Stats Hydration:**
   - Load `db.getQuizMetadataCache()` and `useProfileStats()` asynchronously without blocking the initial paint of the white card containers.
   - Reserve fixed heights for the 6-column Subject Strip (`min-h-[88px]`), `Today's Suggested Drill` (`min-h-[168px]`), and `Your Progress` (`min-h-[168px]`).
4. **Tailwind JIT Safe Color Maps:**
   - Define static lookup objects for the 6 Subject colors and 4 Quick Action badges (e.g., `bg-amber-50 text-amber-600`, `bg-blue-50 text-blue-600`, etc.) rather than string interpolation (`bg-${color}-50`) so Vite's production build never purges the classes.

---

## 6. Component Decomposition Blueprint (Recommended File Structure)

When your developer team implements this redesign, splitting the dashboard into focused, memoized sub-components will keep `DashboardPage.tsx` clean and maintainable:

```
src/
 ├── pages/
 │    └── DashboardPage.tsx                  # Main orchestrator, hooks into useAuth, useProfileStats, & metadata cache
 └── features/
      └── dashboard/
           ├── components/
           │    ├── DashboardHeader.tsx      # Greeting, SSC target badge, Streak pill, Notification & Avatar
           │    ├── SubjectStrip.tsx         # 6-column SSC GK subject tiles + "View All" action
           │    ├── QuickActionsGrid.tsx     # 4 white elevated quick-action cards
           │    ├── SuggestedDrillCard.tsx   # Left split card: "Today's Suggested Drill" + "Start Drill" CTA
           │    ├── UserProgressCard.tsx     # Right split card: "Your Progress" SVG accuracy ring + telemetry
           │    └── ImportantForSscStrip.tsx # "Important for SSC" high-yield PYQ topic cards + "View All"
           └── constants/
                └── sscDashboardConfig.ts    # Static subject definitions, color tokens, and curated SSC high-yield topics
```

---

## 7. Pre-Implementation Checklist for Developer Verification

- [ ] **Visual Parity:** Soft lavender-slate gradient background with crisp white (`#FFFFFF`) `rounded-2xl` elevated cards across all 5 tiers.
- [ ] **Subject Strip:** All 6 core SSC GK subjects (*History, Polity, Geography, Economy, Science, Static GK*) displayed in a 6-column row with custom icons and a working **`View All`** button.
- [ ] **Quick Actions:** Clean white cards with icon badges, titles, subtitles, and 1-tap navigation to Mock/PYQ, Custom Quiz, English/Vocab, and Bookmarks.
- [ ] **Smart Insight Split Row:** **`Today's Suggested Drill`** card paired side-by-side with **`Your Progress`** circular accuracy gauge card.
- [ ] **Important for SSC Strip:** High-weightage SSC topic cards with subject pills, PYQ counts, and a **`View All`** button.
- [ ] **Dynamic Data Wiring:** `useProfileStats` connected to real IndexedDB/Supabase history and `useNavSpinner` updated to forward `NavigateOptions` (`state`) to `QuizConfig`.
