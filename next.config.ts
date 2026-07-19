import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Serve modern formats first — big mobile bandwidth win (AVIF < WebP < JPEG).
    formats: ['image/avif', 'image/webp'],
    // Aggregated/sourced articles pull hero images from arbitrary external
    // news CDNs (standardmedia.co.ke, nation.africa, etc.). Allow any https
    // host so those thumbnails render. SVG stays disabled — user-controlled
    // SVG can carry script.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // Disabled: user-controlled SVG can carry script. Serve avatars from Supabase
    // storage (already sanitized on upload) instead of arbitrary SVG URLs.
    dangerouslyAllowSVG: false,
    // Keep device-pixel-ratio based responsive sizes bounded for phones.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Force @swc/helpers into the proxy/middleware bundle on Vercel
  // Fixes: MIDDLEWARE_INVOCATION_FAILED — Cannot find module @swc/helpers
  outputFileTracingIncludes: {
    '/*': ['node_modules/@swc/helpers/**/*'],
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGIN ?? '',
  ].filter(Boolean),
  experimental: {
    // Trim client bundles by tree-shaking heavy named-export packages.
    // lucide-react is optimized by default; add the others used app-wide.
    optimizePackageImports: [
      'framer-motion',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/pm',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'date-fns',
      'sanitize-html',
    ],
  },
  // CDN / data-transfer optimization.
  // Long-lived immutable caching for hashed build assets shrinks origin egress
  // (pair with Vercel "Fast Origin Transfer" + "Private Data Transfer" in dashboard).
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff2|woff|ttf|mp4|webm)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Compress + don't re-buffer API/HTML responses at the edge
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: "geolocation=(), microphone=(), camera=(), payment=()" },
          // Content-Security-Policy: mitigate stored XSS, clickjacking, mixed content.
          {
            key: 'Content-Security-Policy',
            value: [
              "media-src 'self' https: blob:",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
