-- Add a column to store the client's specific N8N Webhook URL
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;

-- Example: Update your Admin Org with its URL (User should replace with actual values if needed, but this is a safe default example)
-- UPDATE organizations
-- SET n8n_webhook_url = 'https://n8n.smatch.com/webhook/admin-trigger'
-- WHERE company_name = 'Admin Organization';

-- 1. Reset policies for Document Types & Schemas
DROP POLICY IF EXISTS "Clients can insert own types" ON document_types;
DROP POLICY IF EXISTS "Clients can update own types" ON document_types;
DROP POLICY IF EXISTS "Clients can delete own types" ON document_types;

DROP POLICY IF EXISTS "Clients can insert own schemas" ON extraction_schemas;
DROP POLICY IF EXISTS "Clients can update own schemas" ON extraction_schemas;
DROP POLICY IF EXISTS "Clients can delete own schemas" ON extraction_schemas;

-- 2. NEW Policy: Clients are READ-ONLY
-- They can SELECT (view) their own types, but nothing else.
CREATE POLICY "Clients View Own Types"
ON document_types
FOR SELECT
USING ( organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Clients View Own Schemas"
ON extraction_schemas
FOR SELECT
USING ( organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) );

-- 3. NEW Policy: Super Admin has FULL CONTROL over ALL organizations
-- You can Select, Insert, Update, Delete for ANY organization_id
-- Note: is_super_admin() function needs to exist. If not, we might need to define it or use a check on the profiles table.
-- Assuming is_super_admin() exists or we use a direct check:
-- (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true

CREATE POLICY "Super Admin Manage All Types"
ON document_types
FOR ALL
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );

CREATE POLICY "Super Admin Manage All Schemas"
ON extraction_schemas
FOR ALL
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
