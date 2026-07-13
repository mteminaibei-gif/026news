import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/utils'
import { fetchFullArticleContent } from '@/lib/rss/fulltext'
import crypto from 'crypto'

// ── Types ─────────────────────────────────────────────────────
type Feed = { feed_id: number; name: string; feed_url: string; category_id: number | null }
type RssItem = { title: string; link: string; description: string; pubDate: string; imageUrl: string | null }

// ── Helpers ───────────────────────────────────────────────────
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
  for (const match of itemMatches) {
    const block = match[1]
    const title = decode(extract(block, 'title'))
    const link = extract(block, 'link') || extract(block, 'guid')
    const desc = decode(stripHtml(extract(block, 'description') || extract(block, 'summary')))
    const pubDate = extract(block, 'pubDate') || extract(block, 'published') || new Date().toISOString()

    const enclosure = block.match(/enclosure[^>]+url="([^"]+)"/i)
    const mediaContent = block.match(/media:content[^>]+url="([^"]+)"/i)
    const mediaThumbnail = block.match(/media:thumbnail[^>]+url="([^"]+)"/i)
    const imgInDesc = (extract(block, 'description') || '').match(/<img[^>]+src="([^"]+)"/i)

    const imageUrl = enclosure?.[1] ?? mediaContent?.[1] ?? mediaThumbnail?.[1] ?? imgInDesc?.[1] ?? null

    if (title && link) {
      items.push({ title: title.substring(0, 300), link, description: desc.substring(0, 1000), pubDate, imageUrl })
    }
  }
  return items
}

function extract(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')) ||
            block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const html = await res.text()
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    return ogMatch?.[1] ? decode(ogMatch[1]) : null
  } catch {
    return null
  }
}

function contentHash(title: string, url: string): string {
  return crypto.createHash('sha256').update(`${title}|${url}`).digest('hex').substring(0, 32)
}

function makeUniqueSlug(title: string, hash: string): string {
  return `${slugify(title).substring(0, 60)}-${hash.substring(0, 8)}`
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Use anon client for auth check
  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON)

  // Check admin authorization via auth header
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })
  }

  // Check user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is admin using anon client (we'll use service role for writes)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email ?? '')
    .single()

  if (!userData || userData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // Get current article count before fetch
  const { count: articlesBefore } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  // Use service-role client for bulk operations
  const adminSupabase = createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  // Find bot user
  const { data: botUser } = await adminSupabase
    .from('users')
    .select('user_id')
    .eq('email', 'bot@026news.com')
    .single()
  const botAuthorId = (botUser as { user_id: number } | null)?.user_id ?? null

  // Fetch active RSS feeds
  const { data: rawFeeds } = await adminSupabase
    .from('rss_feeds')
    .select('feed_id, name, feed_url, category_id')
    .eq('is_active', true)
  const feeds = (rawFeeds ?? []) as unknown as Feed[]

  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0
  const results: Record<string, string> = {}

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 026NewsBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        results[feed.name] = `HTTP ${res.status}`
        totalErrors++
        continue
      }

      const xml = await res.text()
      const items = parseRssXml(xml).slice(0, 20)

      let inserted = 0
      let skipped = 0

      for (const item of items) {
        const hash = contentHash(item.title, item.link)
        const slug = makeUniqueSlug(item.title, hash)

        const { data: existing } = await adminSupabase
          .from('articles')
          .select('article_id')
          .eq('content_hash', hash)
          .maybeSingle()

        if (existing) { skipped++; continue }

        let finalImageUrl = item.imageUrl
        if (!finalImageUrl && item.link) {
          finalImageUrl = await fetchOgImage(item.link)
        }

        // Pull the full article body when the feed only supplies a short summary
        let fullContent: string | null = null
        if (item.description.length < 600) {
          fullContent = await fetchFullArticleContent(item.link)
        }
        const contentText = fullContent || item.description || item.title
        const excerptText = (item.description || fullContent || '').substring(0, 200)
        const pubDate = new Date(item.pubDate)
        const publishedAt = isNaN(pubDate.getTime()) ? new Date() : pubDate

        const { error: insertError } = await adminSupabase
          .from('articles')
          .insert({
            title: item.title,
            slug,
            content: contentText,
            excerpt: excerptText,
            source_reference: item.link,
            source_url: item.link,
            source_name: feed.name,
            content_hash: hash,
            is_aggregated: true,
            category_id: feed.category_id,
            author_id: botAuthorId,
            status: 'published',
            monetization_type: 'free',
            featured_image: finalImageUrl,
            featured: false,
            published_at: publishedAt.toISOString(),
          } as never)

        if (insertError) {
          if (insertError.code === '23505') { skipped++ }
          else { console.error(`insert error:`, insertError.message) }
        } else {
          inserted++
        }
      }

      totalInserted += inserted
      totalSkipped += skipped
      results[feed.name] = `+${inserted} inserted, ${skipped} skipped`

      await adminSupabase
        .from('rss_feeds')
        .update({ last_fetched: new Date().toISOString(), last_error: null } as never)
        .eq('feed_id', feed.feed_id)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      results[feed.name] = `ERROR: ${msg}`
      totalErrors++
    }
  }

  // Get new article count after fetch
  const { count: articlesAfter } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    ok: true,
    feeds: feeds.length,
    inserted: totalInserted,
    skipped: totalSkipped,
    errors: totalErrors,
    results,
    articlesBefore: articlesBefore ?? 0,
    articlesAfter: articlesAfter ?? 0,
    newArticles: (articlesAfter ?? 0) - (articlesBefore ?? 0),
    timestamp: new Date().toISOString(),
  })
}