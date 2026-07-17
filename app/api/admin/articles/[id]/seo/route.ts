import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { slugify } from '@/lib/utils'

// PATCH /api/admin/articles/[id]/seo — apply AI SEO recommendations
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const { id } = await params
    const articleId = Number(id)
    if (!articleId) return NextResponse.json({ error: 'Invalid article id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}

    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim().slice(0, 255)
    if (typeof body.excerpt === 'string') updates.excerpt = body.excerpt.trim().slice(0, 500)
    if (typeof body.content === 'string' && body.content.trim()) updates.content = body.content.trim()
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20)
    }
    if (typeof body.slug === 'string' && body.slug.trim()) {
      updates.slug = slugify(body.slug.trim())
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const adminDb = await createAdminClient()
    const { data, error } = await adminDb
      .from('articles')
      .update(updates as never)
      .eq('article_id', articleId)
      .select('article_id, title, slug, excerpt, tags')
      .single()

    if (error) throw error

    return NextResponse.json({ article: data, applied: Object.keys(updates) })
  } catch (err) {
    console.error('[PATCH /api/admin/articles/[id]/seo]', err)
    return NextResponse.json({ error: 'Failed to apply SEO changes' }, { status: 500 })
  }
}
