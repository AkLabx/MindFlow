# MindFlow Architecture Documentation

Welcome to the canonical architectural reference for MindFlow. This documentation is generated and maintained to provide clear, actionable insights into the codebase structure, state management, routing, and developer workflows.

## Table of Contents

1. [Repository Architecture](./REPOSITORY_ARCHITECTURE.md) - High-level system design and key philosophies.
2. [Folder Structure](./FOLDER_STRUCTURE.md) - Deep dive into top-level directories and their purposes.
3. [Component Map & Dependency Graph](./COMPONENT_MAP.md) - How layouts, guards, and views communicate.
4. [Routing & Navigation](./ROUTES.md) - Comprehensive route mapping and navigation policies.
5. [Authentication Flow](./AUTHENTICATION.md) - End-to-end auth orchestration.
6. [State Management](./STATE_MANAGEMENT.md) - Zustand stores, Contexts, and IndexedDB caching.
7. [Feature Index](./FEATURES.md) - Modular domain boundaries (`src/features/*`).
8. [Services & Shared Utilities](./SERVICES.md) - API integrations and global hooks.
9. [File Index](./FILE_INDEX.md) - Categorized breakdown of critical, feature, and UI files.
10. [Dead Code Analysis](./DEAD_CODE_ANALYSIS.md) - Findings on unused exports and unreachable code.
11. [Contributing Guidelines](./CONTRIBUTING_ARCHITECTURE.md) - Code style, PR requirements, and architecture scaling rules.

## Auto-Generated Codebase Metrics

*(Snapshot at time of generation)*

- **Total Files:** 512
- **Total Folders:** 165
- **Total Routes:** 97
- **Total React Components:** 272
- **Total Contexts:** 2
- **Total Hooks:** 79
- **Total Services:** 28

## Core Principles

- **Feature-Sliced Design (FSD):** Code is modularized into `/features` strictly.
- **Strict Hydration & Caching:** Offline-first caching with IndexedDB delta sync.
- **Idempotency:** UI actions and background queues strictly handle duplicate inputs safely.
- **Enterprise Native Routing:** Hardware back-button intercepts ensure precise navigation state tracking outside standard React Router memory.
- [Future Refactor Blueprint](./FUTURE_REFACTOR_BLUEPRINT.md) - A clean, 5-layer architectural target.
