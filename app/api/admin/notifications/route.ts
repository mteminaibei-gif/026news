import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// GET /api/admin/notifications — fetch notifications for the authenticated admin
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get('user_id')

    // If a specific user_id is requested, verify the admin is requesting their own
    if (userIdParam && admin.userId && Number(userIdParam) !== admin.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = userIdParam ? Number(userIdParam) : admin.userId
    if (!userId) return NextResponse.json({ error: 'User ID not found' }, { status: 400 })

    const supabase = await createAdminClient()
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (queryError) {
      console.error('[GET /api/admin/notifications]', queryError.message)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/notifications — mark a notification as read
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { notification_id } = body

    if (!notification_id) {
      return NextResponse.json({ error: 'Missing notification_id' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('notification_id', Number(notification_id))
      .eq('user_id', admin.userId!)

    if (error) {
      console.error('[PATCH /api/admin/notifications]', error.message)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
