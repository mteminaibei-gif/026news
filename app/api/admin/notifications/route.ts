import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type UserProfile = { user_id: number; role: string }

async function verifyAdmin(userId?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: rawProfile } = await supabase
    .from('users').select('user_id, role').eq('auth_id', user.id).single()
  const profile = rawProfile as unknown as UserProfile | null
  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  if (userId && profile.user_id !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { admin: true, userId: profile.user_id }
}

// GET /api/admin/notifications — fetch notifications for the authenticated admin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get('user_id')
    const userId = userIdParam ? Number(userIdParam) : undefined

    const { error } = await verifyAdmin(userId)
    if (error) return error

    const supabase = await createAdminClient()
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId!)
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
    const body = await req.json()
    const { notification_id } = body

    if (!notification_id) {
      return NextResponse.json({ error: 'Missing notification_id' }, { status: 400 })
    }

    const { error: authError } = await verifyAdmin()
    if (authError) return authError

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
