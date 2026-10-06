import { NextResponse } from 'next/server';
import { getCategories, getAllPublishedForSitemap, getAuthors, getCatalogUrls } from '@/lib/repo';
import { SITE_URL, postPath } from '@/lib/urls';

export async function GET() {
  const [categories, posts, authors, catalogUrls] = await Promise.all([
    getCategories(),
    getAllPublishedForSitemap(),
    getAuthors(),
    getCatalogUrls(),
  ]);

  const urlMap = new Map<string, { loc: string; lastmod?: string; changefreq: string; priority: string }>();

  // Home
  urlMap.set(`${SITE_URL}/`, {
    loc: `${SITE_URL}/`,
    changefreq: 'daily',
    priority: '1.0',
  });

  // 92 Catalog URLs (Root, Silo, Recipients, Attributes, Problems, Urgencies, Occasions, Styles)
  for (const cUrl of catalogUrls) {
    const loc = `${SITE_URL}${cUrl.url.startsWith('/') ? cUrl.url : '/' + cUrl.url}`;
    const priority =
      cUrl.url_type === 'ROOT'
        ? '1.0'
        : cUrl.url_type === 'SILO'
        ? '0.9'
        : cUrl.priority === 'P1'
        ? '0.9'
        : '0.8';

    urlMap.set(loc, {
      loc,
      lastmod: cUrl.updated_at ? cUrl.updated_at.split('T')[0] : undefined,
      changefreq: cUrl.priority === 'P1' ? 'weekly' : 'monthly',
      priority,
    });
  }

  // Hubs & Categories
  for (const cat of categories) {
    const loc = `${SITE_URL}/${cat.slug}/`;
    if (!urlMap.has(loc)) {
      urlMap.set(loc, {
        loc,
        lastmod: cat.updated_at ? cat.updated_at.split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: cat.group === 'hub' ? '0.9' : '0.8',
      });
    }
  }

  // Published Posts
  for (const p of posts) {
    if (p.robots && p.robots.toLowerCase().includes('noindex')) continue;
    const loc = `${SITE_URL}${postPath(p)}`;
    if (!urlMap.has(loc)) {
      urlMap.set(loc, {
        loc,
        lastmod: (p.updated_at || p.published_at)?.split('T')[0],
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
  }

  // Authors
  for (const a of authors) {
    const loc = `${SITE_URL}/author/${a.slug}/`;
    if (!urlMap.has(loc)) {
      urlMap.set(loc, {
        loc,
        changefreq: 'monthly',
        priority: '0.5',
      });
    }
  }

  const urls = Array.from(urlMap.values());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
