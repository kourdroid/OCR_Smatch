-- Assign Current User as Super Admin
-- This script ensures the Admin Organization exists and links your user to it.

-- 1. Ensure the Admin Organization exists with the specific ID we rely on
INSERT INTO public.organizations (id, company_name, created_at, updated_at)
VALUES ('37dcc0d0-2f83-4c05-98a2-8788a51a1fcc', 'Admin Organization', now(), now())
ON CONFLICT (id) DO UPDATE
SET company_name = 'Admin Organization';

-- 2. Update YOUR profile to belong to this Admin Organization
-- IMPORTANT: Run this in the Supabase SQL Editor while logged in.
-- If you are running this via a migration tool, this part might not affect your specific user
-- unless you replace 'auth.uid()' with your specific User UUID.

UPDATE public.profiles
SET
  organization_id = '37dcc0d0-2f83-4c05-98a2-8788a51a1fcc',
  is_admin = true
WHERE id = auth.uid();

-- If the above update didn't affect any rows (e.g. auth.uid() is null),
-- you can manually run:
-- UPDATE profiles SET organization_id = '37dcc0d0-2f83-4c05-98a2-8788a51a1fcc', is_admin = true WHERE email = 'your-email@example.com';
