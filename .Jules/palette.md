## 2024-05-23 - [shadcn/ui Label Association]
**Learning:** `shadcn/ui` Label components do not automatically associate with their sibling Inputs. They are separate components.
**Action:** Always manually link them using `htmlFor` on Label and `id` on Input. Use `useId` from React to ensure uniqueness if the component is reusable.
