## 2026-01-08 - Accessibility: Icon-only Buttons
**Learning:** Icon-only buttons (like expand/collapse chevrons) are invisible to screen readers without explicit `aria-label` attributes. Even with `Tooltip`, the button itself needs semantic labeling.
**Action:** Always pair icon-only buttons with `aria-label` describing the action (e.g., "Expand group", "Collapse group") and `aria-expanded` for toggle states.
