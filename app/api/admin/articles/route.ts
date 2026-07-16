import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Profile = { user_id: number; role: string }

// GET /api/admin/articles — list all articles with filtering & pagination
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role').eq('auth_id', user.id).single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const category = url.searchParams.get('category_id')
    const search = url.searchParams.get('search')
    const tag = url.searchParams.get('tag')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25))
    const offset = (page - 1) * limit

    const adminDb = await createAdminClient()

    let query = adminDb
      .from('articles')
      .select('article_id, title, slug, status, featured_image, views, earnings, created_at, published_at, is_aggregated, source_name, category_id, author_id, tags, excerpt, like_count, share_count, save_count, featured, author:users(user_id, name, profile_image), category:categories(name, slug)', { count: 'exact' })

    if (status === 'expired') {
      query = query.lt('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).eq('status', 'published')
    } else if (status) {
      query = query.eq('status', status)
    }

    if (type === 'inhouse') query = query.eq('is_aggregated', false)
    else if (type === 'sourced') query = query.eq('is_aggregated', true)

    if (category) query = query.eq('category_id', Number(category))

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      articles: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err) {
    console.error('[GET /api/admin/articles]', err)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// PATCH /api/admin/articles — bulk update status, category, tags, featured, expire
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('user_id, role').eq('auth_id', user.id).single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { ids, action, status, category_id, tags, featured } = body as {
      ids: number[]
      action?: string
      status?: string
      category_id?: number | null
      tags?: string[]
      featured?: boolean
    }

    if (!ids?.length) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const adminDb = await createAdminClient()

    // Build update payload
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (action === 'approve' || status) {
      update.status = action === 'approve' ? 'published' : status
      if (update.status === 'published') update.published_at = new Date().toISOString()
    } else if (action === 'reject') {
      update.status = 'rejected'
    } else if (action === 'expire') {
      update.status = 'expired'
    } else if (action === 'feature') {
      update.featured = featured ?? true
    } else if (action === 'unfeature') {
      update.featured = false
    }

    if (category_id !== undefined) update.category_id = category_id
    if (tags !== undefined) update.tags = tags

    // Batch update articles
    let updated = 0
    if (ids.length > 0) {
      const { error } = await adminDb
        .from('articles')
        .update(update as never)
        .in('article_id', ids)
      if (!error) updated = ids.length
    }

    // Handle bulk delete — batch with .in() per child table
    if (action === 'delete' && ids.length > 0) {
      updated = 0
      await adminDb.from('analytics').delete().in('article_id', ids)
      await adminDb.from('comments').delete().in('article_id', ids)
      await adminDb.from('review_workflow').delete().in('article_id', ids)
      await adminDb.from('earnings').delete().in('article_id', ids)
      await adminDb.from('article_tag_mappings').delete().in('article_id', ids)
      const { error } = await adminDb.from('articles').delete().in('article_id', ids)
      if (!error) updated = ids.length
    }

    // Also handle single article PATCH (backwards compat)
    if (!ids.length && body.id) {
      const singleUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (status) singleUpdate.status = status
      if (category_id !== undefined) singleUpdate.category_id = category_id
      if (tags !== undefined) singleUpdate.tags = tags
      if (featured !== undefined) singleUpdate.featured = featured
      const { error } = await adminDb
        .from('articles')
        .update(singleUpdate as never)
        .eq('article_id', body.id)
      if (error) throw error
      updated = 1
    }

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('PUBLISH_LIMIT_REACHED')) {
      return NextResponse.json(
        { error: 'Publish limit reached. Raise the limit in the dashboard.' },
        { status: 429 },
      )
    }
    console.error('[PATCH /api/admin/articles]', err)
    return NextResponse.json({ error: 'Failed to update articles' }, { status: 500 })
  }
}

// DELETE /api/admin/articles?id=123 — admin delete an article
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role').eq('auth_id', user.id).single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const adminDb = await createAdminClient()

    await adminDb.from('analytics').delete().eq('article_id', Number(id))
    await adminDb.from('comments').delete().eq('article_id', Number(id))
    await adminDb.from('review_workflow').delete().eq('article_id', Number(id))
    await adminDb.from('earnings').delete().eq('article_id', Number(id))
    await adminDb.from('article_tag_mappings').delete().eq('article_id', Number(id))

    const { error } = await adminDb.from('articles').delete().eq('article_id', Number(id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/articles]', err)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}
