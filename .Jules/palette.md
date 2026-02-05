## 2024-05-22 - Loading States for Async Actions
**Learning:** Users can become frustrated or confused when async actions (like form submissions) don't provide immediate feedback. Adding a loading state (spinner + disabled button) prevents double submissions and assures the user that the system is processing their request.
**Action:** Always include a loading state (`isSubmitting`) for buttons that trigger network requests. Use a consistent spinner icon and disable the button during the process.
