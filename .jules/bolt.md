## 2024-05-23 - Vitest & React Testing Pattern
**Learning:** In this environment, Vitest + React Testing Library requires manual setup that is often automatic in CRA/Next.js templates:
1. `cleanup()` must be called manually in `afterEach` to prevent DOM state leaking.
2. `jest-dom` matchers must be explicitly imported and extended via `expect.extend(matchers)`.
3. Global test functions (`describe`, `it`, `expect`) are not available by default and must be imported from `vitest`.

**Action:** When creating new test files, always include the standard boilerplate for imports and cleanup.

## 2024-05-23 - DocumentsTable Performance
**Learning:** `DocumentsTable` was sorting rows on every render (O(N log N)) and recreating event handlers. This caused cascading re-renders when parent state changed.
**Action:** Use `useMemo` for expensive derived state like sorting, and `useCallback` for handlers passed to child components.
