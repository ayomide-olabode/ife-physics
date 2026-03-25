# ETL Rehearsal Workflow (PostgreSQL -> MySQL)

This project uses `scripts/etl/rehearsal.js` for non-production ETL rehearsal.

## Scope

- Read-only extraction from PostgreSQL
- Transform/validation in Node.js
- Ordered load into MySQL (or dry-run validation only)
- Artifacted reports and reject files

## Safety

- Default mode is dry-run (`ETL_DRY_RUN=true`)
- Rejects fail by default (`ETL_FAIL_ON_REJECTS=true`)
- Target emptiness enforced by default (`ETL_REQUIRE_EMPTY_TARGET=true`)
- No silent row drops
- Rehearsal fails if any target business table is not covered in `scripts/etl/plan.js`

## Commands

```bash
npm run etl:rehearsal:dry
npm run etl:rehearsal:load
```

Artifacts are written to `artifacts/etl/<run_id>/`.
