import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// GET /api/admin/journalists — list journalist applications (pending + all)
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') // 'pending', 'approved', 'declined', or null for all

    const admin = await createAdminClient()
    let query = admin
      .from('users')
      .select('user_id, name, email, role, status, profile_image, author_application, created_at')
      .in('role', ['journalist', 'reader'])

    if (status) {
      query = query.eq('author_application->>status', status)
    }

    const { data, error: queryError } = await query.order('created_at', { ascending: false })
    if (queryError) throw queryError

    return NextResponse.json({ applications: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST /api/admin/journalists — approve or decline a journalist application
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, action, reason } = await req.json()
    if (!user_id || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'user_id and action (approve/decline) are required' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Fetch current application
    const { data: user, error: fetchError } = await admin
      .from('users')
      .select('user_id, role, status, author_application')
      .eq('user_id', Number(user_id))
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const app = (user as any).author_application
    if (!app || app.status !== 'pending') {
      return NextResponse.json({ error: 'No pending application found for this user' }, { status: 400 })
    }

    if (action === 'approve') {
      // Upgrade role to journalist, activate account, update application status
      const { error: updateError } = await admin
        .from('users')
        .update({
          role: 'journalist',
          status: 'active',
          author_application: { ...app, status: 'approved', reviewed_at: new Date().toISOString() },
        } as never)
        .eq('user_id', Number(user_id))

      if (updateError) throw updateError

      return NextResponse.json({ success: true, action: 'approved' })
    } else {
      // Decline — keep role but mark application as declined
      const { error: updateError } = await admin
        .from('users')
        .update({
          author_application: {
            ...app,
            status: 'declined',
            reason: reason || '',
            reviewed_at: new Date().toISOString(),
          },
        } as never)
        .eq('user_id', Number(user_id))

      if (updateError) throw updateError

      return NextResponse.json({ success: true, action: 'declined' })
    }
  } catch (err) {
    console.error('[POST /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}

// PATCH /api/admin/journalists — update journalist account status (suspend/reactivate)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, status } = await req.json()
    if (!user_id || !status) {
      return NextResponse.json({ error: 'user_id and status are required' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error: updateError } = await admin
      .from('users')
      .update({ status } as never)
      .eq('user_id', Number(user_id))
    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to update journalist' }, { status: 500 })
  }
}
