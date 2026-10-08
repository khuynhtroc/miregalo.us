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
  experimental: {
    cpus: 1,
  },
  async redirects() {
    // Only load high-level structural/hub redirects into Next router (<100 rules).
    // The 31,000+ legacy URL redirects are handled dynamically with 0ms O(1) in-memory index lookup in [slug]/page.tsx
    return [
      // Sitemap & RSS case variations / aliases
      { source: '/SITEMAP.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/Sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/SITEMAP.XML', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap.XML', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap_index.xml', destination: '/sitemap-index.xml', permanent: true },
      { source: '/SITEMAP-INDEX.xml', destination: '/sitemap-index.xml', permanent: true },
      { source: '/RSS.xml', destination: '/rss.xml', permanent: true },
      { source: '/Rss.xml', destination: '/rss.xml', permanent: true },
      { source: '/RSS.XML', destination: '/rss.xml', permanent: true },
      { source: '/rss.XML', destination: '/rss.xml', permanent: true },
      { source: '/feed', destination: '/rss.xml', permanent: true },
      { source: '/feed.xml', destination: '/rss.xml', permanent: true },
      { source: '/rss', destination: '/rss.xml', permanent: true },
      { source: '/SITEMAP.xsl', destination: '/sitemap.xsl', permanent: true },
      { source: '/Sitemap.xsl', destination: '/sitemap.xsl', permanent: true },
      { source: '/RSS.xsl', destination: '/rss.xsl', permanent: true },
      { source: '/Rss.xsl', destination: '/rss.xsl', permanent: true },

      // Legacy page redirects
      { source: '/all-gifts', destination: '/regalos/', permanent: true },
      { source: '/gift-guides', destination: '/regalos/', permanent: true },
      { source: '/contact', destination: '/contacto/', permanent: true },
      { source: '/faq', destination: '/faqs/', permanent: true },
      { source: '/privacy', destination: '/politica-de-privacidad/', permanent: true },
      { source: '/privacy-policy', destination: '/politica-de-privacidad/', permanent: true },
      { source: '/terms', destination: '/terminos-y-condiciones/', permanent: true },
      { source: '/terms-and-conditions', destination: '/terminos-y-condiciones/', permanent: true },
      { source: '/cookies', destination: '/politica-de-cookies/', permanent: true },
      { source: '/cookie-policy', destination: '/politica-de-cookies/', permanent: true },
      { source: '/about', destination: '/sobre-nosotros/', permanent: true },
      { source: '/about-us', destination: '/sobre-nosotros/', permanent: true },
      { source: '/affiliate', destination: '/divulgacion-de-afiliados/', permanent: true },
      { source: '/affiliate-disclosure', destination: '/divulgacion-de-afiliados/', permanent: true },
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
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(favicon.png|favicon.ico|apple-touch-icon.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default nextConfig;
