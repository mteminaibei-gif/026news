/**
 * Fix missing-category feeds: add World feeds under "Africa"/"Kenya" 
 * and Technology feeds under "Tech".
 * Run:  npx tsx --env-file=.env.local scripts/seed_missing_feeds.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// DB has "Tech" (not "Technology") and no "World" — map to closest
const MISSING: Array<{ name: string; url: string; category: string }> = [
  // Tech (DB category = "Tech")
  { name: 'TechCrunch',       url: 'https://techcrunch.com/feed/',                               category: 'Tech' },
  { name: 'The Verge',        url: 'https://www.theverge.com/rss/index.xml',                     category: 'Tech' },
  { name: 'Wired',            url: 'https://www.wired.com/feed/rss',                             category: 'Tech' },
  { name: 'Ars Technica',     url: 'https://feeds.arstechnica.com/arstechnica/index',            category: 'Tech' },
  { name: 'Disrupt Africa',   url: 'https://disrupt-africa.com/feed/',                           category: 'Tech' },
  { name: 'Techpoint Africa', url: 'https://techpoint.africa/feed/',                             category: 'Tech' },
  // World news — file under Africa / Kenya / Kenya (global stories affecting region)
  { name: 'BBC World News',   url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                category: 'Africa' },
  { name: 'Reuters World',    url: 'https://feeds.reuters.com/reuters/worldnews',                category: 'Africa' },
  { name: 'France24 English', url: 'https://www.france24.com/en/rss',                           category: 'Africa' },
  { name: 'DW World',         url: 'https://rss.dw.com/rdf/rss-en-world',                       category: 'Africa' },
  { name: 'Al Jazeera World', url: 'https://www.aljazeera.com/xml/rss/all.xml',                 category: 'Kenya' },
  { name: 'AP Top News',      url: 'https://feeds.apnews.com/rss/apf-topnews',                  category: 'Kenya' },
  // Science
  { name: 'NASA News',        url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',            category: 'Science' },
  { name: 'New Scientist',    url: 'https://www.newscientist.com/feed/home/',                    category: 'Science' },
  { name: 'ScienceDaily',     url: 'https://www.sciencedaily.com/rss/all.xml',                  category: 'Science' },
]

async function main() {
  const { data: cats } = await supabase.from('categories').select('category_id, name')
  if (!cats) { console.error('No categories found'); process.exit(1) }

  const catMap = Object.fromEntries((cats as any[]).map((c: any) => [c.name, c.category_id]))
  let inserted = 0, skipped = 0

  for (const feed of MISSING) {
    const catId = catMap[feed.category]
    if (!catId) { console.warn(`⚠️  Category not found: ${feed.category}`); continue }

    const { data: existing } = await supabase
      .from('rss_feeds').select('feed_id').eq('feed_url', feed.url).maybeSingle()

    if (existing) { console.log(`⏭  Exists: ${feed.name}`); skipped++; continue }

    const { error } = await supabase.from('rss_feeds').insert({
      name: feed.name, feed_url: feed.url, category_id: catId, is_active: true, fetch_count: 0,
    } as never)

    if (error) console.error(`❌ ${feed.name}:`, error.message)
    else { console.log(`✅ Inserted: ${feed.name} → ${feed.category}`); inserted++ }
  }

  console.log(`\n✨ Done! ${inserted} inserted, ${skipped} skipped.`)
}

main().catch(console.error)
