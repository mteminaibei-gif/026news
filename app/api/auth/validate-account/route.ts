import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ValidationRequest {
  email: string
  operation: 'signup' | 'login' | 'check'
}

interface DuplicateAccount {
  exists: boolean
  email: string
  role: string
  lastLogin?: string
  createdAt?: string
  status: string
}

/**
 * POST /api/auth/validate-account
 * Check for duplicate accounts and validate signup/login
 */
export async function POST(req: NextRequest) {
  try {
    const { email, operation } = (await req.json()) as ValidationRequest

    if (!email || !operation) {
      return NextResponse.json(
        { error: 'Email and operation are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check in Supabase auth
    const supabase = await createClient()

    // Query users table for account info
    const { data: userAccount, error: userError } = await supabase
      .from('users')
      .select('user_id, email, role, last_login, created_at, status')
      .eq('email', normalizedEmail)
      .maybeSingle() as any

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database query error:', userError)
      return NextResponse.json(
        { error: 'Failed to validate account' },
        { status: 500 }
      )
    }

    const duplicate: DuplicateAccount = {
      exists: !!userAccount,
      email: normalizedEmail,
      role: userAccount?.role || 'reader',
      lastLogin: userAccount?.last_login,
      createdAt: userAccount?.created_at,
      status: userAccount?.status || 'inactive',
    }

    // Check operation-specific rules
    if (operation === 'signup') {
      if (duplicate.exists) {
        return NextResponse.json(
          {
            error: 'Account already exists',
            duplicate,
            suggestion: 'Try logging in or use a different email',
          },
          { status: 409 }
        )
      }
    }

    if (operation === 'login') {
      if (!duplicate.exists) {
        return NextResponse.json(
          {
            error: 'Account not found',
            duplicate,
            suggestion: 'Create a new account or check your email',
          },
          { status: 404 }
        )
      }

      if (duplicate.status === 'suspended') {
        return NextResponse.json(
          {
            error: 'Account is suspended',
            duplicate,
            suggestion: 'Contact support for assistance',
          },
          { status: 403 }
        )
      }
    }

    // Return validation result
    return NextResponse.json({
      valid: operation === 'signup' ? !duplicate.exists : duplicate.exists,
      duplicate,
      message: operation === 'signup'
        ? 'Account available'
        : 'Account found',
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
