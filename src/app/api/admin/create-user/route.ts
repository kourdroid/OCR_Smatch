import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, organizationId, fullName } = await request.json()

    if (!email || !password || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Create the user in Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    if (!userData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // 2. Update the profile with organization_id
    // The profile might be created automatically by a trigger, or we might need to create/update it.
    // Assuming a trigger exists (common pattern), we update. If not, we upsert.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        organization_id: organizationId,
        email: email,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Optional: delete the user if profile creation fails?
      // For now, just return error
      return NextResponse.json({ error: 'User created but profile update failed: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({ user: userData.user })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
