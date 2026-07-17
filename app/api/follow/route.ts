import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push-notifications'

// POST /api/follow — Follow or unfollow a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetUserId, action } = body

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'targetUserId and action are required' }, { status: 400 })
    }

    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json({ error: 'action must be follow or unfollow' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id, name')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number; name: string } | null }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const followerId = profile.user_id

    if (followerId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    if (action === 'follow') {
      // Check if already following
      const { data: existing } = await supabase
        .from('user_follows')
        .select('follow_id')
        .eq('follower_id', followerId)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: followerId, following_id: targetUserId } as never)

        if (error) throw error

        // Create notification for followed user
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            type: 'follow',
            title: 'New Follower',
            message: `${profile.name} started following you`,
            actor_name: profile.name,
            actor_id: followerId,
          } as never)

        if (!notifError) {
          // Send push notification
          await sendPushNotification(targetUserId, {
            title: 'New Follower',
            body: `${profile.name} started following you`,
            icon: '/icon-192.png',
            data: { type: 'follow', actorId: followerId },
          })
        }
      }
    } else {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', targetUserId)

      if (error) throw error
    }

    return NextResponse.json({ success: true, following: action === 'follow' })
  } catch (err) {
    console.error('[POST /api/follow]', err)
    return NextResponse.json({ error: 'Failed to process follow action' }, { status: 500 })
  }
}

// GET /api/follow?targetUserId=xxx — Check follow status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetUserId = Number(searchParams.get('targetUserId'))

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ following: false })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number } | null }

    if (!profile) {
      return NextResponse.json({ following: false })
    }

    const { data } = await supabase
      .from('user_follows')
      .select('follow_id')
      .eq('follower_id', profile.user_id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    return NextResponse.json({ following: !!data })
  } catch (err) {
    console.error('[GET /api/follow]', err)
    return NextResponse.json({ following: false })
  }
}