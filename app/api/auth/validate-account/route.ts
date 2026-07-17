import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ValidationRequest {
  email: string
  operation: 'signup' | 'login' | 'check'
}

/**
 * POST /api/auth/validate-account
 * Check for duplicate accounts and validate signup/login.
 *
 * SECURITY: requires authentication. Previously this endpoint was fully
 * public and leaked each user's role/status/last_login/created_at for ANY
 * email (account enumeration). It is now auth-gated and returns only a
 * boolean `exists` — no sensitive profile fields are exposed.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, operation } = (await req.json()) as ValidationRequest

    if (!email || !operation) {
      return NextResponse.json(
        { error: 'Email and operation are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Query users table — select ONLY the primary key so no sensitive
    // profile data (role, status, timestamps) is read into the response.
    const { data: userAccount, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle() as any

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database query error:', userError)
      return NextResponse.json(
        { error: 'Failed to validate account' },
        { status: 500 }
      )
    }

    const exists = !!userAccount

    // Return ONLY a boolean — never role/status/timestamps (enumeration fix)
    return NextResponse.json({
      exists,
      valid: operation === 'signup' ? !exists : exists,
      message: operation === 'signup'
        ? (exists ? 'Account already exists' : 'Account available')
        : (exists ? 'Account found' : 'Account not found'),
    })
  } catch (err) {
    console.error('[POST /api/auth/validate-account]', err)
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/merge-accounts
 * Merge duplicate accounts for admin
 */
export async function PATCH(req: NextRequest) {
  try {
    const { primaryEmail, secondaryEmail } = await req.json()

    // Verify admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if ((adminUser as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Merge accounts: transfer secondary data to primary
    const result = await (supabase.rpc as any)('merge_duplicate_accounts', {
      primary_email: primaryEmail,
      secondary_email: secondaryEmail,
    })
    const { error } = result

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Merged ${secondaryEmail} into ${primaryEmail}`,
    })
  } catch (err) {
    console.error('[PATCH /api/auth/validate-account]', err)
    return NextResponse.json(
      { error: 'Merge failed' },
      { status: 500 }
    )
  }
}
