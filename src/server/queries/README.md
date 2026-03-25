# Server Queries Structure

This folder contains isolated Prisma interactions, returning explicit object mappings required for the Render layout templates.

## General Best Practices inside `/src/server/queries/`

1. **Minimal Selects:** Avoid raw `findMany` when specific UI fields are explicitly scoped. Enforce selection blocks:
   ```typescript
   select: { id: true, title: true, slug: true }
   ```
2. **Pagination Enforcement:** Scope queries matching list requirements explicitly limiting retrieval using standardized pagination offset models.
   ```typescript
   take: 12,
   skip: pageOffset
   ```
3. **Data Cache Tunnels:** Use native Next `cache` wrapping if duplicate reads occur concurrently alongside strict `fetch()` tag references bridging invalidation across server models when required.
