import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

// ── simple in-process rate limiter ──────────────────────────
const postLimiter = new Map<string, { count: number; reset: number }>()
const GET_LIMIT   = 60  // requests per minute per IP
const POST_LIMIT  = 10

function rateLimit(ip: string, store: Map<string, { count: number; reset: number }>, max: number) {
  const now = Date.now()
  const e   = store.get(ip)
  if (!e || now > e.reset) { store.set(ip, { count: 1, reset: now + 60_000 }); return true }
  if (e.count >= max) return false
  e.count++
  return true
}

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/** Strip tags and control characters from a user-supplied string */
function sanitize(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '') // strip control chars
    .trim()
}

const getLimiter = new Map<string, { count: number; reset: number }>()

// GET /api/articles
export async function GET(req: NextRequest) {
  const ip = getIp(req)
  if (!rateLimit(ip, getLimiter, GET_LIMIT)) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status') ?? 'published'
  const authorId = searchParams.get('author_id')
  const limit    = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
  const offset   = Math.max(Number(searchParams.get('offset') ?? '0'), 0)
  const sort     = searchParams.get('sort') ?? 'recent'

  // Only allow reading published articles via public API
  const allowedStatuses = ['published']
  const safeStatus = allowedStatuses.includes(status) ? status : 'published'

  try {
    const supabase = await createClient()

    let query = supabase
      .from('articles')
      .select(
        '*, author:users(user_id,name,profile_image,bio), category:categories(name)',
        { count: 'exact' }
      )
      .eq('status', safeStatus as never)
      .range(offset, offset + limit - 1)

    query = sort === 'trending'
      ? query.order('views', { ascending: false })
      : query.order('created_at', { ascending: false })

    if (authorId && !isNaN(Number(authorId))) {
      query = query.eq('author_id', Number(authorId))
    }

    if (category) {
      const safeCat = sanitize(category).substring(0, 50)
      const { data: cat } = await supabase
        .from('categories').select('category_id').eq('name', safeCat).single()
      if (cat) query = query.eq('category_id', (cat as unknown as { category_id: number }).category_id)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ articles: data ?? [], total: count ?? 0 }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[GET /api/articles]', err)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// POST /api/articles — create new article (authenticated journalists only)
export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (!rateLimit(ip, postLimiter, POST_LIMIT)) {
    return NextResponse.json({ error: 'Too many requests — slow down.' }, {
      status: 429, headers: { 'Retry-After': '60' },
    })
  }

  // Verify Content-Type to prevent CSRF via form POST
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify this user has journalist or admin role
    const { data: rawRole } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    const profile = rawRole as unknown as { user_id: number; role: string } | null
    if (!profile || !['journalist', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: Record<string, unknown>
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const title              = sanitize(String(body.title ?? '')).substring(0, 300)
    const content            = String(body.content ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim().substring(0, 100_000)
    const category           = sanitize(String(body.category ?? '')).substring(0, 100)
    const source_reference   = String(body.source_reference ?? '').substring(0, 500)
    const monetization_type  = ['free', 'sponsored', 'ad'].includes(String(body.monetization_type))
      ? String(body.monetization_type) : 'free'
    const action             = body.action === 'submit' ? 'submit' : 'draft'
    const featured_image     = String(body.featured_image ?? '').substring(0, 1000) || null
    const rawTags            = String(body.tags ?? '')
    const tags: string[]     = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20) : []

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }
    if (title.length < 5) {
      return NextResponse.json({ error: 'Title must be at least 5 characters' }, { status: 400 })
    }
    if (content.length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 })
    }
    // Validate source URL if provided
    if (source_reference) {
      try { new URL(source_reference) }
      catch { return NextResponse.json({ error: 'source_reference must be a valid URL' }, { status: 400 }) }
    }

    const { data: rawCat } = await supabase
      .from('categories').select('category_id').eq('name', category || 'Kenya').single()
    const cat = rawCat as unknown as { category_id: number } | null

    const slug   = slugify(title)
    const status = action === 'submit' ? 'under_review' : 'draft'
    const excerpt = String(body.excerpt ?? '').trim().substring(0, 500) || content.replace(/<[^>]*>/g, '').substring(0, 200).trim()

    // Use admin client to bypass broken RLS policies (user_id vs auth_id mismatch)
    const adminDb = await createAdminClient()

    const { data: article, error } = await adminDb
      .from('articles')
      .insert({
        title, slug, content,
        excerpt,
        category_id:       cat?.category_id ?? null,
        author_id:         profile.user_id,
        source_reference:  source_reference || null,
        status,
        monetization_type,
        featured_image,
        tags: tags.length > 0 ? tags : null,
      } as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An article with this title already exists' }, { status: 409 })
      }
      throw error
    }

    const articleRow = article as unknown as { article_id: number }

    // Analytics INSERT - non-blocking, wrapped in try/catch
    try {
      await adminDb.from('analytics')
        .insert({ article_id: articleRow.article_id, views: 0, likes: 0, shares: 0, comments_count: 0 } as never)
    } catch {
      console.warn('[POST /api/articles] analytics insert failed (non-blocking)')
    }

    // Send email notification to admins when article is submitted for review
    if (action === 'submit') {
      try {
        const { data: admins } = await adminDb
          .from('users').select('email, name').eq('role', 'admin')
        if (admins?.length) {
          const adminEmails = (admins as { email: string; name: string }[]).map(a => a.email)
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026newsblog.vercel.app'
          await fetch(`${APP_URL}/api/admin/skimmer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminEmails,
              subject: `New Article Submitted: ${title}`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #e23b3b;">New Article Submitted for Review</h2>
                  <p><strong>Title:</strong> ${title}</p>
                  <p><strong>Author:</strong> ${profile ? `User #${profile.user_id}` : 'Unknown'}</p>
                  <p><strong>Category:</strong> ${category || 'Uncategorized'}</p>
                  <p><strong>Status:</strong> Under Review</p>
                  <hr style="border: 1px solid #eee; margin: 16px 0;" />
                  <p><a href="${APP_URL}/admin/review/${articleRow.article_id}" style="background: #e23b3b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Article</a></p>
                </div>
              `,
            }),
          }).catch(() => {})
        }
      } catch {
        // Email failure is non-blocking
      }
    }

    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    console.error('[POST /api/articles]', err)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
