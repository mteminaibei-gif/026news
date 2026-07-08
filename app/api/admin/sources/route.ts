import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { user_id: number; role: string }

// POST /api/admin/sources — add a new RSS feed
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, feed_url, category_id } = await req.json()
    if (!name?.trim() || !feed_url?.trim()) {
      return NextResponse.json({ error: 'name and feed_url are required' }, { status: 400 })
    }

    // Basic URL validation
    try { new URL(feed_url) } catch {
      return NextResponse.json({ error: 'feed_url must be a valid URL' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rss_feeds')
      .insert({
        name:        name.trim(),
        feed_url:    feed_url.trim(),
        category_id: category_id ?? null,
        is_active:   true,
      } as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A feed with this URL already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/sources]', err)
    return NextResponse.json({ error: 'Failed to add feed' }, { status: 500 })
  }
}

// PATCH /api/admin/sources — toggle is_active or update a feed
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as { role: string } | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { feed_id, is_active, name, feed_url, category_id } = await req.json()
    if (!feed_id) return NextResponse.json({ error: 'feed_id is required' }, { status: 400 })

    const patch: Record<string, unknown> = {}
    if (is_active !== undefined) patch.is_active   = is_active
    if (name)                    patch.name        = name.trim()
    if (feed_url)                patch.feed_url    = feed_url.trim()
    if (category_id !== undefined) patch.category_id = category_id

    const { error } = await supabase
      .from('rss_feeds')
      .update(patch as never)
      .eq('feed_id', Number(feed_id))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/sources]', err)
    return NextResponse.json({ error: 'Failed to update feed' }, { status: 500 })
  }
}

// DELETE /api/admin/sources?id=123 — remove a feed
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as { role: string } | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase.from('rss_feeds').delete().eq('feed_id', Number(id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/sources]', err)
    return NextResponse.json({ error: 'Failed to delete feed' }, { status: 500 })
  }
}
