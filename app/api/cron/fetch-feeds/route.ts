import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFullArticleContent } from '@/lib/rss/fulltext'
import { curateArticle } from '@/lib/rss/curation'
import { classifyPost } from '@/lib/rss/classify'
import { sendPushToAll } from '@/lib/push/send'
import { parseRssXml, contentHash, makeUniqueSlug, fetchOgImage, normalizeImageUrl } from '@/lib/rss/parser'

// ── Types ─────────────────────────────────────────────────────
type Feed = { feed_id: number; name: string; feed_url: string; category_id: number | null }


// ── Route handler ─────────────────────────────────────────────
// Secured by CRON_SECRET env var. On Vercel (free tier), crons cannot
// send custom headers, so we also trust the internal `x-vercel-cron` header.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const cronSecret = process.env.CRON_SECRET

  const isDevMode = !cronSecret
  const isAuthorized = isDevMode
    ? (console.warn('[cron/fetch-feeds] CRON_SECRET not set — allowing unauthenticated access (dev only)'), true)
    : authHeader === `Bearer ${cronSecret}` || isVercelCron

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service-role client to bypass RLS for bulk inserts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Find a default "aggregated" author — look for user with name "News Assistant"
  // (create one in your DB: INSERT INTO users(name,email,role,password_hash) VALUES('News Assistant','bot@026news.com','journalist',''))
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
  const newArticles: { title: string; slug: string; excerpt: string }[] = []

  // Pre-fetch all existing content hashes to avoid N+1 queries
  const { data: existingHashes } = await supabase
    .from('articles')
    .select('content_hash')
    .not('content_hash', 'is', null)
  const existingHashSet = new Set((existingHashes ?? []).map((r: any) => r.content_hash))

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

        // Check for duplicate using pre-fetched set
        if (existingHashSet.has(hash)) { skipped++; continue }

        let finalImageUrl = item.imageUrl
        if (!finalImageUrl && item.link) {
          finalImageUrl = await fetchOgImage(item.link)
        }
        // Normalize: resolve relative URLs, fix double-prefixed domains
        if (finalImageUrl) {
          finalImageUrl = normalizeImageUrl(finalImageUrl, item.link)
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

        // Auto-categorize and generate tags from content
        const { categoryId: autoCategoryId, tags } = curateArticle(
          item.title,
          contentText,
          feed.category_id,
        )

        // Classify as news or article based on content analysis
        const { postType } = classifyPost({
          title: item.title,
          content: contentText,
          sourceUrl: item.link,
          sourceName: feed.name,
          feedCategoryId: feed.category_id,
        })

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
            category_id:       autoCategoryId,
            author_id:         botAuthorId,
            status:            'published',
            monetization_type: 'free',
            featured_image:    finalImageUrl,
            featured:          false,
            published_at:      publishedAt.toISOString(),
            tags:              tags,
            post_type:         postType,
          } as never)

        if (insertError) {
          if (insertError.code === '23505') { skipped++ } // duplicate slug/hash
          else { console.error(`[fetch-feeds] insert error for "${item.title}":`, insertError.message) }
        } else {
          inserted++
          newArticles.push({ title: item.title, slug, excerpt: excerptText.substring(0, 120) })
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

  // Dispatch push notifications for new articles
  let pushSent = 0
  let pushStale = 0
  const allStaleEndpoints: string[] = []
  if (newArticles.length > 0 && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
      const { data: subs } = await supabase
        .from('push_subscriptions' as never)
        .select('endpoint, p256dh, auth')
      const subscriptions = (subs ?? []) as unknown as { endpoint: string; p256dh: string; auth: string }[]

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'
      for (const article of newArticles.slice(0, 5)) {
        const result = await sendPushToAll(subscriptions, {
          title: `New: ${article.title}`,
          body: article.excerpt || 'Read the full story on 026News',
          url: `${appUrl}/article/${article.slug}`,
        })
        pushSent += result.sent
        pushStale += result.stale
        allStaleEndpoints.push(...result.staleEndpoints)
      }

      // Clean up stale subscriptions
      if (allStaleEndpoints.length > 0) {
        const uniqueStale = [...new Set(allStaleEndpoints)]
        await supabase
          .from('push_subscriptions' as never)
          .delete()
          .in('endpoint', uniqueStale as never)
      }
    } catch (err) {
      console.error('[fetch-feeds] push dispatch error:', err)
    }
  }

  return NextResponse.json({
    ok: true,
    feeds: feeds.length,
    inserted: totalInserted,
    skipped:  totalSkipped,
    errors:   totalErrors,
    pushSent,
    pushStale,
    results,
    timestamp: new Date().toISOString(),
  })
}
