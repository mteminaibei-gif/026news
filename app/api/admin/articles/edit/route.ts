import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { slugify } from '@/lib/utils'

// POST /api/admin/articles/edit — admin creates a new article
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const supabase = await createClient()

    const { title, content, excerpt, category_id, featured_image, monetization_type, status, author_id, tags, source_reference } = await req.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const slug = slugify(title)
    const tagsArray = tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean).slice(0, 20) : null

    const insertPayload = {
      title:             title.trim(),
      slug,
      content:           content.trim(),
      excerpt:           excerpt?.trim() || content.trim().substring(0, 200),
      category_id:       category_id ?? null,
      author_id:         author_id ?? admin.userId,
      featured_image:    featured_image ?? null,
      monetization_type: monetization_type ?? 'free',
      status:            status ?? 'draft',
      is_aggregated:     false,
      published_at:      status === 'published' ? new Date().toISOString() : null,
      tags:              tagsArray,
      source_reference:  source_reference?.trim() || null,
    }

    const adminDb = await createAdminClient()

    const { data: article, error } = await adminDb
      .from('articles')
      .insert(insertPayload as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An article with this title already exists' }, { status: 409 })
      }
      throw error
    }

    // Seed analytics row
    const articleRow = article as unknown as { article_id: number }
    await adminDb
      .from('analytics')
      .insert({ article_id: articleRow.article_id, views: 0, likes: 0, shares: 0, comments_count: 0 } as never)

    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('PUBLISH_LIMIT_REACHED')) {
      return NextResponse.json(
        { error: 'In-house publish limit reached. Raise the limit in the dashboard Publish Limits card.' },
        { status: 429 },
      )
    }
    console.error('[POST /api/admin/articles/edit]', err)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}

// PUT /api/admin/articles/edit — admin updates an existing article
export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const supabase = await createClient()

    const { article_id, title, content, excerpt, category_id, featured_image, monetization_type, status, author_id, tags, source_reference } = await req.json()

    if (!article_id) {
      return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
    }

    const adminDb = await createAdminClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title?.trim()) {
      updatePayload.title = title.trim()
      updatePayload.slug = slugify(title)
    }
    if (content?.trim()) updatePayload.content = content.trim()
    if (excerpt?.trim()) updatePayload.excerpt = excerpt.trim()
    if (category_id !== undefined) updatePayload.category_id = category_id
    if (featured_image !== undefined) updatePayload.featured_image = featured_image
    if (monetization_type) updatePayload.monetization_type = monetization_type
    if (tags !== undefined) {
      updatePayload.tags = tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean).slice(0, 20) : null
    }
    if (source_reference !== undefined) updatePayload.source_reference = source_reference?.trim() || null
    if (status) {
      updatePayload.status = status
      // Set published_at when transitioning to published
      if (status === 'published') {
        const { data: existing } = await adminDb
          .from('articles')
          .select('published_at')
          .eq('article_id', article_id)
          .single()
        if (existing && !(existing as { published_at: string | null }).published_at) {
          updatePayload.published_at = new Date().toISOString()
        }
      }
    }
    if (author_id !== undefined) updatePayload.author_id = author_id

    const { data: article, error } = await adminDb
      .from('articles')
      .update(updatePayload as never)
      .eq('article_id', article_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(article)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('PUBLISH_LIMIT_REACHED')) {
      return NextResponse.json(
        { error: 'In-house publish limit reached. Raise the limit in the dashboard Publish Limits card.' },
        { status: 429 },
      )
    }
    console.error('[PUT /api/admin/articles/edit]', err)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}

// GET /api/admin/articles/edit?id=123 — fetch single article for editing
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const supabase = await createClient()

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const adminDb = await createAdminClient()
    const { data: article, error } = await adminDb
      .from('articles')
      .select('*, author:users(user_id,name,profile_image), category:categories(category_id,name)')
      .eq('article_id', Number(id))
      .single()

    if (error) throw error
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    return NextResponse.json(article)
  } catch (err) {
    console.error('[GET /api/admin/articles/edit]', err)
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}
