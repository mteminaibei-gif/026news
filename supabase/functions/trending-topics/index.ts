/**
 * Supabase Edge Function: trending-topics
 *
 * Computes trending articles based on recent view velocity, likes, and shares.
 * Writes results to a `trending` table (or could write to a Redis/KV store).
 *
 * Deploy:  supabase functions deploy trending-topics
 * Schedule: Every 15 minutes — "*/15 * * * *"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Trending score formula:
//   score = views_last_24h * 1 + likes * 3 + shares * 5
// (Recency-weighted: articles with recent activity rank higher)

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch recently updated analytics joined with published articles
  const { data: rows, error } = await supabase
    .from('analytics')
    .select(`
      article_id, views, likes, shares,
      article:articles (
        article_id, title, slug, featured_image, created_at,
        category:categories ( name )
      )
    `)
    .gte('updated_at', since)
    .order('views', { ascending: false })
    .limit(50)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  // Score and sort
  const scored = (rows ?? [])
    .filter(r => r.article) // exclude orphaned analytics rows
    .map(r => ({
      article_id:     r.article_id,
      title:          (r.article as Record<string, unknown>)?.title,
      slug:           (r.article as Record<string, unknown>)?.slug,
      featured_image: (r.article as Record<string, unknown>)?.featured_image,
      category:       ((r.article as Record<string, unknown>)?.category as Record<string, unknown>)?.name,
      score:          (r.views ?? 0) * 1 + (r.likes ?? 0) * 3 + (r.shares ?? 0) * 5,
      views:          r.views,
      likes:          r.likes,
      shares:         r.shares,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  // Upsert into a simple key-value store via a trending table
  // If you don't have this table, create it:
  // CREATE TABLE IF NOT EXISTS trending (
  //   id SERIAL PRIMARY KEY,
  //   computed_at TIMESTAMPTZ DEFAULT NOW(),
  //   data JSONB NOT NULL
  // );
  await supabase
    .from('trending' as string)
    .insert({ computed_at: new Date().toISOString(), data: scored })
    .then(() => {})

  return new Response(
    JSON.stringify({ count: scored.length, trending: scored }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
