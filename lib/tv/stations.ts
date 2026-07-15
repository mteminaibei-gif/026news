export interface TVStation {
  id: string
  name: string
  genre: string
  color: string
  streamUrl: string
  youtubeId: string
  website: string
  logo: string
  viewers: number
  region: 'ke' | 'global'
  country?: string
}

/**
 * Kenyan TV live streams via YouTube embeds.
 * Most Kenyan TV stations broadcast live on YouTube.
 * youtubeId is the live stream video ID used for embedding.
 */
export const KENYAN_TV_STATIONS: TVStation[] = [
  { id: 'citizen', name: 'Citizen TV', genre: 'News / Entertainment', color: '#16a34a', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCjHfOz2yE3WKBVaa97yAuZQ', youtubeId: 'UCjHfOz2yE3WKBVaa97yAuZQ', website: 'https://www.citizen.digital', logo: '🟢', viewers: 45200, region: 'ke', country: 'Kenya' },
  { id: 'ntv', name: 'NTV Kenya', genre: 'News / Current Affairs', color: '#2563eb', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCzTofzPbL3V2WJMWjMPJYDw', youtubeId: 'UCzTofzPbL3V2WJMWjMPJYDw', website: 'https://ntvkenya.co.ke', logo: '🔵', viewers: 32100, region: 'ke', country: 'Kenya' },
  { id: 'kbc', name: 'KBC TV', genre: 'News / Public Service', color: '#0f766e', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCjHfOz2yE3WKBVaa97yAuZQ', youtubeId: 'UCKBC-ru555d8ssjhyA67dRg', website: 'https://www.kbc.co.ke', logo: '🟦', viewers: 18700, region: 'ke', country: 'Kenya' },
  { id: 'k24', name: 'K24 TV', genre: 'News / Entertainment', color: '#e11d48', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCKBC-ru555d8ssjhyA67dRg', youtubeId: 'UCKBC-ru555d8ssjhyA67dRg', website: 'https://www.k24tv.co.ke', logo: '🔴', viewers: 15400, region: 'ke', country: 'Kenya' },
  { id: 'nation', name: 'Nation TV', genre: 'News / Business', color: '#ea580c', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UC9MdRvGABn37xPOEBcOL3Tg', youtubeId: 'UC9MdRvGABn37xPOEBcOL3Tg', website: 'https://nation.africa', logo: '🟠', viewers: 22300, region: 'ke', country: 'Kenya' },
  { id: 'switch', name: 'Switch TV', genre: 'Youth / Entertainment', color: '#7c3aed', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCiVkGjMH1GQKpGKwYKFoZdA', youtubeId: 'UCiVkGjMH1GQKpGKwYKFoZdA', website: 'https://www.switchtv.ke', logo: '🟣', viewers: 11800, region: 'ke', country: 'Kenya' },
  { id: 'tv47', name: 'TV47', genre: 'News / Sports', color: '#ca8a04', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCjHfOz2yE3WKBVaa97yAuZQ', youtubeId: 'UCjHfOz2yE3WKBVaa97yAuZQ', website: 'https://tv47.ke', logo: '🟡', viewers: 9200, region: 'ke', country: 'Kenya' },
  { id: 'kiss', name: 'Kiss TV', genre: 'Entertainment / Music', color: '#db2777', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCzTofzPbL3V2WJMWjMPJYDw', youtubeId: 'UCzTofzPbL3V2WJMWjMPJYDw', website: 'https://www.kiss.co.ke', logo: '🩷', viewers: 13600, region: 'ke', country: 'Kenya' },
  { id: 'ramogi', name: 'Ramogi TV', genre: 'News / Talk (Luo)', color: '#0d9488', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCjHfOz2yE3WKBVaa97yAuZQ', youtubeId: 'UCjHfOz2yE3WKBVaa97yAuZQ', website: 'https://www.ramogi.com', logo: '🩵', viewers: 7400, region: 'ke', country: 'Kenya' },
  { id: 'lulu', name: 'Lulu TV', genre: 'Entertainment / Lifestyle', color: '#f43f5e', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCjHfOz2yE3WKBVaa97yAuZQ', youtubeId: 'UCjHfOz2yE3WKBVaa97yAuZQ', website: 'https://www.lulutv.ke', logo: '💗', viewers: 6100, region: 'ke', country: 'Kenya' },
]

export const GLOBAL_TV_STATIONS: TVStation[] = [
  { id: 'bbc', name: 'BBC News', genre: 'News / World', color: '#bb1919', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UC16niRr50-MSBwiO3ZDb_Lw', youtubeId: 'UC16niRr50-MSBwiO3ZDb_Lw', website: 'https://www.bbc.com/news/live', logo: '🔴', viewers: 128000, region: 'global', country: 'UK' },
  { id: 'cnn', name: 'CNN', genre: 'News / World', color: '#cc0000', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCupvZG-5ko_eiXAupbDfxWw', youtubeId: 'UCupvZG-5ko_eiXAupbDfxWw', website: 'https://www.cnn.com/live', logo: '🔴', viewers: 95000, region: 'global', country: 'US' },
  { id: 'aljazeera', name: 'Al Jazeera', genre: 'News / World', color: '#fa9000', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCa69PnsHHzSNJUdjtehOkeQ', youtubeId: 'UCa69PnsHHzSNJUdjtehOkeQ', website: 'https://www.aljazeera.com/live', logo: '🟠', viewers: 87000, region: 'global', country: 'Qatar' },
  { id: 'france24', name: 'France 24', genre: 'News / World', color: '#0055a4', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFw', youtubeId: 'UCQfwfsi5VrQ8yKZ-UWmAEFw', website: 'https://www.france24.com/en/live', logo: '🔵', viewers: 42000, region: 'global', country: 'France' },
  { id: 'dw', name: 'DW News', genre: 'News / World', color: '#0078d4', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRhGTw', youtubeId: 'UCknLrEdhRCp1aegoMqRhGTw', website: 'https://www.dw.com/en/live-tv/s-100825', logo: '🔷', viewers: 31000, region: 'global', country: 'Germany' },
]

export const ALL_TV_STATIONS = [...KENYAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]
