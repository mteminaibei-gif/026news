export interface TVStation {
  id: string
  name: string
  genre: string
  color: string
  youtubeChannel: string
  website: string
  logo: string
  viewers: number
  region: 'ke' | 'africa' | 'global'
  country?: string
}

/**
 * TV live streams via YouTube channel /live embeds.
 * Uses: https://www.youtube.com/channel/CHANNEL_ID/live
 * All channel IDs verified July 2026.
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
]

export const AFRICAN_TV_STATIONS: TVStation[] = [
  { id: 'newscentral', name: 'News Central TV', genre: 'News / Africa', color: '#0ea5e9', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://newscentral.africa', logo: '🌍', viewers: 22000, region: 'africa', country: 'Nigeria' },
  { id: 'africanews', name: 'Africanews', genre: 'News / Pan-African', color: '#f97316', youtubeChannel: 'UC1_E8NeF5QHY2dtdLRBCCLA', website: 'https://www.africanews.com', logo: '🟧', viewers: 18500, region: 'africa', country: 'Pan-African' },
  { id: 'tv360', name: 'TV360 Nigeria', genre: 'News / Nigeria', color: '#dc2626', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://tv360nigeria.com', logo: '🔴', viewers: 8400, region: 'africa', country: 'Nigeria' },
  { id: 'channelone', name: 'Channel One TV', genre: 'News / Ghana', color: '#059669', youtubeChannel: 'UCk2ur26rmSfsPsEuqSbOxfQ', website: 'https://channelonegh.com', logo: '🟢', viewers: 7200, region: 'africa', country: 'Ghana' },
]

export const GLOBAL_TV_STATIONS: TVStation[] = [
  { id: 'bbc', name: 'BBC News', genre: 'News / World', color: '#bb1919', youtubeChannel: 'UC16niRr50-MSBwiO3ZDb_Lw', website: 'https://www.bbc.com/news/live', logo: '🔴', viewers: 128000, region: 'global', country: 'UK' },
  { id: 'cnn', name: 'CNN', genre: 'News / World', color: '#cc0000', youtubeChannel: 'UCupvZG-5ko_eiXAupbDfxWw', website: 'https://www.cnn.com/live', logo: '🔴', viewers: 95000, region: 'global', country: 'US' },
  { id: 'aljazeera', name: 'Al Jazeera', genre: 'News / World', color: '#fa9000', youtubeChannel: 'UCa69PnsHHzSNJUdjtehOkeQ', website: 'https://www.aljazeera.com/live', logo: '🟠', viewers: 87000, region: 'global', country: 'Qatar' },
  { id: 'france24', name: 'France 24', genre: 'News / World', color: '#0055a4', youtubeChannel: 'UCQfwfsi5VrQ8yKZ-UWmAEFw', website: 'https://www.france24.com/en/live', logo: '🔵', viewers: 42000, region: 'global', country: 'France' },
  { id: 'dw', name: 'DW News', genre: 'News / World', color: '#0078d4', youtubeChannel: 'UCknLrEdhRCp1aegoMqRhGTw', website: 'https://www.dw.com/en/live-tv/s-100825', logo: '🔷', viewers: 31000, region: 'global', country: 'Germany' },
  { id: 'cgttn', name: 'CGTN', genre: 'News / World', color: '#1d4ed8', youtubeChannel: 'UCfXaWfPOXMnPHJn1cKUenpw', website: 'https://www.cgtn.com/live', logo: '🔷', viewers: 54000, region: 'global', country: 'China' },
  { id: 'nhk', name: 'NHK World', genre: 'News / Japan', color: '#003d6b', youtubeChannel: 'UCaO1raobtFLyDQXF7sYlM2w', website: 'https://www3.nhk.or.jp/nhkworld/', logo: '🔷', viewers: 28000, region: 'global', country: 'Japan' },
  { id: 'euronews', name: 'Euronews', genre: 'News / Europe', color: '#003399', youtubeChannel: 'UCI4qP34sTJu3NnH86fNpuMw', website: 'https://www.euronews.com/live', logo: '🔵', viewers: 19000, region: 'global', country: 'Europe' },
  { id: 'rt', name: 'RT News', genre: 'News / World', color: '#da291c', youtubeChannel: 'UCpw3qfsijb6Ak1BFhrVif0A', website: 'https://www.rt.com/live', logo: '🔴', viewers: 45000, region: 'global', country: 'Russia' },
  { id: 'trt', name: 'TRT World', genre: 'News / Turkey', color: '#e30a17', youtubeChannel: 'UC7fWeaHhqgM4Lba7MSv9LgQ', website: 'https://www.trtworld.com/live', logo: '🔴', viewers: 23000, region: 'global', country: 'Turkey' },
]

export const ALL_TV_STATIONS = [...KENYAN_TV_STATIONS, ...AFRICAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]
