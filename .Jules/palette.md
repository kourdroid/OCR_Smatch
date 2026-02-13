## 2024-05-23 - Accessibility Pattern for Sort Buttons
**Learning:** When adding ARIA labels to sort buttons, the label should describe the ACTION that will happen on click (e.g., 'Sort by Time ascending' if currently descending), while the `aria-pressed` or `aria-sort` attribute describes the CURRENT state. This avoids confusion for screen reader users.
**Action:** Use conditional logic to toggle the label text based on the current sort direction, ensuring it describes the *next* state.
