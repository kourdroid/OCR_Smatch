## 2024-05-23 - DocumentsTable Render Architecture
**Learning:** `DocumentsTable` defines render helpers (`renderGroupRow`, `renderDocumentRow`) inside the component body. This forces function recreation on every render and prevents granular memoization of rows, making the table vulnerable to performance issues when parent state updates.
**Action:** Future optimizations should extract these into standalone components (e.g., `GroupRow`, `DocumentRow`) to enable `React.memo` and reduce re-rendering scope.

## 2024-05-23 - Memory vs Reality Discrepancy
**Learning:** Project memory stated `DocumentsTable` sorting was memoized, but code analysis proved it was running on every render (O(N log N)).
**Action:** Always verify "documented" performance features by reading the source code before assuming they exist.
