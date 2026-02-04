## 2026-02-04 - Testing Protected Components
**Learning:** `DocumentsInterface` performs auth checks that redirect to `/login` if `NEXT_PUBLIC_SUPABASE_URL` is set but invalid. To test in isolation without a real backend, do NOT set Supabase env vars; the component gracefully degrades to a "no-backend" state allowing `initialDocuments` to render.
**Action:** When creating reproduction scripts for authenticated components, omit Supabase env vars to bypass auth redirects and verify UI rendering with mock data.
