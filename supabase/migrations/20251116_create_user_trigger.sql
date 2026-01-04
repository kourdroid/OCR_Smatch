-- Fix the database trigger for user signup
-- This ensures automatic profile creation when users sign up

-- Create function to get admin organization ID
CREATE OR REPLACE FUNCTION get_admin_organization_id() 
RETURNS UUID 
LANGUAGE sql 
STABLE 
AS $$ 
  SELECT id FROM public.organizations 
  WHERE company_name = 'Admin Organization' 
  LIMIT 1; 
$$; 

-- Create the trigger function that runs after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
BEGIN 
  -- Insert a new row into public.profiles 
  -- It links the new user (NEW.id) to the default organization 
  INSERT INTO public.profiles (id, organization_id, email, is_admin) 
  VALUES ( 
    NEW.id, 
    public.get_admin_organization_id(), 
    NEW.email, 
    false -- All new signups are clients, not admins 
  ); 
  RETURN NEW; 
END; 
$$; 

-- Create the trigger that connects the function to Supabase Auth
-- This is the critical piece that's missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user(); 

-- Ensure the default organization exists
INSERT INTO public.organizations (company_name) 
VALUES ('Admin Organization') 
ON CONFLICT DO NOTHING; 

-- Grant necessary permissions
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT INSERT ON public.profiles TO anon, authenticated;

-- Add RLS policy to allow users to create their own profile
-- This is critical for the trigger to work properly
CREATE POLICY "Users can create their own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Add RLS policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON profiles 
  FOR SELECT 
  USING (id = auth.uid());

-- Add RLS policy to allow users to update their own profile  
CREATE POLICY "Users can update their own profile" ON profiles 
  FOR UPDATE 
  USING (id = auth.uid());

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;