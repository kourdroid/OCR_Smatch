## 2024-05-24 - Accessible Interactive Elements
**Learning:** The codebase contained interactive `div` elements (e.g., in the sidebar footer) that were inaccessible to keyboard users. Using `<button>` instead of `div` provides native keyboard support and semantic meaning.
**Action:** Replace interactive `div`s with `<button>` elements, ensuring `type="button"` is set and styling (like `text-left`) is preserved to match the original design.
