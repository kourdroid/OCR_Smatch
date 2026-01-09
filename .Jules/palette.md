## 2026-01-09 - Accessible Icon-Only Buttons
**Learning:** Icon-only buttons (like expansion toggles in tables) are invisible to screen readers without `aria-label`. In `DocumentsTable`, the expansion toggle was just a "button" to assistive technology.
**Action:** Always add `aria-label` describing the action (e.g., "Expand group") and state attributes like `aria-expanded` for toggles. When state changes, update the label (e.g., "Collapse group").
