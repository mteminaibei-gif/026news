/**
 * 026News — Kenya & Africa RSS Feeds Seeder
 *
 * Run with:
 *   npx tsx --env-file=.env.local seed-kenya-feeds.ts
 *
 * Inserts Kenya and Africa media RSS feeds into rss_feeds table.
 * Safe to re-run — uses ON CONFLICT DO NOTHING.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

const KENYA_FEEDS = [
  // Nation Media Group
  { name: 'Nation Africa — Top Stories',  feed_url: 'https://nation.africa/kenya/rss',                  cat: 'Kenya' },
  { name: 'Nation Africa — Business',     feed_url: 'https://nation.africa/kenya/business/rss',          cat: 'Business' },
  { name: 'Nation Africa — Politics',     feed_url: 'https://nation.africa/kenya/politics/rss',          cat: 'Politics' },
  { name: 'Nation Africa — Sports',       feed_url: 'https://nation.africa/kenya/sports/rss',            cat: 'Sports' },
  // Standard Group
  { name: 'The Standard — Kenya News',    feed_url: 'https://www.standardmedia.co.ke/rss/all_news.php',  cat: 'Kenya' },
  { name: 'The Standard — Business',     feed_url: 'https://www.standardmedia.co.ke/rss/business.php',  cat: 'Business' },
  { name: 'The Standard — Sports',       feed_url: 'https://www.standardmedia.co.ke/rss/sports.php',    cat: 'Sports' },
  // KBC
  { name: 'KBC — Kenya News',             feed_url: 'https://www.kbc.co.ke/feed/',                       cat: 'Kenya' },
  // Citizen Digital
  { name: 'Citizen Digital — Kenya',      feed_url: 'https://www.citizen.digital/feed',                  cat: 'Kenya' },
  // NTV Kenya (priority)
  { name: 'NTV Kenya',                    feed_url: 'https://ntvkenya.co.ke/feed',                      cat: 'Kenya' },
  // K24 (Royal Media)
  { name: 'K24 TV (Royal Media)',         feed_url: 'https://www.k24tv.co.ke/feed/',                    cat: 'Kenya' },
  // The Star
  { name: 'The Star Kenya',               feed_url: 'https://www.the-star.co.ke/rss/',                   cat: 'Kenya' },
  // Capital FM
  { name: 'Capital FM — Business',       feed_url: 'https://www.capitalfm.co.ke/business/feed/',         cat: 'Business' },
  { name: 'Capital FM — Kenya News',      feed_url: 'https://www.capitalfm.co.ke/news/feed/',             cat: 'Kenya' },
  // Business Daily Africa
  { name: 'Business Daily Africa',        feed_url: 'https://businessdailyafrica.com/rss',               cat: 'Business' },
  // Tech
  { name: 'Techweez — Kenya Tech',        feed_url: 'https://techweez.com/feed/',                        cat: 'Tech' },
  // Pan-Africa
  { name: 'Africa News',                  feed_url: 'https://www.africanews.com/feed/rss',               cat: 'Africa' },
  { name: 'AllAfrica — Kenya',            feed_url: 'https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf', cat: 'Kenya' },
  { name: 'AllAfrica — East Africa',      feed_url: 'https://allafrica.com/tools/headlines/rdf/eastafrica/headlines.rdf', cat: 'Africa' },
  { name: 'Quartz Africa',                feed_url: 'https://qz.com/africa/rss',                         cat: 'Africa' },
  { name: 'The East African',             feed_url: 'https://www.theeastafrican.co.ke/tea/rss',           cat: 'Africa' },
]

async function seedKenyaFeeds() {
  console.log('🇰🇪 Seeding Kenya & Africa RSS feeds...\n')

  // 1. Ensure categories exist
  const cats = ['Kenya', 'Africa', 'Health']
  for (const name of cats) {
    const slug = name.toLowerCase()
    const { error } = await supabase
      .from('categories')
      .upsert({ name, slug, description: `${name} news`, icon: name === 'Kenya' ? '🇰🇪' : name === 'Africa' ? '🌍' : '🏥' } as never, { onConflict: 'name' })
    if (error) console.error(`  ⚠️  Category "${name}":`, error.message)
    else console.log(`  ✅  Category "${name}" ready`)
  }

  console.log()

  // 2. Fetch category IDs
  const { data: categoryRows } = await supabase.from('categories').select('category_id, name')
  const catMap = Object.fromEntries((categoryRows ?? []).map((c: { category_id: number; name: string }) => [c.name, c.category_id]))

  // 3. Insert feeds
  let inserted = 0
  let skipped  = 0

  for (const feed of KENYA_FEEDS) {
    const category_id = catMap[feed.cat] ?? null
    const { error } = await supabase
      .from('rss_feeds')
      .insert({ name: feed.name, feed_url: feed.feed_url, category_id, is_active: true } as never)

    if (error) {
      if (error.code === '23505') {
        process.stdout.write(`  ⏭️  Already exists: ${feed.name}\n`)
        skipped++
      } else {
        console.error(`  ❌  Failed: ${feed.name} — ${error.message}`)
      }
    } else {
      console.log(`  ✅  Added: ${feed.name}`)
      inserted++
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Kenya feeds seeding complete!
   ${inserted} inserted · ${skipped} already existed

   Go to /admin/sources to see all feeds.
   Click "⚡ Fetch All Now" to pull articles.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

seedKenyaFeeds().catch(err => { console.error(err); process.exit(1) })
