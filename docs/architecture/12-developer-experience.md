# 12. Developer Experience (DX)

## Overview
MindFlow is optimized for rapid iteration using Vite, but requires specific institutional knowledge regarding ports, routing, and database setup.

## Local Environment Setup
1. **Local Server:** The Vite development server is hardcoded to run on **Port 3000** (`http://localhost:3000/`), *not* the Vite default of 5173. Automation scripts and Playwright must target this port.
2. **Database:** Supabase must be linked and migrations applied. A local Supabase instance or a dedicated staging remote project is required.
3. **Environment Variables:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be provided via `.env`.

## Build & Deployment
- **Command:** `npm run build` runs `tsc && vite build`.
- **Target Environments:**
  - **Web (GitHub Pages):** Built with `VITE_BASE_URL=/MindFlow/`. Uses a custom `404.html` script to redirect SPA URLs into HashRouter format.
  - **Native (Capacitor):** Built with base `/` and synced to Android (`npx cap sync android`).
- **Version Management:** `VITE_APP_VERSION` is dynamically evaluated from `package.json`. Running `npm version patch --no-git-tag-version` automatically updates this across the app.

## Testing & Automation
- **Unit Testing:** Executed via `npx vitest --run`. The standard `npm test` is not configured.
- **Type Checking:** Executed via `npx tsc --noEmit`.
- **Visual/E2E Testing:** Playwright is used for visual verification. **Rule:** When verifying authenticated routes (e.g., `#/dashboard`), scripts must first navigate to the root login page, fill in credentials, and submit to bypass the `NavigationManager` redirect.

## Mobile Development (Capacitor)
- Native dependencies require bypassing npm peer conflicts using `--legacy-peer-deps` during installation.
- Capacitor apps bypass the public Landing Page (`/`) and default directly to `/login` for unauthenticated users.

## Guidelines for AI-Assisted Workflows
- **Code Generation:** Do not introduce duplicate components. Reuse existing `src/components/ui/` primitives.
- **Styling:** Keep styling responsive (Flexbox/Grid). Avoid hardcoded widths or fixed pixel assumptions. Avoid negative margins on full-viewport unauthenticated pages (use `min-h-[100dvh] w-full` with positive padding).
- **Modifying Pipelines:** Follow a "backend-first" approach. Establish system correctness, reliability, and observability (e.g., instrumenting raw duration times for uploads) in Supabase before adding complex UI progress bars.
