/**
 * Comprehensive navigation map for 026NEWS
 * All routes, links, and SEO metadata in one place
 */

export const ROUTES = {
  // Public pages
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  
  // Articles
  ARTICLES: '/articles',
  ARTICLE_DETAIL: (slug: string) => `/article/${slug}`,
  NEWS: '/news',
  SOURCES: '/sources',
  RADIO: '/radio',
  TV: '/tv',
  
  // Authors
  AUTHORS: '/journalists',
  AUTHOR_DETAIL: (id: string | number) => `/journalists/${id}`,
  AUTHOR_DASHBOARD: '/journalist/dashboard',
  AUTHOR_CREATE: '/journalist/create',
  AUTHOR_ARTICLES: '/journalist/articles',
  AUTHOR_ANALYTICS: '/journalist/analytics',
  AUTHOR_EARNINGS: '/journalist/earnings',
  AUTHOR_PROFILE: '/journalist/profile',
  AUTHOR_SUBSCRIBERS: '/journalist/subscribers',
  
  // Rankings & Leaderboards
  RANKINGS: '/rankings',
  LEADERBOARD: '/leaderboard',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_EARNINGS: '/admin/earnings',
  ADMIN_EDIT_ARTICLE: (id: string | number) => `/admin/edit/${id}`,
  ADMIN_REVIEW_ARTICLE: (id: string | number) => `/admin/review/${id}`,
  ADMIN_JOURNALISTS: '/admin/journalists',
  ADMIN_USERS: '/admin/users',
  ADMIN_SOURCES: '/admin/sources',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_WRITE: '/admin/write',
  
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // User
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  INBOX: '/inbox',
  
  // Other
  SUBSCRIBE: '/subscribe',
} as const

export const NAV_LINKS = [
  { href: ROUTES.HOME, label: 'Home', icon: '🏠' },
  { href: ROUTES.SOURCES, label: 'Explore', icon: '📡' },
  { href: ROUTES.NEWS, label: 'News', icon: '📰' },
  { href: ROUTES.ARTICLES, label: 'Articles', icon: '📑' },
  { href: ROUTES.RADIO, label: 'Radio', icon: '📻' },
  { href: ROUTES.TV, label: 'TV', icon: '📺' },
  { href: ROUTES.INBOX, label: 'Inbox', icon: '💬' },
] as const

export const FOOTER_LINKS = {
  Company: [
    { href: ROUTES.ABOUT, label: 'About Us' },
    { href: ROUTES.CONTACT, label: 'Contact' },
    { href: ROUTES.SUBSCRIBE, label: 'Newsletter' },
  ],
  Legal: [
    { href: ROUTES.PRIVACY, label: 'Privacy Policy' },
    { href: ROUTES.TERMS, label: 'Terms of Service' },
  ],
  Resources: [
    { href: ROUTES.RANKINGS, label: 'Rankings' },
    { href: ROUTES.LEADERBOARD, label: 'Leaderboard' },
    { href: ROUTES.AUTHORS, label: 'Authors' },
  ],
  CTA: [
    { href: ROUTES.SIGNUP, label: 'Become an Author', external: false },
    { href: ROUTES.AUTHOR_CREATE, label: 'Write an Article', external: false },
  ],
} as const

export const ADMIN_NAV_LINKS = [
  { href: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: '📊' },
  { href: ROUTES.ADMIN_ARTICLES, label: 'Articles', icon: '📰' },
  { href: ROUTES.ADMIN_JOURNALISTS, label: 'Authors', icon: '✍️' },
  { href: ROUTES.ADMIN_USERS, label: 'Users', icon: '👥' },
  { href: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: '📈' },
  { href: ROUTES.ADMIN_EARNINGS, label: 'Earnings', icon: '💰' },
  { href: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: '⚙️' },
] as const

export const AUTHOR_NAV_LINKS = [
  { href: ROUTES.AUTHOR_DASHBOARD, label: 'Dashboard', icon: '📊' },
  { href: ROUTES.AUTHOR_CREATE, label: 'Write Article', icon: '✏️' },
  { href: ROUTES.AUTHOR_ARTICLES, label: 'My Articles', icon: '📰' },
  { href: ROUTES.AUTHOR_ANALYTICS, label: 'Analytics', icon: '📈' },
  { href: ROUTES.AUTHOR_EARNINGS, label: 'Earnings', icon: '💰' },
  { href: ROUTES.AUTHOR_SUBSCRIBERS, label: 'Subscribers', icon: '👥' },
  { href: ROUTES.AUTHOR_PROFILE, label: 'Profile', icon: '👤' },
] as const

/**
 * Validate that all routes exist and links point to correct pages
 * Run this in development to catch broken links early
 */
export function validateLinks() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  const brokenLinks: string[] = []

  // Check if link leads somewhere
  const checkLink = async (href: string) => {
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
      return // Skip external links
    }

    try {
      const response = await fetch(href, { method: 'HEAD' })
      if (response.status === 404) {
        brokenLinks.push(href)
      }
    } catch (e) {
      // Ignore fetch errors in dev
    }
  }

  // Validate all routes
  Object.values(ROUTES).forEach(route => {
    const href = typeof route === 'function' ? route('1').replace('/1', '') : route
    checkLink(href)
  })

  if (brokenLinks.length > 0) {
    console.warn('[Navigation Validation] Potentially broken links:', brokenLinks)
  }
}
