/**
 * Seed RSS feeds for 026NEWS — verified URLs from the July 2024 audit.
 * Run:  npx tsx --env-file=.env.local scripts/seed_rss_feeds.ts
 *
 * Sources are organised by tier (1 = highest priority).
 * See RSS_FEEDS_AUDIT.md for the full audit report.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

interface FeedEntry { name: string; url: string; priority: number }

const FEEDS_BY_CATEGORY: Record<string, FeedEntry[]> = {
  'Kenya': [
    // ── Tier 1: Premium Kenyan News (Priority 95) ──
    { name: 'Nation Africa — Top Stories',     url: 'https://nation.africa/kenya/feed.xml',              priority: 95 },
    { name: 'Nation Africa — Business',        url: 'https://nation.africa/kenya/business/feed.xml',    priority: 95 },
    { name: 'Nation Africa — Politics',        url: 'https://nation.africa/kenya/politics/feed.xml',    priority: 95 },
    { name: 'Nation Africa — Sports',          url: 'https://nation.africa/kenya/sports/feed.xml',      priority: 95 },
    { name: 'Nation Africa — Technology',      url: 'https://nation.africa/kenya/tech/feed.xml',        priority: 95 },
    { name: 'The Standard — Kenya News',       url: 'https://www.standardmedia.co.ke/feeds/news.xml',   priority: 95 },
    { name: 'The Standard — Business',         url: 'https://www.standardmedia.co.ke/feeds/business.xml', priority: 95 },
    { name: 'The Standard — Sports',           url: 'https://www.standardmedia.co.ke/feeds/sports.xml',  priority: 95 },
    { name: 'KBC — Kenya News',                url: 'https://www.kbc.co.ke/category/kenya-news/feed/',  priority: 95 },
    { name: 'KBC — Business',                  url: 'https://www.kbc.co.ke/category/business/feed/',    priority: 95 },
    { name: 'Citizen Digital — Top Stories',   url: 'https://www.citizen.digital/feed',                 priority: 95 },
    { name: 'Citizen Digital — Politics',      url: 'https://www.citizen.digital/category/politics/feed', priority: 95 },
    // ── Tier 2: Quality Kenyan Media (Priority 80-89) ──
    { name: 'The Star Kenya — News',           url: 'https://www.the-star.co.ke/rss/',                  priority: 85 },
    { name: 'The Star Kenya — Business',       url: 'https://www.the-star.co.ke/rss/business/',         priority: 85 },
    { name: 'Capital FM — News',              url: 'https://www.capitalfm.co.ke/news/feed/',           priority: 85 },
    { name: 'Capital FM — Business',           url: 'https://www.capitalfm.co.ke/business/feed/',       priority: 85 },
    { name: 'Business Daily Africa',           url: 'https://businessdailyafrica.com/feed/',             priority: 80 },
    // ── Tier 3: Pan-African with Kenya focus ──
    { name: 'AllAfrica — Kenya Stories',       url: 'https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf', priority: 65 },
  ],
  'Africa': [
    { name: 'BBC News — Africa',               url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', priority: 50 },
    { name: 'AllAfrica — East Africa',         url: 'https://allafrica.com/tools/headlines/rdf/eastafrica/headlines.rdf', priority: 65 },
    { name: 'Quartz Africa',                   url: 'https://qz.com/africa/feed',                       priority: 60 },
    { name: 'The East African',                url: 'https://www.theeastafrican.co.ke/tea/rss/',         priority: 60 },
    { name: 'Africanews',                      url: 'https://www.africanews.com/feed/',                  priority: 55 },
  ],
  'World': [
    { name: 'BBC News — World',                url: 'https://feeds.bbci.co.uk/news/world/rss.xml',       priority: 45 },
    { name: 'Al Jazeera English',              url: 'https://www.aljazeera.com/xml/rss/all.xml',         priority: 40 },
    { name: 'NPR News',                        url: 'https://feeds.npr.org/1001/rss.xml',               priority: 40 },
  ],
  'Business': [
    { name: 'BBC News — Business',             url: 'https://feeds.bbci.co.uk/news/business/rss.xml',    priority: 40 },
    { name: 'Stratechery',                     url: 'https://stratechery.com/feed/',                    priority: 25 },
  ],
  'Technology': [
    { name: 'Techweez — Kenya Tech',           url: 'https://techweez.com/feed/',                       priority: 80 },
    { name: 'AllAfrica — Technology',          url: 'https://allafrica.com/tools/headlines/rdf/technology/headlines.rdf', priority: 50 },
    { name: 'BBC News — Technology',           url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',  priority: 35 },
    { name: 'TechCrunch',                      url: 'https://techcrunch.com/feed/',                     priority: 25 },
    { name: 'The Verge',                       url: 'https://www.theverge.com/rss/index.xml',            priority: 25 },
    { name: 'Wired',                           url: 'https://www.wired.com/feed/rss',                    priority: 25 },
    { name: 'Ars Technica',                    url: 'https://feeds.arstechnica.com/arstechnica/index',   priority: 25 },
    { name: 'HackerNoon',                      url: 'https://hackernoon.com/feed',                      priority: 20 },
    { name: 'MIT Technology Review',           url: 'https://www.technologyreview.com/feed/',            priority: 20 },
  ],
  'Sports': [
    { name: 'BBC Sport',                       url: 'https://feeds.bbci.co.uk/sport/rss.xml',            priority: 40 },
  ],
  'Science': [
    { name: 'BBC News — Science',              url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', priority: 35 },
    { name: 'NASA Breaking News',              url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',    priority: 20 },
    { name: 'Quanta Magazine',                 url: 'https://www.quantamagazine.org/feed/',             priority: 20 },
    { name: 'ScienceDaily',                    url: 'https://www.sciencedaily.com/rss/all.xml',          priority: 20 },
  ],
  'Health': [
    { name: 'BBC Health',                      url: 'https://feeds.bbci.co.uk/news/health/rss.xml',      priority: 40 },
  ],
  'Entertainment': [
    { name: 'BBC Entertainment',               url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', priority: 40 },
    { name: 'Variety',                         url: 'https://variety.com/feed/',                        priority: 30 },
  ],
}

async function main() {
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('category_id, name')

  if (catErr || !cats) {
    console.error('Failed to fetch categories:', catErr?.message)
    process.exit(1)
  }

  console.log(`Found ${cats.length} categories:`, (cats as any[]).map((c: any) => c.name).join(', '))

  let inserted = 0
  let skipped = 0
  const seenUrls = new Set<string>()

  for (const [categoryName, feeds] of Object.entries(FEEDS_BY_CATEGORY)) {
    const cat = (cats as any[]).find(
      (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
    )

    if (!cat) {
      console.warn(`⚠  Category "${categoryName}" not found — skipping ${feeds.length} feeds`)
      continue
    }

    for (const feed of feeds) {
      if (seenUrls.has(feed.url)) {
        console.log(`⏩  Duplicate URL skipped: ${feed.name}`)
        skipped++
        continue
      }
      seenUrls.add(feed.url)

      const { data: existing } = await supabase
        .from('rss_feeds')
        .select('feed_id')
        .eq('feed_url', feed.url)
        .maybeSingle()

      if (existing) {
        console.log(`⏭  Already exists: ${feed.name}`)
        skipped++
        continue
      }

      const { error } = await supabase.from('rss_feeds').insert({
        name: feed.name,
        feed_url: feed.url,
        category_id: cat.category_id,
        is_active: true,
        priority: feed.priority,
        fetch_count: 0,
      } as never)

      if (error) {
        console.error(`✖ Failed to insert ${feed.name}:`, error.message)
      } else {
        console.log(`✓ Inserted: ${feed.name} → ${categoryName} (priority ${feed.priority})`)
        inserted++
      }
    }
  }

  console.log(`\nDone! ${inserted} feeds inserted, ${skipped} skipped.`)
  console.log('Go to /admin/sources or call /api/cron/fetch-feeds to pull articles.')
}

main().catch(console.error)
