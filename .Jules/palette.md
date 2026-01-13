## 2024-05-23 - DocumentReviewForm Loading State & Accessibility
**Learning:** `shadcn/ui` Label components do not automatically associate with Inputs; explicit `htmlFor` and `id` are required for screen reader support and click-to-focus behavior.
**Action:** Always verify `htmlFor` matches `id` when using Label components.

## 2024-05-23 - Async Button States
**Learning:** Async actions (like "Approve & Save") without loading states lead to user uncertainty and potential double-submission.
**Action:** Implement `isSubmitting` state and `Loader2` spinner for all async buttons.
