# Palette's Journal

## 2025-02-20 - Initial Setup
**Learning:** Initialized UX journal.
**Action:** Record critical UX/a11y learnings here.

## 2025-02-20 - Test Environment & Labels
**Learning:** `vitest` requires manual alias configuration when not using Vite directly (e.g. Next.js). Also, shadcn/ui `Label` component is a wrapper around Radix Label and requires `htmlFor` to be manually linked to `Input` `id`.
**Action:** Ensure `htmlFor` and `id` are always paired. Add `vitest.config.ts` if missing.
