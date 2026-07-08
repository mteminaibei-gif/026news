import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             '026News — Breaking News & Freelance Journalism',
    short_name:       '026News',
    description:      'Breaking news, in-depth analysis, and award-winning freelance journalism from Africa and the world.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#0a1628',
    theme_color:      '#0a1628',
    orientation:      'portrait-primary',
    scope:            '/',
    lang:             'en',
    categories:       ['news', 'journalism'],
    icons: [
      {
        src:     '/favicon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'any',
      },
      {
        src:   '/icon-192.png',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:   '/icon-512.png',
        sizes: '512x512',
        type:  'image/png',
      },
    ],
    shortcuts: [
      {
        name:        'Latest News',
        short_name:  'News',
        description: 'See the latest breaking news',
        url:         '/',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name:        'Journalist Portal',
        short_name:  'Portal',
        description: 'Access your journalist dashboard',
        url:         '/journalist/dashboard',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
  }
}
