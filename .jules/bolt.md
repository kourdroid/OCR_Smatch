## 2024-05-22 - Real-time Data & Derived State
**Learning:** `DocumentsInterface` receives frequent real-time updates triggering re-renders. Expensive derived state (grouping, sorting) was being recalculated on every render.
**Action:** Always memoize expensive derived state in components that subscribe to real-time data or have frequent updates.
