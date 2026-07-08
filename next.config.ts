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
}

export default nextConfig
