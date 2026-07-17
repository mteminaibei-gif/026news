import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PodcastRow {
  title: string
  author: string
  region: 'ke' | 'global'
  episodes: number
  duration: string
  cover_color: string
}

interface RecentRow {
  title: string
  station: string
  played_at: string
}

// Fallback seed data — used when Supabase is not configured or tables missing.
const FALLBACK_PODCASTS: PodcastRow[] = [
  { title: 'Kenya Talks', author: 'NRG Radio', region: 'ke', episodes: 186, duration: '45 min', cover_color: '#e11d48' },
  { title: 'The Trend Factory', author: 'Capital FM', region: 'ke', episodes: 98, duration: '38 min', cover_color: '#0f766e' },
  { title: 'Stories of Africa', author: 'Radio Citizen', region: 'ke', episodes: 142, duration: '52 min', cover_color: '#16a34a' },
  { title: 'Tech Pulse Africa', author: 'Kiss 100', region: 'ke', episodes: 89, duration: '35 min', cover_color: '#db2777' },
  { title: 'On the Pitch KE', author: 'Radio Jambo', region: 'ke', episodes: 210, duration: '40 min', cover_color: '#0891b2' },
  { title: 'Biz Breakfast', author: 'Classic 105', region: 'ke', episodes: 178, duration: '32 min', cover_color: '#ea580c' },
  { title: 'The Daily', author: 'The New York Times', region: 'global', episodes: 1240, duration: '25 min', cover_color: '#2563eb' },
  { title: 'BBC Global News', author: 'BBC World Service', region: 'global', episodes: 980, duration: '30 min', cover_color: '#7c3aed' },
  { title: 'How I Built This', author: 'NPR', region: 'global', episodes: 410, duration: '50 min', cover_color: '#ca8a04' },
  { title: 'TED Talks Daily', author: 'TED', region: 'global', episodes: 1560, duration: '15 min', cover_color: '#dc2626' },
  { title: 'The Economist Asks', author: 'The Economist', region: 'global', episodes: 320, duration: '28 min', cover_color: '#16a34a' },
  { title: 'Waveform', author: 'MrMobile & dbrand', region: 'global', episodes: 265, duration: '60 min', cover_color: '#0891b2' },
]

const FALLBACK_RECENT: RecentRow[] = [
  { title: 'Kenya Talk: Episode 156', station: '026 Sonic', played_at: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { title: 'Tech Pulse: AI in Africa', station: '026 Indie', played_at: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { title: 'Sports Zone: Premier League Review', station: '026 Beat', played_at: new Date(Date.now() - 24 * 3600e3).toISOString() },
  { title: 'Morning Vibes: Tuesday Edition', station: '026 Soul', played_at: new Date(Date.now() - 2 * 24 * 3600e3).toISOString() },
]

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: pods, error: podsErr } = await supabase
      .from('podcasts')
      .select('title, author, region, episodes, duration, cover_color')
      .eq('active', true)
      .order('rank', { ascending: true })

    const { data: recent, error: recErr } = await supabase
      .from('recently_played')
      .select('title, station, played_at')
      .order('played_at', { ascending: false })
      .limit(12)

    const podcasts = podsErr || !pods || pods.length === 0 ? FALLBACK_PODCASTS : (pods as PodcastRow[])
    const recentlyPlayed = recErr || !recent || recent.length === 0 ? FALLBACK_RECENT : (recent as RecentRow[])

    const rel = (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    }

    return NextResponse.json(
      {
        podcasts,
        kenyaPodcasts: podcasts.filter(p => p.region === 'ke'),
        globalPodcasts: podcasts.filter(p => p.region === 'global'),
        recentlyPlayed: recentlyPlayed.map(r => ({ ...r, time: rel(r.played_at) })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        },
      },
    )
  } catch (err) {
    console.error('[GET /api/media]', err)
    return NextResponse.json(
      {
        podcasts: FALLBACK_PODCASTS,
        kenyaPodcasts: FALLBACK_PODCASTS.filter(p => p.region === 'ke'),
        globalPodcasts: FALLBACK_PODCASTS.filter(p => p.region === 'global'),
        recentlyPlayed: FALLBACK_RECENT.map(r => ({ ...r, time: 'recently' })),
      },
      { status: 200, headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } },
    )
  }
}

// POST /api/media/recently-played — record a play event (radio/podcast/tv)
export async function POST(req: NextRequest) {
  try {
    let body: { title?: string; station?: string; source?: string; coverColor?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { title, station, source = 'radio', coverColor } = body
    if (!title || !station) {
      return NextResponse.json({ error: 'title and station are required' }, { status: 400 })
    }

    const supabase = await createClient()
    // `recently_played` is a valid table (see supabase/migrations); the generated
    // Database type occasionally resolves its Insert as `never`, so we narrow here.
    const { error } = await (supabase.from('recently_played') as unknown as {
      insert: (values: { title: string; station: string; source?: string; cover_color?: string }) => Promise<{ error: { message: string } | null }>
    }).insert({
      title,
      station,
      source,
      cover_color: coverColor ?? '#2563eb',
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[POST /api/media/recently-played]', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
