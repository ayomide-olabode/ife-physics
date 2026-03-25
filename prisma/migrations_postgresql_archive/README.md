# PostgreSQL Migration History Archive

This directory stores the original Prisma migration folders created while the datasource provider was PostgreSQL.

- These SQL files are preserved for audit/history reference only.
- They are not part of the active MySQL migration lineage.
- Do not replay these migrations against MySQL/MariaDB.

Active migrations for MySQL live in `prisma/migrations/` and should begin from a fresh baseline generated from the current `prisma/schema.prisma`.
