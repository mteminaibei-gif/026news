import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileResult = await supabase
      .from('users').select('user_id, role').eq('auth_id', user.id).single()
    const profile = profileResult.data as unknown as { user_id: number; role: string } | null
    if (!profile || !['journalist', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const articleId = Number(body.article_id)
    const categoryId = Number(body.category_id)

    if (!articleId || !categoryId) {
      return NextResponse.json({ error: 'article_id and category_id required' }, { status: 400 })
    }

    const adminDb = await createAdminClient()

    const { data: existing } = await adminDb
      .from('articles').select('article_id, author_id').eq('article_id', articleId).single()
    const existData = existing as unknown as { article_id: number; author_id: number } | null
    if (!existData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existData.author_id !== profile.user_id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminDb
      .from('articles').update({ category_id: categoryId } as never).eq('article_id', articleId)
    if (error) throw error

    return NextResponse.json({ ok: true, category_id: categoryId })
  } catch (err) {
    console.error('[PATCH /api/articles/categorize]', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}
