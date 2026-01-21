## 2025-05-23 - Form Accessibility & Interaction Patterns
**Learning:** Found that `shadcn/ui` Label and Input components do not automatically associate. Developers must manually generate IDs (using `useId`) and pass `id` to Input and `htmlFor` to Label. Also, async actions often lack visual feedback.
**Action:** When working on forms, always check for `htmlFor`/`id` association and ensure submit buttons have a loading state (`Loader2` + disabled).

## 2025-05-23 - Disabled Form Fields & Labels
**Learning:** When a form field is disabled and replaced by a static element (like `<p>`), the associated `<Label>` should not have an `htmlFor` attribute, as it would point to a non-existent control, causing accessibility errors.
**Action:** Conditionally set `htmlFor={disabled ? undefined : id}` on Labels when the input might be swapped out.
