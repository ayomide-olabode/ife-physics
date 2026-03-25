# Codebase Overview

## 1. What this project is

This repository powers the Department of Physics and Engineering Physics website for OAU Ile-Ife.

It is a combined platform with:

- A **public website** for visitors (students, staff, alumni, external audience).
- A **role-based dashboard** for internal users to manage content and academic/research/staff records.

The project follows a single-source-of-truth model: public pages are rendered from database records managed through the dashboard.

## 2. Product at a glance

The system supports these major domains:

- **Home and communications**: hero news, news updates, events/opportunities, spotlight.
- **About**: history timeline, leadership, roll of honour, legacy gallery.
- **Academics**: undergraduate and postgraduate programme pages, study options, course listings.
- **Research**: research groups, focus areas, members, research outputs.
- **People**: staff directory by category and detailed staff profile pages.
- **Resources**: links/resources domain (partially under construction in current routes).
- **Admin/Governance**: users, roles, leadership terms, audit logs, profile visibility and status controls.

## 3. Technologies powering the codebase

### Core stack

- **Next.js 16 (App Router)** for routing, layouts, server components, and route handlers.
- **React 19 + TypeScript** for UI and typed application code.
- **Prisma + MySQL** for ORM and relational data modeling.
- **NextAuth (credentials provider)** for session-based authentication.
- **Tailwind CSS + shadcn/ui + Radix UI** for design system and primitives.
- **Zod** for server-side schema validation of action payloads.

### Notable supporting libraries

- **TipTap** for rich text editing.
- **dnd-kit** for drag-and-drop author ordering.
- **sanitize-html** for safe rendering of rich text content.
- **Nodemailer** for invite/reset email delivery (with console fallback mode when SMTP is absent).

## 4. High-level architecture

### App structure

- `src/app/`: file-system routes (public pages, dashboard pages, auth pages, API routes).
- `src/components/`: shared and domain UI components.
- `src/server/queries/`: dashboard/private read queries.
- `src/server/actions/`: dashboard/private mutations (server actions).
- `src/server/public/queries/`: public read queries with published/visibility filters.
- `src/lib/`: shared utilities (auth, RBAC, formatting, security helpers, mail, tokens).
- `prisma/schema.prisma`: full domain model.

### Rendering strategy

- Public pages are primarily server-rendered for low client-JS payloads.
- Client components are used where interactivity is needed (filters, carousels, forms, dialogs).
- Heavy editor functionality is lazy-loaded where possible (for example TipTap wrapper).

## 5. Public website features

### Home

- Featured hero carousel (welcome + featured news items).
- Programme highlights (Physics, Engineering Physics, SLT).
- Recent research outputs carousel.
- Latest news cards.
- Events/opportunities carousel with tabs (`All`, `Events`, `Opportunities`).

### About section

- **History**: database-driven timeline entries.
- **Leadership**: current HOD, coordinators, and past HODs.
- **Roll of Honour**: class-year grouped records loaded on demand.
- **Legacy Gallery**: paginated legacy entries with modal detail view.

### Academics

- Undergraduate and postgraduate programme pages by programme code.
- Section-based pages with sticky table-of-contents navigation.
- Course listings with metadata (units, semester, prerequisites, etc).
- Study option displays mapped from programme-to-option relationships.

### Research

- Research group detail pages with:
  - Hero/overview
  - Focus areas
  - Group scientists and past members
  - Searchable/filterable research output list with pagination/load-more

### People

- Category-specific staff listings:
  - Academic, Visiting, Emeritus, Technical, Support, Retired, In Memoriam
- Search + sorting + facet filters (rank, group, affiliation, alpha, former type).
- Individual staff profile pages with tabbed sections:
  - Bio
  - Research outputs
  - Projects
  - Teaching
  - Student theses
  - Tributes (for in-memoriam profiles)

### News and events browsing

- News index with query and month/year filters, pagination, and detail pages.
- Events/opportunities index with query and month/year filters.

## 6. Dashboard and role-based operations

### Core role model

- `SUPER_ADMIN`
- `EDITOR` (global)
- `ACADEMIC_COORDINATOR` (global role with programme + degree scope)
- `RESEARCH_LEAD` (scoped to research group)
- Staff ownership for self-managed profile records

### Dashboard modules

- **Profile**: every authenticated user can manage own profile data.
- **Communication** (`EDITOR`/superadmin): news, events/opportunities, spotlight.
- **Content** (`EDITOR`, current HOD, or superadmin): history, roll of honour, tributes, legacy gallery, resources.
- **Academics** (scoped coordinators, current HOD, or superadmin): programme pages, courses, study options.
- **Research** (scoped leads or superadmin): group management and group-linked outputs.
- **Admin** (superadmin): users, staff, secondary affiliations, leadership terms, audit logs.

### Content workflow

Many content models support lifecycle states:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Public queries enforce publish/visibility gating, while dashboard actions handle transitions and revalidation.

## 7. Data model overview

The Prisma schema includes:

- **Identity and auth**: `Staff`, `User`, `EmailToken`, `RoleAssignment`
- **People profile data**: research outputs, projects, teaching, theses, tributes
- **Research**: groups, memberships, focus areas, publications/outputs
- **Academics**: programmes, courses, requirement blocks, study options
- **Communications/content**: news, events/opportunities, spotlight, history, roll of honour, legacy gallery, resources
- **Governance**: leadership terms, HOD address, audit logs

Common modeling patterns:

- Soft-delete fields (`deletedAt`) across many tables.
- Indexed enum-based categorization.
- Explicit join tables for many-to-many relations (for example courses to study options).
- JSON fields for structured publication metadata (`authorsJson`, `metaJson`, `keywordsJson`).

## 8. Authentication, onboarding, and account lifecycle

- Login is credential-based with NextAuth JWT sessions.
- Invite and password-reset links use hashed tokens with expiration:
  - Invite: 60 minutes
  - Password reset: 30 minutes
- Resend cooldown is enforced (5 minutes).
- Mail delivery supports SMTP and a development console fallback.
- Login attempts include in-memory throttle backoff logic.

## 9. Security and safety mechanisms

- Role and scope checks are enforced in server actions and route guards.
- Rich HTML is sanitized before rendering (`sanitize-html` allowlist).
- Image uploads are validated by binary signature and size before persistence.
- Access-denied routes commonly return `notFound()` to avoid leaking details.
- Key mutations create `AuditLog` records with serialized snapshots.

## 10. Performance and cache behavior

- Public reads use targeted Prisma `select` blocks and pagination patterns.
- Public query helpers enforce common filters (`published`, `not deleted`).
- Mutations trigger `revalidatePath`/`revalidateTag` to keep public and dashboard views fresh.
- Interactivity-heavy parts are isolated in client components.

## 11. Notable advanced capabilities

- DOI metadata lookup via Crossref for research outputs.
- Staff-author auto-linking for structured author records.
- Drag-and-drop author order editing in publication workflows.
- Deep-linking from teaching records into public course pages.
- Dynamic research-group menu generation in public navigation.

## 12. Current in-progress/placeholder areas

Some routes are intentionally placeholder at the moment (for example parts of Spotlight and Resources public/dashboard rendering). Core people/research/academics/news/event flows are fully modeled and integrated.

## 13. Local development notes

- MySQL runs via `docker-compose.yml`.
- Prisma client generation runs during `dev`/`build` lifecycle scripts.
- PostgreSQL-era Prisma migration SQL is archived in `prisma/migrations_postgresql_archive/` and is not part of active lineage.
- Active migration lineage is a fresh MySQL baseline from current `prisma/schema.prisma`.
- Environment variables expected include:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `APP_URL` (used for invite/reset link generation)

## 14. Migration status (PostgreSQL -> MySQL)

- Prisma schema/provider now targets MySQL (`provider = "mysql"`).
- Active Prisma migration lineage is MySQL-only with baseline migration:
  - `prisma/migrations/20260325152837_mysql_baseline`
- PostgreSQL Prisma migrations are archived and inactive:
  - `prisma/migrations_postgresql_archive/`
- ETL tooling exists in `scripts/etl/` and strict local rehearsal has passed.
- Runtime PostgreSQL-specific research raw SQL paths were rewritten for MySQL compatibility:
  - `src/server/public/queries/researchPublic.ts`
  - `src/server/queries/researchGroupOutputs.ts`
  - `src/server/queries/researchGroupPublicationsFromMembers.ts`
- Open migration decision is policy/governance (not technical): approval of quarantined historical `RoleAssignment` duplicates from ETL conflict-resolution artifacts.

## 15. Manual QA checklist (local + staging)

Use this as the minimum release checklist for migration verification.

| Area | What to do | Expected result | Risk | Where |
|---|---|---|---|---|
| Auth login | Test valid/invalid login | Valid auth succeeds, invalid denied cleanly | High | Both |
| Invite flow | Issue invite, register, retry used token | Single-use behavior enforced | High | Both |
| Password reset | Request and consume reset token; test expired token | Reset works once; expired token rejected | High | Both |
| Session role injection | Login as users with different roles/scopes | Session permissions reflect DB roles | High | Both |
| RBAC global/scoped | Test EDITOR, ACADEMIC_COORDINATOR, RESEARCH_LEAD, SUPER_ADMIN boundaries | Access gates enforced server-side | High | Both |
| Public research pages | Visit group pages and output listings | No runtime SQL errors; correct data appears | High | Both |
| Dashboard research outputs | Test group outputs table search/pagination | Stable ordering/filtering and valid counts | High | Both |
| Publications-from-members | Validate member-linked output list behavior | Results align with `authorsJson.staffId` linkage | High | Both |
| Search/filter case behavior | Use mixed-case queries across research/news/people/courses | Case behavior acceptable and consistent | Medium | Both |
| Pagination | Exercise first/middle/last pages for major lists | No missing/duplicate rows across pages | Medium | Both |
| Content CRUD | Create/edit/publish/archive/delete in communication/content modules | Lifecycle transitions and visibility behave correctly | High | Both |
| Leadership/governance | Validate leadership terms, HOD data, tribute workflows | Dashboard and public views remain consistent | Medium | Both |
| Academics | Validate programmes/study options/courses/requirements | Data relations and rendering remain intact | Medium | Both |
| Audit logs | Trigger mutations and inspect audit entries | Actions and snapshots are persisted | High | Both |
| Files/images | Verify uploaded image/file URLs still resolve | Relative URL persistence remains valid | Medium | Both |
| Draft/archived visibility | Check public/dashboard visibility gates | Draft hidden publicly; published/archived semantics preserved | High | Both |
| MariaDB parity (if used) | Re-run research query paths on MariaDB staging | Functional parity with MySQL staging | High | Staging |
| JSON query performance | Load-test rewritten research filters on realistic volume | Performance remains acceptable | High | Staging |

## 16. Staging verification plan

1. Provision clean staging MySQL/MariaDB and apply baseline migration:
   - `npx prisma migrate deploy`
2. Run ETL with strict settings (non-production credentials only):
   - `ETL_FAIL_ON_REJECTS=true`
   - `ETL_REQUIRE_EMPTY_TARGET=true`
3. Review ETL artifacts before app QA:
   - `run-summary.json`
   - `post-load-counts.json`
   - `reports/rejects/*`
   - `reports/quarantine/RoleAssignment.ndjson`
   - `RoleAssignment.conflict-resolution.json`
4. Run app smoke tests (auth, dashboard access, public homepage, research, people, news).
5. Run focused regression tests for rewritten research query modules.
6. If MariaDB staging is used, run explicit parity checks for JSON filtering and case/collation behavior.
7. Run performance sanity checks for research list/search endpoints.
8. Capture signoffs from:
   - data migration reviewer
   - app QA reviewer
   - product/governance owner (RoleAssignment quarantine policy)

## 17. Cutover readiness + rollback checklist

### Pre-cutover

- Confirm maintenance window and stakeholder comms.
- Verify backups:
  - source PostgreSQL full backup + restore proof
  - target MySQL/MariaDB pre-cutover snapshot
- Confirm credential split:
  - migrate credentials
  - ETL write credentials
  - runtime least-privilege credentials
- Confirm final policy approval for quarantined `RoleAssignment` history.

### Cutover execution

- Apply migrations (`npx prisma migrate deploy`).
- Execute ETL in approved order with strict validation.
- Preserve all ETL artifacts outside ephemeral runners.
- Gate progression on artifact review and smoke-test pass.

### Post-cutover validation

- Run high-risk QA subset: auth/RBAC/research/content lifecycle.
- Verify key counts and targeted source-vs-target spot checks.
- Monitor runtime logs and DB health.

### Rollback triggers

- Critical auth or RBAC regression.
- Data-integrity mismatch beyond approved quarantine policy.
- Major public research query failures.
- Severe production performance degradation with no safe hotfix window.

### Rollback plan (high level)

- Repoint app to last known-good PostgreSQL deployment.
- Keep MySQL target snapshot and ETL artifacts for forensic review.
- Restore DB state from verified backups if needed.
- Re-run smoke tests on restored stack before reopening traffic.

## 18. Recommended go/no-go criteria

### Go

- Strict staging ETL completes with only approved quarantines.
- No critical QA failures in auth, RBAC, research, content lifecycle.
- MariaDB parity checks pass (if MariaDB is target).
- Performance sanity checks pass agreed thresholds.
- Backup and rollback rehearsal evidence is complete.
- Product owner signs off on quarantine policy.

### No-go

- Unapproved rejects/quarantines or unresolved data-integrity issues.
- Critical runtime regressions in protected flows.
- Unresolved engine-parity differences that affect correctness.
- Missing rollback readiness evidence.
