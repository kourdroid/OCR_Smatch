import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "");
    const password = String(body?.password ?? "");
    const organizationName = String(body?.organizationName ?? body?.orgName ?? "");

    // Validate input
    if (!email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Email, password, and organization name are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Create secure admin client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase env keys." },
        { status: 500 }
      );
    }
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create the organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({ company_name: organizationName })
      .select("id")
      .single();

    if (orgError) {
      console.error("[SIGNUP_ERROR] Org Create:", orgError.message);
      if (orgError.code === "23505") {
        return NextResponse.json(
          { error: "An organization with this name already exists." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create organization." },
        { status: 500 }
      );
    }
    const orgId = orgData.id;

    // Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      // Rollback: Delete the organization we just created
      await supabaseAdmin.from("organizations").delete().eq("id", orgId);
      
      console.error("[SIGNUP_ERROR] Auth Create:", authError.message);
      if (authError.message.includes("User already exists")) {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create user." },
        { status: 500 }
      );
    }
    const user = authData.user;

    // Create the profile to link user to organization
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        organization_id: orgId,
        email: user.email,
        is_admin: false, // New users are not system admins
      });

    if (profileError) {
      // Rollback: Delete user and organization
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      await supabaseAdmin.from("organizations").delete().eq("id", orgId);

      console.error("[SIGNUP_ERROR] Profile Create:", profileError.message);
      return NextResponse.json(
        { error: "Failed to create user profile." },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      message: "Signup successful! Please check your email to confirm your account.",
      user: { email: user.email }
    }, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in signup route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
