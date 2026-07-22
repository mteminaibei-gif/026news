import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UserProfile = { role: string; name: string; profile_image: string | null; user_id: number }

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawEmail = (body.email ?? '') as string
    const password = (body.password ?? '') as string
    const email = rawEmail.toLowerCase().trim()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[Login] signInWithPassword error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Verify the session was established (cookies were set)
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
    if (verifyError || !verifiedUser) {
      console.error('[Login] Session verification failed:', verifyError?.message)
      return NextResponse.json(
        { error: 'Session could not be established. Please try again.' },
        { status: 401 }
      )
    }

    // Look up profile by auth_id (reliable, never mismatches)
    let profile: UserProfile | null = null
    try {
      const { data: rawProfile, error: profileError } = await supabase
        .from('users')
        .select('role, name, profile_image, user_id')
        .eq('auth_id', verifiedUser.id)
        .single()
      if (profileError) {
        // Profile may not exist yet — try by email as fallback
        if (verifiedUser.email) {
          const { data: emailProfile } = await supabase
            .from('users')
            .select('role, name, profile_image, user_id, auth_id')
            .eq('email', verifiedUser.email)
            .maybeSingle()
          if (emailProfile) {
            // Link existing profile to this auth_id
            if (!emailProfile.auth_id || emailProfile.auth_id !== verifiedUser.id) {
              await supabase.from('users').update({ auth_id: verifiedUser.id }).eq('email', verifiedUser.email)
            }
            profile = { role: emailProfile.role, name: emailProfile.name, profile_image: emailProfile.profile_image, user_id: emailProfile.user_id }
          } else {
            // No profile exists at all — auto-create one
            const insertPayload: Record<string, unknown> = {
              auth_id: verifiedUser.id,
              email: verifiedUser.email,
              name: verifiedUser.user_metadata?.name ?? verifiedUser.email.split('@')[0],
              role: 'reader',
              status: 'active',
              password_hash: '',
              social_links: {},
            }
            const { data: newProfile } = await supabase
              .from('users')
              .insert(insertPayload as never)
              .select('user_id, role, name, profile_image')
              .single()
            if (newProfile) {
              profile = newProfile as unknown as UserProfile
            }
          }
        }
      } else {
        profile = rawProfile as unknown as UserProfile | null
      }
    } catch (err) {
      console.error('[Login] Profile query exception:', err)
    }

    // If no profile found after all fallbacks, return minimal user data
    const safeProfile = profile ?? { role: 'reader' as const, name: '', profile_image: null, user_id: null }

    return NextResponse.json({
      user: {
        id:            verifiedUser.id,
        email:         verifiedUser.email,
        role:          safeProfile.role,
        name:          safeProfile.name ?? '',
        profile_image: safeProfile.profile_image ?? null,
        user_id:       safeProfile.user_id ?? null,
      },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
