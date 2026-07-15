import { createClient } from '@/lib/supabase/server'

/**
 * Calculate and update journalist rankings based on article views
 * Should be called weekly or after significant view changes
 */
export async function updateJournalistRankings() {
  const supabase = await createClient()

  try {
    // 1. Calculate total views per journalist in memory
    const { data: articles, error } = await supabase
      .from('articles')
      .select('author_id, views')
      .eq('status', 'published') as any

    if (error) throw error

    const viewsByAuthor: Record<number, number> = {}
    for (const art of articles || []) {
      if (art.author_id === null || art.author_id === undefined) continue
      viewsByAuthor[art.author_id] = (viewsByAuthor[art.author_id] || 0) + (art.views || 0)
    }

    const stats = Object.entries(viewsByAuthor)
      .map(([author_id, total_views]) => ({
        author_id: Number(author_id),
        total_views,
      }))
      .sort((a, b) => b.total_views - a.total_views)

    // 2. Insert or update rankings
    for (let rank = 0; rank < stats.length; rank++) {
      const stat = stats[rank]
      const tier = getTierByViews(stat.total_views)

      await supabase
        .from('journalist_rankings')
        .upsert({
          user_id: stat.author_id,
          total_views: stat.total_views,
          rank_position: rank + 1,
          rank_tier: tier,
          last_updated: new Date().toISOString(),
        } as any)
        .eq('user_id', stat.author_id)
    }

    return { success: true, updated: stats.length }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Award badges to journalists based on view thresholds
 * Should be called weekly
 */
export async function awardJournalistBadges() {
  const supabase = await createClient()

  try {
    const BADGES = [
      { type: 'bronze', name: 'Rising Star', icon: '🥉', threshold: 10000 },
      { type: 'silver', name: 'Star Contributor', icon: '🥈', threshold: 50000 },
      { type: 'gold', name: 'Elite Journalist', icon: '🥇', threshold: 100000 },
      { type: 'platinum', name: 'Legend', icon: '👑', threshold: 500000 },
    ]

    // 1. Get all journalists with their total views
    const { data: rawJournalists, error } = await supabase
      .from('journalist_rankings')
      .select('user_id, total_views') as any

    if (error) throw error

    const journalists = rawJournalists as any[] | null

    // 2. Award badges
    for (const journalist of journalists || []) {
      for (const badge of BADGES) {
        if (journalist.total_views >= badge.threshold) {
          // Check if badge already awarded
          const { data: existing } = await supabase
            .from('journalist_badges')
            .select('badge_id')
            .eq('user_id', journalist.user_id)
            .eq('badge_type', badge.type)
            .maybeSingle()

          if (!existing) {
            // Award new badge
            await supabase.from('journalist_badges').insert({
              user_id: journalist.user_id,
              badge_type: badge.type,
              badge_name: badge.name,
              badge_icon: badge.icon,
              description: `Awarded for achieving ${badge.threshold.toLocaleString()} article views`,
              threshold_views: badge.threshold,
              awarded_at: new Date().toISOString(),
            } as any)
          }
        }
      }
    }

    return { success: true, processed: journalists?.length }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Calculate monthly revenue split and prepare payouts
 * 50% to platform, 50% distributed to journalists by view proportion
 */
export async function processMonthlyRevenueSplit(totalAdSenseRevenue: number) {
  const supabase = await createClient()

  try {
    const JOURNALIST_CUT = 0.5
    const PLATFORM_CUT = 0.5

    const journalistShare = totalAdSenseRevenue * JOURNALIST_CUT
    const platformShare = totalAdSenseRevenue * PLATFORM_CUT

    // 1. Get total views across all articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('author_id, views')
      .eq('status', 'published') as any

    if (error) throw error

    const totalViews = (articles || []).reduce((sum: number, a: any) => sum + (a.views || 0), 0)

    if (totalViews === 0) {
      return { success: true, distributed: 0 }
    }

    // 2. Calculate each journalist's share in memory
    const viewsByAuthor: Record<number, number> = {}
    for (const art of articles || []) {
      if (art.author_id === null || art.author_id === undefined) continue
      viewsByAuthor[art.author_id] = (viewsByAuthor[art.author_id] || 0) + (art.views || 0)
    }

    const journalistStats = Object.entries(viewsByAuthor).map(([author_id, author_views]) => ({
      author_id: Number(author_id),
      author_views,
    }))

    // 3. Create payout records
    const payouts = []
    for (const stat of journalistStats) {
      const percentage = stat.author_views / totalViews
      const payoutAmount = journalistShare * percentage

      await supabase.from('payout_records').insert({
        user_id: stat.author_id,
        payout_amount: Math.round(payoutAmount * 100) / 100, // Round to 2 decimals
        payout_method: 'pending', // User selects method later
        status: 'pending',
        requested_at: new Date().toISOString(),
      } as any)

      payouts.push({
        user_id: stat.author_id,
        amount: payoutAmount,
      })
    }

    return { success: true, distributed: payouts.length, totalAmount: journalistShare }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Helper: Determine tier based on total views
 */
function getTierByViews(views: number): string {
  if (views >= 500000) return 'platinum'
  if (views >= 100000) return 'gold'
  if (views >= 50000) return 'silver'
  if (views >= 10000) return 'bronze'
  return 'unranked'
}
