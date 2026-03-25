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
