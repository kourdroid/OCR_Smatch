## 2024-05-23 - [DocumentsInterface Re-renders]
**Learning:** `DocumentsInterface` is a heavy component that re-renders frequently due to `useRealTime` hooks and filter changes. Expensive grouping logic (`groupDocuments`) inside the render body was causing performance degradation.
**Action:** Always memoize expensive data transformations in `DocumentsInterface` and ensure helper functions are defined outside the component or memoized.
