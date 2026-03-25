# PostgreSQL -> MySQL ETL Rehearsal Tooling

This folder contains rehearsal-focused ETL tooling for migrating data from PostgreSQL (source) to MySQL (target) in the approved domain order.

## Safety defaults

- Dry-run is enabled by default (`ETL_DRY_RUN=true`)
- Rejects fail the run by default (`ETL_FAIL_ON_REJECTS=true`)
- Target emptiness is required by default (`ETL_REQUIRE_EMPTY_TARGET=true`)
- No rows are silently discarded; rejects are written to artifact files.
- Runs fail if target schema has tables not listed in `scripts/etl/plan.js` (except `_prisma_migrations`).

## Environment variables

- `ETL_SOURCE_PG_URL` (required): read-only PostgreSQL source URL
- `ETL_TARGET_MYSQL_URL` (optional): MySQL target URL; falls back to `DATABASE_URL`
- `ETL_SOURCE_SCHEMA` (default `public`)
- `ETL_BATCH_SIZE` (default `500`)
- `ETL_DRY_RUN` (default `true`)
- `ETL_FAIL_ON_REJECTS` (default `true`)
- `ETL_REQUIRE_EMPTY_TARGET` (default `true`)
- `ETL_ARTIFACT_DIR` (default `artifacts/etl`)
- `ETL_START_TABLE` (optional; only supports first table for safety)

## Run

```bash
node scripts/etl/rehearsal.js --help
node scripts/etl/rehearsal.js
```

For an actual local rehearsal load (non-production only):

```bash
ETL_DRY_RUN=false node scripts/etl/rehearsal.js
```

## Artifacts

Every run writes under `artifacts/etl/<run_id>/`:

- `run-config.json`: effective config (credentials redacted)
- `logs/run.log`: timeline log
- `extracts/<Table>.ndjson`: extracted source rows per table
- `reports/source-counts.json`: source row counts per table
- `reports/<Table>.summary.json`: per-table valid/reject/load counts
- `reports/rejects/<Table>.ndjson`: rejected/problem rows with reasons
- `reports/case-collision-report.json`: case-insensitive unique collision report
- `reports/normalization-report.json`: JSON/datetime normalization counters
- `reports/post-load-counts.json`: source vs target counts (non-dry runs)
- `run-summary.json`: overall status and failure details

## Replayability

- Re-run safely by resetting local MySQL and running the same command.
- Optional `--runId=<id>` allows deterministic artifact naming.

## Reset guidance (local disposable only)

```bash
npm run db:reset
npx prisma migrate deploy
```
