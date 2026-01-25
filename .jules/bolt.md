## 2024-05-22 - Vitest Configuration
**Learning:** This Next.js project uses Vitest but lacks a default `vitest.config.ts`. Tests fail to resolve `@/*` aliases without manual configuration.
**Action:** Always check for `vitest.config.ts` and create one with `jsdom` environment and alias mapping if missing before running tests.
