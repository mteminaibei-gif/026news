export interface RadioStation {
  id: string
  name: string
  genre: string
  color: string
  streamUrl: string
  listeners: number
  region: 'ke' | 'global'
  country?: string
}

/**
 * Live radio streams for 026Newsblog Radio.
 *
 * Kenyan stations are listed first (region: 'ke') and prioritised on the
 * radio page. The global entries use public, CORS-friendly Icecast streams
 * (SomaFM) so playback works directly in the browser without a proxy.
 *
 * All Kenyan stream URLs were verified reachable (HTTP 200, or a zeno.fm 302
 * redirect that the <audio> element follows automatically) via curl. Public
 * endpoints can still change over time — re-verify if a station stops playing.
 */
export const RADIO_STATIONS: RadioStation[] = [
  // ── Kenyan stations (prioritised) ──────────────────────────
  // Stream URLs verified live (HTTP 200 / zeno.fm 302 redirect) via curl.
  { id: 'nrg', name: 'NRG Radio', genre: 'Urban Contemporary / Hip-Hop', color: '#e11d48', streamUrl: 'https://uksouth.streaming.broadcast.radio/nrg', listeners: 12340, region: 'ke', country: 'Kenya' },
  { id: 'capital', name: 'Capital FM', genre: 'Urban / Pop / R&B', color: '#0f766e', streamUrl: 'https://atunwadigital.streamguys1.com/capitalfm', listeners: 9820, region: 'ke', country: 'Kenya' },
  { id: 'kiss', name: 'Kiss 100', genre: 'Top 40 / Afrobeats', color: '#db2777', streamUrl: 'https://kiss100fm-atunwadigital.streamguys1.com/kiss100fm', listeners: 8760, region: 'ke', country: 'Kenya' },
  { id: 'citizen', name: 'Radio Citizen', genre: 'News / Talk (Kiswahili)', color: '#16a34a', streamUrl: 'https://radiocitizen-atunwadigital.streamguys1.com/radiocitizen', listeners: 11200, region: 'ke', country: 'Kenya' },
  { id: 'kbc', name: 'KBC Radio', genre: 'News / Public Service', color: '#2563eb', streamUrl: 'https://stream.zeno.fm/ud2u96xst5quv', listeners: 5340, region: 'ke', country: 'Kenya' },
  { id: 'classic', name: 'Classic 105', genre: 'Old Skool / Soft Rock', color: '#ea580c', streamUrl: 'https://classic105-atunwadigital.streamguys1.com/classic105', listeners: 6410, region: 'ke', country: 'Kenya' },
  { id: 'easy', name: 'Easy FM', genre: 'Adult Contemporary', color: '#7c3aed', streamUrl: 'https://stream.zeno.fm/wvw02zaqpxquv', listeners: 4980, region: 'ke', country: 'Kenya' },
  { id: 'jambo', name: 'Radio Jambo', genre: 'Sports / Entertainment', color: '#0891b2', streamUrl: 'https://radiojambo-atunwadigital.streamguys1.com/radiojambo', listeners: 7250, region: 'ke', country: 'Kenya' },
  { id: 'hot96', name: 'Hot 96', genre: 'Hip-Hop / R&B', color: '#f43f5e', streamUrl: 'https://hot96-atunwadigital.streamguys1.com/hot96', listeners: 6100, region: 'ke', country: 'Kenya' },
  { id: 'inooro', name: 'Inooro FM', genre: 'News / Talk (Kikuyu)', color: '#059669', streamUrl: 'https://inoorofm-atunwadigital.streamguys1.com/inoorofm', listeners: 4800, region: 'ke', country: 'Kenya' },
  { id: 'ramogi', name: 'Ramogi FM', genre: 'News / Talk (Luo)', color: '#0d9488', streamUrl: 'https://ramogifm-atunwadigital.streamguys1.com/ramogifm', listeners: 5300, region: 'ke', country: 'Kenya' },

  // ── Global stations ────────────────────────────────────────
  { id: 'groove', name: '026 Groove', genre: 'Ambient / Downtempo', color: '#0f766e', streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3', listeners: 8420, region: 'global' },
  { id: 'drone', name: '026 Drone', genre: 'Atmospheric / Space', color: '#2563eb', streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3', listeners: 5120, region: 'global' },
  { id: 'fluid', name: '026 Fluid', genre: 'Deep House / Chill', color: '#7c3aed', streamUrl: 'https://ice1.somafm.com/fluid-128-mp3', listeners: 6340, region: 'global' },
  { id: 'indie', name: '026 Indie', genre: 'Indie Pop', color: '#ea580c', streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3', listeners: 7280, region: 'global' },
  { id: 'beat', name: '026 Beat', genre: 'Deep / Soulful House', color: '#db2777', streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3', listeners: 4610, region: 'global' },
  { id: 'lush', name: '026 Lush', genre: 'Vocal / Orchestral', color: '#16a34a', streamUrl: 'https://ice1.somafm.com/lush-128-mp3', listeners: 3990, region: 'global' },
  { id: 'sonic', name: '026 Sonic', genre: 'Modern Jazz', color: '#0891b2', streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3', listeners: 2740, region: 'global' },
  { id: 'agent', name: '026 Agent', genre: 'Spy / Lounge', color: '#ca8a04', streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3', listeners: 5180, region: 'global' },
  { id: 'soul', name: '026 Soul', genre: '60s Soul / R&B', color: '#dc2626', streamUrl: 'https://ice1.somafm.com/7soul-128-mp3', listeners: 6050, region: 'global' },
]

export const KENYA_STATIONS = RADIO_STATIONS.filter(s => s.region === 'ke')
export const GLOBAL_STATIONS = RADIO_STATIONS.filter(s => s.region === 'global')
