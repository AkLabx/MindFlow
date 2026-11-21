# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.366`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Host: `D:\MindFlow-main`)
- **Git Status:** Clean (`origin/main` synchronized post-merge)
- **Static Typecheck:** Passed (0 errors via `npx.cmd tsc --noEmit`)
- **Production Build:** Verified cleanly via `npx.cmd vite build`
- **Active Generation & Milestone:** Generation 1 (v1.0.x), **Milestone 9: Social Chatroom Voice Note Waveform Visualization & Offline Queue Delivery**

---

## 2. Workstation & Runtime Testing Rules

- **Deterministic Slot & Port Architecture:**
  - **Slot 1 (Anchor / Host: `D:\MindFlow-main`):** Port `3000` (`http://localhost:3000/`) — Sole owner of `main`.
  - **Slot 2 (Worker 1):** Port `3001` (`http://localhost:3001/`) — Secondary session.
  - **Slot 3 (Worker 2):** Port `3002` (`http://localhost:3002/`) — Tertiary session.
- **Windows Command Runner Protocol:**
  - Use `npx.cmd` or `./node_modules/.bin/<tool>.cmd` on Windows shells to prevent PowerShell script execution policy errors.
  - Dev server startup: `npm run dev` (in Slot 1) or `npm run dev -- --port 3001` (in Worker 1).
- **Vite HMR Zero-Commit Live Preview:**
  - Vite hot-reloads edits on disk in milliseconds. AI agents and developers do NOT need to commit to git to preview or verify UI changes.
- **Android Native Feel Directives (Non-Negotiable):**
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), zero web-like layout bounce, `<KeyboardAwareBottomBar>` keyboard accommodation, and native-style bottom sheets.

---

## 3. Pre-Planned Execution Brief for Next Version (v1.0.367)

- **Target Version:** `v1.0.367`
- **Target Branch:** `feat/v1.0.367-chat-voice-waveform-offline-queue`
- **Objective:** Milestone 9 Execution — Social Chatroom Voice Note Live Waveform Visualizer & Offline Message Queue Sync.
- **Scope & Deliverables:**
  1. *Realtime Audio Waveform Visualizer:* Replace static voice recording pill with dynamic audio amplitude canvas/SVG visualizer during live microphone recording in `VoiceNoteRecorder.tsx` / `ChatInputBar.tsx`.
  2. *Offline Chat Queue via Dexie IndexedDB:* Ensure newly sent messages are optimistically rendered with clock icon, stored in IndexedDB, and automatically synced to Supabase when connectivity restores.
  3. *Unread Message Realtime Counter Badges:* Update room list unread badges instantaneously via Supabase Realtime channel subscription without requiring page refresh.
- **Invariants to Protect:**
  - Preserve 450ms long-press and direction-locked swipe-to-reply ($|\Delta Y| > |\Delta X|$) established in `DEC-0012`.
  - Maintain MindFlow Indigo/Violet theme system (`DEC-0011`).
  - Keep offline-first 0ms render invariant (`DEC-0004`).

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.367.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark completed deliverables in `docs/blueprint/v1.0_blueprint.md`.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and next milestone brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read the Hot Context:
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active milestone in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.367).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vite build) and test live on http://localhost:3000/.
6. Execute the mandatory 7-step Phase 4 closeout ritual, overwrite CURRENT_HANDOVER.md with the next baton, and output the starter prompt for v1.0.368.
```
