import fs from 'fs';
import path from 'path';

// Manual .env.local loader to avoid external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.warn('Failed to load .env.local manually:', e);
}

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const ensureCategory = async (name: string) => {
    const { data: cat, error } = await supabase
      .from('categories')
      .select('category_id')
      .eq('name', name)
      .single();
    if (error && error.code !== 'PGRST116') {
      const { data: newCat, error: insErr } = await supabase
        .from('categories')
        .insert({ name })
        .select('category_id')
        .single();
      if (insErr) throw insErr;
      return newCat.category_id as number;
    }
    return cat?.category_id as number;
  };

  const kenyaCatId = await ensureCategory('Kenya');
  const africaCatId = await ensureCategory('Africa');
  const worldCatId = await ensureCategory('World');
  const techCatId = await ensureCategory('Tech');
  const sportsCatId = await ensureCategory('Sports');

  const feeds = [
    {
      name: 'Daily Nation (Kenya)',
      feed_url: 'https://nation.africa/service/profile/v1/feed/ke/rss.xml',
      category_id: kenyaCatId,
    },
    {
      name: 'Citizen Digital Kenya',
      feed_url: 'https://www.citizen.digital/news/rss',
      category_id: kenyaCatId,
    },
    {
      name: 'Standard Media Politics (Kenya)',
      feed_url: 'https://www.standardmedia.co.ke/rss/politics.php',
      category_id: kenyaCatId,
    },
    {
      name: 'AllAfrica Kenya',
      feed_url: 'https://allafrica.com/tools/headlines/rdf/ke.rss',
      category_id: kenyaCatId,
    },
    {
      name: 'AllAfrica Africa',
      feed_url: 'https://allafrica.com/tools/headlines/rdf/af.rss',
      category_id: africaCatId,
    },
    {
      name: 'BBC Africa News',
      feed_url: 'http://feeds.bbci.co.uk/news/world/africa/rss.xml',
      category_id: africaCatId,
    },
    {
      name: 'Techpoint Africa',
      feed_url: 'https://techpoint.africa/feed',
      category_id: techCatId,
    },
    {
      name: 'TechCabal',
      feed_url: 'https://techcabal.com/feed',
      category_id: techCatId,
    },
    {
      name: 'BBC Tech News',
      feed_url: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
      category_id: techCatId,
    },
    {
      name: 'Citizen Digital Sports (Kenya)',
      feed_url: 'https://www.citizen.digital/sports/rss',
      category_id: sportsCatId,
    },
    {
      name: 'AllAfrica Sports',
      feed_url: 'https://allafrica.com/tools/headlines/rdf/sport.rss',
      category_id: sportsCatId,
    },
    {
      name: 'BBC Sports',
      feed_url: 'http://feeds.bbci.co.uk/sport/rss.xml',
      category_id: sportsCatId,
    },
    {
      name: 'BBC World News',
      feed_url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      category_id: worldCatId,
    },
    {
      name: 'Al Jazeera World News',
      feed_url: 'https://www.aljazeera.com/xml/rss/all.xml',
      category_id: worldCatId,
    },
  ];

  for (const feed of feeds) {
    const { error } = await supabase
      .from('rss_feeds')
      .upsert(
        {
          name: feed.name,
          feed_url: feed.feed_url,
          category_id: feed.category_id,
          is_active: true,
        } as any,
        { onConflict: 'feed_url' }
      );
    if (error) {
      console.error(`Failed to upsert feed ${feed.name}:`, error.message);
    } else {
      console.log(`Upserted feed: ${feed.name}`);
    }
  }
}

main().catch((e) => {
  console.error('Script error:', e);
});
