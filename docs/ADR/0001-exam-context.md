# ADR 0001: Exam-First Architecture & Canonical Exam Registry

* **Status:** Accepted
* **Date:** 05 November 2026
* **Deciders:** Product Architect, Staff Frontend Engineer, Database Architect
* **Consults:** [MindFlow Constitution](../MINDFLOW_CONSTITUTION.md) (Commandments 1, 2, 8)

---

## Context & Problem Statement
MindFlow's question database contains over 10,000 questions where the `examName` column is populated inconsistently from bulk PDF imports (e.g., 2,512 rows stored as `'CGL PRE'`, 5 rows stored as `'SSC CGL'`, and BPSC questions fragmented across 19 variants such as `'BPSC CSE PRE'`, `'BPSC TRE2'`, `'BPSC AEDO'`).

Previously, the dashboard pushed users through subject-first entry points, requiring repeated manual exam selection on every quiz configuration. Furthermore, students preparing for multiple exams (e.g. SSC CGL + RRB NTPC) experienced state conflicts and empty filter intersections.

## Decision Drivers
* Reduce time-to-first-question from $> 45\text{s}$ (6 configuration steps) to $< 5\text{s}$ (1 tap).
* Establish a canonical mapping layer between user-facing exam brands and raw database strings without destructive database schema migrations.
* Support multi-exam aspirants who switch between or combine target exams.

## Considered Options
1. *Database Data Migration:* Overwrite all 10,000 rows in Supabase to clean strings.  
   *(Rejected: Destructive database migration prohibited by AGENTS.md invariant; risks breaking external ingestion scripts).*
2. *Ad-Hoc String Matching in Components:* Each page regex-matching exam names independently.  
   *(Rejected: High code duplication, UI drift, and brittle regexes).*
3. *Canonical Exam Registry & Multi-Exam Context Store:* Centralized canonical mapping with aliases and persistent Zustand store.  
   *(Accepted).*

## Decision Outcome
Created `src/features/dashboard/constants/examRegistry.ts` defining `CANONICAL_EXAMS`, each mapping to aliases (`dbExamNames`), badge styling, icons, and categories. Backed by `useExamContextStore` in `localStorage` managing `activeExamId` and `pinnedExamIds`.

### Positive Consequences
* Instant 1-tap express drills ("⚡ 25 Qs") from Dashboard Tier 1.5.
* Clean separation of presentation names (`SSC CGL`) from database rows (`CGL PRE`).
* Zero database mutation risk.

### Negative Consequences / Trade-offs
* New exams added to the database require entry in `examRegistry.ts` (mitigated by Tier-2 dynamic taxonomy plans in Section 10 of Audit).
