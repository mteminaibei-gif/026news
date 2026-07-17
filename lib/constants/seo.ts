import { Metadata } from 'next'
import { APP_URL } from '@/lib/constants/app'

export const SITE_CONFIG = {
  name: '026connet!',
  title: '026connet! — Breaking News, Journalism, and Analysis from Africa',
  description: 'Get breaking news, in-depth analysis, and original journalism from Africa. Read articles by professional journalists, subscribe to topics you care about, and stay informed with 026connet!.',
  url: APP_URL,
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  email: 'hello@026connet!.com',
  twitter: '@026connet!',
  socials: {
    twitter: 'https://twitter.com/026connet!',
    facebook: 'https://facebook.com/026connet!',
    instagram: 'https://instagram.com/026connet!',
    linkedin: 'https://linkedin.com/company/026connet!',
  },
}

/**
 * SEO metadata templates for different page types
 */
export const SEO_TEMPLATES = {
  HOME: {
    title: '026connet! — Breaking African News & Journalism',
    description: 'Stay updated with breaking news, original journalism, and in-depth analysis from across Africa. Read articles by professional journalists and follow your favorite authors.',
    keywords: 'news, journalism, Africa, Kenya, breaking news, analysis, original reporting',
  },

  ABOUT: {
    title: 'About 026connet! — Empowering African Journalism',
    description: 'Learn about 026connet! mission to empower journalists and provide quality news coverage across Africa. Discover how we support freelance journalists and independent media.',
    keywords: 'about 026connet!, journalism platform, African media, independent journalism',
  },

  JOURNALISTS: {
    title: 'Meet 026connet! Authors — Professional Journalists',
    description: 'Discover talented journalists, writers, and reporters on 026connet!. Follow your favorite authors and read their latest articles on news, politics, business, tech, and more.',
    keywords: 'journalists, authors, writers, professional journalists, Africa',
  },

  LEADERBOARD: {
    title: '026connet! Journalist Leaderboard — Top Writers',
    description: 'Explore the top-performing journalists on 026connet!. See rankings based on article views, engagement, and earnings.',
    keywords: 'leaderboard, top journalists, rankings, best writers, Africa',
  },

  RANKINGS: {
    title: '026connet! Rankings — Top News & Authors',
    description: 'Browse trending articles, top journalists, and popular categories on 026connet!. Find the best journalism and most-read stories.',
    keywords: 'rankings, trending, popular, top articles, most-read',
  },

  SIGNUP: {
    title: 'Sign Up for 026connet! — Join Our Community',
    description: 'Create your free account on 026connet!. Join thousands of readers and writers enjoying quality African journalism. Read unlimited articles and support independent journalists.',
    keywords: 'signup, register, create account, join 026connet!, free account',
  },

  LOGIN: {
    title: 'Log In — 026connet!',
    description: 'Log in to your 026connet! account to read personalized news, manage your profile, and access exclusive content.',
    keywords: 'login, sign in, account, 026connet!',
  },

  JOURNALIST_DASHBOARD: {
    title: 'Journalist Dashboard — 026connet!',
    description: 'Manage your articles, track analytics, monitor earnings, and grow your audience as a 026connet! journalist.',
    keywords: 'dashboard, journalist, analytics, earnings',
  },

  CONTACT: {
    title: 'Contact 026connet! — Get in Touch',
    description: 'Have questions or feedback for 026connet!? Contact our team. We\'d love to hear from you.',
    keywords: 'contact, feedback, support, email',
  },

  PRIVACY: {
    title: 'Privacy Policy — 026connet!',
    description: 'Learn how 026connet! collects, uses, and protects your personal data. Read our comprehensive privacy policy.',
    keywords: 'privacy policy, data protection, GDPR',
  },

  TERMS: {
    title: 'Terms of Service — 026connet!',
    description: 'Read the terms and conditions for using 026connet! platform. Understand your rights and responsibilities.',
    keywords: 'terms of service, terms and conditions, user agreement',
  },
} as const

/**
 * Generate metadata for different page types
 */
export function generateMetadata(
  type: keyof typeof SEO_TEMPLATES,
  overrides?: Partial<Metadata>
): Metadata {
  const template = SEO_TEMPLATES[type]

  return {
    title: template.title,
    description: template.description,
    keywords: template.keywords,
    
    // Open Graph
    openGraph: {
      title: template.title,
      description: template.description,
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: `${SITE_CONFIG.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: template.title,
      description: template.description,
      creator: SITE_CONFIG.twitter,
      images: [`${SITE_CONFIG.url}/twitter-image.png`],
    },

    // Standard
    metadataBase: new URL(SITE_CONFIG.url),
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },

    ...overrides,
  }
}

/**
 * SEO schema markup for rich snippets
 */
export function getSchemaMarkup(type: 'organization' | 'newsarticle' | 'person' = 'organization') {
  const baseUrl = SITE_CONFIG.url

  if (type === 'organization') {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: SITE_CONFIG.name,
      url: baseUrl,
      logo: `${baseUrl}${SITE_CONFIG.logo}`,
      description: SITE_CONFIG.description,
      sameAs: Object.values(SITE_CONFIG.socials),
      contactPoint: {
        '@type': 'ContactPoint',
        email: SITE_CONFIG.email,
      },
    }
  }

  if (type === 'newsarticle') {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      // Add article-specific properties in component
    }
  }

  if (type === 'person') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      // Add person-specific properties in component
    }
  }
}
