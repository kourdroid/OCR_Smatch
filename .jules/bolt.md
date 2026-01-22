## 2024-05-22 - Inline Render Functions
**Learning:** `DocumentsTable` was defining `renderGroupRow` and `renderDocumentRow` inline, causing them to be recreated on every render and preventing effective memoization of rows.
**Action:** Always extract row renderers into separate components (wrapped in `React.memo`) and use `useCallback` for handlers passed to them.
