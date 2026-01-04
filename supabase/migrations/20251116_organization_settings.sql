-- Add organization management functions and settings page support

-- Add organization_name column to profiles for easier access
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Update existing profiles with organization names
UPDATE profiles 
SET organization_name = organizations.company_name 
FROM organizations 
WHERE profiles.organization_id = organizations.id AND profiles.organization_name IS NULL;

-- Create function to get user's organization details
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.company_name, o.created_at, o.updated_at
  FROM organizations o
  JOIN profiles p ON p.organization_id = o.id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update organization name
CREATE OR REPLACE FUNCTION update_organization_name(user_id UUID, new_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  org_id UUID;
  updated BOOLEAN := false;
BEGIN
  -- Get user's organization ID
  SELECT organization_id INTO org_id FROM profiles WHERE id = user_id;
  
  IF org_id IS NOT NULL THEN
    -- Update organization name
    UPDATE organizations 
    SET company_name = new_name, updated_at = NOW() 
    WHERE id = org_id;
    
    -- Update profile organization name
    UPDATE profiles 
    SET organization_name = new_name, updated_at = NOW() 
    WHERE id = user_id;
    
    updated := true;
  END IF;
  
  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for organization updates
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can update their own organization
CREATE POLICY "Users can update their own organization" ON organizations
FOR UPDATE USING (
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Users can view their own organization
CREATE POLICY "Users can view their own organization" ON organizations
FOR SELECT USING (
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON organizations TO anon, authenticated;
GRANT SELECT, UPDATE ON profiles TO anon, authenticated;