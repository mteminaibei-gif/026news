import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/utils'
import { fetchFullArticleContent } from '@/lib/rss/fulltext'
import crypto from 'crypto'

// ── Types ─────────────────────────────────────────────────────
type Feed = { feed_id: number; name: string; feed_url: string; category_id: number | null }
type RssItem = { title: string; link: string; description: string; pubDate: string; imageUrl: string | null }

// ── Helpers ───────────────────────────────────────────────────
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = []
  // Extract <item>…</item> blocks
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
  for (const match of itemMatches) {
    const block = match[1]

    const title   = decode(extract(block, 'title'))
    const link    = extract(block, 'link') || extract(block, 'guid')
    const desc    = decode(stripHtml(extract(block, 'description') || extract(block, 'summary')))
    const pubDate = extract(block, 'pubDate') || extract(block, 'published') || new Date().toISOString()

    // Try to find an image in enclosure, media:content, media:thumbnail, or og image in description
    const enclosure  = block.match(/enclosure[^>]+url="([^"]+)"/i)
    const mediaContent = block.match(/media:content[^>]+url="([^"]+)"/i)
    const mediaThumbnail = block.match(/media:thumbnail[^>]+url="([^"]+)"/i)
    const imgInDesc  = (extract(block, 'description') || '').match(/<img[^>]+src="([^"]+)"/i)

    const imageUrl = enclosure?.[1] ?? mediaContent?.[1] ?? mediaThumbnail?.[1] ?? imgInDesc?.[1] ?? null

    if (title && link) {
      items.push({ title: title.substring(0, 300), link, description: desc.substring(0, 1000), pubDate, imageUrl })
    }
  }
  return items
}

function extract(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
         || block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const html = await res.text()

    // Match <meta property="og:image" content="..." /> or <meta content="..." property="og:image" />
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)

    if (ogMatch?.[1]) {
      return decode(ogMatch[1])
    }
    return null
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
// Secured by CRON_SECRET header — set this as an env var and add
// it to your Vercel cron job Authorization header.
export async function GET(req: NextRequest) {
  const authHeader  = req.headers.get('authorization')
  const vercelCron  = req.headers.get('x-vercel-cron') // Vercel sends this on cron invocations
  const cronSecret  = process.env.CRON_SECRET

  // Allow if:
  // 1. No CRON_SECRET set (open — local dev / first deploy)
  // 2. Valid Authorization: Bearer <secret> header
  // 3. Request came from Vercel's own cron runner (x-vercel-cron present)
  const isAuthorized =
    !cronSecret ||
    authHeader === `Bearer ${cronSecret}` ||
    vercelCron === '1'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service-role client to bypass RLS for bulk inserts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Find a default "aggregated" author — look for user with name "News Bot"
  // (create one in your DB: INSERT INTO users(name,email,role,password_hash) VALUES('News Bot','bot@026news.com','journalist',''))
  const { data: botUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', 'bot@026news.com')
    .single()
  const botAuthorId = (botUser as { user_id: number } | null)?.user_id ?? null

  // Fetch active RSS feeds
  const { data: rawFeeds } = await supabase
    .from('rss_feeds')
      .select('feed_id, name, feed_url, category_id, error_count')
    .eq('is_active', true)
  const feeds = (rawFeeds ?? []) as unknown as Feed[]

  let totalInserted  = 0
  let totalSkipped   = 0
  let totalErrors    = 0
  const results: Record<string, string> = {}

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 026NewsBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        const errorMsg = `HTTP ${res.status}`
        results[feed.name] = `ERROR: ${errorMsg}`
        totalErrors++
        await supabase.from('rss_feeds')
          .update({ last_error: errorMsg, error_count: ((feed as { error_count?: number }).error_count ?? 0) + 1 } as never)
          .eq('feed_id', feed.feed_id)
        continue
      }

      const xml   = await res.text()
      const items = parseRssXml(xml).slice(0, 20) // max 20 per feed per run

      let inserted = 0
      let skipped  = 0

      for (const item of items) {
        const hash = contentHash(item.title, item.link)
        const slug = makeUniqueSlug(item.title, hash)

        // Check for duplicate
        const { data: existing } = await supabase
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

        // Insert new article (auto-published — aggregated content goes live immediately)
        const { error: insertError } = await supabase
          .from('articles')
          .insert({
            title:             item.title,
            slug,
            content:           contentText,
            excerpt:           excerptText,
            source_reference:  item.link,
            source_url:        item.link,
            source_name:       feed.name,
            content_hash:      hash,
            is_aggregated:     true,
            category_id:       feed.category_id,
            author_id:         botAuthorId,
            status:            'published',
            monetization_type: 'free',
            featured_image:    finalImageUrl,
            featured:          false,
            published_at:      publishedAt.toISOString(),
          } as never)

        if (insertError) {
          if (insertError.code === '23505') { skipped++ } // duplicate slug/hash
          else { console.error(`[fetch-feeds] insert error for "${item.title}":`, insertError.message) }
        } else {
          inserted++
        }
      }

      totalInserted += inserted
      totalSkipped  += skipped
      results[feed.name] = `+${inserted} inserted, ${skipped} skipped`

      // Update last_fetched
      await supabase
        .from('rss_feeds')
        .update({ last_fetched: new Date().toISOString(), last_error: null } as never)
        .eq('feed_id', feed.feed_id)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      results[feed.name] = `ERROR: ${msg}`
      totalErrors++
      await supabase
        .from('rss_feeds')
        .update({ last_error: msg } as never)
        .eq('feed_id', feed.feed_id)
    }
  }

  return NextResponse.json({
    ok: true,
    feeds: feeds.length,
    inserted: totalInserted,
    skipped:  totalSkipped,
    errors:   totalErrors,
    results,
    timestamp: new Date().toISOString(),
  })
}
