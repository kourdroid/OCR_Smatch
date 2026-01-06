## 2024-05-23 - Dynamic ARIA labels for toggle buttons
**Learning:** Icon-only toggle buttons (like expand/collapse chevrons) are a common pattern here. Screen readers need both `aria-expanded` (for state) AND a dynamic `aria-label` (e.g., "Expand group" vs "Collapse group") to make the future action clear, not just the current state.
**Action:** When finding `Chevron` icons in buttons, always check for `aria-expanded` and a state-dependent `aria-label`.
