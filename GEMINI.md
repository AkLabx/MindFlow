# MindFlow Cold-Start Entrypoint (GEMINI.md)

Welcome, AI Pair Programmer! This repository operates on an automated **"1 Chat = 1 Version"** autonomous workflow governed by [`AGENTS.md`](./AGENTS.md) and the [`version-ritual`](./.agents/skills/version-ritual/SKILL.md) skill.

To prevent context bloat, hallucinations, and token waste, you MUST strictly follow the Cold-Start Reading Protocol below.

---

## ⚡ Cold-Start Reading Order (<20 KB Hot Context)

When a fresh chat session begins, read ONLY these files in exact numerical order:

1. **Read FIRST (The Live Handover Baton):**
   👉 [`docs/handovers/CURRENT_HANDOVER.md`](./docs/handovers/CURRENT_HANDOVER.md)
   *Contains current verified baseline, workstation port rules, execution brief for the target version, and the closeout checklist.*

2. **Read SECOND (Master Decision Ledger & Invariants):**
   👉 [`docs/DECISIONS_MASTER.md`](./docs/DECISIONS_MASTER.md)
   *Contains active Do-Not-Break Invariants (Table 1) and Superseded Decisions to NEVER revive (Table 2).*

3. **Read THIRD (Active Roadmap Increment):**
   👉 [`docs/blueprint/v1.0_blueprint.md`](./docs/blueprint/v1.0_blueprint.md)
   *Contains the current 10-step milestone roadmap and active release targets.*

---

## ⛔ ON-DEMAND ONLY (Do NOT Read on Cold Start)

The following files are historical archives. **NEVER load them into context on session startup**:
- Historical Version Dossiers: `docs/versions/*`
- App Journey Changelog: `docs/APP_JOURNEY_LOG.md` (Read only when appending an entry during Phase 4 closeout).
- Architecture Decision Records: `docs/ADR/*`
- Historical Audit Reports: `docs/audit/*`, `docs/*AUDIT*.md`

---

## 🎯 Mandatory Execution Rules

1. **Governing Constitution & Rules:** Strictly obey [`AGENTS.md`](./AGENTS.md) and [`docs/MINDFLOW_CONSTITUTION.md`](./docs/MINDFLOW_CONSTITUTION.md).
2. **Circuit Breakers:** STOP and ask the user before touching >10 files, adding npm packages, altering DB schemas, or modifying auth flows.
3. **Cognitive Pre-Flight:** Simulate lifecycles, identify 3 runtime failure modes, and strictly reject cosmetic fake stubs/mocks.
4. **The Closeout Rule:** No chat session ends with "I'm done". You MUST execute all 7 steps of the Phase 4 closeout ritual in [`version-ritual`](./.agents/skills/version-ritual/SKILL.md) and overwrite `docs/handovers/CURRENT_HANDOVER.md`.
