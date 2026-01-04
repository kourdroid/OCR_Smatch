import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json()
  const email = String(body?.email ?? "")
  const password = String(body?.password ?? "")
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    const missing = [!url ? "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL" : null, !service ? "SUPABASE_SERVICE_ROLE_KEY" : null]
      .filter(Boolean)
      .join(", ")
    return NextResponse.json({ error: `Server not configured: missing ${missing}` }, { status: 500 })
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
  }
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  
  // First, ensure we have a default organization
  const { data: orgData, error: orgError } = await admin
    .from("organizations")
    .select("id")
    .eq("company_name", "Admin Organization")
    .maybeSingle()
  
  let orgId = orgData?.id
  
  // If no default organization exists, create one
  if (!orgId && !orgError) {
    const { data: newOrg, error: createOrgError } = await admin
      .from("organizations")
      .insert({ company_name: "Admin Organization" })
      .select("id")
      .single()
    
    if (createOrgError) {
      console.error("[ADMIN-SIGNUP] Failed to create default organization:", createOrgError)
      return NextResponse.json({ error: "Failed to setup organization" }, { status: 500 })
    }
    
    orgId = newOrg?.id
  }
  
  if (!orgId) {
    return NextResponse.json({ error: "Organization setup failed" }, { status: 500 })
  }
  
  // Create user with admin API
  const { data: created, error: adminError } = await admin.auth.admin.createUser({ 
    email, 
    password, 
    email_confirm: true 
  })
  let user = created?.user
  
  if (adminError || !user) {
    console.error("[ADMIN-SIGNUP] createUser error:", JSON.stringify(adminError, null, 2))
    const list = await admin.auth.admin.listUsers({ perPage: 200 })
    const existing = (list.data?.users || []).find((u: any) => String(u.email || "").toLowerCase() === email.toLowerCase())
    if (!existing) {
      const raw = String(adminError?.message || "")
      const lower = raw.toLowerCase()
      if (lower.includes('relation "organizations" does not exist') || lower.includes('42p01')) {
        return NextResponse.json({ error: "System setup incomplete: missing organizations table" }, { status: 503 })
      }
      return NextResponse.json({ error: raw || "Database error creating new user" }, { status: 500 })
    }
    user = existing
  }
  
  // Create profile for the user
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ 
      id: user.id, 
      organization_id: orgId, 
      email, 
      is_admin: false 
    })
  
  if (profileError && profileError.code !== "23505") {
    console.error("[ADMIN-SIGNUP] profile insert error:", profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }
  
  return NextResponse.json({ userId: user.id, organizationId: orgId }, { status: 200 })
}