-- 1. Let anon see the default organization so the client can read its id
CREATE POLICY "Anyone can view default organization" ON public.organizations
  FOR SELECT USING (company_name = 'Admin Organization');

-- 2. Allow authenticated users to insert their profile row exactly once
CREATE POLICY "Users can insert own profile once" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Basic grants
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;