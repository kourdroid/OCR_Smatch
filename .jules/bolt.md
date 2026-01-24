## 2026-01-24 - Testing Auth-Guarded Components
**Learning:** E2E testing (Playwright) of individual components that have internal `useEffect` auth guards (like `DocumentsInterface`) is blocked by redirects.
**Action:** Use Unit Testing (Vitest/RTL) with comprehensive mocks for `useSupabase` and `useRouter` to verify performance optimizations (like memoization) in isolation.
