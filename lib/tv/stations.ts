export interface TVStation {
  id: string
  name: string
  genre: string
  color: string
  youtubeChannel: string
  website: string
  logo: string
  viewers: number
  region: 'ke' | 'global'
  country?: string
}

/**
 * Kenyan TV live streams via YouTube channel /live embeds.
 * Uses the channel's /live page which auto-plays the current live stream.
 * Format: https://www.youtube.com/channel/CHANNEL_ID/live
 */
export const KENYAN_TV_STATIONS: TVStation[] = [
  { id: 'citizen', name: 'Citizen TV', genre: 'News / Entertainment', color: '#16a34a', youtubeChannel: 'UChBQgieUidXV1CmDxSdRm3g', website: 'https://www.citizen.digital', logo: '🟢', viewers: 45200, region: 'ke', country: 'Kenya' },
  { id: 'ntv', name: 'NTV Kenya', genre: 'News / Current Affairs', color: '#2563eb', youtubeChannel: 'UCzTofzPbL3V2WJMWjMPJYDw', website: 'https://ntvkenya.co.ke', logo: '🔵', viewers: 32100, region: 'ke', country: 'Kenya' },
  { id: 'kbc', name: 'KBC TV', genre: 'News / Public Service', color: '#0f766e', youtubeChannel: 'UCypNjM5hP1qcUqQZe57jNfg', website: 'https://www.kbc.co.ke', logo: '🟦', viewers: 18700, region: 'ke', country: 'Kenya' },
  { id: 'k24', name: 'K24 TV', genre: 'News / Entertainment', color: '#e11d48', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://www.k24tv.co.ke', logo: '🔴', viewers: 15400, region: 'ke', country: 'Kenya' },
  { id: 'nation', name: 'Nation TV', genre: 'News / Business', color: '#ea580c', youtubeChannel: 'UC9MdRvGABn37xPOEBcOL3Tg', website: 'https://nation.africa', logo: '🟠', viewers: 22300, region: 'ke', country: 'Kenya' },
  { id: 'switch', name: 'Switch TV', genre: 'Youth / Entertainment', color: '#7c3aed', youtubeChannel: 'UCUhrpGr_luwUzVaxiW5Jkhw', website: 'https://www.switchtv.ke', logo: '🟣', viewers: 11800, region: 'ke', country: 'Kenya' },
  { id: 'tv47', name: 'TV47', genre: 'News / Sports', color: '#ca8a04', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://tv47.ke', logo: '🟡', viewers: 9200, region: 'ke', country: 'Kenya' },
  { id: 'kiss', name: 'Kiss TV', genre: 'Entertainment / Music', color: '#db2777', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://www.kiss.co.ke', logo: '🩷', viewers: 13600, region: 'ke', country: 'Kenya' },
  { id: 'ramogi', name: 'Ramogi TV', genre: 'News / Talk (Luo)', color: '#0d9488', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://www.ramogi.com', logo: '🩵', viewers: 7400, region: 'ke', country: 'Kenya' },
  { id: 'lulu', name: 'Lulu TV', genre: 'Entertainment / Lifestyle', color: '#f43f5e', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://www.lulutv.ke', logo: '💗', viewers: 6100, region: 'ke', country: 'Kenya' },
]

export const GLOBAL_TV_STATIONS: TVStation[] = [
  { id: 'bbc', name: 'BBC News', genre: 'News / World', color: '#bb1919', youtubeChannel: 'UC16niRr50-MSBwiO3ZDb_Lw', website: 'https://www.bbc.com/news/live', logo: '🔴', viewers: 128000, region: 'global', country: 'UK' },
  { id: 'cnn', name: 'CNN', genre: 'News / World', color: '#cc0000', youtubeChannel: 'UCupvZG-5ko_eiXAupbDfxWw', website: 'https://www.cnn.com/live', logo: '🔴', viewers: 95000, region: 'global', country: 'US' },
  { id: 'aljazeera', name: 'Al Jazeera', genre: 'News / World', color: '#fa9000', youtubeChannel: 'UCa69PnsHHzSNJUdjtehOkeQ', website: 'https://www.aljazeera.com/live', logo: '🟠', viewers: 87000, region: 'global', country: 'Qatar' },
  { id: 'france24', name: 'France 24', genre: 'News / World', color: '#0055a4', youtubeChannel: 'UCQfwfsi5VrQ8yKZ-UWmAEFw', website: 'https://www.france24.com/en/live', logo: '🔵', viewers: 42000, region: 'global', country: 'France' },
  { id: 'dw', name: 'DW News', genre: 'News / World', color: '#0078d4', youtubeChannel: 'UCknLrEdhRCp1aegoMqRhGTw', website: 'https://www.dw.com/en/live-tv/s-100825', logo: '🔷', viewers: 31000, region: 'global', country: 'Germany' },
]

export const ALL_TV_STATIONS = [...KENYAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]
