import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { endpoint, p256dh, auth } = body

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing subscription fields' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userId = (profile as { user_id: number }).user_id
    const userAgent = req.headers.get('user-agent') ?? ''

    const { error } = await supabase
      .from('push_subscriptions' as never)
      .upsert({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
      } as never, { onConflict: 'user_id,endpoint' } as never)

    if (error) {
      console.error('[push/subscribe] upsert error:', error.message)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
