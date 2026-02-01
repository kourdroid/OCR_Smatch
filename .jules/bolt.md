## 2024-05-23 - Memory vs Codebase Reality
**Learning:** Memory entries about codebase state can be outdated. Always verify critical assumptions (like "component X is memoized") by reading the actual code before making changes. In this case, memory stated `DocumentsTable` memoized `sortedRows`, but code inspection revealed it did not.
**Action:** Always use `read_file` to verify the current state of optimization before assuming it exists, especially when the optimization is the target of the task.
