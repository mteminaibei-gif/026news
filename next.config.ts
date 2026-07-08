import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
    // Allow unoptimized images from external RSS sources to avoid hostname errors
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGIN ?? '',
  ].filter(Boolean),
  experimental: {
    // reactCompiler: true,  // disabled to avoid compatibility issues
  },
}

export default nextConfig
