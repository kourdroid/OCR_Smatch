## 2026-01-29 - Accessibility Improvements in Tables
**Learning:** Tables with sortable headers need both `aria-sort` on the `th` and a descriptive `aria-label` on the sort button to be fully accessible. Shadcn's Table component doesn't enforce this, so manual addition is required.
**Action:** Always verify `aria-sort` and `aria-label` when implementing sortable tables.

## 2026-01-29 - Frontend Verification of Protected Components
**Learning:** Testing components protected by auth middleware is difficult with full E2E flows. Creating a temporary public route (e.g. `src/app/test-palette`) allows for quick visual verification with mock data.
**Action:** Use temporary public routes for component verification when auth is a blocker.
