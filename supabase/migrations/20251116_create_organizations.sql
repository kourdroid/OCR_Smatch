-- Create organizations table (must exist before profiles/documents/document_types)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the default organization row if it is missing
INSERT INTO public.organizations (id, company_name, created_at, updated_at)
VALUES ('37dcc0d0-2f83-4c05-98a2-8788a51a1fcc', 'Admin Organization', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Basic RLS (skip if policy already exists)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view default organization" ON public.organizations
    FOR SELECT USING (company_name = 'Admin Organization');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT ON public.organizations TO anon, authenticated;