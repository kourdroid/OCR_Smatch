-- Create RLS policies for document_types table
-- This allows both anon users and authenticated users to access document types

-- Enable RLS if not already enabled
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon users to read all document types" ON document_types;
DROP POLICY IF EXISTS "Allow authenticated users to read organization document types" ON document_types;
DROP POLICY IF EXISTS "Allow service role full access" ON document_types;

-- Create policy for anon users (read-only access to all document types)
CREATE POLICY "Allow anon users to read all document types" ON document_types
    FOR SELECT
    TO anon
    USING (true);

-- Create policy for authenticated users (read-only access to their organization's document types)
CREATE POLICY "Allow authenticated users to read organization document types" ON document_types
    FOR SELECT
    TO authenticated
    USING (
        organization_id IS NULL OR 
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Create policy for service role (full access)
CREATE POLICY "Allow service role full access" ON document_types
    FOR ALL
    TO service_role
    USING (true);

-- Verify the policies were created
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname = 'document_types' 
AND pn.nspname = 'public'
ORDER BY pol.polname;