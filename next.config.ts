import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.100.133:3000',
    process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGIN ?? '',
  ].filter(Boolean),
  experimental: {
    // reactCompiler: true,  // disabled to avoid compatibility issues
  },
}

export default nextConfig
