import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/server-auth'
import { slugify } from '@/lib/utils'
import { APP_URL } from '@/lib/constants/app'
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml'
import { autoCategorize, autoExtractTags, optimizeContentLayout } from '@/lib/auto-categorize'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import {
  createArticleSchema,
  articlesFilterSchema,
  formatValidationError,
} from '@/lib/validation'

function isValidHttpsUrl(value: string): boolean {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.hostname.includes('..')
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rateLimitResult = await checkRateLimit(
      `articles:get:${ip}`,
      RATE_LIMITS.PUBLIC_GET.limit,
      RATE_LIMITS.PUBLIC_GET.window
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(RATE_LIMITS.PUBLIC_GET.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
          },
        }
      )
    }

    const { searchParams } = new URL(req.url)
    const filterParams = {
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      author_id: searchParams.get('author_id') ? Number(searchParams.get('author_id')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      sort: searchParams.get('sort') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    }

    const validatedFilters = articlesFilterSchema.parse(filterParams)
    const supabase = await createClient()

    let query = supabase
      .from('articles')
      .select(
        '*, author:users(user_id,name,profile_image,bio), category:categories(name)',
        { count: 'exact' }
      )
      .eq('status', 'published')
      .range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1)

    if (validatedFilters.sort === 'trending') {
      query = query.order('views', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (validatedFilters.author_id) {
      query = query.eq('author_id', validatedFilters.author_id)
    }

    if (validatedFilters.category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', validatedFilters.category)
        .single()

      if (cat) {
        query = query.eq('category_id', (cat as unknown as { category_id: number }).category_id)
      }
    }

    if (validatedFilters.search) {
      query = query.textSearch('search_vector', validatedFilters.search)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json(
      { articles: data ?? [], total: count ?? 0 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-RateLimit-Limit': String(RATE_LIMITS.PUBLIC_GET.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
        },
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatValidationError(error), { status: 400 })
    }
    console.error('[GET /api/articles]', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rateLimitResult = await checkRateLimit(
      `articles:post:${ip}`,
      RATE_LIMITS.PUBLIC_POST.limit,
      RATE_LIMITS.PUBLIC_POST.window
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(RATE_LIMITS.PUBLIC_POST.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      )
    }

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser || !['journalist', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Only journalists and admins can create articles' },
        { status: 403 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validated = createArticleSchema.parse(body)

    const title = sanitizeArticleHtml(validated.title).substring(0, 300)
    const content = sanitizeArticleHtml(validated.content)
    const excerpt = validated.excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200)
    const featured_image = validated.featured_image && isValidHttpsUrl(validated.featured_image)
      ? validated.featured_image
      : null

    let finalCategoryId = validated.category_id

    if (!finalCategoryId && validated.category_name) {
      const { data: cat } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', validated.category_name)
        .single()

      if (cat) {
        finalCategoryId = (cat as unknown as { category_id: number }).category_id
      }
    }

    if (!finalCategoryId) {
      const catResult = autoCategorize({
        title,
        content,
        excerpt,
        tags: validated.tags?.split(',') || [],
      })

      if (catResult.confidence !== 'low') {
        finalCategoryId = catResult.bestCategoryId
      }
    }

    const finalTags = validated.tags
      ? validated.tags.split(',').map(t => t.trim()).filter(Boolean)
      : autoExtractTags(title, content)

    const optimizedContent = optimizeContentLayout(content)
    const slug = slugify(title)
    const status = validated.action === 'submit' ? 'under_review' : 'draft'

    const adminDb = await createAdminClient()

    const { data: article, error } = await adminDb
      .from('articles')
      .insert({
        title,
        slug,
        content: optimizedContent,
        excerpt,
        category_id: finalCategoryId,
        author_id: currentUser.userId,
        source_reference: validated.source_reference || null,
        status,
        monetization_type: validated.monetization_type,
        featured_image,
        tags: finalTags,
      } as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An article with this title already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    const articleRow = article as unknown as { article_id: number }

    try {
      await adminDb.from('analytics')
        .insert({ article_id: articleRow.article_id, views: 0, likes: 0, shares: 0, comments_count: 0 } as never)
    } catch {
      console.warn('[POST /api/articles] analytics insert failed (non-blocking)')
    }

    if (validated.action === 'submit') {
      try {
        const { data: admins } = await adminDb
          .from('users').select('email, name').eq('role', 'admin')
        if (admins?.length) {
          const adminEmails = (admins as { email: string; name: string }[]).map(a => a.email)
          await fetch(`${APP_URL}/api/admin/skimmer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminEmails,
              subject: `New Article Submitted: ${title}`,
              html: `<h2>New Article Submitted for Review</h2>
                <p>Title: ${title}</p>
                <p><a href="${APP_URL}/admin/review/${articleRow.article_id}">Review</a></p>`,
            }),
          }).catch(() => {})
        }
      } catch {
        // Email failure is non-blocking
      }
    }

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatValidationError(error), { status: 400 })
    }
    console.error('[POST /api/articles]', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
