/**
 * Supabase Edge Function: aggregate-feeds
 *
 * Pulls RSS/API feeds from external news sources stored in the `sources` table,
 * parses articles, and inserts them into the `articles` table with status = 'published'.
 *
 * Deploy:  supabase functions deploy aggregate-feeds
 * Schedule: Set a cron job in Supabase Dashboard → Edge Functions → Schedule
 *           e.g. every 30 minutes: "*/30 * * * *"
 *
 * Invoke manually:
 *   curl -X POST https://pfbudymlpfijhslituwc.supabase.co/functions/v1/aggregate-feeds \
 *     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RssItem {
  title:       string
  link:        string
  description: string
  pubDate:     string
  enclosure?:  { url: string }
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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Fetch active sources
  const { data: sources, error: srcErr } = await supabase
    .from('sources')
    .select('*')
    .eq('status', 'active')

  if (srcErr) {
    return new Response(JSON.stringify({ error: srcErr.message }), { status: 500 })
  }

  let totalInserted = 0
  const errors: string[] = []

  for (const source of (sources ?? [])) {
    try {
      // 2. Fetch RSS feed
      const response = await fetch(source.api_url, {
        headers: { 'User-Agent': '026News Aggregator/1.0' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const xml   = await response.text()
      const items = parseRss(xml).slice(0, 10) // Max 10 items per source per run

      for (const item of items) {
        if (!item.title || !item.link) continue

        const slug = slugify(item.title).slice(0, 200)

        // 3. Skip if slug already exists (deduplication)
        const { data: existing } = await supabase
          .from('articles')
          .select('article_id')
          .eq('slug', slug)
          .maybeSingle()

        if (existing) continue

        // 4. Resolve category — default to "Freelance" for aggregated content
        const { data: cat } = await supabase
          .from('categories')
          .select('category_id')
          .eq('name', 'Freelance')
          .single()

        // 5. Insert article
        const { data: article, error: insertErr } = await supabase
          .from('articles')
          .insert({
            title:            item.title.slice(0, 255),
            slug,
            content:          item.description || item.title,
            category_id:      cat?.category_id ?? null,
            author_id:        null, // aggregated — no author
            source_reference: item.link,
            status:           'published',
            monetization_type:'free',
            featured_image:   item.enclosure?.url ?? null,
          })
          .select('article_id')
          .single()

        if (insertErr) {
          errors.push(`${source.name}: ${insertErr.message}`)
          continue
        }

        // 6. Create analytics row
        await supabase.from('analytics').insert({
          article_id: article.article_id,
          views: 0, likes: 0, shares: 0, comments_count: 0,
        })

        totalInserted++
      }

      // 7. Update last_fetched timestamp
      await supabase
        .from('sources')
        .update({ last_fetched: new Date().toISOString() })
        .eq('source_id', source.source_id)

    } catch (err) {
      errors.push(`${source.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return new Response(
    JSON.stringify({ inserted: totalInserted, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
