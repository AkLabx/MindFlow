# MindFlow Architecture & Knowledge Audit

## Executive Summary

MindFlow is a highly mature, feature-rich educational platform built on React, Vite, Capacitor, and Supabase. The project has successfully navigated complex architectural challenges, notably implementing a robust **Offline-First Quiz Engine** backed by IndexedDB and an **Asynchronous AI Ingestion Pipeline** powered by Supabase `pgmq` and Edge Functions.

### System Strengths
- **Modular Design:** The strict feature-based directory structure (`src/features/*`) prevents codebase degradation.
- **Resilience:** The application is built for unreliable networks. The offline-first design and idempotent background workers ensure data integrity.
- **Advanced Navigation:** The Policy-Driven `NavigationManager` is a sophisticated, scalable approach to routing and authorization compared to traditional React guard wrappers.

### Current Weaknesses & Immediate Priorities
- **UI Blocking & Hydration:** The heavy reliance on IndexedDB for delta-syncing massive amounts of metadata on the main thread is a bottleneck for mobile performance.
- **Tightly Coupled State:** The quiz engine's Zustand stores and persistence services are tightly intertwined, making testing and refactoring difficult.
- **Auth Mutex Instability:** The application relies on a monkey-patch (8-second timeout) to prevent Supabase `gotrue-js` from locking the app during network drops.

### Architectural Maturity
MindFlow exhibits a high level of architectural maturity. The foundational decisions—such as shifting from synchronous AI API calls to an asynchronous queue, and moving from boolean auth flags to a formal Bootstrap State Machine—demonstrate a deep understanding of distributed systems and mobile app constraints. The immediate focus should be on optimizing client-side performance (Web Workers, Zustand selectors) and addressing technical debt (missing indexes, admin bundle splitting).

---

## Documentation Index

Please consult the following documents for deep dives into specific areas of the architecture:

### Part 1: System Overview
- [01. High-Level Architecture](01-high-level-architecture.md)
- [02. Frontend Architecture](02-frontend.md)
- [03. Backend Architecture](03-backend.md)

### Part 2: Data & Features
- [04. Database Architecture](04-database.md)
- [05. Data Flow](05-data-flow.md)
- [06. Feature Inventory](06-feature-inventory.md)

### Part 3: Deep Dives & Audits
- [07. Session System (Quiz Engine)](07-session-system.md)
- [08. Performance Audit](08-performance-audit.md)
- [09. Security Audit](09-security-audit.md)
- [10. Reliability & Resilience](10-reliability.md)

### Part 4: Developer Guidelines & Risks
- [11. Code Quality](11-code-quality.md)
- [12. Developer Experience](12-developer-experience.md)
- [13. Hidden Knowledge & Tribal Assumptions](13-hidden-knowledge.md)
- [14. Architecture Risks](14-architecture-risks.md)

### Part 5: Future & Onboarding
- [15. Improvement Roadmap](15-improvement-roadmap.md)
- [16. Developer Onboarding Guide](16-developer-onboarding.md)
