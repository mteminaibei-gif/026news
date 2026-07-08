/**
 * Supabase Edge Function: aggregate-feeds
 *
 * Pulls RSS/API feeds from external news sources (CNN, Al Jazeera, BBC, Reuters, Guardian)
 * Parses articles, checks for duplicates via content hash, and inserts into the articles table.
 *
 * Deploy:  supabase functions deploy aggregate-feeds
 * Schedule: Set a cron job in Supabase Dashboard → Edge Functions → Schedule
 *           Recommended: every 3-6 hours: "0 */6 * * *"
 *
 * Invoke manually:
 *   curl -X POST https://<your-project>.supabase.co/functions/v1/aggregate-feeds \
 *     -H "Authorization: Bearer $(supabase secrets list --raw | grep service_role)"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Hardcoded feeds for major news sources
const FEEDS = [
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
  { name: 'BBC News', url: 'http://feeds.bbc.co.uk/news/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/feeds/all.xml' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&sort=best' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
]

interface RssItem {
  title:       string
  link:        string
  description: string
  pubDate:     string
  enclosure?:  { url: string }
}

// ─── Hash article for deduplication ──────────────────────────────────────────
async function hashArticle(title: string, link: string): Promise<string> {
  const text = `${title}-${link}`
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Simple RSS parser (no external deps) ─────────────────────────────────────
function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`))
      return m ? (m[1] ?? m[2] ?? '').trim() : ''
    }
    const enclosureUrl = (block.match(/enclosure[^>]+url="([^"]+)"/) ?? [])[1]

    items.push({
      title:       get('title'),
      link:        get('link'),
      description: get('description'),
      pubDate:     get('pubDate'),
      enclosure:   enclosureUrl ? { url: enclosureUrl } : undefined,
    })
  }
  return items
}

// ─── Slugify ─────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100)
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let totalInserted = 0
  const results: Record<string, number> = {}
  const errors: string[] = []

  for (const feed of FEEDS) {
    results[feed.name] = 0
    try {
      // 1. Fetch RSS feed with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: { 'User-Agent': '026News/1.0 (Aggregator)' },
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        errors.push(`${feed.name}: HTTP ${response.status}`)
        continue
      }

      const xml = await response.text()
      const items = parseRss(xml).slice(0, 10) // Max 10 items per feed

      for (const item of items) {
        if (!item.title || !item.link) continue

        const slug = slugify(item.title)
        const contentHash = await hashArticle(item.title, item.link)

        // 2. Check if article exists (by hash)
        const { data: existing, error: checkErr } = await supabase
          .from('articles')
          .select('article_id')
          .eq('content_hash', contentHash)
          .maybeSingle()

        if (existing) continue // Skip duplicates

        // 3. Insert new article
        const { error: insertErr } = await supabase.from('articles').insert({
          title: item.title.slice(0, 255),
          slug,
          content: (item.description || item.title).slice(0, 5000),
          source_name: feed.name,
          source_url: item.link,
          content_hash: contentHash,
          status: 'published',
          views: 0,
          featured_image: item.enclosure?.url ?? null,
          // author_id is NULL for aggregated content
        })

        if (insertErr) {
          errors.push(`${feed.name} (${item.title.slice(0, 50)}): ${insertErr.message}`)
          continue
        }

        results[feed.name]++
        totalInserted++
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      errors.push(`${feed.name}: ${errMsg}`)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      totalInserted,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
