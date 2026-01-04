-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT false,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Auth system can insert new profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND organization_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Create document_types table
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  target_table TEXT,
  expected_schema_json JSONB,
  icon TEXT DEFAULT '📄',
  color TEXT DEFAULT '#3B82F6',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  display_name TEXT
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.document_types TO anon, authenticated;

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE,
  file_name TEXT,
  file_url TEXT,
  type TEXT,
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'received',
  confidence NUMERIC,
  payload JSONB,
  raw_ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  document_number TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  supplier TEXT DEFAULT 'Unknown',
  channel TEXT DEFAULT 'gmail',
  sender_email TEXT,
  file_type TEXT DEFAULT 'pdf',
  processing_time INT DEFAULT 0,
  received_at TIMESTAMP DEFAULT now(),
  thumbnails TEXT[],
  document_events JSONB DEFAULT '[]',
  file_url_expiry TIMESTAMP,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;