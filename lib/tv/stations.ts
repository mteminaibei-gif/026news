export interface TVStation {
  id: string
  name: string
  genre: string
  color: string
  streamUrl: string
  embedType: 'hls' | 'iframe'
  website: string
  logo: string
  region: 'ke' | 'africa' | 'global'
  country?: string
}

/**
 * TV live streams.
 * - Kenyan stations use direct HLS streams (m3u8) for reliable playback
 * - Global stations use YouTube live embeds (avoids X-Frame-Options blocks on bbc.co.uk/live, cnn.com/live)
 * - HLS streams work natively in Safari; other browsers need hls.js (loaded via CDN).
 */
export const KENYAN_TV_STATIONS: TVStation[] = [
  { id: 'citizen', name: 'Citizen TV', genre: 'News / Entertainment', color: '#16a34a', streamUrl: 'https://live.citizentv.co.ke/live/citizentv/playlist.m3u8', embedType: 'hls', website: 'https://www.citizen.digital', logo: '🟢', region: 'ke', country: 'Kenya' },
  { id: 'ntv', name: 'NTV Kenya', genre: 'News / Current Affairs', color: '#2563eb', streamUrl: 'https://uvotv-aniview.global.ssl.fastly.net/hls/live/2119696/ntvken/playlist.m3u8', embedType: 'hls', website: 'https://ntvkenya.co.ke', logo: '🔵', region: 'ke', country: 'Kenya' },
  { id: 'kbc', name: 'KBC TV', genre: 'News / Public Service', color: '#0f766e', streamUrl: 'https://live.kbc.co.ke/live/kbc1/playlist.m3u8', embedType: 'hls', website: 'https://www.kbc.co.ke', logo: '🟦', region: 'ke', country: 'Kenya' },
  { id: 'k24', name: 'K24 TV', genre: 'News / Entertainment', color: '#e11d48', streamUrl: 'https://live.k24tv.co.ke/live/k24/playlist.m3u8', embedType: 'hls', website: 'https://www.k24tv.co.ke', logo: '🔴', region: 'ke', country: 'Kenya' },
  { id: 'nation', name: 'Nation TV', genre: 'News / Business', color: '#ea580c', streamUrl: 'https://live.ntvkenya.co.ke/live/nation/playlist.m3u8', embedType: 'hls', website: 'https://nation.africa', logo: '🟠', region: 'ke', country: 'Kenya' },
  { id: 'switch', name: 'Switch TV', genre: 'Youth / Entertainment', color: '#7c3aed', streamUrl: 'https://live.switchtv.ke/live/switchtv/playlist.m3u8', embedType: 'hls', website: 'https://www.switchtv.ke', logo: '🟣', region: 'ke', country: 'Kenya' },
  { id: 'tv47', name: 'TV47', genre: 'News / Sports', color: '#ca8a04', streamUrl: 'https://live.tv47.ke/live/tv47/playlist.m3u8', embedType: 'hls', website: 'https://tv47.ke', logo: '🟡', region: 'ke', country: 'Kenya' },
  { id: 'kiss', name: 'Kiss TV', genre: 'Entertainment / Music', color: '#db2777', streamUrl: 'https://live.kisstv.co.ke/live/kisstv/playlist.m3u8', embedType: 'hls', website: 'https://www.kiss.co.ke', logo: '🩷', region: 'ke', country: 'Kenya' },
]

export const AFRICAN_TV_STATIONS: TVStation[] = [
  { id: 'newscentral', name: 'News Central TV', genre: 'News / Africa', color: '#0ea5e9', streamUrl: 'https://www.youtube.com/embed/R2YPW8eY1O0?autoplay=1', embedType: 'iframe', website: 'https://newscentral.africa', logo: '🌍', region: 'africa', country: 'Nigeria' },
  { id: 'africanews', name: 'Africanews', genre: 'News / Pan-African', color: '#f97316', streamUrl: 'https://www.youtube.com/embed/NQjabLGdP5g?autoplay=1', embedType: 'iframe', website: 'https://www.africanews.com', logo: '🟧', region: 'africa', country: 'Pan-African' },
  { id: 'tv360', name: 'TV360 Nigeria', genre: 'News / Nigeria', color: '#dc2626', streamUrl: 'https://www.youtube.com/embed/Ti8TxKMN6go?autoplay=1', embedType: 'iframe', website: 'https://tv360nigeria.com', logo: '🔴', region: 'africa', country: 'Nigeria' },
  { id: 'channelone', name: 'Channel One TV', genre: 'News / Ghana', color: '#059669', streamUrl: 'https://www.youtube.com/embed/ry1E98fMeuU?autoplay=1', embedType: 'iframe', website: 'https://channelonegh.com', logo: '🟢', region: 'africa', country: 'Ghana' },
]

export const GLOBAL_TV_STATIONS: TVStation[] = [
  { id: 'bbc', name: 'BBC News', genre: 'News / World', color: '#bb1919', streamUrl: 'https://www.youtube.com/embed/cpVnzH0Qf0g?autoplay=1', embedType: 'iframe', website: 'https://www.bbc.com/news/live', logo: '🔴', region: 'global', country: 'UK' },
  { id: 'cnn', name: 'CNN', genre: 'News / World', color: '#cc0000', streamUrl: 'https://www.youtube.com/embed/paF85RRg4Mw?autoplay=1', embedType: 'iframe', website: 'https://www.cnn.com/live', logo: '🔴', region: 'global', country: 'US' },
  { id: 'aljazeera', name: 'Al Jazeera', genre: 'News / World', color: '#fa9000', streamUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1', embedType: 'iframe', website: 'https://www.aljazeera.com/live', logo: '🟠', region: 'global', country: 'Qatar' },
  { id: 'france24', name: 'France 24', genre: 'News / World', color: '#0055a4', streamUrl: 'https://www.youtube.com/embed/sparkl3yYtM?autoplay=1', embedType: 'iframe', website: 'https://www.france24.com/en/live', logo: '🔵', region: 'global', country: 'France' },
  { id: 'dw', name: 'DW News', genre: 'News / World', color: '#0078d4', streamUrl: 'https://www.youtube.com/embed/WcHcJvV2XbY?autoplay=1', embedType: 'iframe', website: 'https://www.dw.com/en/live-tv/s-100825', logo: '🔷', region: 'global', country: 'Germany' },
  { id: 'cgttn', name: 'CGTN', genre: 'News / World', color: '#1d4ed8', streamUrl: 'https://www.youtube.com/embed/KwMU-gjXmRI?autoplay=1', embedType: 'iframe', website: 'https://www.cgtn.com/live', logo: '🔷', region: 'global', country: 'China' },
  { id: 'nhk', name: 'NHK World', genre: 'News / Japan', color: '#003d6b', streamUrl: 'https://www3.nhk.or.jp/nhkworld/common/player.html?v=y2d7g1', embedType: 'iframe', website: 'https://www3.nhk.or.jp/nhkworld/', logo: '🔷', region: 'global', country: 'Japan' },
  { id: 'euronews', name: 'Euronews', genre: 'News / Europe', color: '#003399', streamUrl: 'https://www.youtube.com/embed/eE3WRHkQ3vg?autoplay=1', embedType: 'iframe', website: 'https://www.euronews.com/live', logo: '🔵', region: 'global', country: 'Europe' },
  { id: 'rt', name: 'RT News', genre: 'News / World', color: '#da291c', streamUrl: 'https://www.youtube.com/embed/UYF1vKx9LMg?autoplay=1', embedType: 'iframe', website: 'https://www.rt.com/live', logo: '🔴', region: 'global', country: 'Russia' },
  { id: 'trt', name: 'TRT World', genre: 'News / Turkey', color: '#e30a17', streamUrl: 'https://www.youtube.com/embed/dAwoL0gbSQA?autoplay=1', embedType: 'iframe', website: 'https://www.trtworld.com/live', logo: '🔴', region: 'global', country: 'Turkey' },
]

export const ALL_TV_STATIONS = [...KENYAN_TV_STATIONS, ...AFRICAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]
