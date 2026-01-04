-- Ensure a default organization exists
INSERT INTO organizations (id, company_name, created_at, updated_at)
SELECT gen_random_uuid(), 'Default Organization', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Assign organization_id to documents where it is NULL
WITH default_org AS (
  SELECT id FROM organizations LIMIT 1
)
UPDATE documents
SET organization_id = (SELECT id FROM default_org)
WHERE organization_id IS NULL;

-- Also ensure document_categories have organization assignments
WITH default_org AS (
  SELECT id FROM organizations LIMIT 1
)
UPDATE document_categories
SET organization_id = (SELECT id FROM default_org)
WHERE organization_id IS NULL;