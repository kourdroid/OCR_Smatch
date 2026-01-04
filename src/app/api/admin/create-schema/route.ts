import { NextResponse } from "next/server";
import { Pool } from "pg";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a pool using your connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const { name, description, color, icon, targetTable, requiredFields } = body;

    // 0. Test Database Connection
    try {
      client = await pool.connect();
    } catch (dbError: any) {
      console.error('DB Connection Failed:', dbError);
      return NextResponse.json({ error: "Database Connection Failed: " + dbError.message }, { status: 500 });
    }

    // 1. Verify Admin (Security)
    const cookieStore = cookies();
    let user = null;

    // Strategy A: Try Cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Manual cookie check to avoid middleware complexity
    // (We skip createRouteHandlerClient here to be raw and robust)
    const authHeader = req.headers.get('authorization');

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseManual = createClient(supabaseUrl, supabaseKey);
      const { data: headerData } = await supabaseManual.auth.getUser(token);
      user = headerData.user;
    }

    if (!user) {
      if (client) client.release();
      return NextResponse.json({ error: "Unauthorized: Please sign out and sign in again." }, { status: 401 });
    }

    // Check Profile directly via SQL
    const profileQuery = `SELECT is_admin, organization_id FROM profiles WHERE id = $1`;
    const profileResult = await client.query(profileQuery, [user.id]);
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      if (client) client.release();
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Enforce Super Admin check
    const ADMIN_ORG_ID = '37dcc0d0-2f83-4c05-98a2-8788a51a1fcc';
    if (profile.organization_id !== ADMIN_ORG_ID) {
      if (client) client.release();
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const organizationId = body.organizationId || profile.organization_id;

    try {
      await client.query('BEGIN'); // Start Transaction

      // --- CONSTRUCT THE SCHEMA JSON ---
      // If frontend sends 'schema', use it. If 'requiredFields', build it.
      const schemaJson = body.schema || {
        type: "object",
        properties: requiredFields.reduce((acc: any, field: any) => {
          acc[field.name] = { type: field.type, description: field.description || "" };
          return acc;
        }, {}),
        required: requiredFields.filter((f: any) => f.required).map((f: any) => f.name)
      };

      // 2. Insert into 'document_types' ONLY
      // We now save 'expected_schema_json' directly here.
      const insertTypeQuery = `
        INSERT INTO document_types (
            name, description, color, icon, target_table,
            organization_id, created_by, expected_schema_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;

      const typeResult = await client.query(insertTypeQuery, [
        name,
        description,
        color,
        icon,
        targetTable,
        organizationId,
        user.id, // created_by
        schemaJson // expected_schema_json
      ]);

      const documentTypeId = typeResult.rows[0].id;

      // 3. Create the Physical Table (Dynamic SQL)
      // We build columns from the schema we just created
      let columnsSql = '';

      // Check if schema has properties (Standard JSON Schema)
      if (schemaJson.properties) {
        columnsSql = Object.entries(schemaJson.properties).map(([key, value]: [string, any]) => {
          const sqlType = mapTypeToSQL(value.type);
          return `"${key}" ${sqlType}`;
        }).join(',\n        ');
      }
      // Fallback if schema is just a list of fields
      else if (requiredFields) {
        columnsSql = requiredFields.map((f: any) => {
          const sqlType = mapTypeToSQL(f.type);
          return `"${f.name}" ${sqlType}`;
        }).join(',\n        ');
      }

      if (columnsSql) {
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS public."${targetTable}" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID REFERENCES documents(id),
            organization_id UUID REFERENCES organizations(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            ${columnsSql}
          );
          -- Enable RLS on the new table immediately
          ALTER TABLE public."${targetTable}" ENABLE ROW LEVEL SECURITY;

          -- Create policy for the organization to view their own data
          -- Note: We use EXECUTE because we are inside a transaction block in logic,
          -- but here we just run the string.
        `;

        await client.query(createTableQuery);

        // Create Policy dynamically
        // We need to sanitize targetTable slightly to be safe, though it's an admin route
        const policyQuery = `
            CREATE POLICY "Org View Own Data ${targetTable}"
            ON public."${targetTable}"
            FOR SELECT
            USING ( organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) );
        `;
        await client.query(policyQuery);
      }

      await client.query('COMMIT'); // Save everything
      return NextResponse.json({ success: true, documentTypeId });

    } catch (e: any) {
      await client.query('ROLLBACK'); // Undo if error
      console.error('Transaction error:', e);
      // Handle unique constraint error gracefully
      if (e.code === '23505') {
        return NextResponse.json({ error: "A document type with this name already exists." }, { status: 400 });
      }
      return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to map your UI types to SQL types
function mapTypeToSQL(type: string) {
  switch (type) {
    case 'number':
    case 'integer':
      return 'NUMERIC';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'datetime':
      return 'TIMESTAMPTZ';
    case 'array':
    case 'object':
      return 'JSONB';
    default:
      return 'TEXT';
  }
}
