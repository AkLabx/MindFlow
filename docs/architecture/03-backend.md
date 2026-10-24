# 3. Backend Architecture

## Overview
MindFlow is entirely serverless, relying on Supabase for its backend infrastructure. There is no traditional monolithic Node.js or Python backend. Instead, business logic is distributed across PostgreSQL (Schema, RPCs, Triggers), GoTrue (Auth), and Deno-based Edge Functions.

## Authentication & Authorization Flow
- **Authentication:** Managed by Supabase GoTrue. Supports Email/Password and Google OAuth. Guest login is explicitly prohibited.
- **Bootstrapping:** The client uses `useAppBootstrap` to verify session existence with strict timeouts (8 seconds) to prevent `gotrue-js` mutex deadlocks.
- **Authorization Model:** Row Level Security (RLS) policies within PostgreSQL enforce access control.
  - Users can only read/write their own data (`auth.uid() = user_id`).
  - Specific administrative tables (e.g., AI configuration, content ingestion) restrict access based on administrative roles or specific user UUIDs.

## Edge Functions
Edge Functions (written in TypeScript/Deno and located in `supabase/functions/`) handle orchestration, third-party API integration, and heavy background tasks.
Notable functions include:
- `ask-ai-tutor`: Handles synchronous AI explanations. Uses a two-stage pipeline (Grounding -> Generation) to avoid Free Tier Quota errors with Gemini models.
- `enrich-questions`: A background worker consuming from a Postgres queue (`pgmq`). It pulls raw question data, invokes LLMs (Gemini-3.1-flash-lite) to extract taxonomy, translation, and research context, and saves the enriched data back to the database.
- `chat-ai`, `tts-gateway`, `push-notifications`: Handles specific external integrations.

## Business Logic Organization
1. **PostgreSQL RPCs (Remote Procedure Calls):** Used for complex transactional logic that requires atomicity, such as finalizing a quiz session, cloning a shared quiz, or calculating analytics.
2. **PostgreSQL Triggers:** Used to automatically update `updated_at` timestamps or maintain derived data.
3. **Queue Workers (pgmq):** Asynchronous tasks like document parsing, OCR, and AI enrichment are offloaded to message queues. This ensures rate limits are respected. Edge functions acting as queue consumers are strictly idempotent.

## Validation Strategy
- **Frontend:** Handled by React components ensuring required fields before submission.
- **Database (Primary):** Strong schema enforcement. PostgreSQL constraints (NOT NULL, foreign keys, CHECK constraints) act as the final, absolute source of validation.
- **AI Pipelines:** The enrichment pipeline defines strict JSON schemas for LLM outputs. Responses that fail schema validation are retried using exponential backoff before being marked as `FAILED`.

## Error Handling & Logging
- **Database Level:** RPCs return structured error payloads or throw SQL exceptions caught by the client.
- **AI Edge Functions:** Infrastructure errors (e.g., 429 Rate Limits, 503 Service Unavailable) update the `pgmq` visibility timeout (`vt`) to trigger an exponential backoff retry. Permanent failures (bad JSON schema) mark jobs as `FAILED` and move them to a Dead Letter Queue (`enrichment_dlq_archive`).
- **Telemetry:** AI pipelines record comprehensive telemetry in an `ai_metadata` JSONB column, tracking pipeline version, token metrics, retry counts, and the specific model used.

## Background Jobs & Capacity Control
Queue-driven functions implement an "Admission Controller" pattern. Before fetching jobs from `pgmq`, the edge function executes `get_execution_plan` to verify capacity (e.g., checking for healthy models and enforcing global RPM limits). `batch_size` for enrichment tasks is strictly set to `1` to prevent parallel exhaustion of rate limits.

*Confidence:* Confirmed via memory guidelines, Supabase migration files (`enrichment_admin_control_center.sql`), and Edge Function architecture (`docs/architecture/AI_TUTOR_PIPELINE.md`).
