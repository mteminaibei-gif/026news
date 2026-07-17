import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  experimental: {},
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
        ],
      },
    ]
  },
}

export default nextConfig
