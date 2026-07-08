import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { user_id: number; role: string }

// DELETE /api/admin/articles?id=123 — admin delete an article
export async function DELETE(req: NextRequest) {
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

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Delete dependent rows first to avoid FK constraint errors
    await supabase.from('analytics').delete().eq('article_id', Number(id))
    await supabase.from('comments').delete().eq('article_id', Number(id))
    await supabase.from('review_workflow').delete().eq('article_id', Number(id))
    await supabase.from('earnings').delete().eq('article_id', Number(id))

    const { error } = await supabase.from('articles').delete().eq('article_id', Number(id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/articles]', err)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}

// PATCH /api/admin/articles — update article status (reject / suspend)
export async function PATCH(req: NextRequest) {
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

    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })

    const { error } = await supabase
      .from('articles')
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('article_id', Number(id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/articles]', err)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}
