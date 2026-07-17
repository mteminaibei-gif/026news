import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { slugify } from '@/lib/utils'

// GET /api/admin/articles/[id] — full article payload for the SEO analyzer
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const { id } = await params
    const articleId = Number(id)
    if (!articleId) return NextResponse.json({ error: 'Invalid article id' }, { status: 400 })

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('articles')
      .select('article_id, title, slug, content, excerpt, tags, featured_image, status, category_id, author:users(name)')
      .eq('article_id', articleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      throw error
    }

    return NextResponse.json({ article: data })
  } catch (err) {
    console.error('[GET /api/admin/articles/[id]]', err)
    return NextResponse.json({ error: 'Failed to load article' }, { status: 500 })
  }
}


