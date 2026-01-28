## 2024-05-23 - Accessible Sortable Tables
**Learning:** For sortable table headers, the `aria-sort` attribute belongs on the `<th>` element to indicate current state, while the interactive button inside needs an `aria-label` describing the *action* (e.g., "Sort by Time ascending").
**Action:** When implementing sortable tables, verify both the state (`aria-sort`) and action (`aria-label`) are explicitly defined.
