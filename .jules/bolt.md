## 2026-01-17 - React Component Definition inside Render
**Learning:** Defining a recursive component (like `Node` in `JSONViewer`) inside the parent component's body causes full subtree unmounting and remounting on every parent render. This destroys state and focus, and kills performance.
**Action:** Always define components outside. For recursive components, pass necessary props or use a stable context.
