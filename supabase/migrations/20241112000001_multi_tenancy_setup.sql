-- ========= 1. USER & ORGANIZATION TABLES =========
-- Stores your clients (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links your Supabase 'auth.users' to an organization
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false, -- This is for YOU (the admin)
  email TEXT, -- For easy lookup in workflows
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========= 2. THE NEW DOCUMENT STRUCTURE =========
-- Rename document_types to document_categories
ALTER TABLE document_types RENAME TO document_categories;

-- Add columns for multi-tenancy and the new UI (only if they don't exist)
ALTER TABLE document_categories
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- Update existing document categories to have default organization (for admin)
UPDATE document_categories SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;

-- Create the new table for multiple schemas
CREATE TABLE extraction_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES document_categories(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  schema_name TEXT NOT NULL,       -- e.g., "Facture - Header Only"
  target_table TEXT NOT NULL,      -- e.g., "data_facture_headers"
  expected_schema_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========= 3. MAKE YOUR DATA SECURE =========
-- Add organization_id to your main 'documents' table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update existing documents to have default organization (for admin)
UPDATE documents SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;

-- Enable Row-Level Security (RLS) on ALL tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION get_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Create a function to get the user's organization
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Create the policies for documents table
CREATE POLICY "Admins can see all documents" ON documents FOR SELECT USING (get_is_admin() = true);
CREATE POLICY "Clients see their own documents" ON documents FOR SELECT USING (organization_id = get_my_organization_id());
CREATE POLICY "Admins can insert all documents" ON documents FOR INSERT WITH CHECK (get_is_admin() = true);
CREATE POLICY "Clients can insert their own documents" ON documents FOR INSERT WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Admins can update all documents" ON documents FOR UPDATE USING (get_is_admin() = true);
CREATE POLICY "Clients can update their own documents" ON documents FOR UPDATE USING (organization_id = get_my_organization_id());
CREATE POLICY "Admins can delete all documents" ON documents FOR DELETE USING (get_is_admin() = true);
CREATE POLICY "Clients can delete their own documents" ON documents FOR DELETE USING (organization_id = get_my_organization_id());

-- Create the policies for document_categories table
CREATE POLICY "Admins can see all categories" ON document_categories FOR SELECT USING (get_is_admin() = true);
CREATE POLICY "Clients see their own categories" ON document_categories FOR SELECT USING (organization_id = get_my_organization_id());
CREATE POLICY "Admins can insert categories" ON document_categories FOR INSERT WITH CHECK (get_is_admin() = true);
CREATE POLICY "Admins can update categories" ON document_categories FOR UPDATE USING (get_is_admin() = true);
CREATE POLICY "Admins can delete categories" ON document_categories FOR DELETE USING (get_is_admin() = true);

-- Create the policies for extraction_schemas table
CREATE POLICY "Admins can see all schemas" ON extraction_schemas FOR SELECT USING (get_is_admin() = true);
CREATE POLICY "Clients see their own schemas" ON extraction_schemas FOR SELECT USING (organization_id = get_my_organization_id());
CREATE POLICY "Admins can insert schemas" ON extraction_schemas FOR INSERT WITH CHECK (get_is_admin() = true);
CREATE POLICY "Admins can update schemas" ON extraction_schemas FOR UPDATE USING (get_is_admin() = true);
CREATE POLICY "Admins can delete schemas" ON extraction_schemas FOR DELETE USING (get_is_admin() = true);

-- Create the policies for organizations table
CREATE POLICY "Admins can see all organizations" ON organizations FOR SELECT USING (get_is_admin() = true);
CREATE POLICY "Clients see their own organization" ON organizations FOR SELECT USING (id = get_my_organization_id());
CREATE POLICY "Admins can insert organizations" ON organizations FOR INSERT WITH CHECK (get_is_admin() = true);
CREATE POLICY "Admins can update organizations" ON organizations FOR UPDATE USING (get_is_admin() = true);
CREATE POLICY "Admins can delete organizations" ON organizations FOR DELETE USING (get_is_admin() = true);

-- Create the policies for profiles table
CREATE POLICY "Users can see their own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can see all profiles" ON profiles FOR SELECT USING (get_is_admin() = true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (get_is_admin() = true);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (get_is_admin() = true);
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (get_is_admin() = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_categories_organization_id ON document_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_extraction_schemas_organization_id ON extraction_schemas(organization_id);
CREATE INDEX IF NOT EXISTS idx_extraction_schemas_category_id ON extraction_schemas(category_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON documents TO anon, authenticated;
GRANT INSERT ON documents TO anon, authenticated;
GRANT UPDATE ON documents TO anon, authenticated;
GRANT DELETE ON documents TO anon, authenticated;

GRANT SELECT ON document_categories TO anon, authenticated;
GRANT INSERT ON document_categories TO anon, authenticated;
GRANT UPDATE ON document_categories TO anon, authenticated;
GRANT DELETE ON document_categories TO anon, authenticated;

GRANT SELECT ON extraction_schemas TO anon, authenticated;
GRANT INSERT ON extraction_schemas TO anon, authenticated;
GRANT UPDATE ON extraction_schemas TO anon, authenticated;
GRANT DELETE ON extraction_schemas TO anon, authenticated;

GRANT SELECT ON organizations TO anon, authenticated;
GRANT INSERT ON organizations TO anon, authenticated;
GRANT UPDATE ON organizations TO anon, authenticated;
GRANT DELETE ON organizations TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT ON profiles TO anon, authenticated;
GRANT UPDATE ON profiles TO anon, authenticated;
GRANT DELETE ON profiles TO anon, authenticated;

-- Insert default admin organization and profile
INSERT INTO organizations (company_name) VALUES ('Admin Organization') ON CONFLICT DO NOTHING;

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign to admin organization by default
  INSERT INTO public.profiles (id, organization_id, is_admin, email)
  VALUES (
    NEW.id, 
    (SELECT id FROM organizations WHERE company_name = 'Admin Organization' LIMIT 1),
    true,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();