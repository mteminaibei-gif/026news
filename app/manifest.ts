import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             '026connet! — Breaking News & Freelance Journalism',
    short_name:       '026connet!',
    description:      'Breaking news, in-depth analysis, and award-winning freelance journalism from Kenya, Africa and the world.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#e23b3b',
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
        src:     '/favicon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'maskable',
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
        url:         '/journalist/profile',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
  }
}
