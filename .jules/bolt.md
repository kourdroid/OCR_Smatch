# Bolt's Journal

## 2024-05-22 - Optimizing Document Processing
**Learning:** Found that `groupDocuments` was being called twice per render with the same data (`documents`) to create `documentRowsAll` and `documentRowsDashboard`, doubling the processing cost unnecessarily. Also, these calculations were happening on every render of `DocumentsInterface`, which includes real-time updates and UI interaction.
**Action:** Moved pure transformation logic outside the component and memoized the results. Always check for redundant calculations of the same data.
