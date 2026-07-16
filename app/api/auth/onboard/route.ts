import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

interface OnboardBody {
  name?: string
  email?: string
  password?: string
  interests?: string[]
  notification_prefs?: Record<string, boolean>
  applyAuthor?: boolean
  application?: Record<string, string>
}

// POST /api/auth/onboard
// Creates a reader account (with verification email) and stores onboarding
// preferences. If the reader chose to apply as an author, the application is
// persisted on the user row (status: pending) for later admin review.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OnboardBody
    const {
      name,
      email,
      password,
      interests = [],
      notification_prefs = {},
      applyAuthor = false,
      application = {},
    } = body

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (!password || password.length < PASSWORD_MIN_LENGTH || !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' },
        { status: 400 }
      )
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check for an existing account
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 })
    }

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create the Supabase Auth user (triggers verification email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: redirectTo
        ? { emailRedirectTo: redirectTo, data: { name: name.trim(), role: 'reader' } }
        : { data: { name: name.trim(), role: 'reader' } },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    if (!authData.user?.id) {
      throw new Error('No user ID returned from signup')
    }

    // 2. Persist preferences. The handle_new_user trigger may have already
    //    inserted a users row on signUp, so upsert on auth_id to be safe.
    //    Use the admin client: right after signUp there is no session cookie
    //    (email verification is pending), so an anon upsert would be blocked
    //    by the "users can update own profile" RLS policy.
    const admin = await createAdminClient()

    const patch: Record<string, unknown> = {
      auth_id: authData.user.id,
      name: name.trim(),
      email: email.toLowerCase(),
      role: 'reader',
      status: 'active',
      password_hash: '',
      social_links: {
        interests: Array.isArray(interests) ? interests : [],
        notification_prefs: notification_prefs && typeof notification_prefs === 'object' ? notification_prefs : {},
      },
    }

    if (applyAuthor) {
      const app = application ?? {}
      patch.bio = (app.bio ?? '').toString().trim() || null
      patch.author_application = {
        status: 'pending',
        first_name: (app.firstName ?? '').toString(),
        last_name: (app.lastName ?? '').toString(),
        title: (app.title ?? '').toString(),
        niche: (app.niche ?? '').toString(),
        experience: (app.experience ?? '').toString(),
        motivation: (app.motivation ?? '').toString(),
        portfolio: (app.portfolioUrl ?? '').toString().trim() || null,
        linkedin: (app.linkedinUrl ?? '').toString().trim() || null,
        submitted_at: new Date().toISOString(),
      }
    }

    const { error: upsertError } = await admin
      .from('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert([patch] as any, { onConflict: 'auth_id' })

    if (upsertError) {
      // Rollback the auth user so we don't leave orphans
      try {
        await admin.auth.admin.deleteUser(authData.user.id)
      } catch (rollbackError) {
        console.error('[onboard] rollback failed:', rollbackError)
      }
      return NextResponse.json({ error: 'Could not save your profile. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created! Check your email to verify your account.',
        email: email.toLowerCase(),
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/auth/onboard]', err)
    return NextResponse.json({ error: 'Signup failed due to a server error' }, { status: 500 })
  }
}
