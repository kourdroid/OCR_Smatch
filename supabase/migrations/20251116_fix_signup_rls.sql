-- 1. Allow users to insert their own profile row (id must match auth.uid())
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Users can see their organization (needed to populate UI)
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Basic table-level grants (redundant once RLS exists, but keeps Supabase Studio happy)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;