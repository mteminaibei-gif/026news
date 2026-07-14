import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    if (!profile || !['journalist', 'admin'].includes((profile as { role: string }).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const articleId = Number(body.article_id)
    const action = body.action

    if (!articleId || !action) {
      return NextResponse.json({ error: 'article_id and action required' }, { status: 400 })
    }

    const adminDb = await createAdminClient()

    // Verify the article belongs to this journalist
    const { data: article } = await adminDb
      .from('articles').select('article_id, status, author_id').eq('article_id', articleId).single()
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    if ((article as { author_id: number }).author_id !== (profile as { user_id: number }).user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let newStatus: string | null = null
    if (action === 'submit' && ['draft', 'rejected'].includes((article as { status: string }).status)) {
      newStatus = 'under_review'
    }

    if (!newStatus) {
      return NextResponse.json({ error: 'Cannot perform this action' }, { status: 400 })
    }

    const { error } = await adminDb
      .from('articles').update({ status: newStatus } as never).eq('article_id', articleId)
    if (error) throw error

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[POST /api/articles/update-status]', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
