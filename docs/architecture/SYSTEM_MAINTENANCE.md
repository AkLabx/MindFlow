# System Maintenance Architecture

## Internal Log Pruning

Supabase heavily utilizes internal PostgreSQL extensions like `pg_net` and `pg_cron`. Over time, these extensions accumulate execution and response logs that can consume significant disk space (hundreds of megabytes to gigabytes) if left unchecked.

### Managed Tables

The following tables are actively pruned by the automated maintenance system:

1.  **`net._http_response`**
    *   **Owner:** `pg_net` extension.
    *   **Purpose:** Logs HTTP responses for asynchronous network requests made directly from the database (e.g., triggering Edge Functions or webhooks).
    *   **Safe to Prune:** Yes. The application does not read from this table. It exists purely for debugging outbound HTTP requests.

2.  **`cron.job_run_details`**
    *   **Owner:** `pg_cron` extension.
    *   **Purpose:** Logs execution metrics (start, end, status) for all scheduled database cron jobs.
    *   **Safe to Prune:** Yes, conditionally. The application dashboard metrics (`get_enrichment_dashboard_metrics` and `v2`) query this table to determine the `last_success_minutes` and `consecutive_failures` of the AI enrichment pipeline. Therefore, we must retain recent logs (e.g., the last 7 days) to ensure the dashboard accurately reflects current pipeline health.

### Cleanup Strategy

*   **Idempotent Function:** A securely definer function `maintenance.prune_system_logs()` handles the cleanup.
*   **Configurable Retention:** The function accepts arguments for HTTP log retention days (default 7) and Cron log retention days (default 7).
*   **Batched Deletion:** To prevent exclusive lock escalation and reduce Write-Ahead Logging (WAL) bloat, the function deletes rows in small chunks (default 5,000 rows per loop) rather than a single massive `DELETE` statement.
*   **Observability:** The function returns a JSON object detailing exactly how many rows were deleted and how long the operation took.
*   **Automation:** A nightly `pg_cron` job (`maintenance-prune-system-logs`) runs at 03:00 UTC.

### Storage Reclamation

PostgreSQL uses Multi-Version Concurrency Control (MVCC). A `DELETE` statement marks a row as "dead" but does not immediately free the disk space back to the operating system.
*   **Autovacuum:** Supabase's built-in `autovacuum` daemon periodically sweeps these tables, marking the dead space as reusable for future log entries. This prevents the tables from growing indefinitely.
*   **VACUUM FULL:** We strictly avoid scheduling `VACUUM FULL` automatically. `VACUUM FULL` requires an `ACCESS EXCLUSIVE` lock, blocking all reads and writes, and rewrites the entire table. This is dangerous for production systems and is only recommended as a manual intervention during a planned maintenance window if absolutely necessary.

## Modifying Retention Policy

To modify the retention policy, you do not need to alter the PL/pgSQL function itself. You only need to update the cron schedule definition to pass different arguments.

Run this SQL on your Supabase project:

```sql
SELECT cron.unschedule('maintenance-prune-system-logs');

-- Arguments: p_retention_http_days, p_retention_cron_days, p_batch_size
SELECT cron.schedule(
    'maintenance-prune-system-logs',
    '0 3 * * *',
    'SELECT maintenance.prune_system_logs(14, 14, 5000);'
);
```

## Troubleshooting Guide

### Issue: The Cron Job Stopped Working
1. **Check if pg_cron is running:** Verify the extension is active (`CREATE EXTENSION pg_cron;`).
2. **Check Cron Logs:** View `cron.job_run_details` for the specific job `maintenance-prune-system-logs` to see the error message.
3. **Common Causes:**
   - The `maintenance` schema was dropped.
   - The `prune_system_logs` function was accidentally deleted.

### Issue: Logs are Still Growing (Table Size Not Shrinking)
Because we avoid `VACUUM FULL`, the *physical file size* reported by `pg_size_pretty(pg_total_relation_size('net._http_response'))` may not shrink immediately after the cron job runs.
1. **Verify Deletions:** Check `cron.job_run_details` to confirm the function returned a JSON object with `http_rows_deleted > 0`.
2. **Wait for Autovacuum:** PostgreSQL will mark the space as reusable in the background. The size will stop *growing*, even if it doesn't shrink.
3. **Emergency Storage Reclamation:** Only if the disk is critically full, schedule a maintenance window and manually execute `VACUUM FULL net._http_response;` or `VACUUM FULL cron.job_run_details;`. This will lock the tables entirely while rewriting them.

## Deep Dive: PostgreSQL Storage, MVCC, and Vacuuming

When monitoring the Supabase Storage dashboard after a massive cleanup, you might notice that the reported size of a table (e.g., `cron.job_run_details`) does not decrease, even after deleting hundreds of thousands of rows. This is normal and expected behavior due to PostgreSQL's architecture.

### MVCC (Multi-Version Concurrency Control)
PostgreSQL does not update or delete data in place. When a row is updated or deleted, the old version of the row is left on disk but marked as "dead" (invisible to new transactions). This allows concurrent read and write operations without blocking each other.

### Definitions and Behaviors

*   **`DELETE`**: Marks rows as dead tuples. It does *not* erase the data from the hard drive or shrink the physical file.
*   **`VACUUM`**: Scans tables for dead tuples and marks their physical disk space as "Free Space" available for future `INSERT` or `UPDATE` operations within that same table. It does *not* return space to the operating system or shrink the file (unless the free space is perfectly aligned at the very end of the file).
*   **`AUTOVACUUM`**: A background daemon in PostgreSQL that automatically runs `VACUUM` and `ANALYZE` when tables accumulate a certain threshold of dead tuples. In Supabase, this handles 99% of routine maintenance.
*   **`VACUUM FULL`**: Rewrites the entire contents of a table into a brand new, optimally packed file, then deletes the old file. This immediately shrinks the file size and returns space to the OS.

### Why We Avoid `VACUUM FULL` in Production
`VACUUM FULL` acquires an **`ACCESS EXCLUSIVE`** lock on the table. This means *all* reads and writes to that table are completely blocked until the operation finishes. For large tables, this can cause major application outages. Therefore, we rely on standard `autovacuum` to manage free space.

### Case Study: `cron.job_run_details`
During an initial cleanup, over 360,000 rows were deleted from `cron.job_run_details`, leaving about 3,700 recent logs. The physical file size remained at ~136 MB.
Because `autovacuum` ran immediately after, the file is now 99% empty "Free Space." Future cron job logs will be written into this existing 136 MB allocation. The table has stopped growing unbounded, which is the primary goal of the maintenance script.

## Storage Investigation Playbook

If you suspect a storage issue or an autovacuum failure, do not blindly run destructive commands. Use these read-only diagnostic queries first.

**1. Verify Current Row Count and Date Range**
```sql
SELECT COUNT(*) FROM cron.job_run_details;
SELECT MIN(start_time), MAX(start_time) FROM cron.job_run_details;
```

**2. Check Actual Relation Size (Physical File Size)**
```sql
SELECT
  pg_size_pretty(pg_relation_size('cron.job_run_details')) AS relation_size,
  pg_size_pretty(pg_total_relation_size('cron.job_run_details')) AS total_size_with_indexes;
```

**3. Check Autovacuum Health and Dead Tuples**
```sql
SELECT
  n_live_tup,
  n_dead_tup,
  last_autovacuum,
  last_vacuum
FROM pg_stat_user_tables
WHERE relname='job_run_details';
```
*If `n_dead_tup` is massive and `last_autovacuum` is old, the autovacuum daemon might be struggling to keep up with the churn rate.*
