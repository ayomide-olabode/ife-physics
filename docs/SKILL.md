# Antigravity Skills & Rules (ife-physics-website)

This document is the operating contract for Antigravity when working in:

- `/home/io/Sandbox/ife-physics-website`

Always follow these rules unless a prompt explicitly overrides them.

---

## 1) Source of Truth

- Prisma schema is the source of truth:
  - `prisma/schema.prisma`
- Product requirements and IA are the source of truth:
  - `docs/prd.md`
- Do not invent new models, fields, routes, or roles unless required for implementation.
  - If change is required, update **both** `prisma/schema.prisma` and `docs/prd.md` and explain why in the commit message.

### UI Surfacing Rule (Public Routes)

- Before any public UI change, confirm the target file is actually surfaced by the public layout import chain.
- Quick check:
  1. start at `src/app/(public)/layout.tsx`
  2. trace imports to header/navbar/footer components
  3. only modify components reachable from that chain
- If a file is not surfaced, do not patch it for visual changes; locate and patch the surfaced component instead.

### Component Structure + Import Rules

- Public components live under `src/components/public/*`:
  - header/nav: `src/components/public/header/*`
  - footer: `src/components/public/PublicFooter.tsx`
  - public page/section modules: `src/components/public/{home,about,research,academics,...}`
- Dashboard components live under `src/components/dashboard/*` (shell, sidebar, tabs, and dashboard UI blocks).
- Shared form primitives live under `src/components/forms/*` and base UI primitives under `src/components/ui/*`.
- Before editing UI, always confirm the target file is surfaced from layout import chains (`src/app/(public)/layout.tsx` or `src/app/dashboard/layout.tsx`).
- Prefer `@/` absolute imports (`@/components/...`, `@/server/...`) and avoid deep relative imports when an alias path is available.

---

## 1b) Database Backup Rule (Mandatory Before Any DB Change)

**BEFORE** any DB change (Prisma migration, schema change, enum change, column add/remove/rename), **ALWAYS** create a backup dump first.

### Backup

```bash
mkdir -p /tmp/ife-physics-backups
docker exec -t ife-physics-postgres pg_dump -U postgres -d ife_physics > /tmp/ife-physics-backups/ife_physics_before_<PROMPT_ID>.sql
```

### Verify (after applying migration)

```bash
docker exec -it ife-physics-postgres psql -U postgres -d ife_physics -c 'select count(*) from "User";'
docker exec -it ife-physics-postgres psql -U postgres -d ife_physics -c 'select count(*) from "Staff";'
```

### If Prisma resets / DB gets wiped / tables are empty after migration

1. **STOP immediately** — do not continue with the task.
2. Restore from the latest backup:

```bash
cat /tmp/ife-physics-backups/ife_physics_before_<PROMPT_ID>.sql | docker exec -i ife-physics-postgres psql -U postgres -d ife_physics
```

3. Re-verify counts, then investigate the migration failure.

### Cleanup (if migration succeeds with no reset)

```bash
rm -f /tmp/ife-physics-backups/ife_physics_before_<PROMPT_ID>.sql
```

Delete the backup file **before** marking the task complete.

### Absolute rules

- Users and staff are created manually by the project owner — never automate seeding or bootstrapping.
- Backups must live outside the repo (e.g. `/tmp`). Never commit backup files.

---

## 2) Build Order (Dependencies)

Always implement in this order:

1. Database + Prisma migrations
2. Auth + RBAC + route guards
3. Dashboard shell
4. Admin module (users, role assignments, leadership)
5. Staff self-management
6. Editor modules (Communication + Content)
7. Academics (Undergraduate, Postgraduate)
8. Research module (scoped leads)
9. Public frontend pages

No public pages should depend on dummy/seed content.

---

## 3) No Dummy Data Policy

- Do not create seed scripts or dummy data.
- Empty states must exist everywhere.
- The only acceptable “baseline structure” data is created through Admin UI (later) or via manual DB entry during development (Prisma Studio), but do not automate seeding.

---

## 4) Low-Bandwidth Performance Rules (Default)

### Rendering

- Default to **Server Components** for all read pages.
- Use **Client Components** only where necessary:
  - forms
  - dialogs/modals
  - toasts
  - interactive widgets

### Data access

- List queries must:
  - select minimal fields
  - be paginated/limited by default
  - avoid N+1 queries
- Heavy fields (e.g., `News.body`, large text blobs) must be fetched only on detail pages.

### Caching

- Public pages should use caching where safe (ISR/tag-based invalidation).
- Use `revalidateTag`/`revalidatePath` after mutations that affect public content.

### Media

- Use `next/image` for all images.
- Always provide width/height.
- Lazy-load below-the-fold images.
- Validate uploads: type + size.
- Store optimized formats where possible (prefer webp/jpg/png).

### Client JS

- Keep client bundles minimal.
- Dynamically import heavy dashboard components (e.g., rich text editor) with loading UI.

---

## 5) Security Defaults

- Never commit secrets.
- `.env.local` must remain gitignored.
- Auth is credentials-based; no public signup.
- Always enforce RBAC on the server:
  - do not rely on hiding links in UI
- Unauthorized dashboard access:
  - if authenticated but not authorized → return **404** via `notFound()`
  - if not authenticated → redirect to `/login`

---

## 6) Roles and Scopes (RBAC Contract)

### SUPER_ADMIN

- Determined by `User.isSuperAdmin = true`
- Full access everywhere.

### EDITOR

- Global role only: `RoleAssignment(role=EDITOR, scopeType=GLOBAL, scopeId=NULL)`
- Manages both:
  - Communication module (`/dashboard/communication/*`)
  - Content module (`/dashboard/content/*`)

### ACADEMIC_COORDINATOR

- Global role only: `RoleAssignment(role=ACADEMIC_COORDINATOR, scopeType=GLOBAL, scopeId=NULL)`
- Manages Undergraduate and Postgraduate modules.

### RESEARCH_LEAD

- Scoped per research group:
  - `RoleAssignment(role=RESEARCH_LEAD, scopeType=RESEARCH_GROUP, scopeId=<ResearchGroup.id>)`
- Enforce max **2 active research leads per group** in application logic.

### STAFF

- Ownership-based:
  - staff can edit only their own Staff profile and related owned records.

---

## 7) Information Architecture (Routes Contract)

Use Next.js App Router. Do not invent new public/dashboard route patterns.

### Public routes

- `/`
- `/about/*`
- `/academics/*` (UG/PG with programme routes)
- `/research` and `/research/[slug]`
- `/people/*` and `/people/staff/[slug]`, `/people/in-memoriam/[slug]`
- `/resources`
- `/news` and `/news/[slug]`
- optional: `/events`, `/spotlight`

### Dashboard routes

- `/dashboard/*`
- `/dashboard/profile/*`
- `/dashboard/communication/*`
- `/dashboard/content/*`
- `/dashboard/undergraduate/*`
- `/dashboard/postgraduate/*`
- `/dashboard/research/*`
- `/dashboard/admin/*`

---

## 8) UI/Component Conventions

- Use Tailwind + shadcn/ui.
- Prefer minimal components; do not add UI libraries without instruction.
- Standard components required:
  - `PageHeader`
  - `EmptyState`
  - `ConfirmDialog`
  - `StatusBadge` (Draft/Published/Archived)
  - `Toast` (sonner preferred)
  - `DataTable` wrapper (pagination-ready)
  - `Modal` pattern for list → preview modal (News + History requirement)

---

## 9) Development Workflow Rules

- Make small, incremental commits.
- Commit message format:
  - `chore: ...`, `feat: ...`, `docs: ...`, `fix: ...`
- Before committing:
  - `npm run lint`
  - `npm run format:check` (or format when appropriate)
  - `npm run build` for milestones that change build-critical config

Avoid `lint --fix` unless asked or the prompt explicitly requires it.

---

## 10) Where Things Live (Conventions)

- Prisma client: `src/lib/prisma.ts`
- Auth helpers: `src/lib/auth.ts`
- RBAC helpers: `src/lib/rbac.ts`
- Audit helper: `src/lib/audit.ts`
- Server queries/actions:
  - `src/server/queries/*`
  - `src/server/actions/*`
- Shared UI components:
  - `src/components/*`
  - `src/components/ui/*` (shadcn)

---

## 11) Dashboard Page Structure Standard (Gold Standard = Admin)

Apply this pattern to all modules:

### 1) Index pages (e.g., `/dashboard/admin/users`, `/dashboard/admin/staff`)

- Must use:
  - `PageHeader(title, description?, actions)`
  - Primary CTA in actions: “Add New” -> `/new`
  - `DataTable` (server paginated)
  - `EmptyState` when no rows
  - Search/filter via URLSearchParams (Apply button; avoid keystroke fetching)

### 2) Deep pages (`/new`, `/[id]`)

- Must include `BackToParent` at top, linking to immediate parent index
- Must use `PageHeader` below `BackToParent`
- Forms must use:
  - Zod validation
  - `toastSuccess`/`toastError`
  - redirect on success
  - confirm dialogs for destructive actions

### 3) Module sub-navigation

- Use `ModuleTabs` in parent layout for second-level pages
- Tabs are link navigation; minimal client JS only for active state

### 4) Low-bandwidth enforcement for all pages

- Minimal selects
- Paginate lists
- Avoid client components except forms/dialogs
- Lazy-load heavy details (like AuditLog snapshots)

---

## 12) “Done” Definition for Any Task

A task is only “done” if:

- It compiles (`npm run build` passes when relevant),
- It respects RBAC and route rules (when applicable),
- It has empty state handling (no dummy data),
- It does not increase client bundle unnecessarily,
- It includes a clean commit with a precise message.

---
