-- Fix the trigger function to create user-specific organizations
-- This ensures each user gets their own organization on signup

-- Update the trigger function to create organization for each new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for this user (using their email as base name)
  INSERT INTO organizations (company_name) 
  VALUES (NEW.email || ' Organization') 
  RETURNING id INTO new_org_id;
  
  -- Create profile for the new user with their own organization
  INSERT INTO public.profiles (id, organization_id, is_admin, email)
  VALUES (
    NEW.id, 
    new_org_id,
    false, -- Regular user, not admin
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add organization_name column to profiles for easier access
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Grant necessary permissions for organization management
GRANT SELECT, INSERT, UPDATE ON organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;