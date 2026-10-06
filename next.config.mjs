import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mirror the source site URL style: every page ends with "/" (e.g. /women/, /blog/slug/)
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true, // Enable gzip/brotli compression for ultra-fast asset delivery
  images: { unoptimized: true },
  async redirects() {
    // Only load high-level structural/hub redirects into Next router (<100 rules).
    // The 31,000+ legacy URL redirects are handled dynamically with 0ms O(1) in-memory index lookup in [slug]/page.tsx
    return [
      { source: '/all-gifts', destination: '/regalos/', permanent: true },
      { source: '/gift-guides', destination: '/regalos/', permanent: true },
      { source: '/blog', destination: '/regalos/', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // Cache static assets and fonts aggressively
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
