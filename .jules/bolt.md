## 2024-05-23 - Memoization of Derived Data
**Learning:** `DocumentsInterface` re-renders frequently due to state updates (KPIs, real-time indicators). Expensive data processing like `groupDocuments` (O(N)) and sorting (O(N log N)) runs on every render if not memoized, causing unnecessary main thread blocking.
**Action:** Always memoize derived data from `documents` array using `useMemo`. Ensure helper functions like `groupDocuments` are defined outside the component or memoized to avoid re-creation.
