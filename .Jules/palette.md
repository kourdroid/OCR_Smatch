## 2026-01-14 - [Accessible Toggle Buttons]
**Learning:** Toggle buttons like expand/collapse need dynamic `aria-label`s to inform screen reader users *what* they are affecting (e.g., "Expand group Microsoft").
**Action:** Use `aria-label={isExpanded ? 'Collapse group ${name}' : 'Expand group ${name}'}` pattern for all list/table expansion toggles.
