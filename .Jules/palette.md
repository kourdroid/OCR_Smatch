## 2025-05-23 - Table Accessibility and Context
**Learning:** Tables with expandable rows often lack `aria-expanded` and accessible names for toggle buttons, making them confusing for screen reader users. Also, rendering empty states *inside* the table body (preserving headers) provides better context than replacing the entire table.
**Action:** Always check `aria-expanded` on accordion/expand interactions and use `colSpan` to render empty states within data tables.
