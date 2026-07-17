import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

interface CreateAccountRequest {
  email: string
  password: string
  name: string
  role: 'reader' | 'journalist'
  phone?: string
  location?: string
  bio?: string
}

/**
 * POST /api/admin/create-account
 * Admin endpoint to create reader or journalist accounts
 * Requires admin authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as CreateAccountRequest
    const { email, password, name, role, phone, location, bio } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    if (!['reader', 'journalist'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be "reader" or "journalist"' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })

    // Privileged mutations need the service-role (admin) client: auth.admin.*
    // only works with the service key, and the users insert must bypass RLS.
    const adminClient = await createAdminClient()

    // Check if email already exists
    const { data: existingUser } = await adminClient
      .from('users')
      .select('user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle() as any

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Create user profile in users table. The handle_new_user trigger may
    // have already inserted a row on createUser, so upsert on auth_id. Include
    // password_hash so the insert branch passes the NOT NULL constraint.
    const { data: newUser, error: userError } = await adminClient
      .from('users')
      .upsert([{
        auth_id: authData.user.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: role,
        bio: bio?.trim() || null,
        status: 'active',
        password_hash: '',
        created_at: new Date().toISOString(),
      }] as any, { onConflict: 'auth_id' })
      .select()
      .single() as any

    if (userError) {
      // Rollback: delete auth user if profile creation fails
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id)
      } catch (rollbackError) {
        console.error('[create-account] rollback failed:', rollbackError)
      }
      console.error('User profile creation error:', userError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // If journalist, create journalist profile
    if (role === 'journalist') {
      const { error: journalistError } = await adminClient
        .from('journalists')
        .insert([{
          user_id: newUser.user_id,
          bio: bio?.trim() || '',
          verified: false,
          commission_rate: 0.15, // Default 15% commission
          total_earnings: 0,
          payment_method: null,
        }] as any)

      if (journalistError) {
        console.error('Journalist profile creation warning:', journalistError)
        // Don't fail, just log warning
      }
    }

    // Log admin action
    try {
      await adminClient
        .from('admin_logs')
        .insert([{
          admin_id: admin.userId,
          action: `Created ${role} account: ${email}`,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          created_at: new Date().toISOString(),
        }] as any)
    } catch (err) {
      console.error('Error logging admin action:', err)
    }

    return NextResponse.json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/create-account]', err)
    return NextResponse.json(
      { error: 'Account creation failed' },
      { status: 500 }
    )
  }
}
