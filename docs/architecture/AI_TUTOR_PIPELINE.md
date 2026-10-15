# AI Tutor Pipeline Architecture

The AI Tutor uses a dual-stage architecture to provide grounded, reliable, and high-quality educational explanations.

## Overview

The pipeline is split into two independent stages:

1.  **Stage 1: Grounding Layer (Optional Enrichment)**
    *   **Purpose:** Fetches recent news and context using Google Search grounding.
    *   **Isolation:** This stage is completely independent of the generation scheduler. It uses its own dedicated API key and model.
    *   **Failure Handling:** If Stage 1 fails (due to quota, unsupported model, timeout, etc.), it logs the failure but gracefully falls back to `"No recent news available."` and continues to Stage 2. It **never** poisons the scheduler's health metrics.
2.  **Stage 2: Generation Layer (Core Scheduler)**
    *   **Purpose:** Uses the context from Stage 1 (or the fallback) to generate the final educational explanation.
    *   **Scheduler:** Relies on the `get_execution_plan` database RPC to cycle through healthy API keys and models (e.g., `gemini-3.1-flash-lite`).
    *   **Health Tracking:** Failures in Stage 2 correctly report back to the database (`reportExecution`), updating `health_score` and `rpd_exhausted` quotas.

## Configuration

### Stage 1 (Grounding) Configuration

Stage 1 is configured entirely via Supabase Edge Function Secrets. No code changes are required to rotate keys or update models.

*   `GROUNDING_API_KEY`: The dedicated Gemini API key used *only* for the Grounding stage. It should ideally be linked to a Google Cloud Project with Grounding capabilities enabled.
*   `GROUNDING_MODEL`: The model to use for grounding (e.g., `gemini-2.5-flash` or `gemini-3.8-flash`).

**How to change the Grounding model or rotate the key:**
Update the secrets in your Supabase dashboard or via the CLI and restart the function if necessary.
```bash
supabase secrets set GROUNDING_API_KEY=new_key GROUNDING_MODEL=gemini-2.5-flash
```

## Why is Stage 1 Isolated?
Google Free Tier often restricts the `googleSearch` tool to specific legacy models (like older `gemini-2.5-flash` deployments) or requires a paid billing account. By isolating the Grounding layer to a single configurable secret (`GROUNDING_API_KEY`), administrators can point Grounding to a specific capable Google Cloud Project without affecting the main generation pool, which freely rotates among newer models (`gemini-3.1-flash-lite`) using the primary scheduler.
