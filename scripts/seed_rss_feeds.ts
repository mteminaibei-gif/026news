/**
 * Seed RSS feeds for 026NEWS — Real, active feeds covering Kenya,
 * East Africa, Africa, World, Sports, Tech, Business & Health.
 * Run:  npx tsx --env-file=.env.local scripts/seed_rss_feeds.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Map category names exactly as they appear in your DB
const CATEGORY_MAP: Record<string, { name: string; url: string }[]> = {
  'Kenya': [
    { name: 'Nation Africa Kenya', url: 'https://nation.africa/kenya/rss.xml' },
    { name: 'The Standard Kenya', url: 'https://www.standardmedia.co.ke/rss/latest_news.php' },
    { name: 'Citizen Digital Kenya', url: 'https://www.citizen.digital/rss' },
    { name: 'Tuko Kenya', url: 'https://www.tuko.co.ke/rss' },
    { name: 'Capital FM Kenya', url: 'https://www.capitalfm.co.ke/news/feed/' },
    { name: 'KBC Kenya', url: 'https://www.kbc.co.ke/feed/' },
    { name: 'Business Daily Africa', url: 'https://www.businessdailyafrica.com/rss.xml' },
    { name: 'The East African', url: 'https://www.theeastafrican.co.ke/rss.xml' },
  ],
  'Africa': [
    { name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml' },
    { name: 'Al Jazeera Africa', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'AllAfrica', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
    { name: 'African Arguments', url: 'https://africanarguments.org/feed/' },
    { name: 'The Africa Report', url: 'https://www.theafricareport.com/feed/' },
    { name: 'Quartz Africa', url: 'https://qz.com/africa/rss' },
  ],
  'World': [
    { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldnews' },
    { name: 'AP World News', url: 'https://rsshub.app/apnews/topics/world-news' },
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'France24 English', url: 'https://www.france24.com/en/rss' },
    { name: 'DW World', url: 'https://rss.dw.com/rdf/rss-en-world' },
  ],
  'Politics': [
    { name: 'BBC Politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml' },
    { name: 'The East African Politics', url: 'https://www.theeastafrican.co.ke/rss.xml' },
    { name: 'Daily Nation Politics', url: 'https://nation.africa/kenya/politics/rss.xml' },
  ],
  'Business': [
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessnews' },
    { name: 'Bloomberg Feed', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { name: 'Business Daily Africa', url: 'https://www.businessdailyafrica.com/rss.xml' },
    { name: 'CNBC Business', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html' },
    { name: 'Quartz Business', url: 'https://qz.com/rss' },
  ],
  'Technology': [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { name: 'Disrupt Africa Tech', url: 'https://disrupt-africa.com/feed/' },
    { name: 'Techpoint Africa', url: 'https://techpoint.africa/feed/' },
  ],
  'Sports': [
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
    { name: 'ESPN FC', url: 'https://www.espn.com/espn/rss/soccer/news' },
    { name: 'Goal.com', url: 'https://www.goal.com/feeds/en/news' },
    { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040' },
    { name: 'SuperSport Africa', url: 'https://www.supersport.com/rss/news' },
    { name: 'KPL Kenya Premier League', url: 'https://www.kpl.co.ke/feed' },
  ],
  'Health': [
    { name: 'WHO News', url: 'https://www.who.int/rss-feeds/news-english.xml' },
    { name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
    { name: 'Reuters Health', url: 'https://feeds.reuters.com/reuters/healthnews' },
    { name: 'Medical Xpress Africa', url: 'https://medicalxpress.com/rss-feed/' },
  ],
  'Entertainment': [
    { name: 'Pulse Kenya Entertainment', url: 'https://www.pulselive.co.ke/entertainment/rss' },
    { name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
    { name: 'Variety', url: 'https://variety.com/feed/' },
  ],
}

async function main() {
  // Fetch all categories from DB
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('category_id, name')
  
  if (catErr || !cats) {
    console.error('Failed to fetch categories:', catErr?.message)
    process.exit(1)
  }

  console.log(`Found ${cats.length} categories:`, cats.map((c: any) => c.name).join(', '))

  let inserted = 0
  let skipped = 0

  for (const [categoryName, feeds] of Object.entries(CATEGORY_MAP)) {
    // Try exact match first, then case-insensitive
    const cat = (cats as any[]).find(
      (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
    )

    if (!cat) {
      console.warn(`⚠️  Category "${categoryName}" not found in DB — skipping ${(feeds as any[]).length} feeds`)
      continue
    }

    for (const feed of feeds as any[]) {
      // Check if already exists
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
        fetch_count: 0,
      } as never)

      if (error) {
        console.error(`❌ Failed to insert ${feed.name}:`, error.message)
      } else {
        console.log(`✅ Inserted: ${feed.name} → ${categoryName}`)
        inserted++
      }
    }
  }

  console.log(`\n🎉 Done! ${inserted} feeds inserted, ${skipped} already existed.`)
  console.log('Now go to /admin/sources or call /api/cron/fetch-feeds to pull articles.')
}

main().catch(console.error)
