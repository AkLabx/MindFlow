# System Log Cleanup Pre-Flight Snapshot

**Date:** 2026-10-13
**Timestamp:** 16:11:00 UTC

## Current Metrics
- `net._http_response` Row Count: 470
- `net._http_response` Estimated Size: 144 MB
- `cron.job_run_details` Row Count: 363,885
- `cron.job_run_details` Estimated Size: 136 MB

## Configuration & Expectations
- **HTTP Log Retention:** 7 days
- **Cron Log Retention:** 7 days
- **Scheduled Cron Job Name:** `maintenance-prune-system-logs`
- **Schedule:** `0 3 * * *` (Daily at 03:00 AM UTC)

## Expected Outcome
- `net._http_response`: Expected to delete 470 rows. Remaining: 0.
- `cron.job_run_details`: Expected to delete 360,154 rows. Remaining: ~3,731.

## Pre-Flight Baseline
- `public.questions`: 9,184 rows
- `public.synonym`: 1,345 rows
- `public.reels`: 13 rows

## Execution Results (Manual Run)
- **Status**: success
- **Timestamp**: 2026-10-13T16:32:38.782026+00:00
- **HTTP Rows Deleted**: 470
- **Cron Rows Deleted**: 360,160
- **Execution Time**: 21,113.12 ms (approx 21.1 seconds)

## Post-Flight Check
- `public.questions`: 9,184 rows (Match: TRUE)
- `public.synonym`: 1,345 rows (Match: TRUE)
- `public.reels`: 13 rows (Match: TRUE)

## Post-Flight Metrics
- `net._http_response` Row Count: 0
- `net._http_response` Estimated Size: 4,296 kB (Wait for autovacuum)
- `cron.job_run_details` Row Count: 3,731
- `cron.job_run_details` Estimated Size: 136 MB (Wait for autovacuum)
