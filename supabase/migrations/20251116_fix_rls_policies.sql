-- Fix RLS policies for profiles table to allow trigger to work

-- First, check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Add proper RLS policies for the trigger to work
-- This allows the trigger function to insert profiles for new users
CREATE POLICY "Users can create their own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read their own profile" ON profiles 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles 
  FOR UPDATE 
  USING (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for the trigger
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;