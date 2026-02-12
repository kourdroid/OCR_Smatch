## 2024-05-23 - [DocumentsTable Optimization]
**Learning:** `DocumentsTable` was re-sorting the entire dataset on every render, including purely visual updates like row expansion. This is a common pattern in this codebase where expensive derived state is computed inline.
**Action:** Always check for `useMemo` on sorting/filtering logic in list components.

## 2024-05-23 - [DocumentsInterface State]
**Learning:** Contrary to previous memory, `DocumentsInterface` does *not* memoize its grouping logic (`groupDocuments`), meaning it rebuilds the entire row structure on every render.
**Action:** Verify "memoized" claims in memory by reading the actual code.
