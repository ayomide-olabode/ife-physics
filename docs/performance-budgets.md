# Performance Budgets

**Goal**: Ensure the Department of Physics website remains fast, accessible, and consistently loads over low-bandwidth or unreliable network connections.

## Key Technical Targets

- **Minimize Client Javascript**: Default all pages to React Server Components (RSC) unless interactivity is explicitly required.
- **Near-Zero Public JS**: Public routes (e.g. standard content pages, reading articles, schedules) should execute near-zero client JS where unavoidable (like simple toggles or sliders which should ideally use modern CSS if possible).
- **Pagination by Default**: All list layouts with dynamic length must be paginated or lazy-loaded at the edges.
- **Optimized Data Fetching**:
  - _List Views_ must only fetch necessary scalar fields (Title, Summary, Year) and omit deep blobs or rich text.
  - _Detail Pages_ can fetch heavier, full-content payload properties.
- **Optimized Images (Next/Image)**:
  - Any image loading must funnel through the built-in Next `Image` component.
  - Always provide explicit `width`/`height`.
  - Content below the fold must remain lazy-loaded.
- **Dynamic Imports**: Do not ship heavy, dashboard-only third-party scripts (e.g., WYSIWYG editors, deep charting widgets) to public users. Defer logic rendering on heavy UI routes via lazy imports (`next/dynamic`).

## Standard Page Sizes

- Standard lists (Articles, Spotlights): 12 items.
- Staff/Directory results: 20 items.
- Dense tables/administrative audit logs: 50 items.
