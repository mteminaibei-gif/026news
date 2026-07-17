import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/server-auth'
import { fetchFullArticleContent } from '@/lib/rss/fulltext'
import { curateArticle } from '@/lib/rss/curation'
import { classifyPost } from '@/lib/rss/classify'
import { sendPushToAll } from '@/lib/push/send'
import { parseRssXml, contentHash, makeUniqueSlug, fetchOgImage, normalizeImageUrl } from '@/lib/rss/parser'

// ── Types ─────────────────────────────────────────────────────
type Feed = { feed_id: number; name: string; feed_url: string; category_id: number | null }

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  
  if (!SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })

  // Use service-role client for bulk operations
  const adminSupabase = createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  // Get current article count before fetch
  const { count: articlesBefore } = await adminSupabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

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

  // Respect the admin-set sourced/RSS publish limit (0 = unlimited)
  const { data: limitRow } = await adminSupabase
    .from('site_settings').select('value').eq('key', 'publish_limits').maybeSingle()
  const sourcedLimit = Number((limitRow?.value as { sourced?: number } | null)?.sourced ?? 0)
  const { count: currentSourced } = await adminSupabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('is_aggregated', true).eq('status', 'published')
  let remainingSourced = sourcedLimit > 0 ? Math.max(0, sourcedLimit - (currentSourced ?? 0)) : Number.POSITIVE_INFINITY

  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0
  const results: Record<string, string> = {}
  const newArticles: { title: string; slug: string; excerpt: string }[] = []

  // Pre-fetch all existing content hashes to avoid N+1 queries
  const { data: existingHashes } = await adminSupabase
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

        if (existingHashSet.has(hash)) { skipped++; continue }

        // Stop pulling sourced articles once the admin-set limit is reached
        if (sourcedLimit > 0 && remainingSourced <= 0) {
          skipped++
          results[feed.name] = 'sourced limit reached'
          continue
        }

        let finalImageUrl = item.imageUrl
        if (!finalImageUrl && item.link) {
          finalImageUrl = await fetchOgImage(item.link)
        }
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
            category_id: autoCategoryId,
            author_id: botAuthorId,
            status: 'published',
            monetization_type: 'free',
            featured_image: finalImageUrl,
            featured: false,
            published_at: publishedAt.toISOString(),
            tags: tags,
            post_type: postType,
          } as never)

        if (insertError) {
          if (insertError.code === '23505') { skipped++ }
          else { console.error(`insert error:`, insertError.message) }
        } else {
          inserted++
          newArticles.push({ title: item.title, slug, excerpt: excerptText.substring(0, 120) })
          if (sourcedLimit > 0) remainingSourced--
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
  const { count: articlesAfter } = await adminSupabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  // Dispatch push notifications for new articles
  let pushSent = 0
  let pushStale = 0
  if (newArticles.length > 0 && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
      const { data: subs } = await adminSupabase
        .from('push_subscriptions' as never)
        .select('endpoint, p256dh, auth')
      const subscriptions = (subs ?? []) as unknown as { endpoint: string; p256dh: string; auth: string }[]

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'
      const allStaleEndpoints: string[] = []
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

      if (allStaleEndpoints.length > 0) {
        const uniqueStale = [...new Set(allStaleEndpoints)]
        await adminSupabase
          .from('push_subscriptions' as never)
          .delete()
          .in('endpoint', uniqueStale as never)
      }
    } catch (err) {
      console.error('[admin/fetch-feeds] push dispatch error:', err)
    }
  }

  return NextResponse.json({
    ok: true,
    feeds: feeds.length,
    inserted: totalInserted,
    skipped: totalSkipped,
    errors: totalErrors,
    pushSent,
    pushStale,
    results,
    articlesBefore: articlesBefore ?? 0,
    articlesAfter: articlesAfter ?? 0,
    newArticles: (articlesAfter ?? 0) - (articlesBefore ?? 0),
    timestamp: new Date().toISOString(),
  })
}