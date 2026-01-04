-- Only the missing policy: let auth system insert profile with NULL org
CREATE POLICY "Auth system can insert new profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND organization_id IS NULL);