export interface TVStation {
  id: string
  name: string
  genre: string
  color: string
  streamUrl: string
  embedType: 'hls' | 'iframe'
  fallbackUrl?: string
  website: string
  logo: string
  region: 'ke' | 'africa' | 'global'
  country?: string
  youtubeChannelId?: string
}

function ytLive(channelId: string) {
  return `https://www.youtube.com/embed?listType=channel_live&list=${channelId}&autoplay=1`
}

export const KENYAN_TV_STATIONS: TVStation[] = [
  { id: 'citizen', name: 'Citizen TV', genre: 'News / Entertainment', color: '#16a34a', streamUrl: ytLive('UCKtlDdGB0tYAsB5l3dEHICA'), embedType: 'iframe', website: 'https://www.citizen.digital', logo: '🟢', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCKtlDdGB0tYAsB5l3dEHICA' },
  { id: 'ntv', name: 'NTV Kenya', genre: 'News / Current Affairs', color: '#2563eb', streamUrl: ytLive('UC-IA7wN4rc7_VwKx4VB_KTQ'), embedType: 'iframe', website: 'https://ntvkenya.co.ke', logo: '🔵', region: 'ke', country: 'Kenya', youtubeChannelId: 'UC-IA7wN4rc7_VwKx4VB_KTQ' },
  { id: 'ktn', name: 'KTN News', genre: 'News / Breaking', color: '#0057b8', streamUrl: ytLive('UCKVsdeoHExltrWMuK0hOWmg'), embedType: 'iframe', website: 'https://ktnnews.co.ke', logo: '🔷', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCKVsdeoHExltrWMuK0hOWmg' },
  { id: 'kbc', name: 'KBC TV', genre: 'News / Public Service', color: '#0f766e', streamUrl: ytLive('UCypNjM5hP1qcUqQZe57jNfg'), fallbackUrl: 'https://live.kbc.co.ke/live/kbc1/playlist.m3u8', embedType: 'iframe', website: 'https://www.kbc.co.ke', logo: '🟦', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCypNjM5hP1qcUqQZe57jNfg' },
  { id: 'k24', name: 'K24 TV', genre: 'News / Entertainment', color: '#e11d48', streamUrl: ytLive('UCzDMJPHNQMX2v7z7aRsf1Og'), embedType: 'iframe', website: 'https://www.k24tv.co.ke', logo: '🔴', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCzDMJPHNQMX2v7z7aRsf1Og' },
  { id: 'nation', name: 'Nation TV', genre: 'News / Business', color: '#ea580c', streamUrl: ytLive('UCk3ZM2Qx3R6kLh2pVyAYcXw'), embedType: 'iframe', website: 'https://nation.africa', logo: '🟠', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCk3ZM2Qx3R6kLh2pVyAYcXw' },
  { id: 'switch', name: 'Switch TV', genre: 'Youth / Entertainment', color: '#7c3aed', streamUrl: ytLive('UCUhrpGr_luwUzVaxiW5Jkhw'), embedType: 'iframe', website: 'https://www.switchtv.ke', logo: '🟣', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCUhrpGr_luwUzVaxiW5Jkhw' },
  { id: 'tv47', name: 'TV47', genre: 'News / Sports', color: '#ca8a04', streamUrl: ytLive('UCxX_XqKtL8rHvP4P4c6xU3A'), embedType: 'iframe', website: 'https://tv47.ke', logo: '🟡', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCxX_XqKtL8rHvP4P4c6xU3A' },
  { id: 'inooro', name: 'Inooro TV', genre: 'News / Kikuyu', color: '#059669', streamUrl: ytLive('UCZlNMLTVNxzwB0axilK-rDw'), embedType: 'iframe', website: 'https://www.inoorotv.co.ke', logo: '🟢', region: 'ke', country: 'Kenya', youtubeChannelId: 'UCZlNMLTVNxzwB0axilK-rDw' },
]

export const AFRICAN_TV_STATIONS: TVStation[] = [
  { id: 'newscentral', name: 'News Central TV', genre: 'News / Africa', color: '#0ea5e9', streamUrl: ytLive('UC7s7uK4nRGr8JwH1UgQnVng'), embedType: 'iframe', website: 'https://newscentral.africa', logo: '🌍', region: 'africa', country: 'Nigeria', youtubeChannelId: 'UC7s7uK4nRGr8JwH1UgQnVng' },
  { id: 'africanews', name: 'Africanews', genre: 'News / Pan-African', color: '#f97316', streamUrl: ytLive('UCvQ9J0rOQn0R4WbKjM1W3gA'), embedType: 'iframe', website: 'https://www.africanews.com', logo: '🟧', region: 'africa', country: 'Pan-African', youtubeChannelId: 'UCvQ9J0rOQn0R4WbKjM1W3gA' },
  { id: 'tv360', name: 'TV360 Nigeria', genre: 'News / Nigeria', color: '#dc2626', streamUrl: ytLive('UC9CTw8nQD4pTLnR1bKDcCmg'), embedType: 'iframe', website: 'https://tv360nigeria.com', logo: '🔴', region: 'africa', country: 'Nigeria', youtubeChannelId: 'UC9CTw8nQD4pTLnR1bKDcCmg' },
  { id: 'channelone', name: 'Channel One TV', genre: 'News / Ghana', color: '#059669', streamUrl: ytLive('UC9CTw8nQD4pTLnR1bKDcCmg'), embedType: 'iframe', website: 'https://channelonegh.com', logo: '🟢', region: 'africa', country: 'Ghana', youtubeChannelId: 'UC9CTw8nQD4pTLnR1bKDcCmg' },
]

export const GLOBAL_TV_STATIONS: TVStation[] = [
  { id: 'bbc', name: 'BBC News', genre: 'News / World', color: '#bb1919', streamUrl: ytLive('UC16niRr50-MSBwiO3ZDb_Cw'), embedType: 'iframe', website: 'https://www.bbc.com/news/live', logo: '🔴', region: 'global', country: 'UK', youtubeChannelId: 'UC16niRr50-MSBwiO3ZDb_Cw' },
  { id: 'cnn', name: 'CNN', genre: 'News / World', color: '#cc0000', streamUrl: ytLive('UCupvZG-5ko_eiXAupbDfxWw'), embedType: 'iframe', website: 'https://www.cnn.com/live', logo: '🔴', region: 'global', country: 'US', youtubeChannelId: 'UCupvZG-5ko_eiXAupbDfxWw' },
  { id: 'aljazeera', name: 'Al Jazeera', genre: 'News / World', color: '#fa9000', streamUrl: ytLive('UCNye-wNBqNL5ZzHSJj3l8Bg'), embedType: 'iframe', website: 'https://www.aljazeera.com/live', logo: '🟠', region: 'global', country: 'Qatar', youtubeChannelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
  { id: 'france24', name: 'France 24', genre: 'News / World', color: '#0055a4', streamUrl: ytLive('UCQfwfsi5VrQ8yKZ-UWmAEFg'), embedType: 'iframe', website: 'https://www.france24.com/en/live', logo: '🔵', region: 'global', country: 'France', youtubeChannelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
  { id: 'dw', name: 'DW News', genre: 'News / World', color: '#0078d4', streamUrl: ytLive('UCknLrEdhRCp1aegoMqRaCZg'), embedType: 'iframe', website: 'https://www.dw.com/en/live-tv/s-100825', logo: '🔷', region: 'global', country: 'Germany', youtubeChannelId: 'UCknLrEdhRCp1aegoMqRaCZg' },
  { id: 'cgttn', name: 'CGTN', genre: 'News / World', color: '#1d4ed8', streamUrl: ytLive('UCgrNz-aDmcr2uuto8_DL2jg'), embedType: 'iframe', website: 'https://www.cgtn.com/live', logo: '🔷', region: 'global', country: 'China', youtubeChannelId: 'UCgrNz-aDmcr2uuto8_DL2jg' },
  { id: 'nhk', name: 'NHK World', genre: 'News / Japan', color: '#003d6b', streamUrl: ytLive('UCSPEjw8F2nQDtmUKPFNF7_A'), embedType: 'iframe', website: 'https://www3.nhk.or.jp/nhkworld/', logo: '🔷', region: 'global', country: 'Japan', youtubeChannelId: 'UCSPEjw8F2nQDtmUKPFNF7_A' },
  { id: 'euronews', name: 'Euronews', genre: 'News / Europe', color: '#003399', streamUrl: ytLive('UCSrZ3UV4jOidv8ppoVuvW9Q'), embedType: 'iframe', website: 'https://www.euronews.com/live', logo: '🔵', region: 'global', country: 'Europe', youtubeChannelId: 'UCSrZ3UV4jOidv8ppoVuvW9Q' },
  { id: 'rt', name: 'RT News', genre: 'News / World', color: '#da291c', streamUrl: ytLive('UCCX6tXfHouWBLhy3dDxsp4g'), embedType: 'iframe', website: 'https://www.rt.com/live', logo: '🔴', region: 'global', country: 'Russia', youtubeChannelId: 'UCCX6tXfHouWBLhy3dDxsp4g' },
  { id: 'trt', name: 'TRT World', genre: 'News / Turkey', color: '#e30a17', streamUrl: ytLive('UC7fWeaHhqgM4Ry-RMpM2YYw'), embedType: 'iframe', website: 'https://www.trtworld.com/live', logo: '🔴', region: 'global', country: 'Turkey', youtubeChannelId: 'UC7fWeaHhqgM4Ry-RMpM2YYw' },
]

export const ALL_TV_STATIONS = [...KENYAN_TV_STATIONS, ...AFRICAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]
