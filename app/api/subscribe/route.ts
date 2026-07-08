import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/subscribe — add email to subscribers
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Sign up with Supabase Auth (magic-link / newsletter subscribe)
    // We use signInWithOtp so the user gets a confirmation email and is added
    // to the auth.users table without requiring a password.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/`
          : undefined,
      },
    })

    if (error) {
      // "already subscribed" is not a real error — treat rate-limit gracefully
      if (error.message.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Subscribed! Check your inbox to confirm.' })
  } catch (err) {
    console.error('[POST /api/subscribe]', err)
    return NextResponse.json({ error: 'Subscription failed.' }, { status: 500 })
  }
}
