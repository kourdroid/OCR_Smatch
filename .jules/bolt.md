## 2024-05-24 - Vitest Expect Extension
**Learning:** In this environment, `vitest` globals are not available by default, and `expect` must be explicitly imported. Furthermore, `jest-dom` matchers are not automatically extended.
**Action:** When writing tests that use `jest-dom` matchers (like `toBeInTheDocument`), explicitly import `expect` from `vitest`, `* as matchers` from `@testing-library/jest-dom/matchers`, and call `expect.extend(matchers)`.
