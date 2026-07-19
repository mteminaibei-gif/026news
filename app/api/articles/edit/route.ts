import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml'

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim()
}

function isValidHttpsUrl(value: string): boolean {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.hostname.includes('..')
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('user_id, role').eq('auth_id', user.id).single()
    if (!profile || !['journalist', 'admin'].includes((profile as { role: string }).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const articleId = Number(body.article_id)
    if (!articleId) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

    const adminDb = await createAdminClient()

    // Verify ownership
    const { data: existing } = await adminDb
      .from('articles').select('article_id, author_id, status').eq('article_id', articleId).single()
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const existingData = existing as unknown as { article_id: number; author_id: number; status: string }
    if (existingData.author_id !== (profile as { user_id: number }).user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existingData.status === 'published') {
      return NextResponse.json({ error: 'Cannot edit published articles' }, { status: 400 })
    }

    const title = sanitize(String(body.title ?? '')).substring(0, 300)
    const content = sanitizeArticleHtml(String(body.content ?? '')).trim().substring(0, 100_000)
    const category_id_input = body.category_id ? Number(body.category_id) : null
    const category_name = sanitize(String(body.category ?? '')).substring(0, 100)
    const rawTags = String(body.tags ?? '')
    const tags: string[] = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20) : []
    const action = body.action === 'submit' ? 'submit' : 'draft'
    const featured_imageRaw = String(body.featured_image ?? '').substring(0, 1000)
    const featured_image = isValidHttpsUrl(featured_imageRaw) ? featured_imageRaw : null
    const excerpt = String(body.excerpt ?? '').trim().substring(0, 500)
    const source_reference = String(body.source_reference ?? '').substring(0, 500)
    const monetization_type = ['free', 'sponsored', 'ad'].includes(String(body.monetization_type)) ? String(body.monetization_type) : 'free'

    if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 })

    // Resolve category_id
    let finalCategoryId: number | null = category_id_input || null
    if (!finalCategoryId && category_name) {
      const { data: rawCat } = await supabase
        .from('categories').select('category_id').eq('name', category_name).single()
      const cat = rawCat as unknown as { category_id: number } | null
      finalCategoryId = cat?.category_id ?? null
    }

    const newStatus = action === 'submit' ? 'under_review' : 'draft'
    const slug = slugify(title)

    const { error } = await adminDb
      .from('articles')
      .update({
        title, slug, content, excerpt,
        category_id: finalCategoryId,
        tags: tags.length > 0 ? tags : null,
        featured_image,
        source_reference: source_reference || null,
        monetization_type,
        status: newStatus,
      } as never)
      .eq('article_id', articleId)

    if (error) throw error

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[POST /api/articles/edit]', err)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}
