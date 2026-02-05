# Palette's Journal

## 2025-05-27 - Journal Initialized
**Learning:** Initialized the journal to track critical UX and accessibility learnings.
**Action:** Use this file to record significant insights, not just routine tasks.

## 2025-05-27 - Async Loading States & Label Associations
**Learning:** Found critical async action ("Approve & Save") lacking visual feedback, causing user uncertainty. Also identified form inputs without programmatic label associations, failing accessibility standards.
**Action:** Always wrap async actions with `isSubmitting` state and visual indicators (spinners). Use `useId` to generate unique IDs for linking `Label`s to `Input`s in reusable components.
