-- Grant permissions for document_types table to anon and authenticated roles
-- This fixes the "No valid document types found in database" error

-- Grant SELECT permission to anon role (for public access)
GRANT SELECT ON document_types TO anon;

-- Grant full access to authenticated role (for logged-in users)
GRANT ALL PRIVILEGES ON document_types TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'document_types'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;