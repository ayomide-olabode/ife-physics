# Project Structure

The project leans on the standard Next.js App Router methodology integrated securely with Prisma and scoped features. Here is an overview:

## 1. Authentication, Data & System Logic

- `prisma/`
  - Holds `schema.prisma`.
  - Handles the physical declarative data layer layout for users, roles, and records.
- `src/server/` or `src/lib/server/`
  - Defines secure session-based auth checking functions and Next Auth providers.
  - Hosts the RBAC (Role-Based Access Control) utility checks.
- `src/lib/`
  - Client and shared helpers.

## 2. Server Queries & Actions

- `src/server/actions/`
  - Contains Next.js Server Actions used heavily by complex UI components (e.g. data mutation, form submissions, archiving workflows).
- `src/server/db/` or direct Prisma Singletons
  - Instantiates the `PrismaClient` and houses abstract data retrieval layer wrappers.

## 3. UI Shell & Components

- `src/app/`
  - File-system router boundary. Controls the application routing context (`page.tsx`, `layout.tsx`, `loading.tsx`).
  - Distributes the App UI Shell via top-level layouts.
- `src/components/ui/`
  - Minimalistic primitive components generated via `shadcn/ui`. (Buttons, Modals, Forms).
- `src/components/`
  - Project-specific shared React components (Composed Headers, Footers, Navbars, Hero Carousels).

## 4. UI Patterns & Constraints

- _Deep Navigation_: All UI pages targeting specific IDs (e.g. `[id]/page.tsx`) or creations (`/new/page.tsx`) deep within the dashboard **must** mount the `BackToParent` UI Component natively above their `PageHeader` implementations, linking directly back safely returning context organically to the immediate parent hierarchy directory effectively avoiding stale JS navigation patterns locally.
