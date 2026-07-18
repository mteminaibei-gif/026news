import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/server-auth'

// POST /api/auth/apply-journalist — a signed-in reader requests to become a
// journalist. Stores a PENDING author_application that a site admin approves
// via /api/admin/journalists. Existing journalists or already-pending
// applicants are rejected.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to apply.' }, { status: 401 })
    }

    let body: {
      organization?: string
      portfolio?: string
      title?: string
      niche?: string
      bio?: string
      experience?: string
      linkedin?: string
      motivation?: string
    } = {}
    try {
      body = await req.json()
    } catch {
      // optional payload — ignore parse errors
    }

    const admin = await createAdminClient()
    const { data: profile, error: fetchError } = await admin
      .from('users')
      .select('user_id, role, status, author_application')
      .eq('user_id', Number(user.userId))
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    const existing = (profile as any).author_application
    if (existing && existing.status === 'pending') {
      return NextResponse.json(
        { error: 'You already have a pending application under review.', status: 'pending' },
        { status: 409 },
      )
    }
    if ((profile as any).role === 'journalist') {
      return NextResponse.json({ error: 'You are already a journalist.' }, { status: 409 })
    }
    if ((profile as any).status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 })
    }

    const application = {
      status: 'pending',
      organization: body.organization?.trim() || null,
      portfolio: body.portfolio?.trim() || null,
      title: body.title?.trim() || null,
      niche: body.niche?.trim() || null,
      bio: body.bio?.trim() || null,
      experience: body.experience?.trim() || null,
      linkedin: body.linkedin?.trim() || null,
      motivation: body.motivation?.trim() || null,
      submitted_at: new Date().toISOString(),
    }

    const { error: updateError } = await admin
      .from('users')
      .update({ author_application: application } as never)
      .eq('user_id', Number(user.userId))

    if (updateError) throw updateError

    return NextResponse.json(
      { success: true, status: 'pending', message: 'Application submitted for review.' },
      { status: 201 },
    )
  } catch (err) {
    console.error('[POST /api/auth/apply-journalist]', err)
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
  }
}
