## 2024-05-22 - DocumentsTable Re-renders
**Learning:** `DocumentsTable` defined `renderGroupRow` and `renderDocumentRow` functions inside the component body. This caused all row sub-components to be re-created on every render, defeating React's reconciliation optimizations and causing the entire table to re-render when local state (like expanded groups) changed.
**Action:** Extract render functions into `React.memo` components (`GroupRowItem`, `DocumentRowItem`) defined outside the main component, and ensure callbacks passed to them are stable using `useCallback`.
