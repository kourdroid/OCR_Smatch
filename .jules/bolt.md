## 2024-05-23 - Memoizing Table Sorting
**Learning:** `DocumentsTable` was sorting data on every render, even when inputs (documents, sort field, direction) didn't change. This is a common React anti-pattern.
**Action:** Used `useMemo` to memoize the sorted data. This is a low-risk, high-value optimization for lists. Always check for heavy computations in the render body.
