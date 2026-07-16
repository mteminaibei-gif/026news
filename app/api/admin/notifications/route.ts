import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/notifications — fetch notifications for an admin user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', Number(userId))
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[GET /api/admin/notifications]', error.message)
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
    const body = await req.json()
    const { notification_id } = body

    if (!notification_id) {
      return NextResponse.json({ error: 'Missing notification_id' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('notification_id', Number(notification_id))

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
