import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

// GET /api/articles
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status') ?? 'published'
  const authorId = searchParams.get('author_id')
  const limit    = Number(searchParams.get('limit') ?? '20')
  const offset   = Number(searchParams.get('offset') ?? '0')
  const sort     = searchParams.get('sort') ?? 'recent' // 'trending' or 'recent'

  try {
    const supabase = await createClient()

    // Build query — cast to never to avoid generated-type column mismatches
    let query = supabase
      .from('articles')
      .select(
        '*, author:users(user_id,name,profile_image,bio), category:categories(name), analytics(views,likes,shares,comments_count)',
        { count: 'exact' }
      )
      .eq('status', status as never)
      .range(offset, offset + limit - 1)

    // Apply sorting
    if (sort === 'trending') {
      query = query.order('views', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (authorId) query = query.eq('author_id', Number(authorId))

    if (category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', category)
        .single()
      if (cat) query = query.eq('category_id', (cat as unknown as { category_id: number }).category_id)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ articles: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[GET /api/articles]', err)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// POST /api/articles — create new article
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, content, category, source_reference, monetization_type, action, featured_image } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    // Resolve category_id
    const { data: rawCat } = await supabase
      .from('categories').select('category_id').eq('name', category ?? 'Freelance').single()
    const cat = rawCat as unknown as { category_id: number } | null

    // Resolve author user_id from auth email
    const { data: rawProfile } = await supabase
      .from('users').select('user_id').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as { user_id: number } | null

    const slug   = slugify(title)
    const status = action === 'submit' ? 'under_review' : 'draft'

    const insertPayload = {
      title:             title.trim(),
      slug,
      content:           content.trim(),
      category_id:       cat?.category_id ?? null,
      author_id:         profile?.user_id ?? null,
      source_reference:  source_reference ?? null,
      status,
      monetization_type: monetization_type ?? 'free',
      featured_image:    featured_image ?? null,
    }

    const { data: article, error } = await supabase
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
    await supabase
      .from('analytics')
      .insert({ article_id: articleRow.article_id, views: 0, likes: 0, shares: 0, comments_count: 0 } as never)

    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    console.error('[POST /api/articles]', err)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
