-- Update trigger to create organization for each new user
-- This allows users to have their own organization after signup

-- Update the trigger function to create organization for each new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for this user
  INSERT INTO organizations (company_name) 
  VALUES (NEW.email || ' Organization') 
  RETURNING id INTO new_org_id;
  
  -- Create profile for the new user with their own organization
  INSERT INTO public.profiles (id, organization_id, is_admin, email)
  VALUES (
    NEW.id, 
    new_org_id,
    true,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add organization_name column to profiles table for easier management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Update existing profiles with organization names
UPDATE profiles 
SET organization_name = organizations.company_name 
FROM organizations 
WHERE profiles.organization_id = organizations.id;

-- Create a function to update organization name
CREATE OR REPLACE FUNCTION update_organization_name(user_id UUID, new_name TEXT)
RETURNS VOID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get user's organization ID
  SELECT organization_id INTO org_id FROM profiles WHERE id = user_id;
  
  -- Update organization name
  UPDATE organizations 
  SET company_name = new_name, updated_at = NOW() 
  WHERE id = org_id;
  
  -- Update profile organization name
  UPDATE profiles 
  SET organization_name = new_name, updated_at = NOW() 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for organization updates
GRANT UPDATE ON organizations TO anon, authenticated;
GRANT UPDATE ON profiles TO anon, authenticated;