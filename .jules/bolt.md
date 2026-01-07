## 2024-05-23 - [Optimization Constraints]
**Learning:** Adding new dev dependencies (like `@vitejs/plugin-react`) to support testing infrastructure updates is considered a violation of the "No new dependencies" rule, even if it's just for testing.
**Action:** When asked to optimize, use existing test infrastructure. If the infrastructure is insufficient (e.g. missing plugins), rely on manual verification or partial testing rather than modifying the build environment. Always check `package.json` devDependencies before assuming a standard testing stack is fully configured.
