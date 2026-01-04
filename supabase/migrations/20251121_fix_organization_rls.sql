-- 1. Secure the is_super_admin function
-- This ensures that only admins of the specific Admin Organization have super admin privileges
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
    AND organization_id = '37dcc0d0-2f83-4c05-98a2-8788a51a1fcc' -- Admin Org ID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix Organizations Table Policies

-- Drop existing policies (including the one the user reported: "Read Own Org")
DROP POLICY IF EXISTS "Read Own Org" ON organizations;
DROP POLICY IF EXISTS "Anyone can view default organization" ON organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Super Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Super Admins can manage organizations" ON organizations;

-- Allow users to view their own organization
CREATE POLICY "Users can view own organization" ON organizations
FOR SELECT
USING (id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Allow Super Admins to view ALL organizations
CREATE POLICY "Super Admins can view all organizations" ON organizations
FOR SELECT
USING (is_super_admin());

-- Allow Super Admins to INSERT/UPDATE/DELETE organizations
CREATE POLICY "Super Admins can manage organizations" ON organizations
FOR ALL
USING (is_super_admin());


-- 3. Update policies for 'document_types' and 'extraction_schemas'
-- Redefining is_super_admin() automatically fixes policies using it, but we ensure they are set correctly here.

DROP POLICY IF EXISTS "Super Admin Manage All Types" ON document_types;
DROP POLICY IF EXISTS "Super Admin Manage All Schemas" ON extraction_schemas;

CREATE POLICY "Super Admin Manage All Types"
ON document_types
FOR ALL
USING (is_super_admin());

CREATE POLICY "Super Admin Manage All Schemas"
ON extraction_schemas
FOR ALL
USING (is_super_admin());
