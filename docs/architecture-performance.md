# Architecture & Performance Strategy

This document outlines the performance and rendering strategies for the continuous optimization of the Department of Physics application. These rules enforce low-bandwidth compatibility and limit client-side resource strain.

## Rendering Strategy

- **Public Routes:** Serve dynamically, but default entirely to Next.js Server Components. No heavy client-side JavaScript or bloated third-party frameworks should be shipped to the user for general content consumption routes (e.g., Homepage, About, People, News).
- **Dashboard Routes:**
  - Leverage Server Components for all data reads and main layout shells.
  - Strict limitation: Client Components (`"use client"`) are permitted strictly where React boundary interactivity natively requires it (e.g., forms, dialogs/modals, toasts, multi-select dropdowns, and interactive tables).

## Data-Loading Rules

- **Minimal Selects:** Lists scaling bounds must strictly utilize generic Prisma `select` blocks to fetch only the explicit scalar fields required by the UI (e.g., `id`, `title`, `slug`, `date`).
- **Heavy Fields Omission:** Omit heavy payload items such as `body` string arrays or rich text blobs from list queries. Those should only be sequentially fetched on explicit detail/slug page loads.
- **Pagination by Default:** All array iterations and dynamic database mappings (e.g., historical timelines or news arrays) require skip/take arguments enforcing pagination implicitly preventing unbounded rendering issues.

## Caching & Invalidation

- **`revalidatePath`:** Apply this invalidation strictly when a known subset route has mutated individually (such as an edit to `/dashboard/profile` or `/news/[slug]`).
- **`revalidateTag`:** Opt for tag-based caching models for global domains. A change to a single publication triggers a `revalidateTag('publications')`, wiping cache boundaries effectively across index endpoints referencing collections without full path-recalculations.

### Suggested Cache Tag Definitions

- `news`
- `events`
- `spotlight`
- `history`
- `research-groups`
- `publications`
- `people`
- `resources`
- `academics`

## Overview of Important Image Rules

Reference `docs/SKILL.md` (Section #4).

- `next/image` handles standard output compression format dynamically (WebP/AVIF output).
- Explicit layout geometries via `width` and `height` properties exist to enforce exact structural sizing and nullify layout shifts.
- Viewports enforce lazy loading behavior.

## State Rendering

- **No Dummy Data Execution:** Do not seed random data records; development workflow relies strictly on either genuine data or true isolated zero-states.
- **Empty States:** The UI structure mandates explicit zero-data conditions gracefully indicating empty records via a localized layout design without breaking execution.

## Auth Security Context

- **In-Memory Login Throttling:** The application employs a minimalistic `loginThrottle` helper locally mitigating direct credential brute-forces using exponential wait times (maxing around 5s). Given its pure "in-memory" state (Map structure), this protection rests identically when instances restart, which inherently means distributed Node clusters will un-sync the throttler state (but fulfills basic dev/stage protection budgets optimally without needing extra Redis reliance).
