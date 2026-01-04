-- Ensure organizations table exists and has the default row
-- This fixes the trigger error when creating new users

-- Check if organizations table exists, create if not
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin organization if not exists
INSERT INTO organizations (company_name) VALUES ('Admin Organization') ON CONFLICT DO NOTHING;

-- Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the trigger function to handle missing organizations gracefully
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the default organization ID
  SELECT id INTO default_org_id FROM organizations WHERE company_name = 'Admin Organization' LIMIT 1;
  
  -- If no default organization exists, create one
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (company_name) VALUES ('Admin Organization') RETURNING id INTO default_org_id;
  END IF;
  
  -- Create profile for the new user
  INSERT INTO public.profiles (id, organization_id, is_admin, email)
  VALUES (
    NEW.id, 
    default_org_id,
    true,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON organizations TO anon, authenticated;
GRANT INSERT ON organizations TO anon, authenticated;
GRANT UPDATE ON organizations TO anon, authenticated;
GRANT DELETE ON organizations TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT ON profiles TO anon, authenticated;
GRANT UPDATE ON profiles TO anon, authenticated;
GRANT DELETE ON profiles TO anon, authenticated;