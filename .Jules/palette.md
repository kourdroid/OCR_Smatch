## 2025-05-22 - Async Loading States

**Learning:** Critical user actions (like "Approve & Save") that trigger network requests were missing loading states, leading to uncertainty and potential double-submissions.
**Action:** Always wrap async handlers with an `isSubmitting` state and reflect this in the UI (disabled button + spinner) to provide immediate feedback.
