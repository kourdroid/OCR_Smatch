## 2024-05-23 - Empty State vs Loading State
**Learning:** Users were seeing "No documents found" (Empty State) immediately on load because the initial empty array `[]` satisfied the empty state condition before loading state was checked. This bypassed the carefully designed skeleton loading state, making the app feel "glitchy" or broken on first load.
**Action:** Always prioritize checking `isLoading` before checking `isEmpty`. Even if the data list is empty, if `isLoading` is true, show the loading state, not the empty state.
