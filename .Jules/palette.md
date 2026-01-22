## 2024-05-23 - Async Loading States
**Learning:** Async actions (like "Approve & Save") without visual feedback can lead to user uncertainty and double submissions. Simple spinners significantly improve perceived responsiveness.
**Action:** Always wrap async handlers with `isSubmitting` state and show a loading indicator (spinner + text change) on the primary action button.

## 2024-05-23 - Form Label Accessibility
**Learning:** `Label` components must be programmatically associated with their `Input`s via `htmlFor` and `id` for screen reader support. React's `useId` hook is essential for generating unique IDs in reusable components.
**Action:** When using `Label` and `Input`, generate a unique ID with `useId()` and link them explicitly. Handle conditional rendering (e.g. disabled state replacing input) by setting `htmlFor` to `undefined` if the input is absent.
