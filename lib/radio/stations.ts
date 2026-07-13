export interface RadioStation {
  id: string
  name: string
  genre: string
  color: string
  streamUrl: string
  listeners: number
}

/**
 * Live radio streams. URLs point to public, CORS-friendly Icecast streams
 * (SomaFM) so playback works directly in the browser without a proxy.
 * Swap these for the production 026Newsblog streams when available.
 */
export const RADIO_STATIONS: RadioStation[] = [
  { id: 'groove', name: '026 Groove', genre: 'Ambient / Downtempo', color: '#0f766e', streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3', listeners: 8420 },
  { id: 'drone', name: '026 Drone', genre: 'Atmospheric / Space', color: '#2563eb', streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3', listeners: 5120 },
  { id: 'fluid', name: '026 Fluid', genre: 'Deep House / Chill', color: '#7c3aed', streamUrl: 'https://ice1.somafm.com/fluid-128-mp3', listeners: 6340 },
  { id: 'indie', name: '026 Indie', genre: 'Indie Pop', color: '#ea580c', streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3', listeners: 7280 },
  { id: 'beat', name: '026 Beat', genre: 'Deep / Soulful House', color: '#db2777', streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3', listeners: 4610 },
  { id: 'lush', name: '026 Lush', genre: 'Vocal / Orchestral', color: '#16a34a', streamUrl: 'https://ice1.somafm.com/lush-128-mp3', listeners: 3990 },
  { id: 'sonic', name: '026 Sonic', genre: 'Modern Jazz', color: '#0891b2', streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3', listeners: 2740 },
  { id: 'agent', name: '026 Agent', genre: 'Spy / Lounge', color: '#ca8a04', streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3', listeners: 5180 },
  { id: 'soul', name: '026 Soul', genre: '60s Soul / R&B', color: '#dc2626', streamUrl: 'https://ice1.somafm.com/7soul-128-mp3', listeners: 6050 },
]
